/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as gifenc from 'gifenc';
import { isPointInsideGeminiStar, hexToRgb, lerpColor } from './descentEngine';

function getGifEncoder() {
  let fn: any = (gifenc as any).GIFEncoder;
  if (typeof fn !== 'function') {
    fn = (gifenc as any).default?.GIFEncoder;
  }
  if (typeof fn !== 'function') {
    fn = (gifenc as any).default;
  }
  if (typeof fn !== 'function') {
    fn = gifenc as any;
  }
  if (typeof fn !== 'function') {
    throw new Error('GIFEncoder not found. typeof gifenc: ' + typeof gifenc + ' keys: ' + Object.keys(gifenc));
  }
  return fn();
}

function quantizePixels(rgba: Uint8ClampedArray | Uint8Array, maxColors: number) {
  const fn = (gifenc as any).quantize || (gifenc as any).default?.quantize;
  return fn(rgba, maxColors);
}

function applyPaletteToPixels(rgba: Uint8ClampedArray | Uint8Array, palette: any) {
  const fn = (gifenc as any).applyPalette || (gifenc as any).default?.applyPalette;
  return fn(rgba, palette);
}

export type GifAnimationMode = 'sparkle' | 'color-cycle' | 'combined' | 'glacial-frost';

export interface GifGeneratorOptions {
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  mode: GifAnimationMode;
  showCompanionStar?: boolean;
  transparentBg?: boolean;
  bgColor?: string;
  dotScale?: number;
}

export interface GifRenderResult {
  gifBytes: Uint8Array;
  blobUrl: string;
  frameCount: number;
  durationSec: number;
}

/**
 * Convert HSV to RGB
 */
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Standard Google Gemini Brand Color Stops
 */
const GEMINI_BRAND_COLORS = {
  core: { r: 255, g: 255, b: 255 },
  cyan: { r: 56, g: 189, b: 248 },     // #38bdf8
  skyBlue: { r: 14, g: 165, b: 233 },   // #0ea5e9
  violet: { r: 129, g: 140, b: 248 },  // #818cf8
  purple: { r: 168, g: 85, b: 247 },   // #a855f7
  magenta: { r: 244, g: 63, b: 94 },   // #f43f5e
  pink: { r: 236, g: 72, b: 153 },     // #ec4899
};

/**
 * Render a single frame into an RGBA pixel buffer (Uint8ClampedArray)
 */
export function renderGeminiFrameRgba(
  width: number,
  height: number,
  frameIndex: number,
  totalFrames: number,
  options: Partial<GifGeneratorOptions> = {}
): Uint8ClampedArray {
  const mode = options.mode || 'combined';
  const transparentBg = options.transparentBg ?? false;
  const showCompanion = options.showCompanionStar ?? true;
  const bgHex = options.bgColor || '#050714';
  const bgRgb = hexToRgb(bgHex);

  const rgba = new Uint8ClampedArray(width * height * 4);
  const progress = (frameIndex / totalFrames) % 1.0;

  // Background fill
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    if (transparentBg) {
      rgba[idx] = 0;
      rgba[idx + 1] = 0;
      rgba[idx + 2] = 0;
      rgba[idx + 3] = 0;
    } else {
      rgba[idx] = bgRgb.r;
      rgba[idx + 1] = bgRgb.g;
      rgba[idx + 2] = bgRgb.b;
      rgba[idx + 3] = 255;
    }
  }

  const cx = width * 0.48;
  const cy = height * 0.52;
  const baseR = width * 0.36;

  // Animation cycle parameters
  // 1. Blinking / Sparkling breath (2 full sparkles per loop)
  const blinkPhase = progress * Math.PI * 4;
  const blinkFactor = 0.5 + 0.5 * Math.sin(blinkPhase);
  const coreScale = 0.16 + 0.08 * blinkFactor;
  const starPulse = 1.0 + 0.04 * Math.sin(progress * Math.PI * 2);
  const R = baseR * starPulse;

  // 2. Color shift offset along gradient
  const colorShift = mode === 'color-cycle' || mode === 'combined' ? progress : 0;

  // 3. Companion Star Orbit
  const orbitAngle = progress * Math.PI * 2;
  const companionDist = baseR * 0.92;
  const compCx = cx + Math.cos(orbitAngle) * companionDist * 0.95;
  const compCy = cy + Math.sin(orbitAngle) * companionDist * 0.65 - 12;
  const compR = baseR * 0.36;

  // Set pixel helper
  const setPixel = (px: number, py: number, r: number, g: number, b: number, a: number = 255) => {
    if (px < 0 || px >= width || py < 0 || py >= height) return;
    const idx = (py * width + px) * 4;
    if (a >= 255 || rgba[idx + 3] === 0) {
      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = a;
    } else {
      // Alpha blending
      const alpha = a / 255;
      const invA = 1 - alpha;
      rgba[idx] = Math.round(r * alpha + rgba[idx] * invA);
      rgba[idx + 1] = Math.round(g * alpha + rgba[idx + 1] * invA);
      rgba[idx + 2] = Math.round(b * alpha + rgba[idx + 2] * invA);
      rgba[idx + 3] = Math.max(rgba[idx + 3], a);
    }
  };

  // 4. Subtle Radial Starlight Aura
  const auraR = Math.round(R * 1.35);
  for (let dy = -auraR; dy <= auraR; dy += 2) {
    for (let dx = -auraR; dx <= auraR; dx += 2) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= auraR && dist > R * 0.4) {
        const falloff = 1 - dist / auraR;
        const auraAlpha = Math.round(falloff * falloff * 90 * (0.6 + 0.4 * blinkFactor));
        if (auraAlpha > 3) {
          // Glow colored with cyan-violet blend
          const glowCol = mode === 'glacial-frost'
            ? { r: 56, g: 189, b: 248 }
            : { r: 129, g: 140, b: 248 };
          setPixel(Math.round(cx + dx), Math.round(cy + dy), glowCol.r, glowCol.g, glowCol.b, auraAlpha);
        }
      }
    }
  }

  // 5. Main 4-pointed Gemini Star Pixel Art
  const intR = Math.ceil(R);
  for (let dy = -intR; dy <= intR; dy++) {
    for (let dx = -intR; dx <= intR; dx++) {
      const check = isPointInsideGeminiStar(cx + dx, cy + dy, cx, cy, R, 0, 0.58);
      if (check.inside) {
        const dist = check.dist;
        // Directional diagonal factor (-1 to +1 normalized to 0..1)
        const rawT = (check.normX + check.normY + 2) / 4;
        const diagT = (rawT + colorShift) % 1.0;

        let r = 255, g = 255, b = 255;
        let alpha = 255;

        if (dist < coreScale) {
          // White sparkling central core with intense glitter
          const coreGleam = dist < coreScale * 0.4 ? 255 : 240 + Math.round(15 * blinkFactor);
          r = coreGleam;
          g = coreGleam;
          b = 255;
        } else if (mode === 'color-cycle') {
          // Dynamic rainbow/HSV cycling spectrum
          const hue = Math.round(((diagT + progress) * 360) % 360);
          const col = hsvToRgb(hue, 0.78, 0.98);
          r = col.r;
          g = col.g;
          b = col.b;
        } else if (mode === 'glacial-frost') {
          // Glacial ice frost blue and cyan tones
          if (diagT < 0.45) {
            r = 56; g = 189; b = 248; // Cyan
          } else if (diagT < 0.75) {
            r = 14; g = 165; b = 233; // Glacial blue
          } else {
            r = 186; g = 230; b: 253; // Soft frost white-blue
          }
        } else {
          // Gemini Brand 4-Stop Gradient (Cyan -> Violet -> Magenta) with optional shift
          if (diagT < 0.36) {
            r = GEMINI_BRAND_COLORS.cyan.r;
            g = GEMINI_BRAND_COLORS.cyan.g;
            b = GEMINI_BRAND_COLORS.cyan.b;
          } else if (diagT < 0.68) {
            r = GEMINI_BRAND_COLORS.violet.r;
            g = GEMINI_BRAND_COLORS.violet.g;
            b = GEMINI_BRAND_COLORS.violet.b;
          } else {
            r = GEMINI_BRAND_COLORS.magenta.r;
            g = GEMINI_BRAND_COLORS.magenta.g;
            b = GEMINI_BRAND_COLORS.magenta.b;
          }
        }

        // Slight edge antialiasing for authentic crisp pixel art
        if (dist > 0.92) {
          alpha = Math.round(210 + 45 * (1 - dist) / 0.08);
        }

        setPixel(Math.round(cx + dx), Math.round(cy + dy), r, g, b, alpha);
      }
    }
  }

  // 6. Cardinal Starlight Flare Beams during peak sparkle
  if (blinkFactor > 0.55) {
    const flareIntensity = (blinkFactor - 0.55) / 0.45;
    const flareLen = Math.round(baseR * 0.45 * flareIntensity);
    const flareCol = mode === 'glacial-frost'
      ? { r: 125, g: 211, b: 252 }
      : { r: 255, g: 255, b: 255 };

    // Horizontal & vertical glimmer spikes
    for (let d = -flareLen; d <= flareLen; d++) {
      if (Math.abs(d) < 3) continue;
      const alpha = Math.round(flareIntensity * (1 - Math.abs(d) / flareLen) * 220);
      setPixel(Math.round(cx + d), Math.round(cy), flareCol.r, flareCol.g, flareCol.b, alpha);
      setPixel(Math.round(cx), Math.round(cy + d), flareCol.r, flareCol.g, flareCol.b, alpha);
    }
  }

  // 7. Companion Binary Satellite Star
  if (showCompanion) {
    const intCompR = Math.ceil(compR);
    const compBlink = 0.5 + 0.5 * Math.cos(blinkPhase + 1.2);
    for (let dy = -intCompR; dy <= intCompR; dy++) {
      for (let dx = -intCompR; dx <= intCompR; dx++) {
        const check = isPointInsideGeminiStar(compCx + dx, compCy + dy, compCx, compCy, compR, 0, 0.58);
        if (check.inside) {
          let r = 255, g = 255, b = 255;
          if (check.dist < 0.22) {
            r = 255; g = 255; b = 255;
          } else if (check.normX < 0) {
            r = GEMINI_BRAND_COLORS.cyan.r;
            g = GEMINI_BRAND_COLORS.cyan.g;
            b = GEMINI_BRAND_COLORS.cyan.b;
          } else {
            r = GEMINI_BRAND_COLORS.pink.r;
            g = GEMINI_BRAND_COLORS.pink.g;
            b = GEMINI_BRAND_COLORS.pink.b;
          }
          const alpha = Math.round(200 + 55 * compBlink);
          setPixel(Math.round(compCx + dx), Math.round(compCy + dy), r, g, b, alpha);
        }
      }
    }
  }

  // 8. Background Twinkling Stardust Pixels
  const starSeeds = [
    { x: 0.15, y: 0.18, phase: 0.0 },
    { x: 0.82, y: 0.14, phase: 0.8 },
    { x: 0.88, y: 0.78, phase: 1.5 },
    { x: 0.12, y: 0.82, phase: 2.2 },
    { x: 0.28, y: 0.35, phase: 3.1 },
    { x: 0.74, y: 0.42, phase: 4.0 },
  ];
  for (const s of starSeeds) {
    const sx = Math.round(s.x * width);
    const sy = Math.round(s.y * height);
    const twinkle = 0.4 + 0.6 * Math.sin(progress * Math.PI * 4 + s.phase);
    if (twinkle > 0.55) {
      const a = Math.round(twinkle * 240);
      setPixel(sx, sy, 255, 255, 255, a);
      if (twinkle > 0.85) {
        setPixel(sx - 1, sy, 186, 230, 253, Math.round(a * 0.5));
        setPixel(sx + 1, sy, 186, 230, 253, Math.round(a * 0.5));
        setPixel(sx, sy - 1, 186, 230, 253, Math.round(a * 0.5));
        setPixel(sx, sy + 1, 186, 230, 253, Math.round(a * 0.5));
      }
    }
  }

  return rgba;
}

/**
 * Generate animated GIF bytes using gifenc
 */
export function generateGeminiAnimatedGif(
  options: Partial<GifGeneratorOptions> = {}
): GifRenderResult {
  const width = options.width || 128;
  const height = options.height || 128;
  const fps = Math.max(5, Math.min(30, options.fps || 12));
  const durationSec = Math.max(1.0, Math.min(5.0, options.durationSec || 2.0));
  const totalFrames = Math.round(fps * durationSec);
  const delayMs = Math.round(1000 / fps);

  const gif = getGifEncoder();

  for (let f = 0; f < totalFrames; f++) {
    const rgba = renderGeminiFrameRgba(width, height, f, totalFrames, options);

    // Quantize 256 colors palette from the frame pixels
    const palette = quantizePixels(rgba, 256);
    const index = applyPaletteToPixels(rgba, palette);

    gif.writeFrame(index, width, height, {
      palette,
      delay: delayMs,
      transparent: options.transparentBg ? true : undefined,
    });
  }

  gif.finish();
  const gifBytes = gif.bytes();

  let blobUrl = '';
  if (typeof window !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
    const blob = new Blob([gifBytes.buffer as ArrayBuffer], { type: 'image/gif' });
    blobUrl = URL.createObjectURL(blob);
  }

  return {
    gifBytes,
    blobUrl,
    frameCount: totalFrames,
    durationSec,
  };
}

/**
 * Trigger file download in browser
 */
export function downloadGifFile(gifBytes: Uint8Array, filename: string = 'google_gemini_pixel.gif') {
  if (typeof window === 'undefined') return;
  const blob = new Blob([gifBytes.buffer as ArrayBuffer], { type: 'image/gif' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
