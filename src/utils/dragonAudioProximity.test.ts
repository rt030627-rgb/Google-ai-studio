/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDragonProximity,
  calculateDragonPan,
  calculateDragonAudioCrossfade,
} from './dragonAudioProximity';

test('Dragon Audio Proximity & Crossfade Engine', async (t) => {
  const WIDTH = 480;
  const HEIGHT = 300;
  const CENTER_X = WIDTH / 2; // 240
  const CENTER_Y = HEIGHT / 2; // 150

  await t.test('calculates exact 1.0 proximity and 0.0 pan at canvas center', () => {
    const proximity = calculateDragonProximity(CENTER_X, WIDTH);
    const pan = calculateDragonPan(CENTER_X, WIDTH);
    assert.equal(proximity, 1.0);
    assert.equal(pan, 0.0);
  });

  await t.test('yields 0.0 proximity beyond maximum audible distance', () => {
    const maxDist = WIDTH * 0.8; // 384
    const farLeft = CENTER_X - maxDist - 50; // -194
    const farRight = CENTER_X + maxDist + 50; // 674

    assert.equal(calculateDragonProximity(farLeft, WIDTH), 0.0);
    assert.equal(calculateDragonProximity(farRight, WIDTH), 0.0);
    assert.equal(calculateDragonProximity(CENTER_X - maxDist, WIDTH), 0.0);
    assert.equal(calculateDragonProximity(CENTER_X + maxDist, WIDTH), 0.0);
  });

  await t.test('exhibits perfect bilateral symmetry around center', () => {
    const offsets = [20, 50, 100, 180, 240, 300];
    for (const offset of offsets) {
      const leftProx = calculateDragonProximity(CENTER_X - offset, WIDTH);
      const rightProx = calculateDragonProximity(CENTER_X + offset, WIDTH);
      assert.ok(Math.abs(leftProx - rightProx) < 1e-12, `Mismatch at offset ${offset}: ${leftProx} vs ${rightProx}`);

      const leftPan = calculateDragonPan(CENTER_X - offset, WIDTH);
      const rightPan = calculateDragonPan(CENTER_X + offset, WIDTH);
      assert.ok(Math.abs(leftPan + rightPan) < 1e-12, `Pan asymmetry at offset ${offset}: ${leftPan} vs ${rightPan}`);
    }
  });

  await t.test('monotonically decreases as dragon departs center', () => {
    let prevProx = 1.0;
    for (let x = CENTER_X; x <= CENTER_X + 400; x += 10) {
      const prox = calculateDragonProximity(x, WIDTH);
      assert.ok(prox <= prevProx, `Expected monotonic decrease at x=${x}: ${prox} > ${prevProx}`);
      prevProx = prox;
    }
  });

  await t.test('clamps stereo pan between -1.0 and 1.0', () => {
    assert.equal(calculateDragonPan(-500, WIDTH), -1.0);
    assert.equal(calculateDragonPan(0, WIDTH), -1.0);
    assert.equal(calculateDragonPan(WIDTH, WIDTH), 1.0);
    assert.equal(calculateDragonPan(1200, WIDTH), 1.0);
  });

  await t.test('safely handles non-positive widths', () => {
    assert.equal(calculateDragonProximity(100, 0), 0);
    assert.equal(calculateDragonProximity(100, -200), 0);
    assert.equal(calculateDragonPan(100, 0), 0);
    assert.equal(calculateDragonPan(100, -200), 0);
  });

  await t.test('computes full crossfade metrics with crescendo at center', () => {
    const centerMetrics = calculateDragonAudioCrossfade(CENTER_X, CENTER_Y, WIDTH, HEIGHT, 1.0);
    assert.ok(centerMetrics.proximity > 0.95);
    assert.ok(centerMetrics.volume > 0.1);
    assert.ok(centerMetrics.filterCutoffHz > 400);
    assert.ok(centerMetrics.resonance > 0.8);
    assert.equal(centerMetrics.pan, 0.0);

    const farLeftMetrics = calculateDragonAudioCrossfade(-200, CENTER_Y, WIDTH, HEIGHT, 1.0);
    assert.equal(farLeftMetrics.proximity, 0.0);
    assert.equal(farLeftMetrics.volume, 0.0001);
    assert.equal(farLeftMetrics.filterCutoffHz, 120);
    assert.equal(farLeftMetrics.pan, -1.0);
  });

  await t.test('respects volume scale factor', () => {
    const halfVolMetrics = calculateDragonAudioCrossfade(CENTER_X, CENTER_Y, WIDTH, HEIGHT, 0.5);
    const fullVolMetrics = calculateDragonAudioCrossfade(CENTER_X, CENTER_Y, WIDTH, HEIGHT, 1.0);
    assert.ok(halfVolMetrics.volume < fullVolMetrics.volume);
    assert.ok(Math.abs(halfVolMetrics.volume - fullVolMetrics.volume * 0.5) < 0.01);
  });

  await t.test('produces smooth continuous values over 1,000 subpixel trajectory steps', () => {
    for (let i = 0; i < 1000; i++) {
      const x = -200 + (880 * i) / 1000;
      const y = 30 + Math.sin(i * 0.05) * 40;
      const metrics = calculateDragonAudioCrossfade(x, y, WIDTH, HEIGHT, 1.0);

      assert.ok(!isNaN(metrics.proximity), `NaN proximity at step ${i}`);
      assert.ok(!isNaN(metrics.pan), `NaN pan at step ${i}`);
      assert.ok(!isNaN(metrics.volume), `NaN volume at step ${i}`);
      assert.ok(!isNaN(metrics.filterCutoffHz), `NaN filterCutoffHz at step ${i}`);
      assert.ok(metrics.proximity >= 0 && metrics.proximity <= 1.0, `Proximity out of range: ${metrics.proximity}`);
      assert.ok(metrics.pan >= -1.0 && metrics.pan <= 1.0, `Pan out of range: ${metrics.pan}`);
      assert.ok(metrics.volume >= 0, `Volume negative: ${metrics.volume}`);
    }
  });
});
