import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createInitialArcadeState,
  getComboMultiplier,
  spawnStardustRing,
  updateArcadeGame,
  StardustRing,
} from './arcadeRingEngine.ts';

describe('Arcade Stardust Ring Collector Engine', () => {
  it('should initialize clean arcade game state', () => {
    const state = createInitialArcadeState();
    assert.strictEqual(state.isActive, false);
    assert.strictEqual(state.score, 0);
    assert.strictEqual(state.combo, 0);
  });

  it('should compute tiered combo multipliers accurately', () => {
    assert.strictEqual(getComboMultiplier(0), 1);
    assert.strictEqual(getComboMultiplier(2), 1);
    assert.strictEqual(getComboMultiplier(3), 2);
    assert.strictEqual(getComboMultiplier(5), 2);
    assert.strictEqual(getComboMultiplier(6), 4);
    assert.strictEqual(getComboMultiplier(9), 4);
    assert.strictEqual(getComboMultiplier(10), 8);
    assert.strictEqual(getComboMultiplier(25), 8);
  });

  it('should spawn a valid stardust ring with coordinate bounds', () => {
    const ring = spawnStardustRing(480, 300, []);
    assert.ok(ring.x >= 480 * 0.2 && ring.x <= 480 * 0.8);
    assert.strictEqual(ring.y, 330);
    assert.ok(ring.radius >= 18);
    assert.strictEqual(ring.collected, false);
  });

  it('should detect star collision, award score with combo, and track high score', () => {
    const state = createInitialArcadeState();
    state.isActive = true;

    const ring: StardustRing = {
      id: 1,
      x: 200,
      y: 150,
      radius: 20,
      color: '#38bdf8',
      glowColor: '#0284c7',
      pointsValue: 100,
      collected: false,
      collectAnim: 0,
      pulsePhase: 0,
    };
    const rings = [ring];

    // Star is at (205, 150) -> distance is 5, within ring.radius + 12 (32)
    const res = updateArcadeGame(state, rings, 205, 150, 480, 300, 1.0);
    assert.strictEqual(res.newlyCollectedCount, 1);
    assert.strictEqual(res.pointsEarned, 100);
    assert.strictEqual(state.score, 100);
    assert.strictEqual(state.combo, 1);
    assert.strictEqual(state.ringsCollected, 1);
    assert.strictEqual(ring.collected, true);
  });
});
