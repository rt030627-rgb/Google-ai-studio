/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DRAGON_ANIMATION_FRAMES,
  VARIANT_HUE_OFFSETS,
  isDragonSpriteReady,
  renderGeminiChestCore,
  renderTailCrystalFlare,
  renderCelestialDragon,
  StardustParticle,
} from './dragonSpriteEngine';
import { createAstralDragon, DRAGON_VARIANTS } from './descentEngine';

test('DRAGON_ANIMATION_FRAMES has 6 valid animation frames matching uploaded sprite sheet', () => {
  assert.equal(DRAGON_ANIMATION_FRAMES.length, 6);
  for (let i = 0; i < DRAGON_ANIMATION_FRAMES.length; i++) {
    const frame = DRAGON_ANIMATION_FRAMES[i];
    assert.ok(frame.sw > 200, `Frame ${i} width must be > 200`);
    assert.ok(frame.sh > 100, `Frame ${i} height must be > 100`);
    assert.ok(frame.headOffsetX > 0, `Frame ${i} headOffsetX must be valid`);
    assert.ok(frame.chestOffsetX > 0, `Frame ${i} chestOffsetX must be valid`);
    assert.ok(frame.tailOffsetX > 0, `Frame ${i} tailOffsetX must be valid`);
  }
});

test('VARIANT_HUE_OFFSETS configures distinct chromatic shifts for all 5 dragon variants', () => {
  const variants = ['void', 'frost', 'crimson', 'emerald', 'solar'];
  for (const v of variants) {
    assert.ok(v in VARIANT_HUE_OFFSETS, `Variant ${v} must have a hue offset defined`);
  }
  assert.equal(VARIANT_HUE_OFFSETS.void, 0, 'Void Amethyst is base 0 offset');
  assert.equal(VARIANT_HUE_OFFSETS.frost, -70, 'Frost rotates to Gemini cyan');
  assert.equal(VARIANT_HUE_OFFSETS.crimson, 85, 'Crimson rotates to ruby fire');
});

test('isDragonSpriteReady returns false safely in non-browser Node test environment', () => {
  assert.equal(isDragonSpriteReady(), false);
});

test('renderCelestialDragon executes safely in procedural fallback mode without crashing', () => {
  const dragon = createAstralDragon(480, 300, 'rtl', 'void');
  const particles: StardustParticle[] = [];

  // Mock 2D canvas context
  const mockCtx: Partial<CanvasRenderingContext2D> = {
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    ellipse: () => {},
    fill: () => {},
    stroke: () => {},
    fillRect: () => {},
    createLinearGradient: () => ({
      addColorStop: () => {},
    } as unknown as CanvasGradient),
    createRadialGradient: () => ({
      addColorStop: () => {},
    } as unknown as CanvasGradient),
    imageSmoothingEnabled: false,
    strokeStyle: '#ffffff',
    fillStyle: '#ffffff',
    lineWidth: 1,
    lineCap: 'round',
    shadowBlur: 0,
    shadowColor: '',
  };

  // Must not throw in fallback mode
  assert.doesNotThrow(() => {
    renderCelestialDragon(
      mockCtx as CanvasRenderingContext2D,
      dragon,
      42,
      1.0,
      particles
    );
  });

  // Verify Gemini chest core and tail crystal flare execute
  assert.doesNotThrow(() => {
    renderGeminiChestCore(mockCtx as CanvasRenderingContext2D, 100, 100, 42, dragon.variant);
    renderTailCrystalFlare(mockCtx as CanvasRenderingContext2D, 150, 100, 42, dragon.variant);
  });
});
