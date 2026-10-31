/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AstralDragonEntity, DragonVariantConfig } from './descentEngine';

export interface DragonFrameDef {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  headOffsetX: number;
  chestOffsetX: number;
  chestOffsetY: number;
  tailOffsetX: number;
  tailOffsetY: number;
}

// Exact 6 animation frame bounding boxes extracted from the uploaded sprite sheet
export const DRAGON_ANIMATION_FRAMES: DragonFrameDef[] = [
  { sx: 38, sy: 605, sw: 270, sh: 152, headOffsetX: 25, chestOffsetX: 72, chestOffsetY: 90, tailOffsetX: 252, tailOffsetY: 106 },
  { sx: 310, sy: 605, sw: 244, sh: 152, headOffsetX: 25, chestOffsetX: 70, chestOffsetY: 90, tailOffsetX: 232, tailOffsetY: 106 },
  { sx: 556, sy: 605, sw: 238, sh: 152, headOffsetX: 25, chestOffsetX: 68, chestOffsetY: 90, tailOffsetX: 226, tailOffsetY: 106 },
  { sx: 796, sy: 605, sw: 224, sh: 152, headOffsetX: 25, chestOffsetX: 66, chestOffsetY: 90, tailOffsetX: 212, tailOffsetY: 106 },
  { sx: 1022, sy: 605, sw: 234, sh: 152, headOffsetX: 25, chestOffsetX: 68, chestOffsetY: 90, tailOffsetX: 222, tailOffsetY: 106 },
  { sx: 1258, sy: 605, sw: 218, sh: 152, headOffsetX: 25, chestOffsetX: 70, chestOffsetY: 90, tailOffsetX: 206, tailOffsetY: 106 },
];

export interface StardustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  sparkleChar?: string;
}

// Color transform helpers
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  h /= 360;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Hue offset mappings relative to the native Amethyst/Void purple (~262°)
export const VARIANT_HUE_OFFSETS: Record<string, number> = {
  void: 0,          // Native Amethyst Purple (from uploaded image)
  frost: -70,       // Gemini Cyan & Sky Blue (~192°)
  crimson: 85,      // Ruby Flame & Supernova Crimson (~347°)
  emerald: -115,    // Cosmic Aurora & Emerald Green (~147°)
  solar: -222,      // Solar Corona & Amber Gold (~40°)
};

// Singleton Sprite Cache
let spriteImage: HTMLImageElement | null = null;
let isSpriteLoaded = false;
let isSpriteFailed = false;

// Pre-tinted frame canvas cache: variant -> frameIdx -> HTMLCanvasElement
const variantFrameCanvases: Map<string, HTMLCanvasElement[]> = new Map();

/**
 * Initializes and processes the dragon sprite sheet.
 * Chroma-keys out the pitch-black background into clean alpha transparency
 * and pre-generates hue-shifted variant frames for buttery 60 FPS performance.
 */
export function initDragonSpriteSheet(imageSrc: string = '/assets/aistudio/pickle-1793172207529_40c1adee.png'): void {
  if (typeof document === 'undefined') return;
  if (spriteImage) return; // already initialized

  spriteImage = new Image();
  spriteImage.src = imageSrc;

  spriteImage.onload = () => {
    try {
      const img = spriteImage!;
      if (!img.naturalWidth || !img.naturalHeight) {
        isSpriteFailed = true;
        return;
      }

      // 1. Create base master canvas and chroma-key pitch-black background
      const masterCanvas = document.createElement('canvas');
      masterCanvas.width = img.naturalWidth;
      masterCanvas.height = img.naturalHeight;
      const mCtx = masterCanvas.getContext('2d', { willReadFrequently: true });
      if (!mCtx) {
        isSpriteFailed = true;
        return;
      }

      mCtx.drawImage(img, 0, 0);
      const imgData = mCtx.getImageData(0, 0, masterCanvas.width, masterCanvas.height);
      const data = imgData.data;

      // Chroma-key: background in the sprite sheet is pitch black void (r,g,b < 18)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const maxVal = Math.max(r, g, b);
        if (maxVal < 14) {
          data[i + 3] = 0; // 100% transparent
        } else if (maxVal < 26) {
          // Smooth anti-aliased edge
          data[i + 3] = Math.round(((maxVal - 14) / 12) * data[i + 3]);
        }
      }
      mCtx.putImageData(imgData, 0, 0);

      // 2. Pre-generate sliced and hue-shifted frames for all dragon variants
      const variants = ['void', 'frost', 'crimson', 'emerald', 'solar'];
      for (const variant of variants) {
        const hueShift = VARIANT_HUE_OFFSETS[variant] || 0;
        const frames: HTMLCanvasElement[] = [];

        for (let f = 0; f < DRAGON_ANIMATION_FRAMES.length; f++) {
          const def = DRAGON_ANIMATION_FRAMES[f];
          const frameCanvas = document.createElement('canvas');
          frameCanvas.width = def.sw;
          frameCanvas.height = def.sh;
          const fCtx = frameCanvas.getContext('2d', { willReadFrequently: true });
          if (!fCtx) continue;

          // Draw the slice from master canvas
          fCtx.drawImage(masterCanvas, def.sx, def.sy, def.sw, def.sh, 0, 0, def.sw, def.sh);

          if (hueShift !== 0) {
            const fData = fCtx.getImageData(0, 0, def.sw, def.sh);
            const fd = fData.data;
            for (let p = 0; p < fd.length; p += 4) {
              if (fd[p + 3] > 0) {
                const [h, s, l] = rgbToHsl(fd[p], fd[p + 1], fd[p + 2]);
                const [nr, ng, nb] = hslToRgb(h + hueShift, s, l);
                fd[p] = nr;
                fd[p + 1] = ng;
                fd[p + 2] = nb;
              }
            }
            fCtx.putImageData(fData, 0, 0);
          }

          frames.push(frameCanvas);
        }

        variantFrameCanvases.set(variant, frames);
      }

      isSpriteLoaded = true;
    } catch {
      isSpriteFailed = true;
    }
  };

  spriteImage.onerror = () => {
    isSpriteFailed = true;
  };
}

export function isDragonSpriteReady(): boolean {
  return isSpriteLoaded && !isSpriteFailed && variantFrameCanvases.size > 0;
}

/**
 * Renders the pulsing Gemini 4-pointed superellipse star core on the dragon's chest.
 */
export function renderGeminiChestCore(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  tick: number,
  variant: DragonVariantConfig
): void {
  const pulse = Math.sin(tick * 0.12) * 0.25 + 1.0;
  const coreSize = 3.5 * pulse;

  // Luminous radial glow
  const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, 14 * pulse);
  grad.addColorStop(0, variant.eyeColor);
  grad.addColorStop(0.5, variant.wakeColorStart);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 14 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // 4-pointed Gemini star core
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(Math.floor(cx - coreSize * 0.5), Math.floor(cy - 0.5), Math.ceil(coreSize), 1);
  ctx.fillRect(Math.floor(cx - 0.5), Math.floor(cy - coreSize * 0.5), 1, Math.ceil(coreSize));

  // Diamond facets
  ctx.fillStyle = variant.hornColor;
  ctx.fillRect(Math.floor(cx - 1), Math.floor(cy - 1), 2, 2);
}

/**
 * Renders the faceted rhombus diamond tail-tip crystal and star glint.
 */
export function renderTailCrystalFlare(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  tick: number,
  variant: DragonVariantConfig
): void {
  const glint = (Math.sin(tick * 0.15 + 1.2) + 1.0) * 0.5;

  // Faceted rhombus diamond
  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(Math.PI * 0.25);

  ctx.fillStyle = variant.dorsalSpikeColor;
  ctx.fillRect(-3, -3, 6, 6);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-1.5, -1.5, 3, 3);

  // Sparkling cross star flare
  if (glint > 0.4) {
    ctx.rotate(-Math.PI * 0.25);
    ctx.strokeStyle = `rgba(255, 255, 255, ${(glint - 0.4) * 1.5})`;
    ctx.lineWidth = 1;
    const len = 4 + glint * 4;
    ctx.beginPath();
    ctx.moveTo(-len, 0); ctx.lineTo(len, 0);
    ctx.moveTo(0, -len); ctx.lineTo(0, len);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * High-performance celestial dragon renderer.
 * Automatically chooses between the authentic 6-frame sprite sheet and the
 * upgraded procedural celestial dragon fallback.
 */
export function renderCelestialDragon(
  ctx: CanvasRenderingContext2D,
  dragon: AstralDragonEntity,
  tick: number,
  speedMult: number,
  stardustPool: StardustParticle[]
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const variant = dragon.variant;
  const isFacingLeft = dragon.direction === 'rtl';
  const targetWidth = 118; // scaled width on 480x300 canvas
  const targetHeight = 66; // scaled height on 480x300 canvas

  // 1. Atmospheric Ethereal Wake Trail
  const wakeGrad = ctx.createLinearGradient(
    dragon.headX,
    dragon.headY,
    dragon.segments[dragon.segments.length - 1].x,
    dragon.segments[dragon.segments.length - 1].y
  );
  wakeGrad.addColorStop(0, variant.wakeColorStart);
  wakeGrad.addColorStop(0.6, variant.wakeColorStart);
  wakeGrad.addColorStop(1, variant.wakeColorEnd);
  ctx.strokeStyle = wakeGrad;
  ctx.lineWidth = 32;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(dragon.headX, dragon.headY);
  for (let i = 2; i < dragon.segments.length; i += 3) {
    ctx.lineTo(dragon.segments[i].x, dragon.segments[i].y);
  }
  ctx.stroke();

  // Check if authentic sprite sheet frames are available
  const variantFrames = variantFrameCanvases.get(variant.type) || variantFrameCanvases.get('void');
  const hasSprite = isDragonSpriteReady() && variantFrames && variantFrames.length === 6;

  if (hasSprite && variantFrames) {
    // -----------------------------------------------------------------
    // MODE A: AUTHENTIC 6-FRAME ANIMATED CELESTIAL DRAGON SPRITE SHEET
    // -----------------------------------------------------------------
    // Calculate wing flap frame (cycles 0 to 5 smoothly with wingSpeed)
    const frameIdx = Math.floor((dragon.wingPhase / (Math.PI * 2) * 6) % 6 + 6) % 6;
    const frameCanvas = variantFrames[frameIdx];
    const def = DRAGON_ANIMATION_FRAMES[frameIdx];

    // Center the dragon at the head/chest coordinates
    const drawX = dragon.headX;
    const drawY = dragon.headY;
    const tilt = Math.sin(dragon.phase) * 0.08;

    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.rotate(tilt);

    if (dragon.direction === 'ltr') {
      // Flip horizontally so the dragon flies smoothly towards the right
      ctx.scale(-1, 1);
    }

    // Outer cosmic aura glow
    const auraGrad = ctx.createRadialGradient(
      -targetWidth * 0.45,
      0,
      10,
      -targetWidth * 0.45,
      0,
      targetWidth * 0.65
    );
    auraGrad.addColorStop(0, variant.wakeColorStart);
    auraGrad.addColorStop(0.7, variant.wakeColorEnd);
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.ellipse(-targetWidth * 0.45, 0, targetWidth * 0.6, targetHeight * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw the transparent authentic pixel dragon frame
    ctx.drawImage(
      frameCanvas,
      -targetWidth,
      -targetHeight * 0.55,
      targetWidth,
      targetHeight
    );

    // Compute relative chest core and tail tip positions for visual attachments
    const chestX = -targetWidth + (def.chestOffsetX / def.sw) * targetWidth;
    const chestY = -targetHeight * 0.55 + (def.chestOffsetY / def.sh) * targetHeight;
    const tailX = -targetWidth + (def.tailOffsetX / def.sw) * targetWidth;
    const tailY = -targetHeight * 0.55 + (def.tailOffsetY / def.sh) * targetHeight;

    // Render Gemini Star Chest Core & Tail Crystal Flare
    renderGeminiChestCore(ctx, chestX, chestY, tick, variant);
    renderTailCrystalFlare(ctx, tailX, tailY, tick, variant);

    ctx.restore();

    // Spawn trailing cosmic stardust nebula particles from the tail and wings
    if (Math.random() > 0.25 && stardustPool.length < 180) {
      const emberCol = variant.emberColors[Math.floor(Math.random() * variant.emberColors.length)];
      const tailSeg = dragon.segments[dragon.segments.length - 1];
      const spawnX = tailSeg ? tailSeg.x : dragon.headX - (dragon.direction === 'ltr' ? targetWidth : -targetWidth);
      const spawnY = (tailSeg ? tailSeg.y : dragon.headY) + (Math.random() - 0.5) * 8;

      stardustPool.push({
        x: spawnX,
        y: spawnY,
        vx: -dragon.vx * 0.25 + (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() > 0.65 ? 2 : 1,
        color: emberCol,
        alpha: 0.95,
        life: 0,
        maxLife: 26 + Math.floor(Math.random() * 20),
        sparkleChar: Math.random() > 0.75 ? (Math.random() > 0.5 ? '★' : '✦') : undefined,
      });
    }
  } else {
    // -----------------------------------------------------------------
    // MODE B: UPGRADED PROCEDURAL CELESTIAL WYRM (FAILSAFE HERO FALLBACK)
    // -----------------------------------------------------------------
    // Render the anatomical celestial dragon with backward-swept horns,
    // multi-tiered stardust wings, chest core, and crystal rhombus tail
    renderProceduralCelestialWyrm(ctx, dragon, tick, speedMult, stardustPool);
  }

  ctx.restore();
}

/**
 * Upgraded procedural celestial wyrm matching the exact silhouette and anatomy
 * of the uploaded image. Acts as a failsafe so the app NEVER breaks even if the
 * image asset is absent or removed.
 */
function renderProceduralCelestialWyrm(
  ctx: CanvasRenderingContext2D,
  dragon: AstralDragonEntity,
  tick: number,
  _speedMult: number,
  stardustPool: StardustParticle[]
): void {
  const variant = dragon.variant;
  const flapAngle = Math.sin(dragon.wingPhase) * 0.75;
  const hx = Math.floor(dragon.headX);
  const hy = Math.floor(dragon.headY);
  const headSeg = dragon.segments[0] || { angle: 0, x: hx, y: hy };
  const hAngle = headSeg.angle;

  // 1. Far Wing (Amethyst stardust feather silhouette)
  ctx.save();
  ctx.fillStyle = variant.bodyColor;
  ctx.strokeStyle = variant.rimStroke;
  ctx.lineWidth = 1;
  const farWingY = hy - 4 + flapAngle * 10;
  ctx.beginPath();
  ctx.moveTo(hx - 15, hy);
  ctx.lineTo(hx - 28, farWingY - 18);
  ctx.lineTo(hx - 44, farWingY - 24);
  ctx.lineTo(hx - 36, farWingY - 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 2. Spine & Serpentine Body Segments
  for (let s = dragon.segments.length - 1; s >= 0; s--) {
    const seg = dragon.segments[s];
    const rad = seg.radius;
    const sx = Math.floor(seg.x);
    const sy = Math.floor(seg.y);

    ctx.fillStyle = variant.bodyColor;
    ctx.beginPath();
    ctx.arc(sx, sy, rad, 0, Math.PI * 2);
    ctx.fill();

    // Luminescent rim along back
    ctx.strokeStyle = variant.rimStroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sx, sy, rad, seg.angle - Math.PI * 0.7, seg.angle - Math.PI * 0.15);
    ctx.stroke();

    // Spiny dorsal crystal scales
    if (s % 2 === 0 && s > 1 && s < dragon.segments.length - 2) {
      const spikeX = seg.x + Math.cos(seg.angle - Math.PI * 0.5) * (rad + 3);
      const spikeY = seg.y + Math.sin(seg.angle - Math.PI * 0.5) * (rad + 3);
      ctx.fillStyle = variant.dorsalSpikeColor;
      ctx.fillRect(Math.floor(spikeX), Math.floor(spikeY), 2, 2);
    }
  }

  // 3. Tucked Flight Legs
  if (dragon.segments.length > 5) {
    const hip1 = dragon.segments[3];
    const hip2 = dragon.segments[6];
    ctx.strokeStyle = variant.rimStroke;
    ctx.lineWidth = 1.2;
    // Front leg tucked back
    ctx.beginPath();
    ctx.moveTo(hip1.x, hip1.y);
    ctx.lineTo(hip1.x - 7, hip1.y + 7);
    ctx.lineTo(hip1.x - 14, hip1.y + 5);
    ctx.stroke();
    // Rear leg tucked back
    ctx.beginPath();
    ctx.moveTo(hip2.x, hip2.y);
    ctx.lineTo(hip2.x - 8, hip2.y + 8);
    ctx.lineTo(hip2.x - 16, hip2.y + 6);
    ctx.stroke();
  }

  // 4. Swept Horns & Dragon Head
  ctx.strokeStyle = variant.hornColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(hx, hy - 2);
  ctx.lineTo(hx - Math.cos(hAngle) * 16, hy - Math.sin(hAngle) * 16 - 8);
  ctx.moveTo(hx, hy + 1);
  ctx.lineTo(hx - Math.cos(hAngle) * 12, hy - Math.sin(hAngle) * 12 - 4);
  ctx.stroke();

  // Glowing Eye
  ctx.fillStyle = variant.eyeColor;
  ctx.shadowColor = variant.dorsalSpikeColor;
  ctx.shadowBlur = 6;
  ctx.fillRect(hx + 2, hy - 1, 2, 2);
  ctx.shadowBlur = 0;

  // Chest Gemini Core
  renderGeminiChestCore(ctx, hx - 8, hy + 2, tick, variant);

  // 5. Near Wing (Dynamic flap with feathered crystalline tips)
  const nearWingY = hy - 2 - flapAngle * 12;
  ctx.fillStyle = variant.bodyColor;
  ctx.strokeStyle = variant.rimStroke;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(hx - 12, hy);
  ctx.lineTo(hx - 22, nearWingY - 26);
  ctx.lineTo(hx - 42, nearWingY - 32);
  ctx.lineTo(hx - 32, nearWingY - 14);
  ctx.lineTo(hx - 48, nearWingY - 16);
  ctx.lineTo(hx - 26, hy + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 6. Tail Tip Rhombus Crystal
  const tailSeg = dragon.segments[dragon.segments.length - 1];
  if (tailSeg) {
    renderTailCrystalFlare(ctx, tailSeg.x, tailSeg.y, tick, variant);
  }

  // 7. Trailing stardust
  if (Math.random() > 0.4 && stardustPool.length < 180) {
    const emberCol = variant.emberColors[Math.floor(Math.random() * variant.emberColors.length)];
    stardustPool.push({
      x: (tailSeg ? tailSeg.x : hx - 50) + (Math.random() - 0.5) * 6,
      y: (tailSeg ? tailSeg.y : hy) + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      size: Math.random() > 0.6 ? 2 : 1,
      color: emberCol,
      alpha: 0.95,
      life: 0,
      maxLife: 24 + Math.floor(Math.random() * 18),
    });
  }
}
