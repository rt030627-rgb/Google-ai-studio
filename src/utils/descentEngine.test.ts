/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPointInsideGeminiStar,
  lerpColor,
  hexToRgb,
  getInterpolatedColors,
  createAIEncounter,
  TIME_PHASES,
  applyWeatherTint,
  WEATHER_CONFIGS,
  calculateCloudDriftVelocity,
  calculateCloudBlobRadius,
  lerpWeatherValue,
  calculateEncounterCameraTarget,
  lerpCameraValue,
  updateEntityTrajectory,
  calculateTrajectoryPulseIndex,
  TrajectoryPoint,
  getHapticPattern,
  triggerCelestialHaptic,
  getScreenJitterKeyframes,
  getRedAlertStrobeTimeline,
  createAstralDragon,
  updateAstralDragon,
  createAstralBirdFlock,
  updateAstralBirdFlock,
  calculateGeminiAwakeningTransform,
  calculateDragonWingPoints,
  calculateDragonRedGlowColors,
  calculateDragonCloudSurge,
  DRAGON_VARIANTS,
  isNightOrMidnight,
  calculateNightFactor,
  createPixelMeteor,
  updatePixelMeteor,
  calculateMeteorTailPoints,
  addMeteorBottomAfterglow,
  updateMeteorAfterglowPool,
  calculateBottomResidualGlowGradient,
  generateConstellationTelemetry,
  getAllConstellationsTelemetry,
} from './descentEngine.ts';

test('isPointInsideGeminiStar correctly evaluates star points', () => {
  const center = isPointInsideGeminiStar(100, 100, 100, 100, 50);
  assert.equal(center.inside, true);
  assert.equal(center.dist, 0);

  const tipX = isPointInsideGeminiStar(150, 100, 100, 100, 50);
  assert.equal(tipX.inside, true);

  const farOut = isPointInsideGeminiStar(200, 200, 100, 100, 50);
  assert.equal(farOut.inside, false);
});

test('getInterpolatedColors smoothly cycles through all 4 time phases', () => {
  const dawn = getInterpolatedColors(0.0);
  assert.equal(dawn.phaseIndex, 0);
  assert.ok(dawn.colors.skyTop);

  const golden = getInterpolatedColors(0.25);
  assert.equal(golden.phaseIndex, 1);

  const twilight = getInterpolatedColors(0.5);
  assert.equal(twilight.phaseIndex, 2);

  const midnight = getInterpolatedColors(0.75);
  assert.equal(midnight.phaseIndex, 3);
});

test('createAIEncounter initializes valid long-duration AI avatars', () => {
  const gpt = createAIEncounter('gpt', 480, 300);
  assert.equal(gpt.type, 'gpt');
  assert.equal(gpt.primaryColor, '#10A37F');
  assert.ok(gpt.maxLife >= 400);
  assert.equal(gpt.avatarUrl, '/assets/aistudio/chatgpt-logo-20261026-213226.png');

  const claude = createAIEncounter('claude', 480, 300);
  assert.equal(claude.type, 'claude');
  assert.equal(claude.primaryColor, '#D97706');
  assert.equal(claude.avatarUrl, '/assets/aistudio/claude-logo-20261026-213714-preview.png');

  const deepseek = createAIEncounter('deepseek', 480, 300);
  assert.equal(deepseek.type, 'deepseek');
  assert.equal(deepseek.primaryColor, '#00E5FF');
  assert.equal(deepseek.avatarUrl, '/assets/aistudio/deepseek-whale-20261026-191209-preview.png');
});

test('WEATHER_CONFIGS and applyWeatherTint operate correctly for all 5 weather modes', () => {
  assert.ok(WEATHER_CONFIGS.rain);
  assert.ok(WEATHER_CONFIGS.snow);
  assert.ok(WEATHER_CONFIGS.mist);
  assert.ok(WEATHER_CONFIGS.clear);
  assert.ok(WEATHER_CONFIGS.aurora);

  // Rainstorm has highest cloud drift speed (2.5x) and heaviest density (1.55x)
  assert.equal(WEATHER_CONFIGS.rain.cloudSpeedMult, 2.5);
  assert.equal(WEATHER_CONFIGS.rain.cloudDensityMod, 1.55);

  // Aurora has tranquil slow mystical drift (0.5x)
  assert.equal(WEATHER_CONFIGS.aurora.cloudSpeedMult, 0.5);
  assert.equal(WEATHER_CONFIGS.aurora.cloudDensityMod, 0.9);

  // Clear sky has light sparse clouds (-25% density)
  assert.equal(WEATHER_CONFIGS.clear.cloudDensityMod, 0.75);

  const tinted = applyWeatherTint('#ffffff', { tintR: -30, tintG: -20, tintB: -10 });
  assert.equal(tinted, 'rgb(225,235,245)');
});

test('calculateCloudDriftVelocity calculates correct weather and speed mode scaled velocities', () => {
  const baseSpeed = 1.0;
  
  // Clear weather in normal speed mode
  const clearVel = calculateCloudDriftVelocity(baseSpeed, WEATHER_CONFIGS.clear.cloudSpeedMult, 1.0);
  // Rainstorm weather in normal speed mode
  const rainVel = calculateCloudDriftVelocity(baseSpeed, WEATHER_CONFIGS.rain.cloudSpeedMult, 1.0);
  
  assert.ok(rainVel > clearVel * 2.5);
});

test('calculateCloudBlobRadius dynamically expands and contracts with weather density', () => {
  const baseR = 20;

  const clearR = calculateCloudBlobRadius(baseR, WEATHER_CONFIGS.clear.cloudDensityMod);
  const rainR = calculateCloudBlobRadius(baseR, WEATHER_CONFIGS.rain.cloudDensityMod);

  assert.equal(clearR, 15); // 20 * 0.75
  assert.equal(rainR, 31); // 20 * 1.55
  assert.ok(rainR > clearR * 2);
});

test('lerpWeatherValue smoothly converges values towards target', () => {
  let current = 1.0;
  const target = 2.5;

  current = lerpWeatherValue(current, target, 0.1);
  assert.ok(current > 1.0 && current < 2.5);
  assert.equal(Math.round(current * 100) / 100, 1.15);
});

test('calculateEncounterCameraTarget centers on entity when active, returns to center when inactive', () => {
  const width = 480;
  const height = 300;

  // Inactive encounter
  const inactive = calculateEncounterCameraTarget(100, 100, width, height, false);
  assert.equal(inactive.targetX, 240);
  assert.equal(inactive.targetY, 150);
  assert.equal(inactive.targetZoom, 1.0);

  // Active encounter with entity at (200, 120)
  const active = calculateEncounterCameraTarget(200, 120, width, height, true);
  assert.equal(active.targetZoom, 1.30);
  assert.equal(active.targetX, 200);
  assert.equal(active.targetY, 120);

  // Active encounter clamping out-of-bounds positions
  const clamped = calculateEncounterCameraTarget(10, 10, width, height, true);
  assert.equal(clamped.targetZoom, 1.30);
  assert.ok(clamped.targetX >= width * 0.28);
  assert.ok(clamped.targetY >= height * 0.24);
});

test('lerpCameraValue smoothly interpolates towards target zoom and position', () => {
  const currentZoom = 1.0;
  const targetZoom = 1.30;
  const nextZoom = lerpCameraValue(currentZoom, targetZoom, 0.05);

  assert.ok(nextZoom > currentZoom);
  assert.ok(nextZoom < targetZoom);
  assert.equal(Math.round(nextZoom * 1000) / 1000, 1.015);
});

test('updateEntityTrajectory appends points, decays alpha, and clamps length', () => {
  let history: TrajectoryPoint[] = [];

  // Add initial point
  history = updateEntityTrajectory(history, 100, 150, '#10A37F', '#34D399', 10, 2);
  assert.equal(history.length, 1);
  assert.equal(history[0].x, 100);
  assert.equal(history[0].y, 150);
  assert.equal(history[0].alpha, 1.0);

  // Moving slightly less than minDistance (1.0px) should NOT add duplicate point
  history = updateEntityTrajectory(history, 100.5, 150.5, '#10A37F', '#34D399', 10, 2);
  assert.equal(history.length, 1);

  // Moving further (5px) should add second point and decay first point's alpha
  history = updateEntityTrajectory(history, 105, 150, '#10A37F', '#34D399', 10, 2);
  assert.equal(history.length, 2);
  assert.ok(history[0].alpha < 1.0);
  assert.equal(history[1].alpha, 1.0);
  assert.equal(history[1].x, 105);

  // Exceeding max points (10) should truncate oldest points
  for (let i = 0; i < 15; i++) {
    history = updateEntityTrajectory(history, 110 + i * 5, 150, '#10A37F', '#34D399', 10, 2);
  }
  assert.ok(history.length <= 10);
});

test('calculateTrajectoryPulseIndex correctly computes traveling packet index', () => {
  const pointsCount = 20;

  // At tick 0, pulse is at the entity head (pointsCount - 1)
  const idx0 = calculateTrajectoryPulseIndex(0, pointsCount, 1.0);
  assert.equal(idx0, 19);

  // At tick 5, pulse travels backwards along trail
  const idx5 = calculateTrajectoryPulseIndex(5, pointsCount, 1.0);
  assert.equal(idx5, 14);

  // Empty points returns -1
  assert.equal(calculateTrajectoryPulseIndex(10, 0), -1);
});

test('getHapticPattern returns distinctive pulse cadences per AI entity', () => {
  const gpt = getHapticPattern('gpt');
  const claude = getHapticPattern('claude');
  const deepseek = getHapticPattern('deepseek');
  const general = getHapticPattern('general');

  assert.ok(Array.isArray(gpt));
  assert.ok(Array.isArray(claude));
  assert.ok(Array.isArray(deepseek));
  assert.ok(Array.isArray(general));

  // Claude's heavy seismic rumble has longer duration pulses
  assert.ok(claude[0] > gpt[0]);
  assert.ok(claude[0] > 100);

  // GPT has 5 fast pulses
  assert.equal(gpt.length, 5);
});

test('triggerCelestialHaptic safely handles environments without vibrate API', () => {
  // In node environment without navigator.vibrate, it gracefully returns false without crashing
  const result = triggerCelestialHaptic('claude');
  assert.equal(typeof result, 'boolean');
});

test('getScreenJitterKeyframes returns scaled displacement values ending in zero', () => {
  const keyframes = getScreenJitterKeyframes(1.0);
  assert.ok(keyframes.x.length >= 8);
  assert.ok(keyframes.y.length >= 8);
  assert.ok(keyframes.rotate.length >= 5);

  // Last keyframe must be 0 to return to rest position
  assert.equal(keyframes.x[keyframes.x.length - 1], 0);
  assert.equal(keyframes.y[keyframes.y.length - 1], 0);
  assert.equal(keyframes.rotate[keyframes.rotate.length - 1], 0);

  // High intensity scaling
  const boosted = getScreenJitterKeyframes(2.0);
  assert.ok(Math.abs(boosted.x[0]) > Math.abs(keyframes.x[0]));
});

test('getRedAlertStrobeTimeline returns 1-second keyframe timeline ending in 0', () => {
  const timeline = getRedAlertStrobeTimeline(1.0);
  assert.equal(timeline.duration, 1.0);
  assert.equal(timeline.keyframes[0], 0);
  assert.equal(timeline.keyframes[timeline.keyframes.length - 1], 0);
  assert.equal(timeline.times[timeline.times.length - 1], 1.0);
  assert.ok(timeline.keyframes.length === timeline.times.length);
});

test('createAstralDragon creates valid serpentine dragon with tapered spine segments and flapping wings', () => {
  const dragon = createAstralDragon(360, 240, 'ltr');
  assert.equal(dragon.direction, 'ltr');
  assert.equal(dragon.segments.length, 22);
  assert.equal(dragon.isSilhouette, true);
  assert.ok(dragon.wingSpan >= 36);
  assert.ok(dragon.segments[0].radius > dragon.segments[dragon.segments.length - 1].radius);
  assert.ok(dragon.vx > 0);

  // Update kinematics and verify movement and wing phase
  const initialHeadX = dragon.headX;
  const initialWingPhase = dragon.wingPhase;
  const isAlive = updateAstralDragon(dragon, 360, 240, 1.0);
  assert.ok(isAlive);
  assert.ok(dragon.headX > initialHeadX);
  assert.notEqual(dragon.wingPhase, initialWingPhase);

  // Distance constraint along spine segments
  for (let i = 1; i < dragon.segments.length; i++) {
    const p1 = dragon.segments[i - 1];
    const p2 = dragon.segments[i];
    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    assert.ok(dist <= 9.0 && dist >= 6.0, `Segment distance ${dist} must remain constrained`);
  }
});

test('calculateDragonWingPoints computes multi-jointed wings responsive to flap angle', () => {
  const dragon = createAstralDragon(360, 240, 'ltr');
  const wings1 = calculateDragonWingPoints(dragon);
  assert.ok(wings1.leftWing.tipX !== undefined);
  assert.ok(wings1.rightWing.tipY !== undefined);

  // Advance wing phase by half cycle
  dragon.wingPhase += Math.PI;
  const wings2 = calculateDragonWingPoints(dragon);
  assert.notEqual(wings1.flapAngle, wings2.flapAngle);
  assert.notEqual(wings1.leftWing.tipY, wings2.leftWing.tipY);
});

test('calculateDragonRedGlowColors transforms Gemini logo colors to intense crimson red and scales aura', () => {
  const baseColors = {
    skyTop: '#000',
    skyMid: '#000',
    skyBottom: '#000',
    cloudLight: '#fff',
    cloudMid: '#888',
    cloudShadow: '#333',
    oceanDeep: '#001',
    oceanCoast: '#002',
    earthLand: '#010',
    earthForest: '#020',
    earthSnow: '#eee',
    earthRidge: '#000',
    cityLights: '#ff0',
    sunGlint: '#fff',
    geminiCore: 'rgb(255,255,255)',
    geminiCyan: 'rgb(34,211,238)',
    geminiViolet: 'rgb(168,85,247)',
    geminiMagenta: 'rgb(236,72,153)',
    trailPlasma: ['#ffffff', '#22d3ee'],
  };

  const normal = calculateDragonRedGlowColors(0.0, baseColors, 0);
  assert.equal(normal.factor, 0);
  assert.equal(normal.pulseScale, 1.0);
  assert.equal(normal.redLaserFlareLength, 0);

  const dragonGlow = calculateDragonRedGlowColors(1.0, baseColors, 10);
  assert.equal(dragonGlow.factor, 1.0);
  assert.ok(dragonGlow.pulseScale > 1.15, 'Scale must expand with heartbeat pulse');
  assert.ok(dragonGlow.auraRadius > 60, 'Red aura must expand');
  assert.ok(dragonGlow.redLaserFlareLength > 100, 'Red starlight laser spikes must flare');
  assert.ok(dragonGlow.trailPlasma.includes('#ef4444'), 'Trail must ignite in crimson');
});

test('createAstralBirdFlock creates coordinated flock with wing phases and updates positions', () => {
  const flock = createAstralBirdFlock(360, 240, 'ltr');
  assert.ok(flock.birds.length >= 5);
  assert.equal(flock.direction, 'ltr');

  const b0 = flock.birds[0];
  const initialX = b0.x;
  const initialPhase = b0.wingPhase;

  const isAlive = updateAstralBirdFlock(flock, 360, 1.0);
  assert.ok(isAlive);
  assert.ok(b0.x > initialX);
  assert.notEqual(b0.wingPhase, initialPhase);
});

test('calculateGeminiAwakeningTransform boosts scale, rotation, and calculates 3D companion orbit', () => {
  const restTransform = calculateGeminiAwakeningTransform(0, false, 0.0, 180, 120);
  assert.equal(restTransform.scale, 1.0);
  assert.equal(restTransform.rotationSpeedMultiplier, 1.0);
  assert.equal(restTransform.prismaticIntensity, 0.0);

  const awakened = calculateGeminiAwakeningTransform(30, true, 1.0, 180, 120);
  assert.ok(awakened.scale > 1.3);
  assert.ok(awakened.rotationSpeedMultiplier > 3.0);
  assert.equal(awakened.prismaticIntensity, 1.0);
  assert.ok(awakened.beamLength > 200);

  // Companion star must orbit around the base position
  assert.ok(Math.abs(awakened.companionOrbitX - 180) > 10);
});

test('playDragonRoarAndWingsSound and playDragonFlybySound execute safely in non-browser/SSR environments', async () => {
  const { playDragonRoarAndWingsSound, playDragonFlybySound } = await import('./audioDescent.ts');
  assert.equal(typeof playDragonRoarAndWingsSound, 'function');
  assert.equal(typeof playDragonFlybySound, 'function');

  // Must not throw or crash when called
  assert.doesNotThrow(() => {
    playDragonRoarAndWingsSound(3.0);
    playDragonFlybySound();
  });
});

test('createAstralDragon supports random and forced variants (Frost, Emerald, Solar, Void, Crimson)', () => {
  const frostDragon = createAstralDragon(360, 240, 'ltr', 'frost');
  assert.equal(frostDragon.variant.type, 'frost');
  assert.equal(frostDragon.variant.name, '서리빛 청룡 (Frost Dragon)');
  assert.equal(frostDragon.variant.laserFlareColor, '#38bdf8');
  assert.ok(frostDragon.variant.emberColors.includes('#38bdf8'));

  const emeraldDragon = createAstralDragon(360, 240, 'rtl', 'emerald');
  assert.equal(emeraldDragon.variant.type, 'emerald');
  assert.equal(emeraldDragon.variant.name, '비취 성운용 (Emerald Dragon)');

  const randomDragon = createAstralDragon(360, 240);
  assert.ok(DRAGON_VARIANTS[randomDragon.variant.type]);
});

test('calculateDragonCloudSurge smoothly accelerates clouds when dragon is active and eases back down', () => {
  let surge = 1.0;

  // Active dragon accelerates clouds
  surge = calculateDragonCloudSurge(true, surge, 2.75, 0.1);
  assert.ok(surge > 1.0);
  assert.ok(surge <= 2.75);

  // Reaching near maximum surge
  for (let i = 0; i < 40; i++) {
    surge = calculateDragonCloudSurge(true, surge, 2.75, 0.1);
  }
  assert.ok(surge > 2.6);

  // Inactive dragon smoothly decelerates back towards 1.0
  surge = calculateDragonCloudSurge(false, surge, 2.75, 0.1);
  assert.ok(surge < 2.6);
  for (let i = 0; i < 50; i++) {
    surge = calculateDragonCloudSurge(false, surge, 2.75, 0.1);
  }
  assert.ok(surge < 1.05);
});

test('isNightOrMidnight and calculateNightFactor accurately detect night phases', () => {
  // Phase 0: Dawn, Phase 1: Golden/Noon, Phase 2: Twilight (Night), Phase 3: Midnight
  assert.equal(isNightOrMidnight(0), false);
  assert.equal(isNightOrMidnight(1), false);
  assert.equal(isNightOrMidnight(2), true);
  assert.equal(isNightOrMidnight(3), true);

  // Cycle progress checks
  assert.equal(isNightOrMidnight(0, 0.10), false);
  assert.equal(isNightOrMidnight(1, 0.35), false);
  assert.equal(isNightOrMidnight(2, 0.55), true);
  assert.equal(isNightOrMidnight(3, 0.85), true);

  // Night factor returns 0 at golden hour, high during midnight
  const goldenFactor = calculateNightFactor(0.35);
  const twilightFactor = calculateNightFactor(0.60);
  const midnightFactor = calculateNightFactor(0.85);

  assert.equal(goldenFactor, 0.0);
  assert.ok(twilightFactor > 0.6);
  assert.ok(midnightFactor >= 0.9);
});

test('createPixelMeteor and updatePixelMeteor simulate diagonal motion and bottom afterglow trigger', () => {
  const meteor = createPixelMeteor(480, 300, {
    x: 300,
    y: 50,
    vx: -6.0,
    vy: 5.0,
    length: 40,
  });

  assert.equal(typeof meteor.id, 'number');
  assert.ok(meteor.length >= 24);
  assert.ok(meteor.vx !== 0);
  assert.ok(meteor.vy > 0);
  assert.equal(meteor.hasDepositedAfterglow, false);

  // Advance simulation
  const result = updatePixelMeteor(meteor, 480, 300, 1.0);
  assert.equal(result.isAlive, true);
  assert.ok(meteor.x < 300); // Moved left
  assert.ok(meteor.y > 50);  // Moved down
  assert.ok(meteor.trailHistory.length > 0);

  // Advance until reaching bottom threshold (height * 0.58 = 174px)
  let hitHorizon = false;
  for (let step = 0; step < 50; step++) {
    const r = updatePixelMeteor(meteor, 480, 300, 1.0);
    if (r.reachedBottom) {
      hitHorizon = true;
      assert.ok(r.bottomY >= 300 * 0.58);
      break;
    }
  }
  assert.equal(hitHorizon, true);
  assert.equal(meteor.hasDepositedAfterglow, true);
});

test('calculateMeteorTailPoints generates gradient starlight pixels tapering to tail', () => {
  const meteor = createPixelMeteor(480, 300, {
    x: 200,
    y: 100,
    vx: -5.0,
    vy: 5.0,
    length: 30,
    headColor: '#ffffff',
    midColor: '#38bdf8',
    tailColor: '#818cf8',
  });

  const points = calculateMeteorTailPoints(meteor);
  assert.ok(points.length > 10);

  // Head point (index 0) has highest alpha and white color
  assert.equal(points[0].color, '#ffffff');
  assert.ok(points[0].alpha > 0.7);

  // Tail point has lower alpha and tail color
  const tail = points[points.length - 1];
  assert.ok(tail.alpha < 0.2);
  assert.equal(tail.color, '#818cf8');
});

test('addMeteorBottomAfterglow and updateMeteorAfterglowPool manage lingering ground haze', () => {
  const pool: any[] = [];
  addMeteorBottomAfterglow(pool, 150, 0.8, '#38bdf8', 60);

  assert.equal(pool.length, 1);
  assert.equal(pool[0].x, 150);
  assert.equal(pool[0].intensity, 0.8);

  // Adding close-by meteor merges intensity
  addMeteorBottomAfterglow(pool, 155, 0.5);
  assert.equal(pool.length, 1); // merged
  assert.ok(pool[0].intensity > 0.8);

  // Adding distinct meteor creates new pool
  addMeteorBottomAfterglow(pool, 350, 0.7, '#c084fc', 50);
  assert.equal(pool.length, 2);

  // Gradient calculation
  const gradients = calculateBottomResidualGlowGradient(pool, 480, 300);
  assert.equal(gradients.length, 2);
  assert.ok(gradients[0].radiusX >= 50);
  assert.ok(gradients[0].alpha > 0);

  // Decays over time
  const mergedIntensity = pool[0].intensity;
  updateMeteorAfterglowPool(pool, 10.0);
  assert.ok(pool[0].intensity < mergedIntensity);
});

test('generateConstellationTelemetry computes accurate trajectory and density profiles for all 4 AI constellations', () => {
  const gemini = generateConstellationTelemetry('gemini', 30);
  assert.equal(gemini.id, 'gemini');
  assert.equal(gemini.points.length, 30);
  assert.equal(gemini.points[0].altitude, 380);
  assert.equal(gemini.points[29].altitude, 0);
  assert.ok(gemini.peakDensity >= 90);
  assert.ok(gemini.peakAltitude < 380 && gemini.peakAltitude > 0);
  assert.ok(gemini.maxLateralDrift < 15); // Gemini descends straight

  const gpt = generateConstellationTelemetry('gpt', 30);
  assert.equal(gpt.id, 'gpt');
  assert.ok(gpt.maxLateralDrift > 20); // Spiral glide has high drift
  assert.ok(gpt.peakDensity >= 80);

  const claude = generateConstellationTelemetry('claude', 30);
  assert.equal(claude.id, 'claude');
  assert.ok(claude.points[0].density > 90); // Coronal flare initial heat
  assert.ok(claude.maxLateralDrift > 25);

  const deepseek = generateConstellationTelemetry('deepseek', 30);
  assert.equal(deepseek.id, 'deepseek');
  assert.ok(deepseek.maxLateralDrift >= 25); // Sinusoidal hydrodynamic wave
  assert.ok(deepseek.peakDensity >= 85); // MoE sonar pulses

  const all = getAllConstellationsTelemetry(20);
  assert.equal(all.length, 4);
  assert.deepEqual(all.map(c => c.id), ['gemini', 'gpt', 'claude', 'deepseek']);
});

