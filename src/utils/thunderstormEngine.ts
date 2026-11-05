/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LightningSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  branchLevel: number;
  alpha: number;
  width: number;
}

export interface LightningBolt {
  id: number;
  segments: LightningSegment[];
  flashIntensity: number; // 0 to 1 ambient cloud illumination
  life: number;
  maxLife: number;
}

export interface StElmoSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
}

/**
 * Generate a procedural fractal branching forked lightning discharge
 */
export function generateForkedLightning(
  startX: number,
  startY: number,
  targetEndY: number,
  canvasWidth: number
): LightningBolt {
  const segments: LightningSegment[] = [];

  function branch(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    depth: number,
    branchLevel: number
  ) {
    const distY = y2 - y1;
    if (depth <= 0 || distY < 6) {
      segments.push({
        x1: Math.floor(x1),
        y1: Math.floor(y1),
        x2: Math.floor(x2),
        y2: Math.floor(y2),
        branchLevel,
        alpha: branchLevel === 0 ? 1.0 : 0.65 / branchLevel,
        width: branchLevel === 0 ? 2.2 : 1.2,
      });
      return;
    }

    const midY = (y1 + y2) / 2;
    // Lateral jitter
    const maxJitter = (distY * 0.45) / (branchLevel + 1);
    const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * maxJitter;

    // Recurse on main trunk
    branch(x1, y1, midX, midY, depth - 1, branchLevel);
    branch(midX, midY, x2, y2, depth - 1, branchLevel);

    // Occasional sub-branch fork
    if (branchLevel < 2 && Math.random() > 0.42) {
      const forkAngle = (Math.random() - 0.5) * 1.2;
      const forkLen = distY * (0.45 + Math.random() * 0.4);
      const forkX2 = midX + Math.sin(forkAngle) * forkLen;
      const forkY2 = midY + Math.cos(forkAngle) * forkLen * 0.7;
      branch(midX, midY, forkX2, forkY2, depth - 2, branchLevel + 1);
    }
  }

  const endX = startX + (Math.random() - 0.5) * 90;
  branch(startX, startY, endX, targetEndY, 5, 0);

  return {
    id: Date.now() + Math.random(),
    segments,
    flashIntensity: 1.0,
    life: 0,
    maxLife: 16, // Fast realistic discharge (~260ms)
  };
}

export function updateLightningBolts(
  bolts: LightningBolt[],
  speedMult: number = 1.0
): number {
  let peakIllumination = 0;

  for (let i = bolts.length - 1; i >= 0; i--) {
    const bolt = bolts[i];
    bolt.life += 1 * speedMult;
    // Fast initial flash followed by flickering decay
    bolt.flashIntensity = Math.max(0, 1.0 - bolt.life / bolt.maxLife);
    peakIllumination = Math.max(peakIllumination, bolt.flashIntensity);

    if (bolt.life >= bolt.maxLife) {
      bolts.splice(i, 1);
    }
  }

  return peakIllumination;
}

/**
 * Generate St. Elmo's Fire plasma electrostatic sparks dancing along the Gemini star tips
 */
export function generateStElmoSparks(
  starX: number,
  starY: number,
  starAngle: number,
  starRadius: number = 30
): StElmoSpark[] {
  const sparks: StElmoSpark[] = [];
  // 4 cardinal tips of the Gemini 4-pointed star
  for (let tip = 0; tip < 4; tip++) {
    const tipAngle = starAngle + (tip * Math.PI) / 2;
    const tx = starX + Math.cos(tipAngle) * starRadius;
    const ty = starY + Math.sin(tipAngle) * starRadius;

    if (Math.random() > 0.35) {
      const spreadAngle = tipAngle + (Math.random() - 0.5) * 0.8;
      const speed = 0.5 + Math.random() * 1.5;
      sparks.push({
        x: tx,
        y: ty,
        vx: Math.cos(spreadAngle) * speed,
        vy: Math.sin(spreadAngle) * speed,
        color: Math.random() > 0.4 ? '#38bdf8' : '#e0f2fe',
        alpha: 0.95,
        size: Math.random() > 0.6 ? 2 : 1,
        life: 0,
        maxLife: 12 + Math.floor(Math.random() * 10),
      });
    }
  }
  return sparks;
}

export function renderLightningBolts(
  ctx: CanvasRenderingContext2D,
  bolts: LightningBolt[]
) {
  for (const bolt of bolts) {
    const intensity = bolt.flashIntensity;
    if (intensity <= 0.01) continue;

    ctx.save();
    // Ambient cyan-white glow halo around the entire lightning strike
    ctx.strokeStyle = `rgba(56, 189, 248, ${(0.45 * intensity).toFixed(2)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (const seg of bolt.segments) {
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
    }
    ctx.stroke();

    // Intense pure-white core channel
    ctx.strokeStyle = `rgba(255, 255, 255, ${(0.95 * intensity).toFixed(2)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const seg of bolt.segments) {
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
    }
    ctx.stroke();

    ctx.restore();
  }
}
