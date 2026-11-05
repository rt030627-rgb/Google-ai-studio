/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMachCompression,
  calculateReynoldsTurbulence,
  calculateEffectiveCloudVelocity,
  calculateEffectiveCloudDensity,
  calculateCloudPhysicsTelemetry,
  FLIGHT_SPEED_KMH,
  FLIGHT_SPEED_MULTIPLIER,
  MACH_COMPRESSION_FACTORS,
} from './cloudPhysicsEngine';

test('calculateMachCompression returns correct aerodynamic compression factor', () => {
  assert.equal(calculateMachCompression('cinematic'), 0.94);
  assert.equal(calculateMachCompression('normal'), 1.0);
  assert.equal(calculateMachCompression('mach'), 1.16);
});

test('calculateReynoldsTurbulence correctly scales with weather squalls and flight speed', () => {
  // Clear sky at cinematic speed with calm wind
  const clearCalm = calculateReynoldsTurbulence('clear', 'cinematic', 0.5);
  assert.ok(clearCalm.index < 0.6);
  assert.equal(clearCalm.label, '안정 층류 (Laminar)');

  // Rain storm at mach speed with high wind
  const rainStorm = calculateReynoldsTurbulence('rain', 'mach', 2.0);
  assert.ok(rainStorm.index > 2.8);
  assert.equal(rainStorm.label, '초음속 충격 와류 (Shock Turbulence)');
});

test('calculateEffectiveCloudVelocity scales with weather and flight speed mode', () => {
  // Clear weather at normal speed
  const clearNormal = calculateEffectiveCloudVelocity('clear', 'normal', 1.0);
  // Rain storm at mach speed
  const rainMach = calculateEffectiveCloudVelocity('rain', 'mach', 1.0);

  assert.ok(rainMach > clearNormal * 5); // Rain is 2.5x, Mach is 2.2x -> over 5x faster!

  // Cinematic speed decelerates cloud flow
  const rainCinematic = calculateEffectiveCloudVelocity('rain', 'cinematic', 1.0);
  assert.ok(rainCinematic < rainMach * 0.3);
});

test('calculateEffectiveCloudDensity accurately couples weather and Mach compression', () => {
  // Clear weather at normal speed (0.75 * 1.0 * 1.0 = 0.75)
  const clearNormal = calculateEffectiveCloudDensity('clear', 1.0, 'normal');
  assert.equal(clearNormal, 0.75);

  // Clear weather at mach speed (0.75 * 1.0 * 1.16 = 0.87)
  const clearMach = calculateEffectiveCloudDensity('clear', 1.0, 'mach');
  assert.equal(clearMach, 0.87);
  assert.ok(clearMach > clearNormal);

  // Rain weather at mach speed with 1.5x user slider
  const rainMach = calculateEffectiveCloudDensity('rain', 1.5, 'mach');
  assert.equal(rainMach, Math.round(1.55 * 1.5 * 1.16 * 1000) / 1000);
});

test('calculateCloudPhysicsTelemetry produces complete and bounded physical metrics', () => {
  const telemetry = calculateCloudPhysicsTelemetry(
    'rain',
    'mach',
    { cloudDensityScale: 1.4, windSpeedScale: 1.8 },
    1.0
  );

  assert.equal(telemetry.weather, 'rain');
  assert.equal(telemetry.speedMode, 'mach');
  assert.ok(telemetry.apparentSpeedKmH > 2000);
  assert.ok(telemetry.effectiveDensityPercent > 200);
  assert.ok(telemetry.reynoldsTurbulence > 2.0);
  assert.ok(telemetry.aerodynamicDrag > 0.8);
  assert.equal(typeof telemetry.turbulenceLabel, 'string');
});

test('calculateEffectiveCloudVelocity and density handle extreme/boundary inputs cleanly', () => {
  const clampedVel = calculateEffectiveCloudVelocity('clear', 'normal', -100);
  assert.ok(clampedVel > 0);

  const maxVel = calculateEffectiveCloudVelocity('rain', 'mach', 999);
  assert.ok(Number.isFinite(maxVel));

  const clampedDen = calculateEffectiveCloudDensity('mist', -5, 'cinematic');
  assert.ok(clampedDen > 0);
});
