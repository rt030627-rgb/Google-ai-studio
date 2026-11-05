/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  renderGeminiFrameRgba,
  generateGeminiAnimatedGif,
  GifAnimationMode,
} from './geminiGifGenerator';

test('renderGeminiFrameRgba creates a valid RGBA pixel buffer with expected dimensions', () => {
  const width = 64;
  const height = 64;
  const rgba = renderGeminiFrameRgba(width, height, 0, 10, {
    mode: 'sparkle',
    bgColor: '#000000',
  });

  assert.equal(rgba.length, width * height * 4);
  
  // Center pixel near (30, 33) should be the bright core
  const centerIdx = (Math.round(height * 0.52) * width + Math.round(width * 0.48)) * 4;
  assert.ok(rgba[centerIdx] >= 220, 'Red channel of center core must be bright');
  assert.ok(rgba[centerIdx + 1] >= 220, 'Green channel of center core must be bright');
  assert.ok(rgba[centerIdx + 2] >= 220, 'Blue channel of center core must be bright');
  assert.equal(rgba[centerIdx + 3], 255, 'Core must be opaque');
});

test('generateGeminiAnimatedGif generates a valid GIF89a binary stream for sparkle mode', () => {
  const result = generateGeminiAnimatedGif({
    width: 48,
    height: 48,
    fps: 8,
    durationSec: 1.0,
    mode: 'sparkle',
  });

  assert.ok(result.gifBytes.length > 500, 'GIF bytes must be populated');
  assert.equal(result.frameCount, 8);
  assert.equal(result.durationSec, 1.0);

  // Check GIF89a header magic bytes: 0x47, 0x49, 0x46, 0x38, 0x39, 0x61 ("GIF89a")
  const magic = Buffer.from(result.gifBytes.slice(0, 6)).toString('ascii');
  assert.equal(magic, 'GIF89a');
});

test('generateGeminiAnimatedGif generates valid GIF for color-cycle and combined modes', () => {
  const colorCycle = generateGeminiAnimatedGif({
    width: 32,
    height: 32,
    fps: 6,
    durationSec: 1.0,
    mode: 'color-cycle',
  });
  assert.equal(Buffer.from(colorCycle.gifBytes.slice(0, 6)).toString('ascii'), 'GIF89a');

  const combined = generateGeminiAnimatedGif({
    width: 32,
    height: 32,
    fps: 6,
    durationSec: 1.0,
    mode: 'combined',
  });
  assert.equal(Buffer.from(combined.gifBytes.slice(0, 6)).toString('ascii'), 'GIF89a');
});
