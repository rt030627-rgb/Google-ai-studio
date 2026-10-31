import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  generateForkedLightning,
  updateLightningBolts,
  generateStElmoSparks,
} from './thunderstormEngine.ts';

describe('Thunderstorm & Forked Lightning Engine', () => {
  it('should generate branching fractal lightning with connected segments', () => {
    const bolt = generateForkedLightning(240, -10, 260, 480);
    assert.ok(bolt.segments.length > 5);
    assert.strictEqual(bolt.flashIntensity, 1.0);
    assert.ok(bolt.maxLife > 10);

    for (const seg of bolt.segments) {
      assert.ok(seg.y2 >= seg.y1);
      assert.ok(seg.width > 0);
      assert.ok(seg.alpha > 0);
    }
  });

  it('should update bolts, compute peak illumination, and cull expired bolts', () => {
    const bolt = generateForkedLightning(240, 0, 200, 480);
    const bolts = [bolt];

    const illum1 = updateLightningBolts(bolts, 1.0);
    assert.ok(illum1 > 0.8);

    // Advance until expired
    for (let i = 0; i < 20; i++) {
      updateLightningBolts(bolts, 1.0);
    }
    assert.strictEqual(bolts.length, 0);
  });

  it('should generate St. Elmo sparks on star tips', () => {
    const sparks = generateStElmoSparks(240, 150, 0, 30);
    assert.ok(Array.isArray(sparks));
    for (const sp of sparks) {
      assert.ok(sp.size >= 1);
      assert.ok(sp.alpha > 0);
    }
  });
});
