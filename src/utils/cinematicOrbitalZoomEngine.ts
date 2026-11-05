/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OrbitalZoomPhase = 'space_orbit' | 'atmospheric_reentry' | 'cloud_breakthrough' | 'settled';

export interface OrbitalZoomState {
  isActive: boolean;
  triggerId: number;
  startTime: number;
  durationMs: number;
  progress: number;              // 0.0 to 1.0
  phase: OrbitalZoomPhase;
  altitudeKm: number;            // 380 km down to 12 km
  scale: number;                 // 0.32 to 1.0
  pitch: number;                 // 3D camera inclination pitch (radians)
  roll: number;                  // subtle 3D orbital roll (radians)
  offsetX: number;
  offsetY: number;
  warpStreakIntensity: number;   // 0.0 to 1.0 (hyperspace starlight streaks)
  plasmaReentryHeatAlpha: number;// 0.0 to 1.0 (atmospheric ionization flare)
  cloudVaporAlpha: number;       // 0.0 to 1.0 (cloud deck breakthrough condensation)
  layerName: string;
}

export interface OrbitalZoomConfig {
  initialAltitudeKm?: number;    // default 380
  targetAltitudeKm?: number;     // default 12 (Troposphere cloud layer)
  durationMs?: number;           // default 3600ms
  startScale?: number;           // default 0.32
  targetScale?: number;          // default 1.0
}

export const DEFAULT_ORBITAL_ZOOM_CONFIG: Readonly<Required<OrbitalZoomConfig>> = {
  initialAltitudeKm: 380,
  targetAltitudeKm: 12,
  durationMs: 3600,
  startScale: 0.32,
  targetScale: 1.0,
};

/**
 * Creates an initial idle or active orbital zoom state
 */
export function createInitialOrbitalZoomState(
  active: boolean = false,
  triggerId: number = 0,
  durationMs: number = DEFAULT_ORBITAL_ZOOM_CONFIG.durationMs
): OrbitalZoomState {
  return {
    isActive: active,
    triggerId,
    startTime: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    durationMs: Math.max(800, durationMs),
    progress: active ? 0.0 : 1.0,
    phase: active ? 'space_orbit' : 'settled',
    altitudeKm: active ? DEFAULT_ORBITAL_ZOOM_CONFIG.initialAltitudeKm : DEFAULT_ORBITAL_ZOOM_CONFIG.targetAltitudeKm,
    scale: active ? DEFAULT_ORBITAL_ZOOM_CONFIG.startScale : DEFAULT_ORBITAL_ZOOM_CONFIG.targetScale,
    pitch: 0,
    roll: 0,
    offsetX: 0,
    offsetY: 0,
    warpStreakIntensity: 0,
    plasmaReentryHeatAlpha: 0,
    cloudVaporAlpha: 0,
    layerName: active ? 'ORBITAL THERMOSPHERE' : 'TROPOSPHERIC CLOUD DECK',
  };
}

/**
 * Smooth cubic & quintic easing for cinematic zoom acceleration and spring deceleration
 */
export function easeOrbitalZoom(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  // Smooth S-curve with rapid acceleration in the middle and soft deceleration
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

/**
 * Calculates camera transform and atmospheric telemetry for a given zoom progress (0.0 to 1.0)
 */
export function calculateOrbitalZoomFrame(
  progress: number,
  config: OrbitalZoomConfig = {}
): Omit<OrbitalZoomState, 'isActive' | 'triggerId' | 'startTime' | 'durationMs'> {
  const p = Math.max(0, Math.min(1, progress));
  const cfg = { ...DEFAULT_ORBITAL_ZOOM_CONFIG, ...config };

  // Determine orbital phase
  let phase: OrbitalZoomPhase;
  let layerName: string;

  if (p < 0.32) {
    phase = 'space_orbit';
    layerName = 'ORBITAL THERMOSPHERE (380 KM)';
  } else if (p < 0.78) {
    phase = 'atmospheric_reentry';
    layerName = p < 0.55
      ? 'MESOSPHERIC RE-ENTRY (85 KM)'
      : 'STRATOSPHERIC SHOCKWAVE (35 KM)';
  } else if (p < 1.0) {
    phase = 'cloud_breakthrough';
    layerName = 'TROPOSPHERIC CLOUD DECK (12 KM)';
  } else {
    phase = 'settled';
    layerName = 'FLIGHT CRUISE LEVEL';
  }

  // 1. Altitude calculation: non-linear drop from 380 km down to 12 km
  const altDrop = easeOrbitalZoom(p);
  const altitudeKm = Math.round(
    cfg.initialAltitudeKm - (cfg.initialAltitudeKm - cfg.targetAltitudeKm) * altDrop
  );

  // 2. Camera scale calculation:
  // Starts far out in space (0.32), accelerates rapidly during re-entry, with slight spring settling at 1.0
  let scale: number;
  if (p < 0.32) {
    // Gentle drift in space orbit
    const subP = p / 0.32;
    scale = cfg.startScale + (0.48 - cfg.startScale) * (subP * subP);
  } else if (p < 0.88) {
    // High-speed re-entry zoom
    const subP = (p - 0.32) / (0.88 - 0.32);
    const eased = easeOrbitalZoom(subP);
    scale = 0.48 + (1.08 - 0.48) * eased;
  } else {
    // Spring deceleration settling into 1.0
    const subP = (p - 0.88) / 0.12;
    const settle = Math.cos(subP * Math.PI * 0.5);
    scale = cfg.targetScale + 0.08 * settle;
  }

  // 3. 3D Perspective Pitch & Roll
  // Looking downward from orbit (-0.14 rad) leveling out to 0 rad at cloud level
  const pitchRaw = -0.14 * Math.max(0, 1 - Math.pow(p, 1.6));
  const pitch = (Math.round(pitchRaw * 1000) / 1000) || 0;
  // Subtle orbital yaw/roll banking that stabilizes as we align with flight corridor
  const rollRaw = 0.045 * Math.sin(p * Math.PI) * Math.max(0, 1 - p * 1.2);
  const roll = (Math.round(rollRaw * 1000) / 1000) || 0;

  // 4. Starlight Hyperspace Warp Streaks
  // Peaks during high-speed atmospheric penetration (0.35 to 0.75)
  let warpStreakIntensity = 0;
  if (p >= 0.28 && p <= 0.80) {
    const warpMid = 0.54;
    const dist = Math.abs(p - warpMid) / 0.26;
    warpStreakIntensity = Math.max(0, Math.min(1, 1 - dist * dist));
  }

  // 5. Plasma Re-entry Heating Glow
  // Peaks when compressing mesospheric gas (0.42 to 0.72)
  let plasmaReentryHeatAlpha = 0;
  if (p >= 0.38 && p <= 0.74) {
    const heatMid = 0.56;
    const dist = Math.abs(p - heatMid) / 0.18;
    plasmaReentryHeatAlpha = Math.max(0, Math.min(1, 1 - dist * dist));
  }

  // 6. Cloud Deck Breakthrough Condensation Mist
  // Flares up right as we punch through the cloud tops (0.75 to 0.98)
  let cloudVaporAlpha = 0;
  if (p >= 0.74 && p <= 0.98) {
    const vaporMid = 0.86;
    const dist = Math.abs(p - vaporMid) / 0.12;
    cloudVaporAlpha = Math.max(0, Math.min(1, 1 - dist * dist)) * 0.75;
  }

  // Subtle focal shift towards the planetary horizon
  const offsetY = -28 * (1 - p);
  const offsetX = 0;

  return {
    progress: p,
    phase,
    altitudeKm,
    scale: Math.round(scale * 1000) / 1000,
    pitch: Math.round(pitch * 1000) / 1000,
    roll: Math.round(roll * 1000) / 1000,
    offsetX,
    offsetY,
    warpStreakIntensity: Math.round(warpStreakIntensity * 100) / 100,
    plasmaReentryHeatAlpha: Math.round(plasmaReentryHeatAlpha * 100) / 100,
    cloudVaporAlpha: Math.round(cloudVaporAlpha * 100) / 100,
    layerName,
  };
}

/**
 * Updates orbital zoom state advancing time by deltaMs
 */
export function updateOrbitalZoomState(
  state: OrbitalZoomState,
  deltaMs: number,
  config: OrbitalZoomConfig = {}
): OrbitalZoomState {
  if (!state.isActive) {
    return state;
  }

  const duration = state.durationMs || DEFAULT_ORBITAL_ZOOM_CONFIG.durationMs;
  const newProgress = Math.min(1.0, state.progress + deltaMs / duration);
  const isFinished = newProgress >= 1.0;

  const frame = calculateOrbitalZoomFrame(newProgress, config);

  return {
    ...state,
    ...frame,
    isActive: !isFinished,
    progress: newProgress,
  };
}

/**
 * Generates deterministic starlight warp speed vectors for hypersonic re-entry
 */
export function generateWarpStreakLines(
  count: number = 36,
  width: number = 480,
  height: number = 300,
  centerX: number = 240,
  centerY: number = 110
): Array<{ angle: number; minR: number; maxR: number; speed: number; alpha: number }> {
  const streaks = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + ((i * 37) % 17) * 0.05;
    const baseR = 30 + ((i * 23) % 80);
    const len = 40 + ((i * 47) % 110);
    streaks.push({
      angle,
      minR: baseR,
      maxR: baseR + len,
      speed: 1.2 + ((i * 13) % 10) * 0.2,
      alpha: 0.4 + ((i * 19) % 6) * 0.1,
    });
  }
  return streaks;
}

/**
 * Renders the realistic curved planetary limb with atmospheric halo when viewed from space
 */
export function renderPlanetaryAtmosphereLimb(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  progress: number
): void {
  // Only visible when zoomed out in high orbital space
  if (scale >= 0.88 || progress >= 0.75) return;

  const limbAlpha = Math.max(0, Math.min(1, (0.88 - scale) / 0.56));
  if (limbAlpha <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = limbAlpha;

  // The center of the planet is far below the screen to create a grand arc
  const planetCenterX = width * 0.5;
  const planetCenterY = height * 2.2;
  const planetRadius = height * 1.6;

  // Atmosphere glow halo
  const glowGrad = ctx.createRadialGradient(
    planetCenterX,
    planetCenterY,
    planetRadius - 15,
    planetCenterX,
    planetCenterY,
    planetRadius + 35
  );
  glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
  glowGrad.addColorStop(0.3, 'rgba(129, 140, 248, 0.35)');
  glowGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.15)');
  glowGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');

  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(planetCenterX, planetCenterY, planetRadius + 35, 0, Math.PI * 2);
  ctx.fill();

  // Crisp illuminated atmospheric rim line
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.75)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(planetCenterX, planetCenterY, planetRadius, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders high-speed radial starlight warp streaks during atmospheric ingress
 */
export function renderReentryWarpStreaks(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  intensity: number,
  tick: number
): void {
  if (intensity <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = Math.min(0.9, intensity * 0.9);

  const streakCount = 32;
  for (let i = 0; i < streakCount; i++) {
    const angle = (i / streakCount) * Math.PI * 2 + Math.sin(tick * 0.05 + i) * 0.04;
    const baseDist = 45 + ((i * 31 + tick * 8) % 190);
    const length = 25 + intensity * 60 + (i % 4) * 15;

    const x1 = centerX + Math.cos(angle) * baseDist;
    const y1 = centerY + Math.sin(angle) * baseDist;
    const x2 = centerX + Math.cos(angle) * (baseDist + length);
    const y2 = centerY + Math.sin(angle) * (baseDist + length);

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    const colors = ['#ffffff', '#38bdf8', '#818cf8', '#c084fc'];
    const col = colors[i % colors.length];

    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.3, col);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.0 + (i % 3) * 0.6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renders atmospheric re-entry ionization plasma shockwave around Gemini
 */
export function renderReentryPlasmaShockwave(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  heatAlpha: number,
  tick: number
): void {
  if (heatAlpha <= 0.03) return;

  ctx.save();
  ctx.globalAlpha = heatAlpha;

  // Expanding compression shockwave rings
  const ringProgress = (tick * 0.08) % 1.0;
  const ringRadius = 24 + ringProgress * 65;
  const ringAlpha = (1 - ringProgress) * heatAlpha * 0.7;

  ctx.strokeStyle = `rgba(56, 189, 248, ${ringAlpha.toFixed(2)})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Secondary amber/rose thermal ionization ring
  const ring2Radius = 18 + ((ringProgress + 0.5) % 1.0) * 55;
  const ring2Alpha = (1 - ((ringProgress + 0.5) % 1.0)) * heatAlpha * 0.5;
  ctx.strokeStyle = `rgba(251, 146, 60, ${ring2Alpha.toFixed(2)})`;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(centerX, centerY, ring2Radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders soft cloud condensation vapor breakthrough mist as we punch through cloud tops
 */
export function renderCloudBreakthroughVapor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  vaporAlpha: number,
  tick: number
): void {
  if (vaporAlpha <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = vaporAlpha;

  // Perimeter vapor condensation vignette
  const grad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    width * 0.2,
    width * 0.5,
    height * 0.5,
    width * 0.7
  );
  grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(0.65, 'rgba(224, 242, 254, 0.45)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Soft moving cloud wisp puffs around corners
  const puffCount = 6;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  for (let i = 0; i < puffCount; i++) {
    const px = ((i * 97 + tick * 3) % (width + 80)) - 40;
    const py = height * 0.45 + Math.sin(tick * 0.05 + i) * 35;
    const r = 40 + (i % 3) * 20;

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
