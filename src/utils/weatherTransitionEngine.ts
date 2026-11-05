/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherType } from './descentEngine';

export const ALL_WEATHER_TYPES: readonly WeatherType[] = ['clear', 'rain', 'snow', 'mist', 'aurora'] as const;

export type TransitionParticleKind =
  | 'vapor-swirl'
  | 'condensation-ice'
  | 'dew-sparkle'
  | 'ion-flare'
  | 'thermal-steam';

export interface AtmosphericTransitionParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  color: string;
  kind: TransitionParticleKind;
  rotation: number;
  rotationSpeed: number;
  swayPhase: number;
  swaySpeed: number;
}

export interface WeatherTransitionConfig {
  frontColor: string;
  frontGlowColor: string;
  particleKinds: TransitionParticleKind[];
  particlePalette: string[];
  frontTiltAngle: number; // in radians
  descriptionKo: string;
  descriptionEn: string;
}

export const WEATHER_TRANSITION_CONFIGS: Record<WeatherType, WeatherTransitionConfig> = {
  clear: {
    frontColor: 'rgba(254, 240, 138, 0.40)',
    frontGlowColor: '#fef08a',
    particleKinds: ['thermal-steam', 'dew-sparkle'],
    particlePalette: ['#ffffff', '#fef08a', '#fde047', '#fed7aa', '#fde68a'],
    frontTiltAngle: 0.12,
    descriptionKo: '구름이 걷히며 따스한 태양 온난 전선 유입',
    descriptionEn: 'Warm solar clearance dissipating stratospheric moisture',
  },
  rain: {
    frontColor: 'rgba(96, 165, 250, 0.45)',
    frontGlowColor: '#60a5fa',
    particleKinds: ['vapor-swirl', 'dew-sparkle'],
    particlePalette: ['#93c5fd', '#60a5fa', '#38bdf8', '#bae6fd', '#0284c7'],
    frontTiltAngle: 0.22,
    descriptionKo: '기압골 하강 및 습윤 한랭 전선 응결',
    descriptionEn: 'Atmospheric trough descent and moist cold front condensation',
  },
  snow: {
    frontColor: 'rgba(224, 242, 254, 0.50)',
    frontGlowColor: '#e0f2fe',
    particleKinds: ['condensation-ice', 'dew-sparkle'],
    particlePalette: ['#ffffff', '#f8fafc', '#e2e8f0', '#bae6fd', '#cbd5e1'],
    frontTiltAngle: -0.15,
    descriptionKo: '빙점 하강 및 고기압성 한랭 기단 빙정화',
    descriptionEn: 'Freezing point drop and anticyclonic polar crystallisation',
  },
  mist: {
    frontColor: 'rgba(199, 210, 254, 0.38)',
    frontGlowColor: '#c7d2fe',
    particleKinds: ['vapor-swirl', 'thermal-steam'],
    particlePalette: ['#e0e7ff', '#c7d2fe', '#a5b4fc', '#cbd5e1', '#f1f5f9'],
    frontTiltAngle: 0.05,
    descriptionKo: '기온 역전층 형성 및 해무 운무대 유입',
    descriptionEn: 'Thermal inversion layer formation and marine fog bank drift',
  },
  aurora: {
    frontColor: 'rgba(52, 211, 153, 0.45)',
    frontGlowColor: '#34d399',
    particleKinds: ['ion-flare', 'dew-sparkle'],
    particlePalette: ['#34d399', '#22d3ee', '#a855f7', '#f43f5e', '#67e8f9'],
    frontTiltAngle: 0.28,
    descriptionKo: '태양풍 지자기 교란 및 고에너지 이온 플럭스 전선',
    descriptionEn: 'Solar geomagnetic storm wave and energetic ion flux front',
  },
};

export interface WeatherTransitionState {
  currentWeather: WeatherType;
  targetWeather: WeatherType;
  sourceWeather: WeatherType;
  progress: number; // 0.0 to 1.0
  isTransitioning: boolean;
  transitionDurationTicks: number;
  blendWeights: Record<WeatherType, number>;
  frontProgress: number; // 0.0 to 1.0
  frontActive: boolean;
  particles: AtmosphericTransitionParticle[];
  transitionCount: number;
}

/**
 * Mathematical smoothstep easing (Hermite polynomial)
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Natural cosine ease-in-out curve
 */
export function easeInOutSine(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return (1 - Math.cos(Math.PI * clamped)) * 0.5;
}

/**
 * Normalize an arbitrary weight map so total sums strictly to 1.0
 */
export function normalizeWeights(weights: Record<WeatherType, number>): Record<WeatherType, number> {
  let sum = 0;
  for (const w of ALL_WEATHER_TYPES) {
    sum += Math.max(0, weights[w] || 0);
  }
  if (sum <= 0.0001) {
    return {
      clear: 1,
      rain: 0,
      snow: 0,
      mist: 0,
      aurora: 0,
    };
  }
  const result: Record<WeatherType, number> = {
    clear: (weights.clear || 0) / sum,
    rain: (weights.rain || 0) / sum,
    snow: (weights.snow || 0) / sum,
    mist: (weights.mist || 0) / sum,
    aurora: (weights.aurora || 0) / sum,
  };
  return result;
}

/**
 * Pre-allocates fixed pool of transition particles to avoid garbage collector churn
 */
export function createTransitionParticlePool(size: number = 64): AtmosphericTransitionParticle[] {
  const pool: AtmosphericTransitionParticle[] = [];
  for (let i = 0; i < size; i++) {
    pool.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 1,
      alpha: 0,
      maxLife: 60,
      life: 0,
      color: '#ffffff',
      kind: 'vapor-swirl',
      rotation: 0,
      rotationSpeed: 0,
      swayPhase: 0,
      swaySpeed: 0,
    });
  }
  return pool;
}

/**
 * Creates initial WeatherTransitionState with clean baseline
 */
export function createWeatherTransitionState(
  initialWeather: WeatherType = 'clear',
  durationTicks: number = 90
): WeatherTransitionState {
  const safeWeather: WeatherType = ALL_WEATHER_TYPES.includes(initialWeather) ? initialWeather : 'clear';
  const initialWeights: Record<WeatherType, number> = {
    clear: 0,
    rain: 0,
    snow: 0,
    mist: 0,
    aurora: 0,
  };
  initialWeights[safeWeather] = 1.0;

  return {
    currentWeather: safeWeather,
    targetWeather: safeWeather,
    sourceWeather: safeWeather,
    progress: 1.0,
    isTransitioning: false,
    transitionDurationTicks: Math.max(20, durationTicks),
    blendWeights: initialWeights,
    frontProgress: 1.0,
    frontActive: false,
    particles: createTransitionParticlePool(64),
    transitionCount: 0,
  };
}

/**
 * Spawn transition particles along the moving weather front line
 */
export function spawnFrontTransitionParticles(
  state: WeatherTransitionState,
  targetWeather: WeatherType,
  frontX: number,
  width: number,
  height: number,
  count: number = 24
): void {
  const cfg = WEATHER_TRANSITION_CONFIGS[targetWeather] || WEATHER_TRANSITION_CONFIGS.clear;
  let spawned = 0;

  for (let i = 0; i < state.particles.length && spawned < count; i++) {
    const p = state.particles[i];
    if (p.active) continue;

    const kind = cfg.particleKinds[Math.floor(Math.random() * cfg.particleKinds.length)];
    const color = cfg.particlePalette[Math.floor(Math.random() * cfg.particlePalette.length)];
    const yPos = Math.random() * height;
    // Disperse around front sweep line with slight tilt offset
    const tiltOffset = (yPos - height * 0.5) * Math.sin(cfg.frontTiltAngle);
    const xPos = frontX + tiltOffset + (Math.random() - 0.5) * 36;

    p.active = true;
    p.x = xPos;
    p.y = yPos;
    p.kind = kind;
    p.color = color;
    p.life = 0;
    p.maxLife = 35 + Math.floor(Math.random() * 45);
    p.alpha = 0.8 + Math.random() * 0.2;
    p.rotation = Math.random() * Math.PI * 2;
    p.rotationSpeed = (Math.random() - 0.5) * 0.08;
    p.swayPhase = Math.random() * Math.PI * 2;
    p.swaySpeed = 0.04 + Math.random() * 0.06;

    if (kind === 'condensation-ice') {
      p.size = Math.random() > 0.6 ? 2 : 1;
      p.vx = (Math.random() - 0.5) * 0.8;
      p.vy = 0.4 + Math.random() * 0.8;
    } else if (kind === 'vapor-swirl') {
      p.size = 2 + Math.floor(Math.random() * 3);
      p.vx = targetWeather === 'rain' ? -0.8 - Math.random() * 1.2 : 0.4 + Math.random() * 0.8;
      p.vy = -0.2 + (Math.random() - 0.5) * 0.5;
    } else if (kind === 'ion-flare') {
      p.size = Math.random() > 0.5 ? 2 : 1;
      p.vx = (Math.random() - 0.5) * 2.2;
      p.vy = (Math.random() - 0.5) * 1.4;
    } else if (kind === 'thermal-steam') {
      p.size = 1 + Math.floor(Math.random() * 2);
      p.vx = (Math.random() - 0.5) * 0.6;
      p.vy = -0.6 - Math.random() * 0.9;
    } else {
      // dew-sparkle
      p.size = 1;
      p.vx = (Math.random() - 0.5) * 0.4;
      p.vy = 0.2 + Math.random() * 0.5;
    }

    spawned++;
  }
}

/**
 * Triggers a new weather transition.
 * Handles smooth interruption if a transition is already in progress.
 */
export function startWeatherTransition(
  state: WeatherTransitionState,
  newWeather: WeatherType,
  width: number = 480,
  height: number = 300
): boolean {
  if (!ALL_WEATHER_TYPES.includes(newWeather)) return false;
  if (state.targetWeather === newWeather && state.isTransitioning) return false;
  if (state.currentWeather === newWeather && !state.isTransitioning) return false;

  state.sourceWeather = state.targetWeather;
  state.targetWeather = newWeather;
  state.progress = 0.0;
  state.frontProgress = 0.0;
  state.isTransitioning = true;
  state.frontActive = true;
  state.transitionCount++;

  // Spawn initial burst of atmospheric transition particles along the incoming front
  spawnFrontTransitionParticles(state, newWeather, -20, width, height, 28);
  return true;
}

/**
 * Updates the transition tick: advances progress, calculates dynamic blend weights,
 * propagates the atmospheric front wave, and updates particle motion.
 */
export function updateWeatherTransition(
  state: WeatherTransitionState,
  speedMult: number = 1.0,
  width: number = 480,
  height: number = 300
): void {
  // If in steady state, ensure 100% weight on currentWeather
  if (!state.isTransitioning) {
    for (const w of ALL_WEATHER_TYPES) {
      state.blendWeights[w] = w === state.currentWeather ? 1.0 : 0.0;
    }
    state.frontActive = false;
  } else {
    // Advance progress with delta time scaled by flight speed
    const step = (1.0 / state.transitionDurationTicks) * Math.max(0.4, speedMult);
    state.progress = Math.min(1.0, state.progress + step);
    state.frontProgress = easeInOutSine(state.progress);

    // Continuous spawn of condensation front motes during the middle phase of transition
    if (state.frontProgress < 0.85 && Math.random() > 0.45) {
      const frontX = (state.frontProgress * (width + 120)) - 60;
      spawnFrontTransitionParticles(state, state.targetWeather, frontX, width, height, 3);
    }

    // Blend weight interpolation using smoothstep curve
    const blendT = smoothstep(0, 1, state.progress);
    const sourceW = Math.max(0, 1.0 - blendT);
    const targetW = Math.min(1.0, blendT);

    for (const w of ALL_WEATHER_TYPES) {
      if (w === state.targetWeather) {
        state.blendWeights[w] = targetW;
      } else if (w === state.sourceWeather) {
        state.blendWeights[w] = sourceW;
      } else {
        // Any residual tertiary weather decays smoothly
        state.blendWeights[w] = Math.max(0, (state.blendWeights[w] || 0) * 0.94);
      }
    }

    // Completion condition
    if (state.progress >= 1.0) {
      state.isTransitioning = false;
      state.currentWeather = state.targetWeather;
      state.blendWeights = {
        clear: 0,
        rain: 0,
        snow: 0,
        mist: 0,
        aurora: 0,
      };
      state.blendWeights[state.currentWeather] = 1.0;
      state.frontActive = false;
    }
  }

  // Update transition particle kinetics & lifecycles
  for (let i = 0; i < state.particles.length; i++) {
    const p = state.particles[i];
    if (!p.active) continue;

    p.life++;
    p.swayPhase += p.swaySpeed;

    // Movement
    if (p.kind === 'condensation-ice') {
      p.x += (p.vx + Math.sin(p.swayPhase) * 0.5) * speedMult;
      p.y += p.vy * speedMult;
    } else if (p.kind === 'vapor-swirl') {
      p.x += p.vx * speedMult;
      p.y += (p.vy + Math.cos(p.swayPhase) * 0.3) * speedMult;
    } else {
      p.x += p.vx * speedMult;
      p.y += p.vy * speedMult;
    }

    p.rotation += p.rotationSpeed;

    // Fade out smoothly towards end of life
    const lifeRatio = p.life / p.maxLife;
    p.alpha = Math.max(0, (1.0 - lifeRatio) * 0.85);

    // Boundary & life recycle check
    if (p.life >= p.maxLife || p.x < -80 || p.x > width + 80 || p.y < -40 || p.y > height + 40) {
      p.active = false;
    }
  }
}

/**
 * Renders the atmospheric front sweep veil across the canvas.
 * Draws an air-mass boundary line with volumetric gradient glow.
 */
export function renderWeatherTransitionFront(
  ctx: CanvasRenderingContext2D,
  state: WeatherTransitionState,
  width: number = 480,
  height: number = 300,
  tick: number = 0
): void {
  if (!state.frontActive && state.progress >= 1.0) return;

  const targetCfg = WEATHER_TRANSITION_CONFIGS[state.targetWeather] || WEATHER_TRANSITION_CONFIGS.clear;
  const frontX = (state.frontProgress * (width + 140)) - 70;
  const tiltAngle = targetCfg.frontTiltAngle;
  const frontAlpha = Math.sin(state.progress * Math.PI) * 0.38; // Rises to peak at mid-transition

  if (frontAlpha <= 0.01) return;

  ctx.save();

  // Create sweeping air-mass boundary band
  const bandWidth = 90;
  const grad = ctx.createLinearGradient(frontX - bandWidth * 0.5, 0, frontX + bandWidth * 0.5, 0);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(0.45, targetCfg.frontColor);
  grad.addColorStop(0.5, `rgba(255, 255, 255, ${(frontAlpha * 1.3).toFixed(2)})`);
  grad.addColorStop(0.55, targetCfg.frontColor);
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = grad;
  ctx.globalAlpha = frontAlpha;

  // Render tilted atmospheric front polygon
  const topX = frontX - Math.tan(tiltAngle) * (height * 0.5);
  const bottomX = frontX + Math.tan(tiltAngle) * (height * 0.5);

  ctx.beginPath();
  ctx.moveTo(topX - bandWidth * 0.5, 0);
  ctx.lineTo(topX + bandWidth * 0.5, 0);
  ctx.lineTo(bottomX + bandWidth * 0.5, height);
  ctx.lineTo(bottomX - bandWidth * 0.5, height);
  ctx.closePath();
  ctx.fill();

  // Fine pixelated front boundary filament
  ctx.strokeStyle = targetCfg.frontGlowColor;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = frontAlpha * 0.85;

  ctx.beginPath();
  const segments = 12;
  for (let s = 0; s <= segments; s++) {
    const ySeg = (s / segments) * height;
    const wave = Math.sin(tick * 0.08 + s * 1.1) * 3.5;
    const xSeg = topX + (bottomX - topX) * (s / segments) + wave;
    if (s === 0) ctx.moveTo(xSeg, ySeg);
    else ctx.lineTo(xSeg, ySeg);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders the atmospheric transition condensation motes, crystals, and vapor wisps
 */
export function renderWeatherTransitionParticles(
  ctx: CanvasRenderingContext2D,
  state: WeatherTransitionState
): void {
  let hasActive = false;
  for (let i = 0; i < state.particles.length; i++) {
    if (state.particles[i].active) {
      hasActive = true;
      break;
    }
  }
  if (!hasActive) return;

  ctx.save();
  for (let i = 0; i < state.particles.length; i++) {
    const p = state.particles[i];
    if (!p.active || p.alpha <= 0.02) continue;

    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;

    const px = Math.floor(p.x);
    const py = Math.floor(p.y);

    if (p.kind === 'condensation-ice') {
      // 4-pixel cross crystal
      ctx.fillRect(px, py - 1, 1, 3);
      ctx.fillRect(px - 1, py, 3, 1);
    } else if (p.kind === 'ion-flare') {
      // Energetic diamond spark
      ctx.fillRect(px, py, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, py, 1, 1);
    } else if (p.kind === 'vapor-swirl') {
      // Soft square cloud blob
      ctx.fillRect(px, py, p.size, p.size);
    } else {
      // Single/double pixel spark
      ctx.fillRect(px, py, p.size, p.size);
    }
  }
  ctx.restore();
}
