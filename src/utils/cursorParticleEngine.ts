/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CursorSparkle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number; // 1 or 2 px
  color: string;
  alpha: number;
  maxAlpha: number;
  decay: number;
  life: number;
  maxLife: number;
  isBurst?: boolean;
  hasCrossFlare?: boolean;
}

export interface CursorBurstNova {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

// Starlight palette based on Google Gemini chromatic spectrum
export const STARLIGHT_PALETTE = [
  '#ffffff', // Radiant Core White
  '#38bdf8', // Gemini Electric Cyan
  '#818cf8', // Cosmic Violet
  '#fde047', // Celestial Stardust Gold
  '#ec4899', // Radiant Starlight Pink
  '#67e8f9', // Glacial Blue
];

let sparkleIdCounter = 1;
let burstIdCounter = 1;

/**
 * Maps screen-space pointer coordinates (clientX, clientY) to internal pixel canvas coordinates
 * Taking CSS object-contain letterboxing and aspect ratio into account
 */
export function mapScreenToCanvasCoords(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  internalW: number,
  internalH: number
): { x: number; y: number } | null {
  if (rect.width <= 0 || rect.height <= 0) return null;

  // Relative normalized coordinates inside element rect [0, 1]
  const relX = clientX - rect.left;
  const relY = clientY - rect.top;

  if (relX < 0 || relX > rect.width || relY < 0 || relY > rect.height) {
    return null;
  }

  // Account for CSS object-contain aspect ratio preservation
  const elementAspect = rect.width / rect.height;
  const canvasAspect = internalW / internalH;

  let renderW = rect.width;
  let renderH = rect.height;
  let offsetX = 0;
  let offsetY = 0;

  if (elementAspect > canvasAspect) {
    // Letterbox on left/right
    renderW = rect.height * canvasAspect;
    offsetX = (rect.width - renderW) * 0.5;
  } else {
    // Letterbox on top/bottom
    renderH = rect.width / canvasAspect;
    offsetY = (rect.height - renderH) * 0.5;
  }

  const canvasX = ((relX - offsetX) / renderW) * internalW;
  const canvasY = ((relY - offsetY) / renderH) * internalH;

  if (canvasX < 0 || canvasX > internalW || canvasY < 0 || canvasY > internalH) {
    return null;
  }

  return {
    x: Math.round(canvasX * 10) / 10,
    y: Math.round(canvasY * 10) / 10,
  };
}

/**
 * Generates gentle micro-starlight trail sparkles behind moving cursor
 */
export function createCursorTrailSparkle(
  x: number,
  y: number,
  prevX?: number,
  prevY?: number,
  count: number = 2
): CursorSparkle[] {
  const result: CursorSparkle[] = [];

  for (let i = 0; i < count; i++) {
    // Interpolate slightly along movement vector if previous position exists
    const interp = Math.random();
    const spawnX = prevX !== undefined ? prevX + (x - prevX) * interp : x;
    const spawnY = prevY !== undefined ? prevY + (y - prevY) * interp : y;

    // Gentle random drift
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.2 + Math.random() * 0.55;
    const color = STARLIGHT_PALETTE[Math.floor(Math.random() * STARLIGHT_PALETTE.length)];
    const size = Math.random() > 0.65 ? 2 : 1;
    const maxLife = 18 + Math.floor(Math.random() * 22); // 18~40 frames (~0.3s to 0.7s)

    result.push({
      id: sparkleIdCounter++,
      x: spawnX + (Math.random() - 0.5) * 3,
      y: spawnY + (Math.random() - 0.5) * 3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 0.15, // Slight downward celestial gravity drift
      size,
      color,
      alpha: 0.85 + Math.random() * 0.15,
      maxAlpha: 1.0,
      decay: 0.035 + Math.random() * 0.02,
      life: 0,
      maxLife,
      isBurst: false,
      hasCrossFlare: size === 2 && Math.random() > 0.5,
    });
  }

  return result;
}

/**
 * Generates a vibrant radial starlight burst / nova explosion upon clicking
 */
export function createCursorBurstSparks(
  x: number,
  y: number,
  count: number = 16
): { sparkles: CursorSparkle[]; nova: CursorBurstNova } {
  const sparkles: CursorSparkle[] = [];

  for (let i = 0; i < count; i++) {
    // Radial explosion trajectory
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const speed = 1.6 + Math.random() * 2.8;
    const color = STARLIGHT_PALETTE[i % STARLIGHT_PALETTE.length];
    const size = Math.random() > 0.4 ? 2 : 1;
    const maxLife = 24 + Math.floor(Math.random() * 18);

    sparkles.push({
      id: sparkleIdCounter++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      color,
      alpha: 1.0,
      maxAlpha: 1.0,
      decay: 0.042 + Math.random() * 0.02,
      life: 0,
      maxLife,
      isBurst: true,
      hasCrossFlare: i % 3 === 0, // 4-directional cross flare on prominent sparks
    });
  }

  // Accompanying expanding nova shockwave ring
  const nova: CursorBurstNova = {
    id: burstIdCounter++,
    x,
    y,
    radius: 3,
    maxRadius: 28 + Math.random() * 8,
    alpha: 0.9,
    color: '#38bdf8',
  };

  return { sparkles, nova };
}

/**
 * Updates kinematics and alpha lifetimes for all active cursor sparkles
 */
export function updateCursorSparkles(
  sparkles: CursorSparkle[],
  speedMult: number = 1.0
): CursorSparkle[] {
  const alive: CursorSparkle[] = [];

  for (let i = 0; i < sparkles.length; i++) {
    const s = sparkles[i];
    s.life++;

    // Motion with aerodynamic friction drag
    s.x += s.vx * speedMult;
    s.y += s.vy * speedMult;

    // Atmospheric air resistance
    s.vx *= 0.94;
    s.vy *= 0.94;

    // Decay alpha
    s.alpha -= s.decay * speedMult;

    if (s.alpha > 0.02 && s.life < s.maxLife) {
      alive.push(s);
    }
  }

  return alive;
}

/**
 * Updates expanding nova shockwave rings
 */
export function updateCursorBurstNovas(
  novas: CursorBurstNova[],
  speedMult: number = 1.0
): CursorBurstNova[] {
  const alive: CursorBurstNova[] = [];

  for (let i = 0; i < novas.length; i++) {
    const n = novas[i];
    n.radius += 2.2 * speedMult;
    n.alpha -= 0.065 * speedMult;

    if (n.alpha > 0.02 && n.radius < n.maxRadius) {
      alive.push(n);
    }
  }

  return alive;
}

/**
 * Renders all cursor starlight particles and burst novas onto the 2D canvas context
 */
export function renderCursorStarlight(
  ctx: CanvasRenderingContext2D,
  sparkles: CursorSparkle[],
  novas: CursorBurstNova[]
): void {
  if (sparkles.length === 0 && novas.length === 0) return;

  ctx.save();

  // 1. Render expanding shockwave rings
  for (let i = 0; i < novas.length; i++) {
    const n = novas[i];
    ctx.strokeStyle = n.color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = Math.max(0, Math.min(1, n.alpha));
    ctx.beginPath();
    ctx.arc(Math.floor(n.x), Math.floor(n.y), Math.floor(n.radius), 0, Math.PI * 2);
    ctx.stroke();

    // Inner bright micro ring
    if (n.radius > 6) {
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = Math.max(0, Math.min(1, n.alpha * 0.5));
      ctx.beginPath();
      ctx.arc(Math.floor(n.x), Math.floor(n.y), Math.floor(n.radius * 0.6), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 2. Render starlight sparkles and micro cross-flares
  for (let i = 0; i < sparkles.length; i++) {
    const s = sparkles[i];
    const px = Math.floor(s.x);
    const py = Math.floor(s.y);
    const alpha = Math.max(0, Math.min(1, s.alpha));

    ctx.fillStyle = s.color;
    ctx.globalAlpha = alpha;

    // Core pixel block
    ctx.fillRect(px, py, s.size, s.size);

    // 4-axis micro cross-flare for larger sparkles or burst highlights
    if (s.hasCrossFlare && alpha > 0.3) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha * 0.65;
      // Micro arms (1px wide)
      ctx.fillRect(px - 1, py, 1, s.size);
      ctx.fillRect(px + s.size, py, 1, s.size);
      ctx.fillRect(px, py - 1, s.size, 1);
      ctx.fillRect(px, py + s.size, s.size, 1);
    }
  }

  ctx.restore();
}
