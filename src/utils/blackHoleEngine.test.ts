import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createBlackHole,
  updateBlackHole,
  calculateGravitationalPull,
} from './blackHoleEngine.ts';

describe('Black Hole Singularity Engine', () => {
  it('should initialize with valid singularity parameters', () => {
    const hole = createBlackHole(480, 300);
    assert.strictEqual(hole.x, 240);
    assert.strictEqual(hole.radius, 20);
    assert.strictEqual(hole.accretionDiskRadius, 64);
    assert.strictEqual(hole.life, 0);
  });

  it('should update spin angle and handle fade in lifecycle', () => {
    const hole = createBlackHole(480, 300);
    assert.strictEqual(hole.intensity, 0);

    // Advance 40 frames
    for (let i = 0; i < 40; i++) {
      updateBlackHole(hole, 1.0);
    }
    assert.ok(hole.intensity > 0.4 && hole.intensity < 0.6);
    assert.ok(hole.spinAngle > 0);

    // Advance to peak life
    for (let i = 0; i < 100; i++) {
      updateBlackHole(hole, 1.0);
    }
    assert.strictEqual(hole.intensity, 1.0);
  });

  it('should calculate directional gravitational pull on objects within range', () => {
    const hole = createBlackHole(480, 300, { x: 200, y: 150, intensity: 1.0 });

    // Target to the right of singularity: pullX should be negative (towards left)
    const pullRight = calculateGravitationalPull(hole, 250, 150, 100);
    assert.ok(pullRight.pullX < 0);
    assert.strictEqual(Math.round(pullRight.pullY), 0);
    assert.strictEqual(pullRight.inHorizon, false);

    // Target inside horizon
    const pullInside = calculateGravitationalPull(hole, 205, 150, 100);
    assert.strictEqual(pullInside.inHorizon, true);

    // Target out of range
    const pullFar = calculateGravitationalPull(hole, 450, 150, 100);
    assert.strictEqual(pullFar.pullX, 0);
    assert.strictEqual(pullFar.pullY, 0);
  });
});
