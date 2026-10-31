/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialGliderState,
  updateGliderFlight,
  generateThrusterPlume,
} from './gliderFlightEngine.ts';

test('createInitialGliderState returns resting zero-velocity state', () => {
  const state = createInitialGliderState();
  assert.equal(state.offsetX, 0);
  assert.equal(state.offsetY, 0);
  assert.equal(state.vx, 0);
  assert.equal(state.vy, 0);
  assert.equal(state.bankAngle, 0);
  assert.equal(state.thrusterBoost, 0);
  assert.equal(state.isManualActive, false);
});

test('updateGliderFlight responds to directional steering and rolls into banking turns', () => {
  const initial = createInitialGliderState();

  // Steer Left
  const steeredLeft = updateGliderFlight(
    initial,
    { left: true, right: false, up: false, down: false, boost: false },
    { minX: -100, maxX: 100, minY: -50, maxY: 50 },
    1.0
  );
  assert.ok(steeredLeft.vx < 0);
  assert.ok(steeredLeft.bankAngle < 0); // Negative bank angle turns left
  assert.equal(steeredLeft.isManualActive, true);

  // Steer Right
  const steeredRight = updateGliderFlight(
    initial,
    { left: false, right: true, up: false, down: false, boost: false },
    { minX: -100, maxX: 100, minY: -50, maxY: 50 },
    1.0
  );
  assert.ok(steeredRight.vx > 0);
  assert.ok(steeredRight.bankAngle > 0); // Positive bank angle turns right

  // Boost Key accelerates thrusters
  const boosted = updateGliderFlight(
    initial,
    { left: false, right: false, up: true, down: false, boost: true },
    { minX: -100, maxX: 100, minY: -50, maxY: 50 },
    1.0
  );
  assert.ok(boosted.thrusterBoost > 0);
  assert.ok(boosted.vy < 0); // Upwards motion
});

test('updateGliderFlight clamps position strictly within corridor boundaries', () => {
  let state = createInitialGliderState();
  const bounds = { minX: -50, maxX: 50, minY: -30, maxY: 30 };

  // Run left repeatedly to exceed bounds
  for (let i = 0; i < 40; i++) {
    state = updateGliderFlight(
      state,
      { left: true, right: false, up: false, down: false, boost: true },
      bounds,
      1.0
    );
  }

  assert.equal(state.offsetX, bounds.minX);
  assert.equal(state.vx, 0);
});

test('generateThrusterPlume creates exhaust particles when thrusterBoost is active', () => {
  // Idle state produces zero plume
  const idlePlume = generateThrusterPlume(240, 150, 0.02, 0);
  assert.equal(idlePlume.length, 0);

  // Boosted state produces plumes with downward velocity
  const boostedPlume = generateThrusterPlume(240, 150, 0.85, 0.15);
  assert.ok(boostedPlume.length >= 1);
  for (const p of boostedPlume) {
    assert.ok(p.vy > 1.5);
    assert.ok(p.alpha > 0.5);
  }
});
