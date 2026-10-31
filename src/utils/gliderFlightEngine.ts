/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GliderKeyInputs {
  left?: boolean;
  right?: boolean;
  up?: boolean;
  down?: boolean;
  boost?: boolean;
}

export interface GliderFlightState {
  offsetX: number;       // Displacement relative to base center (-140 ~ +140)
  offsetY: number;       // Displacement relative to base center (-70 ~ +80)
  vx: number;
  vy: number;
  bankAngle: number;     // Constellation roll/tilt in radians (-0.35 ~ +0.35)
  thrusterBoost: number; // 0.0 to 1.0
  isManualActive: boolean;
}

export interface ThrusterPlumeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export function createInitialGliderState(): GliderFlightState {
  return {
    offsetX: 0,
    offsetY: 0,
    vx: 0,
    vy: 0,
    bankAngle: 0,
    thrusterBoost: 0,
    isManualActive: false,
  };
}

/**
 * Updates manual flight physics: banking tilt, inertia, spring centering, and boundary clamping
 */
export function updateGliderFlight(
  state: GliderFlightState,
  inputs: GliderKeyInputs,
  boundsOrSpeedMult: { minX: number; maxX: number; minY: number; maxY: number } | number = { minX: -130, maxX: 130, minY: -65, maxY: 75 },
  speedMult: number = 1.0
): GliderFlightState {
  const bounds = typeof boundsOrSpeedMult === 'object' && boundsOrSpeedMult !== null
    ? boundsOrSpeedMult
    : { minX: -130, maxX: 130, minY: -65, maxY: 75 };
  const effectiveSpeedMult = typeof boundsOrSpeedMult === 'number' ? boundsOrSpeedMult : speedMult;

  const next = { ...state };

  // Acceleration inputs
  const accel = 0.55 * effectiveSpeedMult;
  let inputAx = 0;
  let inputAy = 0;

  if (inputs.left) inputAx -= accel;
  if (inputs.right) inputAx += accel;
  if (inputs.up) inputAy -= accel;
  if (inputs.down) inputAy += accel;

  // Determine if user is currently steering
  const isInputActive = inputs.left || inputs.right || inputs.up || inputs.down || inputs.boost;

  if (isInputActive) {
    next.isManualActive = true;
    next.vx += inputAx;
    next.vy += inputAy;

    // Target banking tilt roll into turns
    const targetBank = inputs.left ? -0.28 : inputs.right ? 0.28 : 0;
    next.bankAngle += (targetBank - next.bankAngle) * 0.12 * speedMult;

    // Thruster boost
    const targetThruster = inputs.up || inputs.boost ? 1.0 : isInputActive ? 0.45 : 0.0;
    next.thrusterBoost += (targetThruster - next.thrusterBoost) * 0.18;
  } else {
    // Smooth aerodynamic drag & gentle spring return towards center
    next.vx *= 0.91;
    next.vy *= 0.91;

    // Ease bank angle back to level
    next.bankAngle *= 0.90;
    next.thrusterBoost *= 0.85;

    // If completely idle for a while, slowly settle back towards origin
    next.offsetX += (0 - next.offsetX) * 0.035 * speedMult;
    next.offsetY += (0 - next.offsetY) * 0.035 * speedMult;

    if (Math.abs(next.offsetX) < 0.2 && Math.abs(next.offsetY) < 0.2 && Math.abs(next.vx) < 0.05) {
      next.offsetX = 0;
      next.offsetY = 0;
      next.vx = 0;
      next.vy = 0;
      next.bankAngle = 0;
      next.isManualActive = false;
    }
  }

  // Speed limits
  const maxVel = (inputs.boost ? 5.2 : 3.4) * speedMult;
  next.vx = Math.max(-maxVel, Math.min(maxVel, next.vx));
  next.vy = Math.max(-maxVel, Math.min(maxVel, next.vy));

  // Integrate positions
  next.offsetX += next.vx;
  next.offsetY += next.vy;

  // Clamping to flight corridor
  if (next.offsetX < bounds.minX) {
    next.offsetX = bounds.minX;
    next.vx = 0;
  } else if (next.offsetX > bounds.maxX) {
    next.offsetX = bounds.maxX;
    next.vx = 0;
  }

  if (next.offsetY < bounds.minY) {
    next.offsetY = bounds.minY;
    next.vy = 0;
  } else if (next.offsetY > bounds.maxY) {
    next.offsetY = bounds.maxY;
    next.vy = 0;
  }

  return next;
}

/**
 * Generates thruster plasma exhaust plumes behind the constellation
 */
export function generateThrusterPlume(
  starCenterX: number,
  starCenterY: number,
  thrusterBoost: number,
  bankAngle: number
): ThrusterPlumeParticle[] {
  if (thrusterBoost <= 0.05) return [];

  const count = Math.max(1, Math.floor(thrusterBoost * 4));
  const particles: ThrusterPlumeParticle[] = [];
  const palette = ['#38bdf8', '#818cf8', '#ffffff', '#67e8f9'];

  for (let i = 0; i < count; i++) {
    // Exhaust emanates from bottom arm of the Gemini diamond
    const spread = (Math.random() - 0.5) * 8;
    const baseExhaustY = starCenterY + 22;
    const baseExhaustX = starCenterX + spread;

    // Velocity downwards with lateral banking deflection
    const vy = 2.2 + Math.random() * 3.5 * thrusterBoost;
    const vx = -Math.sin(bankAngle) * 2.0 + (Math.random() - 0.5) * 1.2;

    particles.push({
      x: baseExhaustX,
      y: baseExhaustY,
      vx,
      vy,
      size: Math.random() > 0.4 ? 2 : 1,
      color: palette[Math.floor(Math.random() * palette.length)],
      alpha: 0.65 + Math.random() * 0.35,
    });
  }

  return particles;
}
