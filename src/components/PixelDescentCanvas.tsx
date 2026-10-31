/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import {
  getInterpolatedColors,
  isPointInsideGeminiStar,
  ActiveAI,
  createAIEncounter,
  WeatherType,
  WEATHER_CONFIGS,
  Particle,
  calculateCloudDriftVelocity,
  calculateCloudBlobRadius,
  lerpWeatherValue,
  CustomAtmosphereSettings,
  DEFAULT_ATMOSPHERE_SETTINGS,
  calculateEncounterCameraTarget,
  lerpCameraValue,
  updateEntityTrajectory,
  renderGlowingTrajectoryLine,
  TrajectoryPoint,
  createAstralDragon,
  updateAstralDragon,
  calculateDragonWingPoints,
  calculateDragonRedGlowColors,
  calculateDragonCloudSurge,
  AstralDragonEntity,
  DragonVariantConfig,
  PixelMeteor,
  BottomAfterglowPoolItem,
  isNightOrMidnight,
  calculateNightFactor,
  createPixelMeteor,
  updatePixelMeteor,
  calculateMeteorTailPoints,
  addMeteorBottomAfterglow,
  updateMeteorAfterglowPool,
  calculateBottomResidualGlowGradient,
} from '../utils/descentEngine';
import {
  calculateEffectiveCloudVelocity,
  calculateEffectiveCloudDensity,
  calculateReynoldsTurbulence,
} from '../utils/cloudPhysicsEngine';
import {
  playAIEncounterSound,
  playDragonFlybySound,
  playMeteorShootingSound,
  triggerStarSparkleChime,
  playBlackHoleSingularitySound,
  playStardustRingCollectSound,
  playSatelliteRadioBeepSound,
  playThunderclapSound,
} from '../utils/audioDescent';
import { AI_SPRITE_DATA_URIS, AI_SPRITE_PATHS } from '../utils/aiSpritesData';
import { initDragonSpriteSheet, renderCelestialDragon, StardustParticle } from '../utils/dragonSpriteEngine';
import {
  CursorSparkle,
  CursorBurstNova,
  mapScreenToCanvasCoords,
  createCursorTrailSparkle,
  createCursorBurstSparks,
  updateCursorSparkles,
  updateCursorBurstNovas,
  renderCursorStarlight,
} from '../utils/cursorParticleEngine';
import {
  createInitialGliderState,
  updateGliderFlight,
  generateThrusterPlume,
  GliderFlightState,
} from '../utils/gliderFlightEngine';
import {
  renderStarChart,
  findHoveredAsterism,
  CELESTIAL_ASTERISMS,
  CelestialAsterism,
} from '../utils/starChartEngine';
import {
  BlackHoleSingularity,
  createBlackHole,
  updateBlackHole,
  calculateGravitationalPull,
  renderBlackHole,
} from '../utils/blackHoleEngine';
import {
  StardustRing,
  ArcadeGameState,
  createInitialArcadeState,
  updateArcadeGame,
  renderArcadeRings,
} from '../utils/arcadeRingEngine';
import {
  OrbitalSatellite,
  createOrbitalSatellite,
  updateOrbitalSatellites,
  findHoveredSatellite,
  renderOrbitalSatellites,
} from '../utils/satelliteEngine';
import {
  LightningBolt,
  generateForkedLightning,
  updateLightningBolts,
  generateStElmoSparks,
  renderLightningBolts,
  StElmoSpark,
} from '../utils/thunderstormEngine';
import { ParticlePool } from '../utils/particlePool';
import { CanvasContextRecoveryManager } from '../utils/canvasContextRecovery';

interface PixelDescentCanvasProps {
  autoCycle: boolean;
  manualCycleProgress: number; // 0 to 1
  onCycleUpdate?: (prog: number) => void;
  speedMode: 'normal' | 'mach' | 'cinematic';
  showScanlines: boolean;
  showStarTrails: boolean;
  showTrajectoryLine?: boolean;
  soundEnabled: boolean;
  activeWeather: WeatherType;
  summonEvent?: { type: 'gpt' | 'claude' | 'deepseek'; id: number } | null;
  dragonEncounterTrigger?: { id: number; timestamp: number } | null;
  meteorShowerSurge?: { id: number; timestamp: number } | null;
  blackHoleTrigger?: { id: number; timestamp: number } | null;
  onActiveEncounterChange?: (name: string | null, color: string, physics?: string) => void;
  onDragonEncounterActiveChange?: (active: boolean, dragonName?: string, badge?: string, color?: string) => void;
  onMeteorShowerActiveChange?: (active: boolean, count: number) => void;
  onBlackHoleActiveChange?: (active: boolean) => void;
  onEncounterTrigger?: (type: 'gpt' | 'claude' | 'deepseek') => void;
  onFpsUpdate?: (fps: number) => void;
  atmosphereSettings?: CustomAtmosphereSettings;
  gliderFlightEnabled?: boolean;
  onGliderStateChange?: (glider: GliderFlightState) => void;
  starChartEnabled?: boolean;
  selectedAsterismId?: string | null;
  onAsterismSelect?: (asterism: CelestialAsterism | null, screenCoords?: { x: number; y: number }) => void;
  arcadeModeEnabled?: boolean;
  onArcadeStateChange?: (state: ArcadeGameState) => void;
  onHoveredSatelliteChange?: (sat: OrbitalSatellite | null) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export const PixelDescentCanvas: React.FC<PixelDescentCanvasProps> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Buffer dimensions: 480 x 300
  const WIDTH = 480;
  const HEIGHT = 300;

  // Use propsRef so the animation loop never tears down or resets state!
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  // Mount the canvas animation ONCE
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Preload authentic pixel AI character sprites (GPT, Claude, DeepSeek)
    const aiSprites: Record<'gpt' | 'claude' | 'deepseek', HTMLImageElement> = {
      gpt: new Image(),
      claude: new Image(),
      deepseek: new Image(),
    };
    aiSprites.gpt.onerror = () => { aiSprites.gpt.src = AI_SPRITE_DATA_URIS.gpt; };
    aiSprites.gpt.src = AI_SPRITE_PATHS.gpt;

    aiSprites.claude.onerror = () => { aiSprites.claude.src = AI_SPRITE_DATA_URIS.claude; };
    aiSprites.claude.src = AI_SPRITE_PATHS.claude;

    aiSprites.deepseek.onerror = () => { aiSprites.deepseek.src = AI_SPRITE_DATA_URIS.deepseek; };
    aiSprites.deepseek.src = AI_SPRITE_PATHS.deepseek;

    // Initialize authentic 6-frame Celestial Dragon sprite engine (Void Amethyst & Gemini Dragon)
    initDragonSpriteSheet('/assets/aistudio/pickle-1793172207529_40c1adee.png');

    let animId: number;
    let tick = 0;
    let cycleTime = propsRef.current.manualCycleProgress;
    let frameCount = 0;
    let lastFpsTime = performance.now();

    // Camera Zoom and Focal Tracking (zoom-in and recovery when encountering constellations)
    let currentZoom = 1.0;
    let targetZoom = 1.0;
    let currentCamX = WIDTH * 0.5;
    let currentCamY = HEIGHT * 0.5;
    let targetCamX = WIDTH * 0.5;
    let targetCamY = HEIGHT * 0.5;

    // 1. Procedural Stars in Upper Stratosphere (Persistent positions with zoom margin)
    const stars: { x: number; y: number; r: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < 110; i++) {
      stars.push({
        x: Math.floor(Math.random() * (WIDTH + 180) - 90),
        y: Math.floor(Math.random() * (HEIGHT * 0.55) - 25),
        r: Math.random() > 0.85 ? 2 : 1,
        alpha: 0.3 + Math.random() * 0.7,
        speed: 0.05 + Math.random() * 0.12,
      });
    }

    // 2. Procedural Volumetric Clouds (Persistent positions)
    const generateCloudBlobs = (count: number, baseR: number) => {
      const blobs: { ox: number; oy: number; r: number }[] = [];
      for (let b = 0; b < count; b++) {
        blobs.push({
          ox: (b - count / 2) * (baseR * 0.85) + (Math.random() - 0.5) * 10,
          oy: (Math.random() - 0.5) * (baseR * 0.5),
          r: baseR * (0.7 + Math.random() * 0.5),
        });
      }
      return blobs;
    };

    const clouds: {
      x: number;
      y: number;
      speed: number;
      blobs: { ox: number; oy: number; r: number }[];
      layer: 'bg' | 'mid' | 'fg';
      alpha: number;
      minDensityThreshold?: number; // Smoothly fades in when weather cloud density exceeds this threshold
    }[] = [
      // Primary Background banks (always present)
      { x: 40, y: 170, speed: 0.35, blobs: generateCloudBlobs(7, 14), layer: 'bg', alpha: 0.45 },
      { x: 260, y: 185, speed: 0.35, blobs: generateCloudBlobs(8, 15), layer: 'bg', alpha: 0.45 },
      { x: 420, y: 175, speed: 0.35, blobs: generateCloudBlobs(6, 13), layer: 'bg', alpha: 0.45 },
      // Primary Mid billowing canyon clouds (flanking left and right)
      { x: 30, y: 60, speed: 1.2, blobs: generateCloudBlobs(9, 22), layer: 'mid', alpha: 0.85 },
      { x: 440, y: 90, speed: 1.3, blobs: generateCloudBlobs(9, 22), layer: 'mid', alpha: 0.85 },
      { x: 60, y: 220, speed: 1.2, blobs: generateCloudBlobs(8, 20), layer: 'mid', alpha: 0.85 },
      { x: 420, y: 250, speed: 1.3, blobs: generateCloudBlobs(8, 20), layer: 'mid', alpha: 0.85 },
      // Primary Foreground wisps
      { x: 100, y: 120, speed: 3.2, blobs: generateCloudBlobs(5, 16), layer: 'fg', alpha: 0.35 },
      { x: 360, y: 260, speed: 3.4, blobs: generateCloudBlobs(5, 16), layer: 'fg', alpha: 0.35 },
      // Secondary Overcast Dense Banks (smoothly emerges when density > 1.05: rain, snow, mist)
      { x: 180, y: 80, speed: 1.4, blobs: generateCloudBlobs(10, 24), layer: 'mid', alpha: 0.88, minDensityThreshold: 1.05 },
      { x: 310, y: 220, speed: 1.5, blobs: generateCloudBlobs(9, 22), layer: 'mid', alpha: 0.82, minDensityThreshold: 1.15 },
      // Rapid Low-Altitude Scud Clouds (storm & rain gusts: density > 1.20)
      { x: 60, y: 160, speed: 4.5, blobs: generateCloudBlobs(4, 15), layer: 'fg', alpha: 0.55, minDensityThreshold: 1.22 },
      { x: 330, y: 100, speed: 4.8, blobs: generateCloudBlobs(4, 16), layer: 'fg', alpha: 0.50, minDensityThreshold: 1.28 },
    ];

    // 3. Weather Precipitation Systems
    // 3A. Raindrops (Rain)
    const raindrops: { x: number; y: number; len: number; vx: number; vy: number; alpha: number }[] = [];
    for (let i = 0; i < 110; i++) {
      raindrops.push({
        x: Math.random() * (WIDTH + 60) - 30,
        y: Math.random() * HEIGHT,
        len: 8 + Math.floor(Math.random() * 8),
        vx: -1.2,
        vy: 11 + Math.random() * 6,
        alpha: 0.35 + Math.random() * 0.45,
      });
    }

    // 3B. Rain Splash Ripples on Ocean/Earth
    const rainSplashes: { x: number; y: number; r: number; maxR: number; alpha: number }[] = [];

    // 3C. Snowflakes (Snow)
    const snowflakes: { x: number; y: number; r: number; vx: number; vy: number; sway: number; alpha: number }[] = [];
    for (let i = 0; i < 95; i++) {
      snowflakes.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        r: Math.random() > 0.8 ? 2 : 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.8 + Math.random() * 1.1,
        sway: Math.random() * Math.PI * 2,
        alpha: 0.5 + Math.random() * 0.5,
      });
    }

    // 3D. Atmospheric Mist Banks (Mist & Fog)
    const mistBanks: { x: number; y: number; w: number; h: number; speed: number; alpha: number; waveOffset: number }[] = [];
    for (let i = 0; i < 8; i++) {
      mistBanks.push({
        x: (i * 90) % (WIDTH + 140) - 70,
        y: 165 + (i % 4) * 18,
        w: 120 + Math.random() * 90,
        h: 22 + Math.random() * 16,
        speed: 0.25 + (i % 3) * 0.18,
        alpha: 0.22 + Math.random() * 0.24,
        waveOffset: Math.random() * Math.PI * 2,
      });
    }

    // Thunder Flash state for rainstorms
    let lightningFlashAlpha = 0;

    // 4. Stardust, plasma sparks, theme particles (Zero-Allocation Object Pool)
    const particlePool = new ParticlePool(1200);

    // Camera Shake state (micro screen vibration & impact feel on celestial summons)
    let cameraShakeTrauma = 0; // 0.0 ~ 1.0 (non-linear trauma decay model)
    let cameraShakeMaxIntensity = 3.8;
    let cameraShakeDecay = 0.86;
    let cameraShakeType: 'gpt' | 'claude' | 'deepseek' = 'gpt';

    const triggerCameraShake = (type: 'gpt' | 'claude' | 'deepseek') => {
      cameraShakeTrauma = 1.0;
      cameraShakeType = type;
      if (type === 'gpt') {
        // OpenAI GPT: Sharp cybernetic high-frequency jitter
        cameraShakeMaxIntensity = 3.6;
        cameraShakeDecay = 0.84;
      } else if (type === 'claude') {
        // Anthropic Claude: Heavy solar prominence seismic pulse
        cameraShakeMaxIntensity = 4.6;
        cameraShakeDecay = 0.88;
      } else if (type === 'deepseek') {
        // DeepSeek: Hydrodynamic wave and quantum sonar rolling shake
        cameraShakeMaxIntensity = 4.0;
        cameraShakeDecay = 0.86;
      }
    };

    // Helper: 50% boosted particle burst for celestial summon
    const spawnSummonBurst = (ai: ActiveAI) => {
      // Immediate camera shake trigger on summon
      triggerCameraShake(ai.type);

      // High-energy shockwave ring at summon epicenter
      shockwaves.push({
        x: ai.x,
        y: ai.y,
        r: 4,
        alpha: 1.0,
        color: ai.primaryColor,
      });
      shockwaves.push({
        x: ai.x,
        y: ai.y,
        r: 12,
        alpha: 0.85,
        color: '#ffffff',
      });

      const burstCount = ai.burstParticleCount; // 48 particles (50% density increase)
      for (let b = 0; b < burstCount; b++) {
        const angle = (b / burstCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const speed = 1.2 + Math.random() * 3.8;
        const colorIdx = Math.floor(Math.random() * ai.trailColors.length);
        const col = ai.trailColors[colorIdx];

        if (ai.type === 'gpt') {
          // Double-helix logarithmic spiral initial vectors
          particlePool.spawn({
            x: ai.x,
            y: ai.y,
            vx: Math.cos(angle) * speed - ai.vx * 0.35,
            vy: Math.sin(angle) * speed * 0.7,
            size: Math.random() > 0.6 ? 2 : 1,
            color: col,
            alpha: 1.0,
            maxLife: 32 + Math.floor(Math.random() * 24),
            theme: 'gpt',
            angle: angle,
            spin: (Math.random() - 0.5) * 0.22,
            radius: 3 + Math.random() * 6,
            radiusSpeed: 0.5 + Math.random() * 0.7,
            baseX: ai.x,
            baseY: ai.y,
            char: Math.random() > 0.4 ? ['1', '0', 'λ', '∂', '✦', '∇', '⌘'][Math.floor(Math.random() * 7)] : undefined,
            shape: Math.random() > 0.4 ? 'char' : 'pixel',
          });
        } else if (ai.type === 'claude') {
          // Explosive solar flare promontory with magnetic coronal arc
          const flareSpeed = 1.4 + Math.random() * 4.2;
          particlePool.spawn({
            x: ai.x + (Math.random() - 0.5) * 6,
            y: ai.y + (Math.random() - 0.5) * 6,
            vx: Math.cos(angle) * flareSpeed,
            vy: Math.sin(angle) * flareSpeed * 0.75 - 0.9,
            size: Math.random() > 0.5 ? 2 : 1,
            color: col,
            alpha: 1.0,
            maxLife: 36 + Math.floor(Math.random() * 24),
            theme: 'claude',
            shape: 'pixel',
          });
        } else {
          // DeepSeek ocean whale quantum sonar & wake burst
          const isRing = b % 4 === 0;
          particlePool.spawn({
            x: ai.x + (Math.random() - 0.5) * 8,
            y: ai.y + (Math.random() - 0.5) * 8,
            vx: Math.cos(angle) * speed * 0.85 - ai.vx * 0.3,
            vy: Math.sin(angle) * speed * 0.75,
            size: isRing ? 3 : (Math.random() > 0.55 ? 2 : 1),
            color: col,
            alpha: 1.0,
            maxLife: 38 + Math.floor(Math.random() * 26),
            theme: 'deepseek',
            shape: isRing ? 'ring' : 'pixel',
          });
        }
      }
    };

    // 5. Shockwaves
    const shockwaves: { x: number; y: number; r: number; alpha: number; color: string }[] = [];

    // 6. Speed Lines
    const speedLines: { x: number; y: number; len: number; speed: number; alpha: number }[] = [];
    for (let i = 0; i < 30; i++) {
      speedLines.push({
        x: Math.floor(Math.random() * WIDTH),
        y: Math.floor(Math.random() * HEIGHT),
        len: 12 + Math.floor(Math.random() * 26),
        speed: 6 + Math.random() * 8,
        alpha: 0.15 + Math.random() * 0.4,
      });
    }

    // Active AI Encounter entity
    let activeAI: ActiveAI | null = null;
    let autoEncounterCounter = 0;
    let lastHandledSummonId = 0;
    const fadingTrajectories: Array<{
      points: TrajectoryPoint[];
      primaryColor: string;
      accentColor: string;
      glowColor: string;
    }> = [];

    // Dragon Silhouette Encounter entity & Resonant Starlight Resonance
    let activeDragon: AstralDragonEntity | null = null;
    let dragonRedGlowFactor = 0.0;
    let autoDragonTimer = 0;
    let lastHandledDragonId = 0;
    let lastReportedDragonActive = false;
    let dragonCloudSurge = 1.0;
    let currentDragonVariant: DragonVariantConfig | undefined = undefined;
    const dragonStardust: StardustParticle[] = [];

    // Pixel Meteor Shower & Bottom Afterglow Persistent State (diurnal meteors)
    const activeMeteors: PixelMeteor[] = [];
    const bottomAfterglowPool: BottomAfterglowPoolItem[] = [];
    let meteorSpawnTimer = 0;
    let nextMeteorInterval = 65;
    let lastHandledMeteorSurgeId = 0;
    let lastReportedMeteorShowerActive = false;

    // Interactive Cursor Starlight & Burst Persistent State
    const cursorSparkles: CursorSparkle[] = [];
    const cursorNovas: CursorBurstNova[] = [];
    let lastCursorPos: { x: number; y: number } | null = null;

    // Steerable Glider Flight & Star Chart State
    let gliderFlight = createInitialGliderState();
    const gliderInputs = { left: false, right: false, up: false, down: false, boost: false };
    const thrusterParticles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      life: number;
      maxLife: number;
    }[] = [];
    let hoveredAsterismId: string | null = null;

    // 1. Gargantua Black Hole Singularity State
    let activeBlackHole: BlackHoleSingularity | null = null;
    let lastHandledBlackHoleTriggerId = 0;
    let lastReportedBlackHoleActive = false;

    // 2. Arcade Stardust Ring Collector State
    const arcadeState: ArcadeGameState = createInitialArcadeState();
    const stardustRings: StardustRing[] = [];

    // 3. Low-Earth Orbit Satellite Constellation State
    const orbitalSatellites: OrbitalSatellite[] = [];
    let satelliteSpawnTimer = 0;
    let hoveredSatellite: OrbitalSatellite | null = null;

    // 4. Supercell Dynamic Thunderstorm & Fractal Lightning State
    const activeLightningBolts: LightningBolt[] = [];
    let lightningSpawnTimer = 0;
    const stElmoSparks: StElmoSpark[] = [];

    if (propsRef.current.onCanvasReady) {
      propsRef.current.onCanvasReady(canvas);
    }

    // Weather-reactive dynamic cloud interpolation state (smooth lerping across weather changes)
    const initWeather = propsRef.current.activeWeather || 'clear';
    const initCfg = WEATHER_CONFIGS[initWeather] || WEATHER_CONFIGS.clear;
    let smoothCloudSpeed = initCfg.cloudSpeedMult;
    let smoothCloudDensity = initCfg.cloudDensityMod;
    let smoothCloudAlpha = initCfg.cloudAlphaMod;
    let smoothWindX = initCfg.windX;
    let isContextPaused = false;

    const render = (now: number) => {
      if (!ctx || isContextPaused) return;
      tick++;
      const currentProps = propsRef.current;
      const weather = currentProps.activeWeather || 'clear';
      const weatherCfg = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.clear;
      const speedMode = currentProps.speedMode || 'normal';
      const atmo = currentProps.atmosphereSettings || DEFAULT_ATMOSPHERE_SETTINGS;

      // Physically couple weather, flight speedMode, and user atmosphere tuning
      const targetCoupledSpeed = calculateEffectiveCloudVelocity(
        weather,
        speedMode,
        atmo.windSpeedScale ?? 1.0,
        1.0
      );
      const targetCoupledDensity = calculateEffectiveCloudDensity(
        weather,
        atmo.cloudDensityScale ?? 1.0,
        speedMode
      );
      const targetWindX = weatherCfg.windX * (atmo.windSpeedScale ?? 1.0);

      // Smoothly interpolate cloud speed, density, opacity, and lateral wind towards physical targets
      smoothCloudSpeed = lerpWeatherValue(smoothCloudSpeed, targetCoupledSpeed, 0.04);
      smoothCloudDensity = lerpWeatherValue(smoothCloudDensity, targetCoupledDensity, 0.04);
      smoothCloudAlpha = lerpWeatherValue(smoothCloudAlpha, weatherCfg.cloudAlphaMod, 0.04);
      smoothWindX = lerpWeatherValue(smoothWindX, targetWindX, 0.04);

      // Accelerate cloud velocity surge during dragon encounter pass (speed multiplier 1.0 -> 2.75x)
      dragonCloudSurge = calculateDragonCloudSurge(!!activeDragon, dragonCloudSurge, 2.75, 0.08);

      // FPS tracking
      frameCount++;
      if (now - lastFpsTime >= 1000) {
        if (currentProps.onFpsUpdate) {
          currentProps.onFpsUpdate(Math.round((frameCount * 1000) / (now - lastFpsTime)));
        }
        frameCount = 0;
        lastFpsTime = now;
      }

      // Speed Multiplier
      let speedMult = 1.0;
      if (currentProps.speedMode === 'mach') speedMult = 2.2;
      else if (currentProps.speedMode === 'cinematic') speedMult = 0.55;

      // Time progression: Gentle & cinematic (~150 seconds full day cycle)
      if (currentProps.autoCycle) {
        cycleTime = (cycleTime + 0.00012) % 1.0;
        if (tick % 6 === 0 && currentProps.onCycleUpdate) {
          currentProps.onCycleUpdate(cycleTime);
        }
      } else {
        cycleTime = currentProps.manualCycleProgress;
      }

      // ----------------------------------------------------
      // DRAGON ENCOUNTER TRIGGER & KINEMATICS UPDATE
      // ----------------------------------------------------
      if (
        currentProps.dragonEncounterTrigger &&
        currentProps.dragonEncounterTrigger.id !== lastHandledDragonId
      ) {
        lastHandledDragonId = currentProps.dragonEncounterTrigger.id;
        activeDragon = createAstralDragon(WIDTH, HEIGHT);
        currentDragonVariant = activeDragon.variant;
      } else if (!activeDragon) {
        autoDragonTimer++;
        // Natural ambient dragon flyby every ~50 seconds
        if (autoDragonTimer > 3000) {
          autoDragonTimer = 0;
          activeDragon = createAstralDragon(WIDTH, HEIGHT);
          currentDragonVariant = activeDragon.variant;
          if (currentProps.soundEnabled) playDragonFlybySound();
        }
      }

      // Track dragon active notification with variant name and colors
      const isDragonActiveNow = !!activeDragon;
      if (isDragonActiveNow !== lastReportedDragonActive) {
        lastReportedDragonActive = isDragonActiveNow;
        if (currentProps.onDragonEncounterActiveChange) {
          currentProps.onDragonEncounterActiveChange(
            isDragonActiveNow,
            activeDragon?.variant.name,
            activeDragon?.variant.badge,
            activeDragon?.variant.laserFlareColor
          );
        }
      }

      // Update dragon motion & red resonance factor
      if (activeDragon) {
        const isAlive = updateAstralDragon(activeDragon, WIDTH, HEIGHT, speedMult);
        dragonRedGlowFactor = Math.min(1.0, dragonRedGlowFactor + 0.038);
        if (!isAlive) {
          activeDragon = null;
        }
      } else {
        dragonRedGlowFactor = Math.max(0.0, dragonRedGlowFactor - 0.022);
      }

      // Check manual summon or periodic auto summon
      if (
        currentProps.summonEvent &&
        currentProps.summonEvent.id !== lastHandledSummonId
      ) {
        lastHandledSummonId = currentProps.summonEvent.id;
        if (activeAI) {
          // Hyperspace exit shockwave for previous entity
          shockwaves.push({
            x: activeAI.x,
            y: activeAI.y,
            r: 8,
            alpha: 0.95,
            color: activeAI.accentColor,
          });
          if (activeAI.trajectoryHistory.length > 0) {
            fadingTrajectories.push({
              points: [...activeAI.trajectoryHistory],
              primaryColor: activeAI.primaryColor,
              accentColor: activeAI.accentColor,
              glowColor: activeAI.glowColor,
            });
          }
        }
        activeAI = createAIEncounter(currentProps.summonEvent.type, WIDTH, HEIGHT);
        spawnSummonBurst(activeAI);
        if (currentProps.soundEnabled) playAIEncounterSound(currentProps.summonEvent.type);
        if (currentProps.onActiveEncounterChange) {
          currentProps.onActiveEncounterChange(activeAI.name, activeAI.primaryColor, activeAI.physicsName);
        }
      } else if (!activeAI) {
        autoEncounterCounter++;
        // Automatic periodic encounter every ~22 seconds
        if (autoEncounterCounter > 1300) {
          autoEncounterCounter = 0;
          const choices: ('gpt' | 'claude' | 'deepseek')[] = ['gpt', 'claude', 'deepseek'];
          const chosen = choices[Math.floor(Math.random() * choices.length)];
          activeAI = createAIEncounter(chosen, WIDTH, HEIGHT);
          spawnSummonBurst(activeAI);
          if (currentProps.onEncounterTrigger) {
            currentProps.onEncounterTrigger(chosen);
          }
          if (currentProps.soundEnabled) playAIEncounterSound(chosen);
          if (currentProps.onActiveEncounterChange) {
            currentProps.onActiveEncounterChange(activeAI.name, activeAI.primaryColor, activeAI.physicsName);
          }
        }
      }

      // Interpolate colors taking weather color filter into account!
      const { colors, phaseIndex } = getInterpolatedColors(cycleTime, weather);

      // ----------------------------------------------------
      // PIXEL METEOR SHOWER SPAWN & KINEMATICS (diurnal meteors)
      // ----------------------------------------------------
      const isNight = isNightOrMidnight(phaseIndex, cycleTime);
      const nightFactor = calculateNightFactor(cycleTime);

      // Check manual meteor shower surge
      if (
        currentProps.meteorShowerSurge &&
        currentProps.meteorShowerSurge.id !== lastHandledMeteorSurgeId
      ) {
        lastHandledMeteorSurgeId = currentProps.meteorShowerSurge.id;
        // Spawn an intense cascade of shooting stars across the upper sky
        for (let k = 0; k < 6; k++) {
          activeMeteors.push(
            createPixelMeteor(WIDTH, HEIGHT, {
              x: Math.random() * (WIDTH * 0.85) + 30,
              y: -15 - k * 16,
            })
          );
        }
        if (currentProps.soundEnabled) playMeteorShootingSound();
      } else if (isNight && nightFactor > 0.15) {
        meteorSpawnTimer++;
        if (meteorSpawnTimer >= nextMeteorInterval) {
          meteorSpawnTimer = 0;
          // Midnight has higher meteor frequency (~35 to 80 frames = 0.6s ~ 1.3s)
          nextMeteorInterval = Math.max(30, Math.floor(100 - nightFactor * 60 + Math.random() * 40));

          // Spawn 1 or 2 meteors
          const spawnCount = Math.random() > 0.7 ? 2 : 1;
          for (let s = 0; s < spawnCount; s++) {
            activeMeteors.push(createPixelMeteor(WIDTH, HEIGHT));
          }
          if (currentProps.soundEnabled && Math.random() > 0.45) {
            playMeteorShootingSound();
          }
        }
      }

      // Notify parent component of active shower status
      const isShowerActive = isNight && (activeMeteors.length > 0 || nightFactor > 0.2);
      if (isShowerActive !== lastReportedMeteorShowerActive) {
        lastReportedMeteorShowerActive = isShowerActive;
        if (currentProps.onMeteorShowerActiveChange) {
          currentProps.onMeteorShowerActiveChange(isShowerActive, activeMeteors.length);
        }
      }

      // ----------------------------------------------------
      // GARGANTUA BLACK HOLE TRIGGER & LIFECYCLE
      // ----------------------------------------------------
      if (
        currentProps.blackHoleTrigger &&
        currentProps.blackHoleTrigger.id !== lastHandledBlackHoleTriggerId
      ) {
        lastHandledBlackHoleTriggerId = currentProps.blackHoleTrigger.id;
        activeBlackHole = createBlackHole(WIDTH, HEIGHT);
        if (currentProps.soundEnabled) playBlackHoleSingularitySound();
      }

      const isBHActive = !!activeBlackHole && activeBlackHole.intensity > 0.02;
      if (isBHActive !== lastReportedBlackHoleActive) {
        lastReportedBlackHoleActive = isBHActive;
        if (currentProps.onBlackHoleActiveChange) {
          currentProps.onBlackHoleActiveChange(isBHActive);
        }
      }

      if (activeBlackHole) {
        const bhRes = updateBlackHole(activeBlackHole, speedMult);
        if (!bhRes.isAlive) {
          activeBlackHole = null;
        }
      }

      // Update Active Meteors motion & check horizon afterglow
      for (let mIdx = activeMeteors.length - 1; mIdx >= 0; mIdx--) {
        const m = activeMeteors[mIdx];
        const mRes = updatePixelMeteor(m, WIDTH, HEIGHT, speedMult);

        if (mRes.reachedBottom) {
          // Deposit lingering residual starlight haze at the screen bottom
          addMeteorBottomAfterglow(bottomAfterglowPool, mRes.bottomX, 0.85, m.midColor, 58);
        }

        if (!mRes.isAlive) {
          activeMeteors.splice(mIdx, 1);
        }
      }

      // Decay bottom residual light pools
      updateMeteorAfterglowPool(bottomAfterglowPool, speedMult);

      // Steerable Glider Flight Kinematics
      if (currentProps.gliderFlightEnabled) {
        gliderFlight = updateGliderFlight(gliderFlight, gliderInputs, speedMult);
        if (currentProps.onGliderStateChange && tick % 4 === 0) {
          currentProps.onGliderStateChange({ ...gliderFlight });
        }
      } else {
        // Smoothly glide back towards center when manual flight mode is disabled
        gliderFlight = updateGliderFlight(
          gliderFlight,
          { left: false, right: false, up: false, down: false, boost: false },
          speedMult
        );
      }

      // Star coordinates (augmented by steerable glider flight offset & banking roll)
      const starBaseX = WIDTH * 0.5;
      const starBaseY = HEIGHT * 0.36;
      const swayX = Math.sin(tick * 0.035) * 8;
      const swayY = Math.cos(tick * 0.04) * 4;
      let starX = starBaseX + swayX + gliderFlight.offsetX;
      let starY = starBaseY + swayY + gliderFlight.offsetY;
      const starAngle = 0.12 * Math.sin(tick * 0.03) + 0.05 + gliderFlight.bankAngle;

      // Gravitational Singularity space-warp pull on star flight
      if (activeBlackHole && activeBlackHole.intensity > 0.05) {
        const bhPull = calculateGravitationalPull(activeBlackHole, starX, starY, 220);
        starX += bhPull.pullX * 0.45;
        starY += bhPull.pullY * 0.45;
      }

      // Update Arcade Stardust Ring Collector challenge
      arcadeState.isActive = !!currentProps.arcadeModeEnabled;
      if (arcadeState.isActive) {
        const arcadeRes = updateArcadeGame(
          arcadeState,
          stardustRings,
          starX,
          starY,
          WIDTH,
          HEIGHT,
          speedMult
        );
        if (arcadeRes.newlyCollectedCount > 0 && currentProps.soundEnabled) {
          playStardustRingCollectSound(arcadeState.combo);
        }
        if (currentProps.onArcadeStateChange && (arcadeRes.newlyCollectedCount > 0 || tick % 12 === 0)) {
          currentProps.onArcadeStateChange({ ...arcadeState });
        }
      }

      // Update Low-Earth Orbit Satellite Constellation
      satelliteSpawnTimer++;
      if (satelliteSpawnTimer > 1500 && orbitalSatellites.length < 2) {
        satelliteSpawnTimer = 0;
        const satTypes: ('iss' | 'hubble' | 'voyager' | 'starlink')[] = ['iss', 'hubble', 'voyager', 'starlink'];
        const chosenSat = satTypes[Math.floor(Math.random() * satTypes.length)];
        const dir = Math.random() > 0.5 ? 'left-to-right' : 'right-to-left';
        orbitalSatellites.push(createOrbitalSatellite(chosenSat, WIDTH, HEIGHT, dir));
      }
      updateOrbitalSatellites(orbitalSatellites, speedMult, WIDTH);

      // Supercell Thunderstorm & Fractal Lightning Bolt Updates
      if (weather === 'rain') {
        lightningSpawnTimer++;
        if (lightningSpawnTimer > 280 && Math.random() > 0.65 && activeLightningBolts.length < 2) {
          lightningSpawnTimer = 0;
          const startX = Math.random() * (WIDTH * 0.7) + WIDTH * 0.15;
          const strikePan = (startX / WIDTH) * 2 - 1; // 3D stereo binaural position (-1.0 left to +1.0 right)
          activeLightningBolts.push(generateForkedLightning(startX, -10, HEIGHT * 0.75, WIDTH));
          if (currentProps.soundEnabled) {
            setTimeout(() => {
              playThunderclapSound(strikePan);
            }, 180);
          }
        }
      }
      const thunderIllum = updateLightningBolts(activeLightningBolts, speedMult);
      if (thunderIllum > 0.05) {
        lightningFlashAlpha = Math.max(lightningFlashAlpha, thunderIllum * 0.75);
      }
      if (weather === 'rain' && tick % 2 === 0) {
        const newSparks = generateStElmoSparks(starX, starY, starAngle, 30);
        for (let s = 0; s < newSparks.length; s++) {
          stElmoSparks.push(newSparks[s]);
        }
      }
      for (let sp = stElmoSparks.length - 1; sp >= 0; sp--) {
        const spark = stElmoSparks[sp];
        spark.life++;
        spark.x += spark.vx * speedMult;
        spark.y += spark.vy * speedMult;
        spark.alpha *= 0.90;
        if (spark.alpha <= 0.02 || spark.life >= spark.maxLife) {
          stElmoSparks.splice(sp, 1);
        }
      }

      // Generate and emit plasma thruster plumes when gliding or steering
      if (
        currentProps.gliderFlightEnabled &&
        (gliderInputs.left ||
          gliderInputs.right ||
          gliderInputs.up ||
          gliderInputs.down ||
          Math.abs(gliderFlight.vx) > 0.3 ||
          Math.abs(gliderFlight.vy) > 0.3)
      ) {
        const newPlumes = generateThrusterPlume(starX, starY, gliderFlight.thrusterBoost || 0.6, gliderFlight.bankAngle);
        for (let np = 0; np < newPlumes.length; np++) {
          thrusterParticles.push({
            ...newPlumes[np],
            life: 0,
            maxLife: 14 + Math.floor(Math.random() * 8),
          });
        }
      }

      // Occasional lightning flash during rain
      if (weather === 'rain' && tick % 460 === 0 && Math.random() > 0.4) {
        lightningFlashAlpha = 0.32;
      }
      if (lightningFlashAlpha > 0) {
        lightningFlashAlpha = Math.max(0, lightningFlashAlpha - 0.045);
      }

      // ==========================================
      // CAMERA SHAKE COMPUTATION (screen rumble & trauma)
      // ==========================================
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (cameraShakeTrauma > 0.015) {
        // Non-linear trauma model (trauma^1.8) -> powerful onset with smooth exponential decay
        const currentMag = Math.pow(cameraShakeTrauma, 1.8) * cameraShakeMaxIntensity;

        if (cameraShakeType === 'gpt') {
          // OpenAI GPT: Sharp cybernetic high-frequency jitter
          const phase = tick * 2.8;
          shakeOffsetX = Math.round(Math.cos(phase * 1.7) * currentMag);
          shakeOffsetY = Math.round(Math.sin(phase * 2.1) * currentMag * 0.85);
        } else if (cameraShakeType === 'claude') {
          // Anthropic Claude: Heavy solar prominence seismic pulse
          const phase = tick * 1.9;
          shakeOffsetX = Math.round(Math.sin(phase) * currentMag * 0.7);
          shakeOffsetY = Math.round(Math.cos(phase * 1.4) * currentMag);
        } else if (cameraShakeType === 'deepseek') {
          // DeepSeek: Hydrodynamic wave and quantum sonar rolling shake
          const phase = tick * 1.5;
          shakeOffsetX = Math.round(Math.cos(phase) * currentMag);
          shakeOffsetY = Math.round(Math.sin(phase * 1.8) * currentMag * 0.75);
        } else {
          const angle = (tick * 1.7) % (Math.PI * 2);
          shakeOffsetX = Math.round(Math.cos(angle) * currentMag);
          shakeOffsetY = Math.round(Math.sin(angle) * currentMag);
        }

        cameraShakeTrauma *= cameraShakeDecay;
        if (cameraShakeTrauma <= 0.015) {
          cameraShakeTrauma = 0;
          shakeOffsetX = 0;
          shakeOffsetY = 0;
        }
      }

      // ==========================================
      // CAMERA ZOOM & FOCAL TRACKING COMPUTATION (Entity Zoom & Recovery)
      // ==========================================
      const camTarget = calculateEncounterCameraTarget(
        activeAI ? activeAI.x : WIDTH * 0.5,
        activeAI ? activeAI.y : HEIGHT * 0.5,
        WIDTH,
        HEIGHT,
        !!activeAI
      );
      targetZoom = camTarget.targetZoom;
      targetCamX = camTarget.targetX;
      targetCamY = camTarget.targetY;

      // Smooth cinematic ease: lerp towards entity when active, recover smoothly to center when finished
      const zoomRate = activeAI ? 0.038 : 0.030;
      currentZoom = lerpCameraValue(currentZoom, targetZoom, zoomRate);
      currentCamX = lerpCameraValue(currentCamX, targetCamX, zoomRate);
      currentCamY = lerpCameraValue(currentCamY, targetCamY, zoomRate);

      // Save canvas state and apply camera shake & zoom-in transformation
      ctx.save();

      // Screen shake translation
      ctx.translate(shakeOffsetX, shakeOffsetY);

      // Focal Zoom: Center viewport -> scale by currentZoom -> translate focal point to origin
      ctx.translate(WIDTH * 0.5, HEIGHT * 0.5);
      ctx.scale(currentZoom, currentZoom);
      ctx.translate(-currentCamX, -currentCamY);

      // ==========================================
      // 1. SKY GRADIENT (Generous margin for camera pan & zoom)
      // ==========================================
      const skyMarginX = 180;
      const skyMarginY = 130;
      const skyGrad = ctx.createLinearGradient(0, -skyMarginY, 0, HEIGHT + skyMarginY);
      skyGrad.addColorStop(0, colors.skyTop);
      skyGrad.addColorStop(0.35, colors.skyMid);
      skyGrad.addColorStop(0.68, colors.skyBottom);
      skyGrad.addColorStop(0.95, colors.oceanCoast);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-skyMarginX, -skyMarginY, WIDTH + skyMarginX * 2, HEIGHT + skyMarginY * 2);

      // Ambient lightning flash overlay
      if (lightningFlashAlpha > 0) {
        ctx.fillStyle = `rgba(224, 242, 254, ${lightningFlashAlpha.toFixed(2)})`;
        ctx.fillRect(-skyMarginX, -skyMarginY, WIDTH + skyMarginX * 2, HEIGHT + skyMarginY * 2);
      }

      // Celestial Summon Impact Flare (flash on peak shake frames)
      if (cameraShakeTrauma > 0.45 && activeAI) {
        const flareAlpha = (cameraShakeTrauma - 0.45) * 0.35;
        ctx.save();
        ctx.fillStyle = activeAI.glowColor;
        ctx.globalAlpha = flareAlpha;
        ctx.fillRect(-skyMarginX, -skyMarginY, WIDTH + skyMarginX * 2, HEIGHT + skyMarginY * 2);
        ctx.restore();
      }

      // ==========================================
      // 2. STARS IN HIGH STRATOSPHERE
      // ==========================================
      // Stars are dimmed heavily by rain/mist, crisp in clear
      const weatherStarFactor = weather === 'clear' ? 1.0 : weather === 'snow' ? 0.8 : weather === 'mist' ? 0.4 : 0.15;
      const starVisibility =
        (phaseIndex === 3 ? 1.0 : phaseIndex === 0 || phaseIndex === 2 ? 0.65 : 0.2) * weatherStarFactor;

      if (starVisibility > 0.05) {
        ctx.save();
        for (const st of stars) {
          st.y = (st.y - st.speed * speedMult + HEIGHT * 0.48) % (HEIGHT * 0.48);
          const tw = 0.65 + 0.35 * Math.sin(tick * 0.08 + st.x);
          ctx.fillStyle = `rgba(255,255,255,${(st.alpha * tw * starVisibility).toFixed(2)})`;
          ctx.fillRect(Math.floor(st.x), Math.floor(st.y), st.r, st.r);
        }
        ctx.restore();
      }

      // ==========================================
      // 2B. COSMIC AURORA CURTAIN (Aurora Polar Curtains)
      // ==========================================
      if (weather === 'aurora' || phaseIndex === 2) {
        ctx.save();
        const auroraStrength = weather === 'aurora' ? 1.0 : 0.55;
        for (let wave = 0; wave < 3; wave++) {
          const speed = (wave + 1) * 0.015;
          const baseY = 25 + wave * 18;
          ctx.beginPath();
          ctx.moveTo(0, baseY);
          for (let x = 0; x <= WIDTH; x += 8) {
            const y1 = baseY + Math.sin(tick * speed + x * 0.018) * 14 + Math.cos(tick * 0.02 + x * 0.035) * 8;
            ctx.lineTo(x, y1);
          }
          ctx.lineTo(WIDTH, baseY + 60);
          ctx.lineTo(0, baseY + 60);
          ctx.closePath();

          const auroraGrad = ctx.createLinearGradient(0, baseY - 10, 0, baseY + 60);
          if (wave === 0) {
            auroraGrad.addColorStop(0, `rgba(52, 211, 153, ${(0.18 * auroraStrength).toFixed(2)})`);
            auroraGrad.addColorStop(0.5, `rgba(34, 211, 238, ${(0.22 * auroraStrength).toFixed(2)})`);
            auroraGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
          } else if (wave === 1) {
            auroraGrad.addColorStop(0, `rgba(168, 85, 247, ${(0.16 * auroraStrength).toFixed(2)})`);
            auroraGrad.addColorStop(0.6, `rgba(244, 63, 94, ${(0.18 * auroraStrength).toFixed(2)})`);
            auroraGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
          } else {
            auroraGrad.addColorStop(0, `rgba(16, 185, 129, ${(0.14 * auroraStrength).toFixed(2)})`);
            auroraGrad.addColorStop(0.5, `rgba(56, 189, 248, ${(0.20 * auroraStrength).toFixed(2)})`);
            auroraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          }
          ctx.fillStyle = auroraGrad;
          ctx.fill();

          // Pixelated vertical light flutes
          ctx.fillStyle = wave % 2 === 0 ? 'rgba(167, 243, 208, 0.22)' : 'rgba(233, 213, 255, 0.20)';
          for (let flute = 12; flute < WIDTH; flute += 20) {
            const fx = flute + Math.sin(tick * 0.02 + flute) * 4;
            const fy = baseY + Math.sin(tick * speed + fx * 0.018) * 14;
            const fLen = 20 + Math.floor(Math.sin(tick * 0.06 + flute) * 10);
            ctx.fillRect(Math.floor(fx), Math.floor(fy), 2, fLen);
          }
        }
        ctx.restore();
      }

      // ==========================================
      // 2C. PIXEL METEOR SHOWER (Long trails of night meteors)
      // ==========================================
      if (activeMeteors.length > 0) {
        ctx.save();
        for (const m of activeMeteors) {
          const tailPoints = calculateMeteorTailPoints(m);
          for (const pt of tailPoints) {
            if (pt.alpha <= 0.01) continue;
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = pt.alpha;
            ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
          }

          // Meteor Head: Intense radiant white starlight core
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = m.brightness;
          ctx.fillRect(Math.floor(m.x), Math.floor(m.y), m.headSize, m.headSize);

          // Head cross flare halo (pixelated 4-directional micro flare)
          ctx.fillStyle = m.midColor;
          ctx.globalAlpha = m.brightness * 0.55;
          ctx.fillRect(Math.floor(m.x) - 1, Math.floor(m.y), 1, 1);
          ctx.fillRect(Math.floor(m.x) + m.headSize, Math.floor(m.y), 1, 1);
          ctx.fillRect(Math.floor(m.x), Math.floor(m.y) - 1, 1, 1);
          ctx.fillRect(Math.floor(m.x), Math.floor(m.y) + m.headSize, 1, 1);

          // Sloughed starlight sparks along recent trajectory
          if (m.trailHistory.length > 2) {
            ctx.fillStyle = m.tailColor;
            for (let thIdx = 1; thIdx < m.trailHistory.length; thIdx += 2) {
              const th = m.trailHistory[thIdx];
              ctx.globalAlpha = (1.0 - thIdx / m.trailHistory.length) * 0.45;
              ctx.fillRect(Math.floor(th.x), Math.floor(th.y), 1, 1);
            }
          }
        }
        ctx.restore();
      }

      // ==========================================
      // 2D. CELESTIAL CONSTELLATION STAR-CHART
      // ==========================================
      if (currentProps.starChartEnabled) {
        renderStarChart(
          ctx,
          CELESTIAL_ASTERISMS,
          1.0,
          tick,
          hoveredAsterismId,
          currentProps.selectedAsterismId
        );
      }

      // ==========================================
      // 2E. GARGANTUA BLACK HOLE SINGULARITY
      // ==========================================
      if (activeBlackHole) {
        renderBlackHole(ctx, activeBlackHole, tick);
      }

      // ==========================================
      // 2F. LOW-EARTH ORBIT SATELLITES & SPACE STATIONS
      // ==========================================
      if (orbitalSatellites.length > 0) {
        renderOrbitalSatellites(
          ctx,
          orbitalSatellites,
          tick,
          hoveredSatellite?.id || null
        );
      }

      // ==========================================
      // 3. SUNLIGHT GOD RAYS
      // ==========================================
      if (phaseIndex !== 3 && weather !== 'rain') {
        ctx.save();
        ctx.globalAlpha = (phaseIndex === 1 ? 0.09 : 0.05) * (weather === 'mist' ? 0.4 : 1.0);
        ctx.fillStyle = colors.sunGlint;
        for (let r = 0; r < 4; r++) {
          const sx = WIDTH * 0.18 + r * 80 + Math.sin(tick * 0.006 + r) * 16;
          ctx.beginPath();
          ctx.moveTo(sx, -12);
          ctx.lineTo(sx + 26, -12);
          ctx.lineTo(sx + 120, HEIGHT + 16);
          ctx.lineTo(sx + 70, HEIGHT + 16);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // ==========================================
      // 4. THE VAST LIVING EARTH (Continents, oceans, forests, alpine peaks)
      // ==========================================
      const earthCenterX = WIDTH * 0.5;
      const earthCenterY = HEIGHT * 1.60;
      const earthRadius = HEIGHT * 0.96;

      ctx.save();
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius, Math.PI, 0, false);
      ctx.lineTo(WIDTH + 16, HEIGHT + 16);
      ctx.lineTo(-16, HEIGHT + 16);
      ctx.closePath();
      ctx.clip(); // Constrain strictly inside the planet curve!

      // Deep Ocean Base
      const oceanGrad = ctx.createRadialGradient(
        earthCenterX,
        earthCenterY,
        earthRadius * 0.72,
        earthCenterX,
        earthCenterY,
        earthRadius
      );
      oceanGrad.addColorStop(0, colors.oceanDeep);
      oceanGrad.addColorStop(0.75, colors.oceanCoast);
      oceanGrad.addColorStop(1, '#0c1b33');
      ctx.fillStyle = oceanGrad;
      ctx.fill();

      // Curved organic continents
      const terrainScroll = (tick * 0.16 * speedMult) % (WIDTH * 2.4);

      // Continent definition with natural polygons & features
      const continentList = [
        {
          baseX: -100 + terrainScroll * 0.35,
          width: 170,
          yOffset: 32,
          // Snow peaks [x, y, w, h]
          snow: [
            { x: 30, y: 195, w: 24, h: 10 },
            { x: 62, y: 198, w: 32, h: 12 },
            { x: 102, y: 194, w: 26, h: 9 },
          ],
          // Dense forests
          forests: [
            { x: 15, y: 212, w: 35, h: 16 },
            { x: 55, y: 216, w: 45, h: 20 },
            { x: 110, y: 208, w: 38, h: 18 },
          ],
          // Night city light clusters
          cities: [
            { x: 25, y: 224 },
            { x: 72, y: 228 },
            { x: 80, y: 232 },
            { x: 125, y: 220 },
          ],
        },
        {
          baseX: 180 + terrainScroll * 0.35,
          width: 220,
          yOffset: 36,
          snow: [
            { x: 45, y: 196, w: 34, h: 12 },
            { x: 90, y: 199, w: 42, h: 14 },
            { x: 145, y: 195, w: 36, h: 11 },
          ],
          forests: [
            { x: 20, y: 215, w: 50, h: 22 },
            { x: 80, y: 220, w: 60, h: 25 },
            { x: 150, y: 214, w: 45, h: 20 },
          ],
          cities: [
            { x: 35, y: 228 },
            { x: 42, y: 232 },
            { x: 105, y: 235 },
            { x: 115, y: 238 },
            { x: 175, y: 226 },
          ],
        },
      ];

      for (const cont of continentList) {
        const cx = (cont.baseX % (WIDTH + 300)) - 140;

        // 1. Organic coastline polygon
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)'; // Turquoise reef shelf
        ctx.beginPath();
        ctx.ellipse(cx + cont.width * 0.5, 225, cont.width * 0.54, 42, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Sandy beach rim
        ctx.fillStyle = colors.oceanCoast;
        ctx.beginPath();
        ctx.ellipse(cx + cont.width * 0.5, 225, cont.width * 0.50, 38, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Green Landmass (Plains & Hills)
        ctx.fillStyle = colors.earthLand;
        ctx.beginPath();
        ctx.ellipse(cx + cont.width * 0.5, 226, cont.width * 0.46, 35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wet terrain sheen during rainstorm
        if (weather === 'rain') {
          ctx.fillStyle = 'rgba(147, 197, 253, 0.18)';
          ctx.beginPath();
          ctx.ellipse(cx + cont.width * 0.5, 225, cont.width * 0.43, 31, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. Dense Pine & Moss Forests
        ctx.fillStyle = colors.earthForest;
        for (const f of cont.forests) {
          const fx = cx + f.x;
          ctx.beginPath();
          ctx.ellipse(fx + f.w * 0.5, f.y + f.h * 0.5, f.w * 0.5, f.h * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          // Forest textured highlight dots
          ctx.fillStyle = weather === 'snow' ? 'rgba(226, 232, 240, 0.35)' : 'rgba(74, 222, 128, 0.28)';
          ctx.fillRect(Math.floor(fx + f.w * 0.3), Math.floor(f.y + 3), Math.floor(f.w * 0.4), 2);
          ctx.fillStyle = colors.earthForest;
        }

        // 5. Majestic Snow-Capped Alpine Peaks & Glaciers
        for (const s of cont.snow) {
          const sx = cx + s.x;
          // Snow expands slightly during snow weather
          const extraW = weather === 'snow' ? 4 : 0;
          const extraH = weather === 'snow' ? 2 : 0;

          // Dark granite shadow
          ctx.fillStyle = colors.earthRidge;
          ctx.beginPath();
          ctx.moveTo(sx - extraW * 0.5, s.y + s.h);
          ctx.lineTo(sx + s.w * 0.5, s.y - extraH);
          ctx.lineTo(sx + s.w + extraW * 0.5, s.y + s.h);
          ctx.closePath();
          ctx.fill();

          // Brilliant White Glacier & Snow Cap
          ctx.fillStyle = colors.earthSnow;
          ctx.beginPath();
          ctx.moveTo(sx + s.w * 0.2 - extraW * 0.3, s.y + s.h * 0.5);
          ctx.lineTo(sx + s.w * 0.5, s.y - extraH);
          ctx.lineTo(sx + s.w * 0.8 + extraW * 0.3, s.y + s.h * 0.5);
          ctx.closePath();
          ctx.fill();

          // Ice glint / Snow sparkle
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.floor(sx + s.w * 0.45), Math.floor(s.y + 1), 3, 2);

          // Snow weather adds mountain peak drifting frost
          if (weather === 'snow' && Math.random() > 0.85) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.fillRect(Math.floor(sx + Math.random() * s.w), Math.floor(s.y + Math.random() * s.h * 0.6), 1, 1);
          }
        }

        // 6. Constellation of Twinkling Night City Lights
        const cityVisibility =
          (phaseIndex === 3 ? 0.95 : phaseIndex === 2 ? 0.65 : phaseIndex === 0 ? 0.35 : 0.0) *
          (weather === 'mist' ? 0.6 : 1.0);
        if (cityVisibility > 0) {
          ctx.fillStyle = colors.cityLights;
          for (const city of cont.cities) {
            const citX = cx + city.x;
            const citY = city.y;
            const flicker = 0.75 + 0.25 * Math.sin(tick * 0.14 + citX);
            ctx.globalAlpha = cityVisibility * flicker;
            // City center
            ctx.fillRect(Math.floor(citX), Math.floor(citY), 2, 2);
            ctx.fillRect(Math.floor(citX - 2), Math.floor(citY + 1), 1, 1);
            ctx.fillRect(Math.floor(citX + 2), Math.floor(citY - 1), 1, 1);
          }
          ctx.globalAlpha = 1.0;
        }
      }

      // Shimmering Ocean Wave Specular glints
      ctx.fillStyle = colors.sunGlint;
      for (let g = 0; g < 40; g++) {
        const gx = (g * 33 + tick * 0.8 * speedMult) % (WIDTH * 0.84) + WIDTH * 0.08;
        const gy = HEIGHT * 0.73 + (g % 6) * 8;
        const gAlpha = (0.18 + 0.32 * Math.sin(tick * 0.12 + g)) * (weather === 'mist' ? 0.45 : 1.0);
        ctx.globalAlpha = Math.max(0.08, gAlpha);
        ctx.fillRect(Math.floor(gx), Math.floor(gy), 3 + (g % 3) * 2, 1);
      }
      ctx.globalAlpha = 1.0;

      // ==========================================
      // WEATHER GROUND REACTIONS (Rain Splashes on Ocean & Earth)
      // ==========================================
      if (weather === 'rain') {
        for (let ri = rainSplashes.length - 1; ri >= 0; ri--) {
          const sp = rainSplashes[ri];
          sp.r += 0.45 * speedMult;
          sp.alpha -= 0.07;
          if (sp.alpha <= 0 || sp.r >= sp.maxR) {
            rainSplashes.splice(ri, 1);
            continue;
          }
          ctx.save();
          ctx.globalAlpha = sp.alpha;
          ctx.strokeStyle = '#bae6fd';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, sp.r * 2.2, sp.r * 0.7, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.restore(); // End planet clip

      // Atmospheric Limb Glow along planet horizon
      ctx.save();
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius, Math.PI, 0, false);
      ctx.lineWidth = 4;
      ctx.strokeStyle = weather === 'rain' ? 'rgba(71, 85, 105, 0.45)' : 'rgba(56, 189, 248, 0.45)';
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = weather === 'rain' ? 'rgba(148, 163, 184, 0.65)' : 'rgba(255, 255, 255, 0.65)';
      ctx.stroke();
      ctx.restore();

      // ==========================================
      // WEATHER: ATMOSPHERIC MIST & LOW-ALTITUDE FOG (Mist & Fog Layers)
      // ==========================================
      if (weather === 'mist') {
        ctx.save();
        for (const mb of mistBanks) {
          mb.x += mb.speed * speedMult * 0.4;
          if (mb.x > WIDTH + 80) {
            mb.x = -mb.w - 40;
          }
          const wave = Math.sin(tick * 0.025 + mb.waveOffset) * 4;
          const bankY = mb.y + wave;

          // Multi-tiered diffuse pixel mist bands
          const mistGrad = ctx.createLinearGradient(mb.x, bankY, mb.x + mb.w, bankY);
          mistGrad.addColorStop(0, 'rgba(224, 231, 255, 0)');
          mistGrad.addColorStop(0.3, `rgba(224, 231, 255, ${mb.alpha.toFixed(2)})`);
          mistGrad.addColorStop(0.7, `rgba(199, 210, 254, ${(mb.alpha * 1.15).toFixed(2)})`);
          mistGrad.addColorStop(1, 'rgba(224, 231, 255, 0)');

          ctx.fillStyle = mistGrad;
          // Render stepped pixel bands
          const steps = 4;
          for (let s = 0; s < steps; s++) {
            const hStep = mb.h / steps;
            const inset = (steps - s) * 6;
            ctx.fillRect(Math.floor(mb.x + inset), Math.floor(bankY + s * hStep), Math.floor(mb.w - inset * 2), Math.floor(hStep));
          }
        }
        ctx.restore();
      }

      // ==========================================
      // 5. PROCEDURAL VOLUMETRIC PIXEL CLOUDS (Weather-reactive density & movement speed)
      // ==========================================
      const renderCloud = (c: typeof clouds[0], drawCtx: CanvasRenderingContext2D) => {
        // Density threshold check: extra storm/fog layers smoothly fade in as density rises
        let layerFade = 1.0;
        if (c.minDensityThreshold !== undefined) {
          if (smoothCloudDensity < c.minDensityThreshold) return;
          layerFade = Math.min(1.0, (smoothCloudDensity - c.minDensityThreshold) / 0.16);
        }

        drawCtx.save();
        const effectiveAlpha = Math.min(1.0, c.alpha * smoothCloudAlpha * layerFade);
        drawCtx.globalAlpha = effectiveAlpha;
        const cx = Math.floor(c.x);
        const cy = Math.floor(c.y);

        // Underside shadow (dynamically scaled by weather density)
        drawCtx.fillStyle = colors.cloudShadow;
        for (const b of c.blobs) {
          const rad = calculateCloudBlobRadius(b.r, smoothCloudDensity);
          const ox = b.ox * smoothCloudDensity;
          const oy = b.oy * (smoothCloudDensity > 1.2 ? smoothCloudDensity * 0.85 : smoothCloudDensity);
          drawCtx.beginPath();
          drawCtx.arc(cx + ox, cy + oy + rad * 0.35, rad, 0, Math.PI * 2);
          drawCtx.fill();
        }

        // Main body
        drawCtx.fillStyle = colors.cloudMid;
        for (const b of c.blobs) {
          const rad = calculateCloudBlobRadius(b.r * 0.92, smoothCloudDensity);
          const ox = b.ox * smoothCloudDensity;
          const oy = b.oy * (smoothCloudDensity > 1.2 ? smoothCloudDensity * 0.85 : smoothCloudDensity);
          drawCtx.beginPath();
          drawCtx.arc(cx + ox, cy + oy, rad, 0, Math.PI * 2);
          drawCtx.fill();
        }

        // Highlight
        drawCtx.fillStyle = colors.cloudLight;
        for (const b of c.blobs) {
          const rad = calculateCloudBlobRadius(b.r * 0.65, smoothCloudDensity);
          const ox = b.ox * smoothCloudDensity;
          const oy = b.oy * (smoothCloudDensity > 1.2 ? smoothCloudDensity * 0.85 : smoothCloudDensity);
          drawCtx.beginPath();
          drawCtx.arc(cx + ox, cy + oy - rad * 0.35, rad, 0, Math.PI * 2);
          drawCtx.fill();
        }

        // Weather-reactive bespoke touches:
        if (weather === 'rain' && (c.layer === 'mid' || c.layer === 'fg')) {
          // Rainstorm dripping fringes along underside
          drawCtx.fillStyle = colors.cloudShadow;
          for (let df = -24; df <= 24; df += 6) {
            const dropLen = 3 + Math.floor(Math.sin(tick * 0.12 + df * 0.8) * 3);
            drawCtx.fillRect(cx + df, cy + Math.floor(20 * smoothCloudDensity), 2, dropLen);
          }
        } else if (weather === 'aurora') {
          // Shimmering emerald-cyan rim luminescence
          drawCtx.fillStyle = 'rgba(52, 211, 153, 0.40)';
          for (const b of c.blobs) {
            const rad = calculateCloudBlobRadius(b.r * 0.45, smoothCloudDensity);
            const ox = b.ox * smoothCloudDensity;
            const oy = b.oy * smoothCloudDensity;
            drawCtx.beginPath();
            drawCtx.arc(cx + ox, cy + oy - rad * 0.45, rad, 0, Math.PI * 2);
            drawCtx.fill();
          }
        } else if (weather === 'snow') {
          // Frosted ice sparkles on cloud ridges
          drawCtx.fillStyle = '#ffffff';
          for (const b of c.blobs) {
            if (Math.sin(tick * 0.05 + b.ox) > 0.5) {
              drawCtx.fillRect(Math.floor(cx + b.ox * smoothCloudDensity), Math.floor(cy + b.oy - b.r * 0.45), 2, 2);
            }
          }
        } else if (weather === 'clear') {
          // Warm sunny golden edges
          drawCtx.fillStyle = 'rgba(254, 240, 138, 0.30)';
          for (const b of c.blobs) {
            const rad = calculateCloudBlobRadius(b.r * 0.40, smoothCloudDensity);
            const ox = b.ox * smoothCloudDensity;
            const oy = b.oy * smoothCloudDensity;
            drawCtx.beginPath();
            drawCtx.arc(cx + ox, cy + oy - rad * 0.45, rad, 0, Math.PI * 2);
            drawCtx.fill();
          }
        }

        drawCtx.restore();
      };

      for (const c of clouds) {
        // Vertical descent drift scaled by smoothCloudSpeed & boosted by dragonCloudSurge
        const effectiveCloudSpeed = smoothCloudSpeed * dragonCloudSurge;
        const verticalDrift = calculateCloudDriftVelocity(c.speed, effectiveCloudSpeed, 1.0, 0.6);
        c.y -= verticalDrift;

        // Horizontal lateral wind drift with layer parallax, Reynolds turbulence, and dragon slipstream wake
        const layerWindMult = c.layer === 'fg' ? 1.5 : c.layer === 'mid' ? 1.0 : 0.6;
        const { index: reynoldsTurbulence } = calculateReynoldsTurbulence(weather, speedMode, atmo.windSpeedScale ?? 1.0);
        const gustTurbulence = Math.sin(tick * 0.04 + c.y * 0.02) * (weather === 'rain' ? 0.75 : 0.2) * (reynoldsTurbulence * 0.45 + 0.55);
        
        // Dragon generates an atmospheric slipstream wind surge in its flight direction
        const dragonSlipstreamDraft = activeDragon
          ? activeDragon.vx * 0.45 * layerWindMult * (dragonCloudSurge - 1.0)
          : 0;

        c.x += (smoothWindX * layerWindMult * dragonCloudSurge) + gustTurbulence + dragonSlipstreamDraft;

        // Horizontal wrapping
        if (c.x < -140) {
          c.x = WIDTH + 100;
        } else if (c.x > WIDTH + 140) {
          c.x = -100;
        }

        // Part clouds around falling star path
        if (c.layer === 'mid') {
          const distY = Math.abs(c.y - starY);
          if (distY < 65) {
            c.x += (c.x < starX ? -1 : 1) * 0.6 * speedMult;
          }
        }

        // Vertical wrapping
        if (c.y < -90) {
          c.y = HEIGHT + 70;
          c.x = Math.random() > 0.5 ? Math.random() * (WIDTH * 0.35) - 30 : WIDTH * 0.65 + Math.random() * (WIDTH * 0.35);
        }
      }

      // 5A. Render Background Cloud Layer
      for (const c of clouds) {
        if (c.layer === 'bg') renderCloud(c, ctx);
      }

      // ==========================================
      // 5B. MYTHIC CELESTIAL DRAGON FLIGHT (Void Amethyst & Gemini Dragon)
      // ==========================================
      if (activeDragon) {
        renderCelestialDragon(
          ctx,
          activeDragon,
          tick,
          speedMult,
          dragonStardust
        );
      }

      // 5C. Render Mid and Foreground Cloud Layers (drifting over background and dragon)
      for (const c of clouds) {
        if (c.layer !== 'bg') renderCloud(c, ctx);
      }

      // ==========================================
      // 5D. SUPERCELL FRACTAL FORKED LIGHTNING
      // ==========================================
      if (activeLightningBolts.length > 0) {
        renderLightningBolts(ctx, activeLightningBolts);
      }

      // ==========================================
      // 6. CELESTIAL AI ENCOUNTER FLYBY (GPT, Claude, DeepSeek)
      // ==========================================
      if (activeAI) {
        activeAI.life++;
        activeAI.x += activeAI.vx * speedMult;
        activeAI.phase += 0.08;

        // Dynamic organic altitude wave (gentle atmospheric soaring bobbing)
        const waveAmp = activeAI.type === 'deepseek' ? 8 : activeAI.type === 'gpt' ? 5 : 6;
        activeAI.y = activeAI.baseY + Math.sin(activeAI.phase * 1.5) * waveAmp;

        const ax = Math.floor(activeAI.x);
        const ay = Math.floor(activeAI.y);

        // Record trailing trajectory coordinates
        activeAI.trajectoryHistory = updateEntityTrajectory(
          activeAI.trajectoryHistory,
          ax,
          ay,
          activeAI.primaryColor,
          activeAI.accentColor,
          85,
          1.5
        );

        // Spawn trailing AI particles with 50% boosted density (5 particles/frame) and bespoke themes
        const trailEmission = Math.floor(activeAI.trailRatePerFrame * (speedMult > 1 ? 1.4 : 1.0));
        for (let ep = 0; ep < trailEmission; ep++) {
          const colorIdx = Math.floor(Math.random() * activeAI.trailColors.length);
          const col = activeAI.trailColors[colorIdx];

          if (activeAI.type === 'gpt') {
            const spinDir = ep % 2 === 0 ? 1 : -1;
            particlePool.spawn({
              x: activeAI.x,
              y: activeAI.y,
              vx: -activeAI.vx * 0.35 + (Math.random() - 0.5) * 0.5,
              vy: -activeAI.vy * 0.35 + (Math.random() - 0.5) * 0.5,
              size: Math.random() > 0.6 ? 2 : 1,
              color: col,
              alpha: 0.95,
              life: 0,
              maxLife: 36 + Math.floor(Math.random() * 18),
              theme: 'gpt',
              angle: activeAI.phase * 3 + (ep * Math.PI) / 2.5,
              spin: 0.12 * spinDir,
              radius: 4 + Math.random() * 6,
              radiusSpeed: 0.45 + Math.random() * 0.5,
              baseX: activeAI.x,
              baseY: activeAI.y,
              char: Math.random() > 0.45 ? ['1', '0', 'λ', '∂', '∇', '✦'][Math.floor(Math.random() * 6)] : undefined,
              shape: Math.random() > 0.45 ? 'char' : 'pixel',
            });
          } else if (activeAI.type === 'claude') {
            // Solar flare promontory with magnetic coronal arc
            const angle = Math.PI + (Math.random() - 0.5) * 1.5;
            const flareSpeed = 0.9 + Math.random() * 2.4;
            particlePool.spawn({
              x: activeAI.x + (Math.random() - 0.5) * 8,
              y: activeAI.y + (Math.random() - 0.5) * 8,
              vx: Math.cos(angle) * flareSpeed - activeAI.vx * 0.25,
              vy: Math.sin(angle) * flareSpeed * 0.7 - 0.65,
              size: Math.random() > 0.55 ? 2 : 1,
              color: col,
              alpha: 0.95,
              life: 0,
              maxLife: 40 + Math.floor(Math.random() * 18),
              theme: 'claude',
              wavePhase: Math.random() * Math.PI * 2,
              shape: 'pixel',
            });
          } else {
            // DeepSeek hydrodynamic fluid wave & quantum sonar
            const isSonarRing = Math.random() > 0.80;
            particlePool.spawn({
              x: activeAI.x - activeAI.vx * 4 + (Math.random() - 0.5) * 6,
              y: activeAI.y + (Math.random() - 0.5) * 6,
              vx: -activeAI.vx * 0.45 + (Math.random() - 0.5) * 0.4,
              vy: (Math.random() - 0.5) * 0.6,
              size: isSonarRing ? 3 : (Math.random() > 0.6 ? 2 : 1),
              color: col,
              alpha: 0.95,
              life: 0,
              maxLife: 38 + Math.floor(Math.random() * 20),
              theme: 'deepseek',
              wavePhase: activeAI.phase + ep * 0.8,
              waveAmp: 1.6 + Math.random() * 1.5,
              shape: isSonarRing ? 'ring' : 'pixel',
            });
          }
        }

        // Render luminous glowing trajectory particle line behind entity
        if (currentProps.showTrajectoryLine !== false && activeAI.trajectoryHistory.length >= 2) {
          renderGlowingTrajectoryLine(
            ctx,
            activeAI.trajectoryHistory,
            activeAI.primaryColor,
            activeAI.accentColor,
            activeAI.glowColor,
            tick
          );
        }

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        const spriteImg = aiSprites[activeAI.type];
        const isLoaded = spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0;

        if (activeAI.type === 'deepseek') {
          // DeepSeek Cyan Quantum Whale (Authentic pixel mascot)
          const bobY = Math.sin(activeAI.phase * 2.2) * 2.5;
          const tilt = Math.sin(activeAI.phase * 1.5) * 0.08;
          const drawX = ax;
          const drawY = ay + bobY;

          // Crucial: Whale head must face the direction of flight (vx)
          // In the uploaded sprite art, the head is on the LEFT (x < 0).
          // When moving right (vx >= 0), flip horizontally (scaleX = -1) so the head faces right.
          // When moving left (vx < 0), keep normal (scaleX = 1) so the head faces left.
          const isMovingRight = activeAI.vx >= 0;

          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.rotate(isMovingRight ? -tilt : tilt);

          // Luminous Undersea / Cosmic Quantum Aura
          const whaleGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, 36);
          whaleGlow.addColorStop(0, 'rgba(0, 229, 255, 0.45)');
          whaleGlow.addColorStop(0.6, 'rgba(30, 136, 229, 0.22)');
          whaleGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = whaleGlow;
          ctx.beginPath();
          ctx.arc(0, 0, 36, 0, Math.PI * 2);
          ctx.fill();

          // Apply direction flip to whale body & forward sonar ripples
          ctx.save();
          ctx.scale(isMovingRight ? -1 : 1, 1);

          // Concentric Quantum Sonar Ripple Arc pulsing forward from whale snout (local x = -16)
          const sonarRadius = 14 + ((tick * 0.9) % 22);
          const sonarAlpha = Math.max(0, 1 - (sonarRadius - 14) / 22);
          ctx.strokeStyle = `rgba(0, 229, 255, ${sonarAlpha * 0.75})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(-16, 0, sonarRadius, Math.PI - 0.7, Math.PI + 0.7);
          ctx.stroke();

          if (isLoaded) {
            // Draw authentic DeepSeek Whale sprite (48x48 px crisp pixel art)
            const w = 48;
            const h = 48;
            ctx.drawImage(spriteImg, -w / 2, -h / 2, w, h);
          } else {
            // Fallback high-fidelity procedural pixel whale (head on left)
            ctx.fillStyle = activeAI.primaryColor;
            ctx.shadowColor = activeAI.accentColor;
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.ellipse(0, 0, 18, 10, 0.1, 0, Math.PI * 2);
            ctx.fill();
            // Tail fluke on right
            ctx.beginPath();
            ctx.moveTo(14, 0);
            ctx.lineTo(24, -8);
            ctx.lineTo(24, 8);
            ctx.closePath();
            ctx.fill();
            // Eye & underbelly on left
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-10, -2, 4, 3);
            ctx.beginPath();
            ctx.ellipse(-4, 3, 9, 4, 0.2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore(); // restore direction flip
          ctx.restore(); // restore translate & rotate
        } else if (activeAI.type === 'gpt') {
          // OpenAI Emerald-Teal Spiral Glyph (Upscaled authentic pixel squircle rosette badge)
          const bobY = Math.sin(activeAI.phase * 2.0) * 2.2;
          const drawX = ax;
          const drawY = ay + bobY;

          ctx.save();
          ctx.translate(drawX, drawY);

          // Emerald starlight radiance aura
          const gptGlow = ctx.createRadialGradient(0, 0, 8, 0, 0, 30);
          gptGlow.addColorStop(0, 'rgba(16, 185, 129, 0.55)');
          gptGlow.addColorStop(0.65, 'rgba(5, 150, 105, 0.2)');
          gptGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = gptGlow;
          ctx.beginPath();
          ctx.arc(0, 0, 30, 0, Math.PI * 2);
          ctx.fill();

          // Orbiting micro cyber matrix runes
          const runeOrbitR = 25;
          const runeAngle = activeAI.phase * 1.2;
          const rx = Math.cos(runeAngle) * runeOrbitR;
          const ry = Math.sin(runeAngle) * runeOrbitR;
          ctx.fillStyle = '#A7F3D0';
          ctx.font = '8px monospace';
          ctx.fillText('λ', rx, ry);

          const rx2 = Math.cos(runeAngle + Math.PI) * runeOrbitR;
          const ry2 = Math.sin(runeAngle + Math.PI) * runeOrbitR;
          ctx.fillStyle = '#6EE7B7';
          ctx.fillText('1', rx2, ry2);

          if (isLoaded) {
            // Draw authentic ChatGPT Rosette badge (44x44 px crisp pixel art)
            const size = 44;
            ctx.drawImage(spriteImg, -size / 2, -size / 2, size, size);
          } else {
            // Fallback rosette
            ctx.fillStyle = activeAI.primaryColor;
            ctx.shadowColor = activeAI.accentColor;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = activeAI.accentColor;
            ctx.lineWidth = 2.5;
            for (let sp = 0; sp < 6; sp++) {
              const angle = (sp * Math.PI) / 3 + activeAI.phase;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(angle) * 18, Math.sin(angle) * 18);
              ctx.stroke();
            }
          }

          ctx.restore();
        } else {
          // Anthropic Claude Terracotta Sunburst (Upscaled authentic pixel sunburst badge)
          const bobY = Math.sin(activeAI.phase * 2.1) * 2.2;
          const drawX = ax;
          const drawY = ay + bobY;

          ctx.save();
          ctx.translate(drawX, drawY);

          // Terracotta/gold solar coronal flare aura
          const claudeGlow = ctx.createRadialGradient(0, 0, 8, 0, 0, 30);
          claudeGlow.addColorStop(0, 'rgba(245, 158, 11, 0.55)');
          claudeGlow.addColorStop(0.65, 'rgba(217, 119, 6, 0.22)');
          claudeGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = claudeGlow;
          ctx.beginPath();
          ctx.arc(0, 0, 30, 0, Math.PI * 2);
          ctx.fill();

          // Cardinal coronal solar spikes
          const spikeLen = 23 + Math.sin(activeAI.phase * 3.0) * 3;
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-spikeLen, 0); ctx.lineTo(spikeLen, 0);
          ctx.moveTo(0, -spikeLen); ctx.lineTo(0, spikeLen);
          ctx.stroke();

          if (isLoaded) {
            // Draw authentic Claude Sunburst badge (44x44 px crisp pixel art)
            const size = 44;
            ctx.drawImage(spriteImg, -size / 2, -size / 2, size, size);
          } else {
            // Fallback sunburst
            ctx.fillStyle = activeAI.primaryColor;
            ctx.shadowColor = activeAI.accentColor;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = activeAI.accentColor;
            ctx.lineWidth = 2.5;
            for (let cp = 0; cp < 8; cp++) {
              const angle = (cp * Math.PI) / 4 + activeAI.phase * 0.6;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
              ctx.stroke();
            }
          }

          ctx.restore();
        }

        // Nameplate floating above the entity
        const nameplateOffset = activeAI.type === 'deepseek' ? 32 : 27;
        ctx.font = '10px monospace';
        ctx.fillStyle = activeAI.accentColor;
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.textAlign = 'center';
        ctx.fillText(`✦ ${activeAI.name} ✦`, ax, ay - nameplateOffset);

        // Cinematic Zoom Targeting Reticle & Tracking Bracket (Zoom focal brackets)
        if (currentZoom > 1.05) {
          const lockSize = activeAI.type === 'deepseek' ? 32 : 25;
          const bLen = 7;
          ctx.strokeStyle = activeAI.accentColor;
          ctx.lineWidth = 1;
          ctx.globalAlpha = Math.min(0.85, (currentZoom - 1.0) * 3.5);

          // Top-left corner
          ctx.beginPath();
          ctx.moveTo(ax - lockSize, ay - lockSize + bLen);
          ctx.lineTo(ax - lockSize, ay - lockSize);
          ctx.lineTo(ax - lockSize + bLen, ay - lockSize);
          ctx.stroke();

          // Top-right corner
          ctx.beginPath();
          ctx.moveTo(ax + lockSize - bLen, ay - lockSize);
          ctx.lineTo(ax + lockSize, ay - lockSize);
          ctx.lineTo(ax + lockSize, ay - lockSize + bLen);
          ctx.stroke();

          // Bottom-left corner
          ctx.beginPath();
          ctx.moveTo(ax - lockSize, ay + lockSize - bLen);
          ctx.lineTo(ax - lockSize, ay + lockSize);
          ctx.lineTo(ax - lockSize + bLen, ay + lockSize);
          ctx.stroke();

          // Bottom-right corner
          ctx.beginPath();
          ctx.moveTo(ax + lockSize - bLen, ay + lockSize);
          ctx.lineTo(ax + lockSize, ay + lockSize);
          ctx.lineTo(ax + lockSize, ay + lockSize - bLen);
          ctx.stroke();

          // Zoom focus label
          ctx.font = '8px monospace';
          ctx.fillStyle = activeAI.accentColor;
          ctx.fillText(`ZOOM ${(currentZoom).toFixed(2)}x // FOCUS`, ax, ay + lockSize + 12);
        }
        ctx.restore();

        // End encounter when entity has traversed across and exited the screen
        const isOffscreen =
          (activeAI.vx < 0 && ax < -80) ||
          (activeAI.vx > 0 && ax > WIDTH + 80) ||
          activeAI.life > activeAI.maxLife;

        if (isOffscreen) {
          if (activeAI.trajectoryHistory.length > 0) {
            fadingTrajectories.push({
              points: [...activeAI.trajectoryHistory],
              primaryColor: activeAI.primaryColor,
              accentColor: activeAI.accentColor,
              glowColor: activeAI.glowColor,
            });
          }
          activeAI = null;
          if (currentProps.onActiveEncounterChange) {
            currentProps.onActiveEncounterChange(null, '');
          }
        }
      }

      // Render and decay any fading trajectories from departed entities
      for (let ft = fadingTrajectories.length - 1; ft >= 0; ft--) {
        const item = fadingTrajectories[ft];
        let hasAlive = false;
        for (let p = 0; p < item.points.length; p++) {
          item.points[p].alpha -= 0.022;
          if (item.points[p].alpha > 0.02) hasAlive = true;
        }
        if (!hasAlive) {
          fadingTrajectories.splice(ft, 1);
          continue;
        }
        if (currentProps.showTrajectoryLine !== false && item.points.length >= 2) {
          renderGlowingTrajectoryLine(
            ctx,
            item.points,
            item.primaryColor,
            item.accentColor,
            item.glowColor,
            tick
          );
        }
      }

      // ==========================================
      // 7. PRECIPITATION PARTICLES: RAIN & SNOW
      // ==========================================
      // 7A. Rain Precipitation
      if (weather === 'rain') {
        ctx.save();
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.2;
        for (const drop of raindrops) {
          drop.x += drop.vx * speedMult;
          drop.y += drop.vy * speedMult;

          if (drop.y > HEIGHT) {
            drop.y = -drop.len - Math.random() * 20;
            drop.x = Math.random() * (WIDTH + 60) - 30;
          }

          // Trigger splash when crossing into ocean horizon zone (y > 200)
          if (drop.y >= 210 && Math.random() > 0.88 && rainSplashes.length < 35) {
            rainSplashes.push({
              x: drop.x,
              y: drop.y,
              r: 1,
              maxR: 4 + Math.random() * 3,
              alpha: 0.85,
            });
          }

          ctx.globalAlpha = drop.alpha;
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + drop.vx * 1.5, drop.y + drop.len);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 7B. Snow Precipitation
      if (weather === 'snow') {
        ctx.save();
        for (const flake of snowflakes) {
          flake.sway += 0.04;
          flake.x += Math.sin(flake.sway) * 0.7 - 0.2;
          flake.y += flake.vy * speedMult;

          if (flake.y > HEIGHT) {
            flake.y = -5;
            flake.x = Math.random() * WIDTH;
          }
          if (flake.x < 0) flake.x = WIDTH;
          if (flake.x > WIDTH) flake.x = 0;

          ctx.fillStyle = flake.r === 2 ? '#ffffff' : '#e0f2fe';
          ctx.globalAlpha = flake.alpha;
          ctx.fillRect(Math.floor(flake.x), Math.floor(flake.y), flake.r, flake.r);
        }
        ctx.restore();
      }

      // ==========================================
      // 8. FALLING GOOGLE GEMINI STAR
      // ==========================================
      // Compute Dragon Resonance Starlight Glow & Special Motion (adapting to dragon element)
      const dragonRedConfig = calculateDragonRedGlowColors(
        dragonRedGlowFactor,
        colors,
        tick,
        activeDragon?.variant || currentDragonVariant
      );

      // Celestial Starlight Aura (Blazing elemental starlight halo during dragon encounter)
      ctx.save();
      const currentAuraR = dragonRedGlowFactor > 0.05 ? dragonRedConfig.auraRadius : 52;
      const auraGrad = ctx.createRadialGradient(starX, starY, 4, starX, starY, currentAuraR);
      if (dragonRedGlowFactor > 0.05) {
        const cAlpha = dragonRedConfig.crimsonAuraAlpha;
        const { r, g, b } = dragonRedConfig.auraRgba;
        auraGrad.addColorStop(
          0,
          `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)}, ${(0.85 * cAlpha).toFixed(2)})`
        );
        auraGrad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${(0.62 * cAlpha).toFixed(2)})`);
        auraGrad.addColorStop(
          0.70,
          `rgba(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)}, ${(0.28 * cAlpha).toFixed(2)})`
        );
        auraGrad.addColorStop(1, `rgba(${Math.max(0, r - 80)}, ${Math.max(0, g - 80)}, ${Math.max(0, b - 80)}, 0)`);
      } else {
        auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        auraGrad.addColorStop(0.45, 'rgba(129, 140, 248, 0.25)');
        auraGrad.addColorStop(0.8, 'rgba(232, 121, 249, 0.12)');
        auraGrad.addColorStop(1, 'rgba(232, 121, 249, 0)');
      }
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(starX, starY, currentAuraR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Dragon Elemental Starlight Laser Flare Beams (Rotating cardinal spikes shooting from logo)
      if (dragonRedGlowFactor > 0.08) {
        ctx.save();
        const beamLen = dragonRedConfig.redLaserFlareLength;
        const bAlpha = dragonRedGlowFactor * 0.78;
        ctx.globalAlpha = bAlpha;
        ctx.fillStyle = dragonRedConfig.laserFlareColor;
        for (let b = 0; b < 4; b++) {
          const bAngle = starAngle + (b * Math.PI) / 2;
          const tipX = starX + Math.cos(bAngle) * beamLen;
          const tipY = starY + Math.sin(bAngle) * beamLen;
          const perpAngle = bAngle + Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(starX, starY);
          ctx.lineTo(
            starX + Math.cos(perpAngle) * 3 + Math.cos(bAngle) * (beamLen * 0.22),
            starY + Math.sin(perpAngle) * 3 + Math.sin(bAngle) * (beamLen * 0.22)
          );
          ctx.lineTo(tipX, tipY);
          ctx.lineTo(
            starX - Math.cos(perpAngle) * 3 + Math.cos(bAngle) * (beamLen * 0.22),
            starY - Math.sin(perpAngle) * 3 + Math.sin(bAngle) * (beamLen * 0.22)
          );
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Atmospheric re-entry shockwaves (turns into dragon's elemental hue during encounter)
      if (tick % (dragonRedGlowFactor > 0.4 ? 14 : 20) === 0) {
        shockwaves.push({
          x: starX,
          y: starY + 12,
          r: 8,
          alpha: 0.95,
          color: dragonRedGlowFactor > 0.3 ? dragonRedConfig.laserFlareColor : colors.geminiCyan,
        });
      }

      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.r += 2.4 * speedMult;
        sw.alpha *= 0.91;
        if (sw.alpha < 0.04 || sw.r > 65) {
          shockwaves.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = sw.alpha;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(sw.x, sw.y, sw.r * 1.4, sw.r * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Particle Trail behind star (with dragon crimson plasma embers)
      if (currentProps.showStarTrails) {
        const spawnCount = Math.floor(6 * speedMult);
        const trailPalette =
          dragonRedGlowFactor > 0.35 ? dragonRedConfig.trailPlasma : colors.trailPlasma;
        for (let s = 0; s < spawnCount; s++) {
          const col = trailPalette[Math.floor(Math.random() * trailPalette.length)];
          particlePool.spawn({
            x: starX + (Math.random() - 0.5) * 20,
            y: starY - Math.random() * 8,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -(4.0 + Math.random() * 5.5) * speedMult,
            size: Math.random() > 0.75 ? 2 : 1,
            color: col,
            alpha: 0.95,
            maxLife: 24 + Math.floor(Math.random() * 26),
          });
        }
      }

      // Draw all active particles with bespoke constellation physics models using zero-allocation pool
      const particleDrawCtx = ctx;
      particlePool.update((p) => {
        p.life++;
        const prog = p.life / p.maxLife;

        // Apply theme-specific physical motion
        if (p.theme === 'gpt') {
          // Logarithmic spiral / dual-vortex orbit
          p.angle = (p.angle ?? 0) + (p.spin ?? 0.08);
          p.radius = (p.radius ?? 4) + (p.radiusSpeed ?? 0.4);
          p.baseX = (p.baseX ?? p.x) + p.vx;
          p.baseY = (p.baseY ?? p.y) + p.vy;
          p.x = p.baseX + Math.cos(p.angle) * p.radius;
          p.y = p.baseY + Math.sin(p.angle) * p.radius;
        } else if (p.theme === 'claude') {
          // Solar flare promontory with magnetic loop curvature & downward solar gravity
          p.vy += 0.045; // downward gravitational drift
          p.vx *= 0.985; // thermal drag
          p.x += p.vx + Math.sin(p.life * 0.16) * 0.75;
          p.y += p.vy;
        } else if (p.theme === 'deepseek') {
          // Hydrodynamic fluid wave & quantum sonar oscillation
          p.vx *= 0.97; // fluid drag
          p.x += p.vx;
          p.y += Math.sin(p.life * 0.18) * 1.6 + p.vy;
          if (p.shape === 'ring') {
            p.size += 0.14; // expanding sonar acoustic wave ring
          }
        } else {
          // Standard star descent particles
          p.x += p.vx;
          p.y += p.vy;
        }

        p.alpha = Math.max(0, 1 - prog);

        if (p.life >= p.maxLife || p.y < -30 || p.y > HEIGHT + 40) {
          return false; // Safely recycle in O(1)
        }

        particleDrawCtx.fillStyle = p.color;
        particleDrawCtx.globalAlpha = p.alpha;

        if (p.shape === 'ring') {
          particleDrawCtx.save();
          particleDrawCtx.strokeStyle = p.color;
          particleDrawCtx.lineWidth = 1.2;
          particleDrawCtx.beginPath();
          particleDrawCtx.arc(Math.floor(p.x), Math.floor(p.y), Math.max(1, p.size), 0, Math.PI * 2);
          particleDrawCtx.stroke();
          particleDrawCtx.restore();
        } else if (p.char) {
          particleDrawCtx.font = '9px monospace';
          particleDrawCtx.fillText(p.char, Math.floor(p.x), Math.floor(p.y));
        } else {
          particleDrawCtx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.max(1, Math.floor(p.size)), Math.max(1, Math.floor(p.size)));
        }

        return true;
      });
      ctx.globalAlpha = 1.0;

      // Render and update plasma thruster plume exhaust particles
      if (thrusterParticles.length > 0) {
        ctx.save();
        for (let tp = thrusterParticles.length - 1; tp >= 0; tp--) {
          const p = thrusterParticles[tp];
          p.life++;
          p.x += p.vx * speedMult;
          p.y += p.vy * speedMult;
          p.alpha *= 0.88;
          if (p.alpha <= 0.02 || p.life >= p.maxLife) {
            thrusterParticles.splice(tp, 1);
            continue;
          }
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
        }
        ctx.restore();
      }

      // ==========================================
      // 8B. ARCADE STARDUST RINGS & COLLECT REWARD
      // ==========================================
      if (stardustRings.length > 0) {
        renderArcadeRings(ctx, stardustRings, tick);
      }

      // ==========================================
      // 8C. ST. ELMO'S FIRE CORONA DISCHARGE SPARKS
      // ==========================================
      if (stElmoSparks.length > 0) {
        ctx.save();
        for (const spk of stElmoSparks) {
          ctx.fillStyle = spk.color;
          ctx.globalAlpha = spk.alpha;
          ctx.fillRect(Math.floor(spk.x), Math.floor(spk.y), spk.size, spk.size);
        }
        ctx.restore();
      }

      // 9. THE GOOGLE GEMINI 4-POINTED STAR (Meticulous Pixel Art, with Dragon Crimson Resonance)
      const R = Math.round(30 * dragonRedConfig.pulseScale);
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const check = isPointInsideGeminiStar(
            starX + dx,
            starY + dy,
            starX,
            starY,
            R,
            starAngle,
            0.58
          );

          if (check.inside) {
            const px = Math.floor(starX + dx);
            const py = Math.floor(starY + dy);
            const dist = check.dist;
            const diagT = (check.normX + check.normY + 2) / 4;

            let col = dragonRedConfig.geminiCyan;
            let alpha = 1.0;

            if (dist < 0.16) {
              col = dragonRedConfig.geminiCore;
            } else if (diagT < 0.38) {
              col = dragonRedConfig.geminiCyan;
            } else if (diagT < 0.64) {
              col = dragonRedConfig.geminiViolet;
            } else {
              col = dragonRedConfig.geminiMagenta;
            }

            if (dist > 0.90) alpha = 0.82;

            ctx.fillStyle = col;
            ctx.globalAlpha = alpha;
            ctx.fillRect(px, py, 1, 1);
          }
        }
      }

      // Plasma bow shock on leading downward tip
      ctx.save();
      ctx.globalAlpha = 0.8 + 0.2 * Math.sin(tick * 0.25);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.floor(starX - 1), Math.floor(starY + R * 0.9), 3, 2);
      ctx.fillStyle = dragonRedConfig.geminiCyan;
      ctx.fillRect(Math.floor(starX - 4), Math.floor(starY + R * 0.82), 9, 2);
      ctx.restore();

      // Companion Satellite Star (Binary formation, ignited in crimson during dragon flyby)
      const secR = Math.round(12 * dragonRedConfig.pulseScale);
      const secX = starX + 28;
      const secY = starY - 20;
      for (let dy = -secR; dy <= secR; dy++) {
        for (let dx = -secR; dx <= secR; dx++) {
          const check = isPointInsideGeminiStar(
            secX + dx,
            secY + dy,
            secX,
            secY,
            secR,
            starAngle * 0.85,
            0.58
          );

          if (check.inside) {
            const px = Math.floor(secX + dx);
            const py = Math.floor(secY + dy);
            let col = dragonRedConfig.geminiViolet;
            if (check.dist < 0.22) col = dragonRedConfig.geminiCore;
            else if (check.normX < 0) col = dragonRedConfig.geminiCyan;
            else col = dragonRedConfig.geminiMagenta;
            ctx.fillStyle = col;
            ctx.fillRect(px, py, 1, 1);
          }
        }
      }

      // 10. SPEED LINES
      ctx.fillStyle = '#ffffff';
      for (const line of speedLines) {
        line.y -= line.speed * speedMult;
        if (line.y < -line.len) {
          line.y = HEIGHT + Math.random() * 40;
          line.x = Math.random() * WIDTH;
        }
        ctx.globalAlpha = line.alpha * (currentProps.speedMode === 'mach' ? 0.9 : 0.45);
        ctx.fillRect(Math.floor(line.x), Math.floor(line.y), 1, line.len);
      }
      ctx.globalAlpha = 1.0;

      // ==========================================
      // 11. SCREEN BOTTOM RESIDUAL LIGHT AFTERGLOW (Horizon Light Reservoir)
      // ==========================================
      if (bottomAfterglowPool.length > 0) {
        ctx.save();
        const glowItems = calculateBottomResidualGlowGradient(bottomAfterglowPool, WIDTH, HEIGHT);
        for (const item of glowItems) {
          const radGrad = ctx.createRadialGradient(
            item.x,
            item.y,
            2,
            item.x,
            item.y,
            item.radiusX
          );
          radGrad.addColorStop(0, item.color);
          radGrad.addColorStop(0.35, `${item.color}99`);
          radGrad.addColorStop(0.75, `${item.color}35`);
          radGrad.addColorStop(1, 'transparent');

          ctx.globalAlpha = item.alpha;
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.ellipse(item.x, item.y, item.radiusX, item.radiusY, 0, 0, Math.PI * 2);
          ctx.fill();

          // Soft starlight spark sprinkles along bottom impact site
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = item.alpha * 0.70;
          const sparkOffset = Math.sin(tick * 0.18 + item.x) * (item.radiusX * 0.45);
          ctx.fillRect(Math.floor(item.x + sparkOffset), Math.floor(item.y - 3), 1, 1);
        }

        // Ambient continuous horizon starlight luminescence across screen bottom
        const totalIntensity = bottomAfterglowPool.reduce((acc, p) => acc + p.intensity, 0);
        if (totalIntensity > 0.05) {
          const baseAlpha = Math.min(0.26, totalIntensity * 0.06);
          const horizonHaze = ctx.createLinearGradient(0, HEIGHT - 38, 0, HEIGHT);
          horizonHaze.addColorStop(0, 'transparent');
          horizonHaze.addColorStop(0.5, `rgba(56, 189, 248, ${baseAlpha.toFixed(3)})`);
          horizonHaze.addColorStop(1, `rgba(129, 140, 248, ${(baseAlpha * 1.35).toFixed(3)})`);
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = horizonHaze;
          ctx.fillRect(0, HEIGHT - 38, WIDTH, 38);
        }
        ctx.restore();
      }

      // Restore camera shake and focal zoom transformation
      ctx.restore();

      // Screen-space interactive cursor starlight particles & nova bursts
      const activeSparkles = updateCursorSparkles(cursorSparkles, speedMult);
      cursorSparkles.length = 0;
      for (let k = 0; k < activeSparkles.length; k++) cursorSparkles.push(activeSparkles[k]);

      const activeNovas = updateCursorBurstNovas(cursorNovas, speedMult);
      cursorNovas.length = 0;
      for (let k = 0; k < activeNovas.length; k++) cursorNovas.push(activeNovas[k]);

      renderCursorStarlight(ctx, cursorSparkles, cursorNovas);

      // Screen-space overlays (pixel grid and cinema letterbox bars)
      if (atmo?.showPixelGrid) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let gx = 0; gx < WIDTH; gx += 4) {
          for (let gy = 0; gy < HEIGHT; gy += 4) {
            ctx.fillRect(gx, gy, 1, 1);
          }
        }
      }

      // Anamorphic 2.39:1 Cinema Bars
      if (atmo?.cinemaBars) {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, WIDTH, 28);
        ctx.fillRect(0, HEIGHT - 28, WIDTH, 28);
      }

      animId = requestAnimationFrame(render);
    };

    // Interactive pointer motion listeners for starlight trail, burst, and star-chart hover
    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const pos = mapScreenToCanvasCoords(e.clientX, e.clientY, rect, WIDTH, HEIGHT);
      if (!pos) {
        lastCursorPos = null;
        hoveredAsterismId = null;
        hoveredSatellite = null;
        return;
      }

      // Check hovered constellation asterism if star chart is active
      if (propsRef.current.starChartEnabled) {
        hoveredAsterismId = findHoveredAsterism(pos.x, pos.y)?.id || null;
      } else {
        hoveredAsterismId = null;
      }

      // Check hovered orbital satellite
      hoveredSatellite = findHoveredSatellite(orbitalSatellites, pos.x, pos.y);
      if (propsRef.current.onHoveredSatelliteChange) {
        propsRef.current.onHoveredSatelliteChange(hoveredSatellite);
      }

      // Spawn subtle trailing starlight particles along motion trajectory
      const sparks = createCursorTrailSparkle(pos.x, pos.y, lastCursorPos?.x, lastCursorPos?.y, 2);
      for (let k = 0; k < sparks.length; k++) {
        cursorSparkles.push(sparks[k]);
      }
      lastCursorPos = pos;
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const pos = mapScreenToCanvasCoords(e.clientX, e.clientY, rect, WIDTH, HEIGHT);
      if (!pos) return;

      // Burst explosion animation: 16 radial sparks + expanding nova shockwave ring
      const { sparkles: burstSparks, nova } = createCursorBurstSparks(pos.x, pos.y, 16);
      for (let k = 0; k < burstSparks.length; k++) {
        cursorSparkles.push(burstSparks[k]);
      }
      cursorNovas.push(nova);

      // Check if clicking on an asterism while Star-Chart is active
      if (propsRef.current.starChartEnabled) {
        const clickedAsterism = findHoveredAsterism(pos.x, pos.y);
        if (clickedAsterism && propsRef.current.onAsterismSelect) {
          propsRef.current.onAsterismSelect(clickedAsterism, { x: e.clientX, y: e.clientY });
        }
      }

      // Play audio feedback: satellite radio beep if clicking satellite, otherwise crystalline chime
      if (propsRef.current.soundEnabled) {
        if (hoveredSatellite) {
          playSatelliteRadioBeepSound();
        } else {
          triggerStarSparkleChime();
        }
      }
    };

    const handlePointerLeave = () => {
      lastCursorPos = null;
      hoveredAsterismId = null;
      hoveredSatellite = null;
      if (propsRef.current.onHoveredSatelliteChange) {
        propsRef.current.onHoveredSatelliteChange(null);
      }
    };

    // Keyboard listeners for steerable glider flight mode (Arrow keys + WASD)
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && ['INPUT', 'TEXTAREA'].includes(activeEl.tagName)) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gliderInputs.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gliderInputs.right = true;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        gliderInputs.up = true;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        gliderInputs.down = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gliderInputs.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gliderInputs.right = false;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        gliderInputs.up = false;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        gliderInputs.down = false;
      }
    };

    // Canvas Context Loss & GPU Recovery Engine
    const recoveryManager = new CanvasContextRecoveryManager();
    recoveryManager.attach(canvas, {
      onContextLost: () => {
        isContextPaused = true;
        cancelAnimationFrame(animId);
      },
      onContextRestored: (newCtx) => {
        ctx = newCtx;
        ctx.imageSmoothingEnabled = false;
        initDragonSpriteSheet('/assets/aistudio/pickle-1793172207529_40c1adee.png');
        isContextPaused = false;
        animId = requestAnimationFrame(render);
      },
    });

    // Prevent key ghosting on window/tab blur
    const handleBlur = () => {
      gliderInputs.left = false;
      gliderInputs.right = false;
      gliderInputs.up = false;
      gliderInputs.down = false;
    };
    window.addEventListener('blur', handleBlur);

    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      recoveryManager.detach();
      window.removeEventListener('blur', handleBlur);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // Run ONCE!

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="w-full h-full object-contain pixelated block select-none"
        style={{
          imageRendering: 'pixelated',
          aspectRatio: `${WIDTH}/${HEIGHT}`,
        }}
      />
      {props.showScanlines && (
        <div
          className="absolute inset-0 crt-overlay pointer-events-none"
          style={{ opacity: props.atmosphereSettings?.crtScanlineIntensity ?? 0.22 }}
        />
      )}
    </div>
  );
};
