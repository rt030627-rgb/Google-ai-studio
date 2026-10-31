import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AdaptivePerformanceGuard } from './adaptiveQuality.js';

describe('Adaptive Performance Guard', () => {
  it('should initialize with ultra tier and zero throttled state', () => {
    const guard = new AdaptivePerformanceGuard('ultra', true);
    assert.equal(guard.getQualityTier(), 'ultra');
    assert.equal(guard.getIsThrottled(), false);
  });

  it('should compute average FPS and variance accurately', () => {
    const guard = new AdaptivePerformanceGuard('ultra', false, 10);
    // 16.6ms is ~60 FPS
    for (let i = 0; i < 10; i++) {
      guard.recordFrame(16.6);
    }
    const snap = guard.recordFrame(16.6);
    assert.equal(snap.averageFps, 60);
    assert.ok(snap.frameTimeVarianceMs >= 0);
  });

  it('should auto-downgrade quality tier after sustained low FPS', () => {
    const guard = new AdaptivePerformanceGuard('ultra', true, 20);
    // 33.3ms is ~30 FPS (< 42 FPS threshold)
    for (let i = 0; i < 45; i++) {
      guard.recordFrame(33.3);
    }
    assert.equal(guard.getQualityTier(), 'balanced');
    assert.equal(guard.getIsThrottled(), true);

    // Another sustained low period downgrades from balanced to low
    for (let i = 0; i < 45; i++) {
      guard.recordFrame(33.3);
    }
    assert.equal(guard.getQualityTier(), 'low');
  });

  it('should auto-upgrade quality tier after sustained high FPS', () => {
    const guard = new AdaptivePerformanceGuard('ultra', true, 20);
    // Force downgrade to low
    for (let i = 0; i < 90; i++) {
      guard.recordFrame(33.3);
    }
    assert.equal(guard.getQualityTier(), 'low');

    // Run high 60fps frames (16.6ms) for 190 frames
    for (let i = 0; i < 190; i++) {
      guard.recordFrame(16.6);
    }
    assert.equal(guard.getQualityTier(), 'balanced');

    for (let i = 0; i < 190; i++) {
      guard.recordFrame(16.6);
    }
    assert.equal(guard.getQualityTier(), 'ultra');
    assert.equal(guard.getIsThrottled(), false);
  });

  it('should not auto-scale when auto-throttle is disabled', () => {
    const guard = new AdaptivePerformanceGuard('ultra', false);
    for (let i = 0; i < 100; i++) {
      guard.recordFrame(40.0); // 25 FPS
    }
    assert.equal(guard.getQualityTier(), 'ultra');
    assert.equal(guard.getIsThrottled(), false);
  });
});
