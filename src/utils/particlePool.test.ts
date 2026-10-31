import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ParticlePool } from './particlePool.js';

describe('Zero-Allocation Particle Object Pool', () => {
  it('should initialize with pre-allocated capacity and zero active count', () => {
    const pool = new ParticlePool(50);
    assert.equal(pool.capacity, 50);
    assert.equal(pool.getActiveCount(), 0);
    assert.equal(pool.getAvailableCount(), 50);
  });

  it('should spawn particles in O(1) time up to capacity limit', () => {
    const pool = new ParticlePool(5);

    for (let i = 0; i < 5; i++) {
      const ok = pool.spawn({
        x: i * 10,
        y: i * 5,
        vx: 1.0,
        vy: -0.5,
        color: '#38bdf8',
        maxLife: 30,
      });
      assert.equal(ok, true);
    }

    assert.equal(pool.getActiveCount(), 5);
    assert.equal(pool.getAvailableCount(), 0);

    // 6th spawn should safely reject to protect budget
    const overflow = pool.spawn({
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      color: '#ffffff',
      maxLife: 10,
    });
    assert.equal(overflow, false);
    assert.equal(pool.getActiveCount(), 5);
  });

  it('should update active particles and prune expired ones via swap-and-pop in O(1)', () => {
    const pool = new ParticlePool(10);

    pool.spawn({ x: 0, y: 0, vx: 1, vy: 0, color: '#f43f5e', maxLife: 2 });
    pool.spawn({ x: 10, y: 0, vx: 1, vy: 0, color: '#38bdf8', maxLife: 5 });
    pool.spawn({ x: 20, y: 0, vx: 1, vy: 0, color: '#818cf8', maxLife: 2 });

    assert.equal(pool.getActiveCount(), 3);

    // Update 1: life increments to 1, all survive
    pool.update((p) => {
      p.life++;
      p.x += p.vx;
      return p.life < p.maxLife;
    });
    assert.equal(pool.getActiveCount(), 3);

    // Update 2: p0 and p2 reach life 2 and expire; only p1 (maxLife 5) survives
    pool.update((p) => {
      p.life++;
      p.x += p.vx;
      return p.life < p.maxLife;
    });

    assert.equal(pool.getActiveCount(), 1);
    const remaining = pool.getActiveParticles();
    assert.equal(remaining[0].color, '#38bdf8');
    assert.equal(remaining[0].life, 2);
  });

  it('should recycle all particles instantly on clear() without memory deallocation', () => {
    const pool = new ParticlePool(20);
    for (let i = 0; i < 15; i++) {
      pool.spawn({ x: i, y: i, vx: 0, vy: 0, color: '#ffffff', maxLife: 100 });
    }
    assert.equal(pool.getActiveCount(), 15);

    pool.clear();
    assert.equal(pool.getActiveCount(), 0);
    assert.equal(pool.getAvailableCount(), 20);

    // Should be able to spawn again immediately
    const ok = pool.spawn({ x: 50, y: 50, vx: 1, vy: 1, color: '#ffffff', maxLife: 50 });
    assert.equal(ok, true);
    assert.equal(pool.getActiveCount(), 1);
  });
});
