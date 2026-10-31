/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATMOSPHERIC_LAYERS,
  calculateAltitudeTelemetry,
  formatAltitudeDisplay,
  formatMachDisplay,
  generateWatermarkText,
  calculateLedEqualizerBands,
} from './altitudeTelemetry.ts';

test('ATMOSPHERIC_LAYERS spans continuous altitude from 140 km down to 0 km', () => {
  assert.equal(ATMOSPHERIC_LAYERS.length, 5);
  assert.equal(ATMOSPHERIC_LAYERS[0].maxAltKm, 140);
  assert.equal(ATMOSPHERIC_LAYERS[ATMOSPHERIC_LAYERS.length - 1].minAltKm, 0);

  // Check continuity: minAlt of layer N equals maxAlt of layer N+1
  for (let i = 0; i < ATMOSPHERIC_LAYERS.length - 1; i++) {
    assert.equal(
      ATMOSPHERIC_LAYERS[i].minAltKm,
      ATMOSPHERIC_LAYERS[i + 1].maxAltKm,
      `Layer ${ATMOSPHERIC_LAYERS[i].id} minAlt must match ${ATMOSPHERIC_LAYERS[i + 1].id} maxAlt`
    );
  }
});

test('calculateAltitudeTelemetry accurately determines layers, pressure and temperature', () => {
  // Near top of thermosphere (progress = 0)
  const topTelemetry = calculateAltitudeTelemetry(0.0, 'normal', false, 0);
  assert.ok(topTelemetry.altitudeKm > 100);
  assert.equal(topTelemetry.currentLayer.id, 'thermosphere');
  assert.ok(topTelemetry.pressureHpa < 1.0); // Very low pressure in space
  assert.ok(topTelemetry.machNumber > 0);

  // Near surface (progress = 0.99)
  const bottomTelemetry = calculateAltitudeTelemetry(0.99, 'normal', false, 0);
  assert.ok(bottomTelemetry.altitudeKm < 5);
  assert.ok(
    bottomTelemetry.currentLayer.id === 'planetary_surface' ||
    bottomTelemetry.currentLayer.id === 'troposphere'
  );
  assert.ok(bottomTelemetry.pressureHpa > 500); // Much higher barometric pressure
});

test('calculateAltitudeTelemetry responds to speedMode and dragon surges', () => {
  const normal = calculateAltitudeTelemetry(0.5, 'normal', false, 0);
  const cinematic = calculateAltitudeTelemetry(0.5, 'cinematic', false, 0);
  const mach = calculateAltitudeTelemetry(0.5, 'mach', false, 0);

  assert.ok(cinematic.speedKmh < normal.speedKmh);
  assert.ok(mach.speedKmh > normal.speedKmh);
  assert.ok(mach.machNumber > normal.machNumber);

  // Dragon surge boosts speed & plasma friction
  const dragonSurge = calculateAltitudeTelemetry(0.5, 'mach', true, 0);
  assert.ok(dragonSurge.speedKmh > mach.speedKmh);
  assert.ok(dragonSurge.plasmaFrictionIntensity > mach.plasmaFrictionIntensity);
});

test('formatAltitudeDisplay and formatMachDisplay format numbers correctly', () => {
  assert.equal(formatAltitudeDisplay(128.4), '128 KM');
  assert.equal(formatAltitudeDisplay(42.36), '42.4 KM');
  assert.equal(formatAltitudeDisplay(4.0), '4.0 KM');

  assert.equal(formatMachDisplay(1.159), 'M 1.16');
  assert.equal(formatMachDisplay(3.14), 'M 3.14');
});

test('generateWatermarkText creates formatted retro sci-fi string', () => {
  const watermark = generateWatermarkText(38.4, 'Twilight Aurora', 'Clear Skies');
  assert.ok(watermark.includes('GOOGLE GEMINI DESCENT'));
  assert.ok(watermark.includes('ALT 38.4 KM'));
  assert.ok(watermark.includes('TWILIGHT AURORA'));
  assert.ok(watermark.includes('CLEAR SKIES'));
});

test('calculateLedEqualizerBands produces responsive 8-band audio visualization', () => {
  // When idle / muted, returns 8 baseline resting values
  const idleBands = calculateLedEqualizerBands(false, 0);
  assert.equal(idleBands.length, 8);
  for (const b of idleBands) {
    assert.equal(b, 0.08);
  }

  // When playing, bands are actively varying between 0.05 and 1.0
  const activeBands = calculateLedEqualizerBands(true, 45, false, false, 1.2);
  assert.equal(activeBands.length, 8);
  for (const b of activeBands) {
    assert.ok(b >= 0.05 && b <= 1.0);
  }

  // Dragon roar boosts lower bass bands
  const dragonBands = calculateLedEqualizerBands(true, 45, true, false, 1.0);
  assert.ok(dragonBands[0] > idleBands[0]);
  assert.ok(dragonBands[1] >= activeBands[1] * 0.9);

  // Meteor shower boosts high frequency bands
  const meteorBands = calculateLedEqualizerBands(true, 45, false, true, 1.0);
  assert.ok(meteorBands[6] >= activeBands[6] * 0.9);
});
