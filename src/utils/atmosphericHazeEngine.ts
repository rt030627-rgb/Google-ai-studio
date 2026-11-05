/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherType, CustomAtmosphereSettings } from './descentEngine.js';

export interface AtmosphericHazeConfig {
  /** Normalized haze density factor from 0.0 (high vacuum) to 1.0 (thickest ground atmosphere) */
  hazeFactor: number;
  /** Effective simulated altitude in kilometers (140km down to 0.4km) */
  altitudeKm: number;
  /** Subtle pixel softening blur in pixels (0.0px to ~0.75px) */
  blurPx: number;
  /** Contrast ratio in percent (e.g. 100% in space down to 80%~90% in dense fog) */
  contrastPercent: number;
  /** Brightness multiplier in percent (e.g. 100% to ~104% simulating diffuse airlight) */
  brightnessPercent: number;
  /** Color saturation ratio in percent (e.g. 100% down to ~85% in rain/mist) */
  saturationPercent: number;
  /** Primary RGB color tint of the atmospheric veil for current weather */
  veilRgb: [number, number, number];
  /** Formatted RGBA string for canvas gradients */
  veilColorRgba: string;
  /** Overall alpha opacity for the atmospheric veil layer (0.0 to ~0.35) */
  veilAlpha: number;
  /** Horizon concentration multiplier for lower screen haze reservoir */
  horizonAlpha: number;
  /** Ready-to-use CSS filter string for canvas elements */
  cssFilter: string;
}

export const WEATHER_HAZE_PROFILES: Record<
  WeatherType,
  {
    multiplier: number;
    veilRgb: [number, number, number];
    contrastDamp: number;
    saturationDamp: number;
    brightnessLift: number;
  }
> = {
  mist: {
    multiplier: 1.0, // Misty pearlescent vapor (densest fog)
    veilRgb: [186, 212, 226],
    contrastDamp: 0.78,
    saturationDamp: 0.85,
    brightnessLift: 1.04,
  },
  rain: {
    multiplier: 0.82, // Rainy humid slate-blue
    veilRgb: [148, 175, 202],
    contrastDamp: 0.86,
    saturationDamp: 0.88,
    brightnessLift: 1.01,
  },
  snow: {
    multiplier: 0.72, // Frosty crystalline white-blue
    veilRgb: [224, 238, 252],
    contrastDamp: 0.89,
    saturationDamp: 0.92,
    brightnessLift: 1.03,
  },
  aurora: {
    multiplier: 0.56, // Ionized polar aurora luminescence
    veilRgb: [130, 235, 210],
    contrastDamp: 0.95,
    saturationDamp: 1.06,
    brightnessLift: 1.02,
  },
  clear: {
    multiplier: 0.48, // Crisp golden-hour Rayleigh sky scattering
    veilRgb: [180, 215, 245],
    contrastDamp: 0.94,
    saturationDamp: 1.0,
    brightnessLift: 1.01,
  },
};

/**
 * Calculates atmospheric haze parameters dynamically derived from flight cycle progress (altitude),
 * the active weather system, and optional user atmosphere tuning.
 */
export function calculateAtmosphericHaze(
  cycleProgress: number,
  weather: WeatherType,
  atmosphereSettings?: CustomAtmosphereSettings
): AtmosphericHazeConfig {
  // Normalize progress to [0.0, 1.0], treating exact 1.0 as ground touchdown
  let norm = 0.5;
  if (Number.isFinite(cycleProgress)) {
    if (cycleProgress >= 0 && cycleProgress <= 1) {
      norm = cycleProgress;
    } else {
      norm = ((cycleProgress % 1.0) + 1.0) % 1.0;
    }
  }

  // Physical non-linear altitude descent curve: 138.4km (exosphere) down to 0.4km (surface)
  const baseAlt = 138.0 * Math.pow(1.0 - norm, 1.15) + 0.4;
  const altitudeKm = Math.max(0.2, Math.min(140.0, Math.round(baseAlt * 10) / 10));

  // Atmospheric barometric density increases exponentially as altitude drops:
  // At >85km (thermosphere): near 0 density (pure vacuum clarity)
  // At 50-85km (mesosphere): 0.05 ~ 0.15
  // At 15-50km (stratosphere): 0.15 ~ 0.45
  // At 3-15km (troposphere): 0.45 ~ 0.85
  // At 0-3km (surface): 0.85 ~ 1.0
  const altitudeFactor = Math.pow(norm, 1.55);

  const profile = WEATHER_HAZE_PROFILES[weather] || WEATHER_HAZE_PROFILES.clear;
  const densitySetting = atmosphereSettings?.cloudDensityScale ?? 1.0;
  const densityMultiplier = Math.max(0.5, Math.min(2.0, densitySetting));

  // Compute composite haze factor: clamped to [0.0, 1.0]
  const rawHaze = altitudeFactor * profile.multiplier * densityMultiplier;
  const hazeFactor = Math.min(1.0, Math.max(0.0, rawHaze));

  // Calculate subtle optical parameters
  // Maximum blur is capped at 0.75px to maintain pixel art crispness
  const blurPx = Math.round(hazeFactor * 0.75 * 100) / 100;

  // Contrast drops gently as haze thickens (e.g. 100% -> 80%~92%)
  const contrastPercent = Math.round((1.0 - hazeFactor * (1.0 - profile.contrastDamp)) * 100);

  // Brightness lifts slightly in dense haze to simulate ambient airlight diffusion
  const brightnessPercent = Math.round((1.0 + hazeFactor * (profile.brightnessLift - 1.0)) * 100);

  // Saturation dampens slightly in rain/mist
  const saturationPercent = Math.round((1.0 - hazeFactor * (1.0 - profile.saturationDamp)) * 100);

  // Veil alpha on canvas: 0.0 in deep space up to ~0.26 at ground level (higher in mist)
  const maxVeilAlpha = weather === 'mist' ? 0.32 : weather === 'rain' ? 0.24 : 0.18;
  const veilAlpha = Math.round(hazeFactor * maxVeilAlpha * 1000) / 1000;
  const horizonAlpha = Math.round(Math.min(0.42, veilAlpha * 1.5) * 1000) / 1000;

  const veilRgb = profile.veilRgb;
  const veilColorRgba = `rgba(${veilRgb[0]}, ${veilRgb[1]}, ${veilRgb[2]}, ${veilAlpha})`;

  // Build clean CSS filter string (e.g. "contrast(93%) brightness(102%) saturate(94%) blur(0.35px)")
  const filters: string[] = [];
  if (contrastPercent !== 100) filters.push(`contrast(${contrastPercent}%)`);
  if (brightnessPercent !== 100) filters.push(`brightness(${brightnessPercent}%)`);
  if (saturationPercent !== 100) filters.push(`saturate(${saturationPercent}%)`);
  if (blurPx > 0.05) filters.push(`blur(${blurPx}px)`);
  const cssFilter = filters.length > 0 ? filters.join(' ') : 'none';

  return {
    hazeFactor,
    altitudeKm,
    blurPx,
    contrastPercent,
    brightnessPercent,
    saturationPercent,
    veilRgb,
    veilColorRgba,
    veilAlpha,
    horizonAlpha,
    cssFilter,
  };
}

/**
 * Renders an in-canvas physical atmospheric haze veil and volumetric horizon scattering.
 * Executed directly within the 2D pixel rasterizer loop to blend seamlessly with star trails and clouds.
 */
export function renderAtmosphericHazeCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: AtmosphericHazeConfig,
  tick: number = 0
): void {
  // If in high-vacuum exosphere with negligible haze, skip to conserve draw cycles
  if (config.veilAlpha < 0.005) return;

  ctx.save();

  const [r, g, b] = config.veilRgb;
  const hazeStart = height * Math.max(0.1, 1.0 - config.hazeFactor * 0.85);

  // 1. Vertical atmospheric depth gradient (diffusing from troposphere down to surface)
  const grad = ctx.createLinearGradient(0, hazeStart, 0, height);
  grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ', 0)');
  grad.addColorStop(0.5, 'rgba(' + r + ',' + g + ',' + b + ', ' + (config.veilAlpha * 0.45).toFixed(3) + ')');
  grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ', ' + config.horizonAlpha.toFixed(3) + ')');

  ctx.fillStyle = grad;
  ctx.fillRect(0, hazeStart, width, height - hazeStart);

  // 2. Subtle horizontal vapor drift bands across horizon during dense low-altitude flight
  if (config.hazeFactor > 0.4) {
    const waveY = height - 28 + Math.sin(tick * 0.04) * 4;
    const waveAlpha = (config.veilAlpha * 0.35 * Math.min(1.0, (config.hazeFactor - 0.4) * 2)).toFixed(3);
    const bandGrad = ctx.createLinearGradient(0, waveY - 12, 0, height);
    bandGrad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ', 0)');
    bandGrad.addColorStop(0.5, 'rgba(' + r + ',' + g + ',' + b + ', ' + waveAlpha + ')');
    bandGrad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ', 0)');

    ctx.fillStyle = bandGrad;
    ctx.fillRect(0, waveY - 12, width, 32);
  }

  ctx.restore();
}
