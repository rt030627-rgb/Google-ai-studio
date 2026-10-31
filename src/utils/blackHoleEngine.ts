/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BlackHoleSingularity {
  id: number;
  x: number;
  y: number;
  radius: number; // Event horizon radius in pixels (e.g. 18-24)
  spinAngle: number;
  spinSpeed: number;
  accretionDiskRadius: number; // e.g. 55-75
  intensity: number; // 0 to 1 fade-in / fade-out
  life: number;
  maxLife: number;
  gravityStrength: number;
}

export function createBlackHole(
  width: number,
  height: number,
  overrides?: Partial<BlackHoleSingularity>
): BlackHoleSingularity {
  return {
    id: Date.now(),
    x: width * 0.5,
    y: height * 0.32,
    radius: 20,
    spinAngle: 0,
    spinSpeed: 0.045,
    accretionDiskRadius: 64,
    intensity: 0,
    life: 0,
    maxLife: 1600, // ~26 seconds lifetime
    gravityStrength: 1.8,
    ...overrides,
  };
}

export function updateBlackHole(
  hole: BlackHoleSingularity,
  speedMult: number = 1.0
): { isAlive: boolean; pullForce: { fx: number; fy: number } } {
  hole.life++;
  hole.spinAngle = (hole.spinAngle + hole.spinSpeed * speedMult) % (Math.PI * 2);

  // Smooth fade-in (first 80 frames) and fade-out (last 120 frames)
  if (hole.life < 80) {
    hole.intensity = Math.min(1.0, hole.life / 80);
  } else if (hole.life > hole.maxLife - 120) {
    hole.intensity = Math.max(0, (hole.maxLife - hole.life) / 120);
  } else {
    hole.intensity = 1.0;
  }

  const isAlive = hole.life < hole.maxLife && hole.intensity > 0.01;
  return { isAlive, pullForce: { fx: 0, fy: 0 } };
}

/**
 * Calculate gravitational pull vector on an arbitrary point (e.g., star or particle)
 */
export function calculateGravitationalPull(
  hole: BlackHoleSingularity,
  targetX: number,
  targetY: number,
  maxDistance: number = 180
): { pullX: number; pullY: number; distance: number; inHorizon: boolean } {
  const dx = hole.x - targetX;
  const dy = hole.y - targetY;
  const dist = Math.hypot(dx, dy);

  if (dist < 1 || dist > maxDistance || hole.intensity <= 0.05) {
    return { pullX: 0, pullY: 0, distance: dist, inHorizon: dist < hole.radius };
  }

  // Inverse-linear falloff bounded to prevent infinite acceleration
  const normalizedForce = (1 - dist / maxDistance) * hole.gravityStrength * hole.intensity;
  const nx = dx / dist;
  const ny = dy / dist;

  return {
    pullX: nx * normalizedForce,
    pullY: ny * normalizedForce,
    distance: dist,
    inHorizon: dist <= hole.radius,
  };
}

/**
 * Render the Black Hole singularity with relativistic accretion disk, photon ring, and gravitational lensing glow
 */
export function renderBlackHole(
  ctx: CanvasRenderingContext2D,
  hole: BlackHoleSingularity,
  tick: number
) {
  if (hole.intensity <= 0.02) return;

  ctx.save();
  ctx.translate(hole.x, hole.y);

  const alpha = hole.intensity;

  // 1. Outer Gravitational Lensing Halo (Space-warping distortion aura)
  const lensGrad = ctx.createRadialGradient(0, 0, hole.radius, 0, 0, hole.accretionDiskRadius * 1.55);
  lensGrad.addColorStop(0, `rgba(15, 23, 42, ${0.95 * alpha})`);
  lensGrad.addColorStop(0.35, `rgba(56, 189, 248, ${0.35 * alpha})`);
  lensGrad.addColorStop(0.70, `rgba(236, 72, 153, ${0.18 * alpha})`);
  lensGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = lensGrad;
  ctx.beginPath();
  ctx.arc(0, 0, hole.accretionDiskRadius * 1.55, 0, Math.PI * 2);
  ctx.fill();

  // 2. Relativistic Rotating Accretion Disk (Tilted ellipse with Doppler effect)
  ctx.save();
  ctx.rotate(0.25); // Tilt angle of the accretion disk plane

  const numDiskSpokes = 36;
  const rInner = hole.radius * 1.25;
  const rOuter = hole.accretionDiskRadius;

  for (let s = 0; s < numDiskSpokes; s++) {
    const angle = (s / numDiskSpokes) * Math.PI * 2 + hole.spinAngle;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Doppler shift: Approaching side (left, cosA < 0) is blueshifted & brighter; receding is redshifted
    const dopplerFactor = -cosA; // -1 to +1
    let spokeColor: string;
    let spokeAlpha = (0.55 + dopplerFactor * 0.35) * alpha;

    if (dopplerFactor > 0.2) {
      spokeColor = '#38bdf8'; // Hot Cyan (Blueshifted)
    } else if (dopplerFactor > -0.2) {
      spokeColor = '#fbbf24'; // Radiant Golden Amber
    } else {
      spokeColor = '#ec4899'; // Crimson Pink (Redshifted)
    }

    const x1 = cosA * rInner;
    const y1 = sinA * (rInner * 0.38); // Flattened elliptical projection
    const x2 = cosA * rOuter;
    const y2 = sinA * (rOuter * 0.38);

    ctx.strokeStyle = spokeColor;
    ctx.globalAlpha = Math.max(0.1, Math.min(1.0, spokeAlpha));
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Photon Sphere Ring (Intense luminous white photon orbit boundary)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.0;
  ctx.globalAlpha = 0.9 * alpha;
  ctx.beginPath();
  ctx.arc(0, 0, hole.radius * 1.15, 0, Math.PI * 2);
  ctx.stroke();

  // Sub-pixel shimmering photon flares
  ctx.fillStyle = '#bae6fd';
  for (let pf = 0; pf < 6; pf++) {
    const pfa = tick * 0.08 + (pf * Math.PI) / 3;
    const px = Math.cos(pfa) * (hole.radius * 1.15);
    const py = Math.sin(pfa) * (hole.radius * 1.15);
    ctx.fillRect(Math.floor(px) - 1, Math.floor(py) - 1, 2, 2);
  }

  // 4. Absolute Event Horizon (Pure Black Singularity Void)
  ctx.fillStyle = '#000000';
  ctx.globalAlpha = 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, hole.radius, 0, Math.PI * 2);
  ctx.fill();

  // 5. Polar Relativistic Plasma Jet Beams (Perpendicular emission flares)
  const jetLength = 55 + Math.sin(tick * 0.2) * 8;
  const jetAlpha = 0.45 * alpha;
  const jetGradTop = ctx.createLinearGradient(0, 0, 0, -jetLength);
  jetGradTop.addColorStop(0, `rgba(56, 189, 248, ${jetAlpha})`);
  jetGradTop.addColorStop(0.5, `rgba(168, 85, 247, ${jetAlpha * 0.6})`);
  jetGradTop.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = jetGradTop;
  ctx.beginPath();
  ctx.moveTo(-3, -hole.radius * 0.6);
  ctx.lineTo(3, -hole.radius * 0.6);
  ctx.lineTo(1, -jetLength);
  ctx.lineTo(-1, -jetLength);
  ctx.closePath();
  ctx.fill();

  const jetGradBottom = ctx.createLinearGradient(0, 0, 0, jetLength);
  jetGradBottom.addColorStop(0, `rgba(56, 189, 248, ${jetAlpha})`);
  jetGradBottom.addColorStop(0.5, `rgba(168, 85, 247, ${jetAlpha * 0.6})`);
  jetGradBottom.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = jetGradBottom;
  ctx.beginPath();
  ctx.moveTo(-3, hole.radius * 0.6);
  ctx.lineTo(3, hole.radius * 0.6);
  ctx.lineTo(1, jetLength);
  ctx.lineTo(-1, jetLength);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
