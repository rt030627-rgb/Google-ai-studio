/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapScreenToCanvasCoords,
  createCursorTrailSparkle,
  createCursorBurstSparks,
  updateCursorSparkles,
  updateCursorBurstNovas,
  renderCursorStarlight,
  STARLIGHT_PALETTE,
} from './cursorParticleEngine.ts';

test('mapScreenToCanvasCoords accurately maps client coordinates taking aspect ratio letterboxing into account', () => {
  // Case 1: Exact matching aspect ratio (480x300 canvas in 960x600 container)
  const rectExact = { left: 100, top: 50, width: 960, height: 600 };
  const coordsExact = mapScreenToCanvasCoords(100 + 480, 50 + 300, rectExact, 480, 300);
  assert.ok(coordsExact !== null);
  assert.equal(coordsExact?.x, 240);
  assert.equal(coordsExact?.y, 150);

  // Case 2: Out of bounds client position
  const coordsOutside = mapScreenToCanvasCoords(50, 20, rectExact, 480, 300);
  assert.equal(coordsOutside, null);

  // Case 3: Letterboxing in wider container (width 1200, height 600)
  const rectWider = { left: 0, top: 0, width: 1200, height: 600 };
  const centerCoords = mapScreenToCanvasCoords(600, 300, rectWider, 480, 300);
  assert.ok(centerCoords !== null);
  assert.equal(centerCoords?.x, 240);
  assert.equal(centerCoords?.y, 150);

  // Case 4: Zero dimension protection
  const rectZero = { left: 0, top: 0, width: 0, height: 0 };
  assert.equal(mapScreenToCanvasCoords(10, 10, rectZero, 480, 300), null);
});

test('createCursorTrailSparkle spawns starlight particles with valid motion and palette colors', () => {
  const sparkles = createCursorTrailSparkle(200, 150, 190, 145, 3);
  assert.equal(sparkles.length, 3);

  for (const s of sparkles) {
    assert.ok(s.x >= 180 && s.x <= 210);
    assert.ok(s.y >= 140 && s.y <= 160);
    assert.ok(s.size === 1 || s.size === 2);
    assert.ok(STARLIGHT_PALETTE.includes(s.color));
    assert.ok(s.alpha > 0.5 && s.alpha <= 1.0);
    assert.equal(s.isBurst, false);
  }
});

test('createCursorBurstSparks generates radial sparks and an expanding nova shockwave', () => {
  const { sparkles, nova } = createCursorBurstSparks(240, 150, 16);
  assert.equal(sparkles.length, 16);
  assert.ok(nova !== undefined);
  assert.equal(nova.x, 240);
  assert.equal(nova.y, 150);
  assert.equal(nova.radius, 3);
  assert.ok(nova.maxRadius > 20);

  // Verify radial velocity distribution
  for (const s of sparkles) {
    assert.equal(s.x, 240);
    assert.equal(s.y, 150);
    const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
    assert.ok(speed > 1.0);
    assert.equal(s.isBurst, true);
  }
});

test('updateCursorSparkles advances kinematics and decays dead particles', () => {
  const sparkles = createCursorTrailSparkle(100, 100, undefined, undefined, 2);
  const initialX = sparkles[0].x;
  const initialAlpha = sparkles[0].alpha;

  // Step 1: Normal update
  const updated = updateCursorSparkles(sparkles, 1.0);
  assert.equal(updated.length, 2);
  assert.ok(updated[0].alpha < initialAlpha); // Alpha decayed
  assert.notEqual(updated[0].x, initialX);     // Position moved

  // Step 2: Force decay to test cleanup
  for (const s of updated) {
    s.alpha = 0.005;
  }
  const remaining = updateCursorSparkles(updated, 1.0);
  assert.equal(remaining.length, 0); // All decayed particles removed
});

test('updateCursorBurstNovas expands radius and removes expired rings', () => {
  const { nova } = createCursorBurstSparks(120, 120, 4);
  const initialRadius = nova.radius;

  const updated = updateCursorBurstNovas([nova], 1.0);
  assert.equal(updated.length, 1);
  assert.ok(updated[0].radius > initialRadius);

  // Force expire
  updated[0].alpha = 0.01;
  const expired = updateCursorBurstNovas(updated, 1.0);
  assert.equal(expired.length, 0);
});

test('renderCursorStarlight executes safely with empty or populated arrays', () => {
  // Mock canvas context
  const drawCalls: string[] = [];
  const mockCtx = {
    save: () => drawCalls.push('save'),
    restore: () => drawCalls.push('restore'),
    fillRect: (x: number, y: number, w: number, h: number) => drawCalls.push(`rect:${x},${y},${w},${h}`),
    beginPath: () => drawCalls.push('beginPath'),
    arc: () => drawCalls.push('arc'),
    stroke: () => drawCalls.push('stroke'),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;

  // Empty arrays: should early-return without calls
  renderCursorStarlight(mockCtx, [], []);
  assert.equal(drawCalls.length, 0);

  // With active particles and nova
  const { sparkles, nova } = createCursorBurstSparks(50, 50, 2);
  renderCursorStarlight(mockCtx, sparkles, [nova]);
  assert.ok(drawCalls.includes('save'));
  assert.ok(drawCalls.includes('restore'));
  assert.ok(drawCalls.some((c) => c.startsWith('rect:')));
  assert.ok(drawCalls.includes('stroke'));
});
