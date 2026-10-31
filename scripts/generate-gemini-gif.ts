/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { generateGeminiAnimatedGif } from '../src/utils/geminiGifGenerator';

console.log('Generating Google Gemini Pixel Art Animated GIFs...');

// 1. Combined: Blinking sparkle + color gradient pulse (128x128, 14 FPS, 2.0s loop)
const combined = generateGeminiAnimatedGif({
  width: 128,
  height: 128,
  fps: 14,
  durationSec: 2.0,
  mode: 'combined',
  showCompanionStar: true,
  bgColor: '#060818',
});

// 2. Sparkling / Blinking focus (128x128, 14 FPS, 1.8s loop)
const sparkle = generateGeminiAnimatedGif({
  width: 128,
  height: 128,
  fps: 14,
  durationSec: 1.8,
  mode: 'sparkle',
  showCompanionStar: true,
  bgColor: '#040612',
});

// 3. Color Cycling Spectrum (128x128, 14 FPS, 2.2s loop)
const colorCycle = generateGeminiAnimatedGif({
  width: 128,
  height: 128,
  fps: 14,
  durationSec: 2.2,
  mode: 'color-cycle',
  showCompanionStar: true,
  bgColor: '#050714',
});

// Save to public directory
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'gemini_pixel_animated.gif'), Buffer.from(combined.gifBytes));
fs.writeFileSync(path.join(publicDir, 'gemini_pixel_sparkle.gif'), Buffer.from(sparkle.gifBytes));
fs.writeFileSync(path.join(publicDir, 'gemini_pixel_color_cycle.gif'), Buffer.from(colorCycle.gifBytes));

// Also save at root workspace for immediate inspection
fs.writeFileSync('gemini_pixel_animated.gif', Buffer.from(combined.gifBytes));

console.log('Successfully generated animated GIFs:');
console.log(' - public/gemini_pixel_animated.gif (' + combined.gifBytes.length + ' bytes, ' + combined.frameCount + ' frames)');
console.log(' - public/gemini_pixel_sparkle.gif (' + sparkle.gifBytes.length + ' bytes, ' + sparkle.frameCount + ' frames)');
console.log(' - public/gemini_pixel_color_cycle.gif (' + colorCycle.gifBytes.length + ' bytes, ' + colorCycle.frameCount + ' frames)');
console.log(' - gemini_pixel_animated.gif (' + combined.gifBytes.length + ' bytes)');
