/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DragonAudioCrossfadeMetrics {
  /** Normalized proximity to canvas center: 0.0 (far/offscreen) to 1.0 (dead center) */
  proximity: number;
  /** Stereo panning coordinate: -1.0 (left) to 1.0 (right) */
  pan: number;
  /** Target synthesis volume based on proximity and volume scale */
  volume: number;
  /** Acoustic lowpass filter cutoff in Hz (opens up towards center) */
  filterCutoffHz: number;
  /** Throat overtone harmonic resonance factor (0.0 to 1.0) */
  resonance: number;
}

/**
 * Calculates normalized proximity (0.0 to 1.0) of the dragon to the canvas center.
 * Uses a C1-continuous cosine easing function so the volume ramps up smoothly as the dragon
 * approaches the center and fades out gently as it flies away, with zero-derivative boundaries.
 *
 * @param dragonX - Horizontal pixel coordinate of dragon midpoint or head
 * @param width - Canvas width in pixels
 * @param maxAudibleDist - Maximum distance from center where roar can be heard (default: width * 0.8)
 */
export function calculateDragonProximity(
  dragonX: number,
  width: number,
  maxAudibleDist?: number
): number {
  if (width <= 0) return 0;
  const centerX = width * 0.5;
  const maxDist = Math.max(1, maxAudibleDist ?? width * 0.8);
  const dist = Math.abs(dragonX - centerX);

  if (dist >= maxDist) {
    return 0;
  }

  const normalized = dist / maxDist; // 0.0 at center, 1.0 at maxDist
  // Cosine easing: smoothly interpolates from 1.0 (at normalized=0) to 0.0 (at normalized=1)
  // Derivative is 0 at both ends (no clicks or sudden gain jumps)
  return 0.5 * (1 + Math.cos(normalized * Math.PI));
}

/**
 * Calculates stereo panning coordinate (-1.0 to 1.0) based on dragon position.
 *
 * @param dragonX - Horizontal pixel coordinate of dragon
 * @param width - Canvas width in pixels
 */
export function calculateDragonPan(dragonX: number, width: number): number {
  if (width <= 0) return 0;
  const centerX = width * 0.5;
  const halfWidth = width * 0.5;
  const pan = (dragonX - centerX) / halfWidth;
  return Math.max(-1.0, Math.min(1.0, pan));
}

/**
 * Computes complete dynamic audio cross-fade metrics for the celestial dragon encounter.
 *
 * @param dragonX - Horizontal pixel coordinate
 * @param dragonY - Vertical pixel coordinate
 * @param width - Canvas width
 * @param height - Canvas height
 * @param volumeScale - User master volume scale multiplier (default 1.0)
 * @param maxAudibleDist - Optional custom audible radius
 */
export function calculateDragonAudioCrossfade(
  dragonX: number,
  dragonY: number,
  width: number,
  height: number,
  volumeScale: number = 1.0,
  maxAudibleDist?: number
): DragonAudioCrossfadeMetrics {
  const proximity = calculateDragonProximity(dragonX, width, maxAudibleDist);
  const pan = calculateDragonPan(dragonX, width);

  // Optional slight vertical modulation: dragon closer to horizon/center of altitude resonates more
  let verticalMod = 1.0;
  if (height > 0) {
    const centerY = height * 0.45; // Dragons fly across upper-mid altitude
    const dy = Math.abs(dragonY - centerY);
    const normY = Math.min(1.0, dy / (height * 0.5));
    verticalMod = 0.88 + 0.12 * (1.0 - normY);
  }

  const effectiveProximity = Math.max(0, Math.min(1.0, proximity * verticalMod));

  // Base roar master volume ceiling: 0.15 scaled by volumeScale
  const baseVolume = 0.15 * Math.max(0, volumeScale);
  // Quadratic volume curve gives a punchier cinematic crescendo at closest proximity
  const volume = Math.max(0.0001, baseVolume * (effectiveProximity * effectiveProximity));

  // Dynamic filter cutoff: muffled rumble (120Hz) when far, clarion roar (440Hz) at center
  const filterCutoffHz = Math.round(120 + effectiveProximity * 320);

  // Resonance increases near center for visceral throat rumble
  const resonance = 0.2 + effectiveProximity * 0.8;

  return {
    proximity: effectiveProximity,
    pan,
    volume,
    filterCutoffHz,
    resonance,
  };
}
