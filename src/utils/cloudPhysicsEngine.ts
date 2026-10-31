/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherType, WEATHER_CONFIGS, CustomAtmosphereSettings } from './descentEngine';

export type SpeedMode = 'cinematic' | 'normal' | 'mach';

export interface CloudPhysicsTelemetry {
  weather: WeatherType;
  weatherName: string;
  speedMode: SpeedMode;
  effectiveVelocityScale: number;      // Total multiplier (weather * speedMode * windScale)
  apparentSpeedKmH: number;            // Calibrated relative airspeed in km/h
  effectiveDensityScale: number;       // Total density multiplier (weather * densityScale * machCompression)
  effectiveDensityPercent: number;     // Display percentage (e.g. 145%)
  machCompressionFactor: number;       // Prandtl-Glauert localized condensation factor
  reynoldsTurbulence: number;          // Reynolds fluid turbulence index (0.2 ~ 3.5 Re)
  turbulenceLabel: string;             // Fluid regime description in Korean
  aerodynamicDrag: number;             // Dynamic aerodynamic drag coefficient Cd
  lateralWindVelocity: number;         // Calibrated lateral drift
  downwashRate: number;                // Downwash draft velocity
}

// Calibrated reference flight airspeeds in km/h
export const FLIGHT_SPEED_KMH: Record<SpeedMode, number> = {
  cinematic: 380, // Subsonic loiter
  normal: 850,    // Transonic cruise
  mach: 2650,     // Hypersonic Mach 2.16
};

// Base flight speed multipliers for visual drift
export const FLIGHT_SPEED_MULTIPLIER: Record<SpeedMode, number> = {
  cinematic: 0.55,
  normal: 1.0,
  mach: 2.2,
};

// Localized aerodynamic condensation factor due to dynamic air compression (Prandtl-Glauert effect)
export const MACH_COMPRESSION_FACTORS: Record<SpeedMode, number> = {
  cinematic: 0.94, // Decompressed calm expansion
  normal: 1.0,    // Standard ambient atmospheric pressure
  mach: 1.16,     // +16% localized vapor compression shockwave
};

// Base turbulence index by weather regime
export const WEATHER_TURBULENCE_BASE: Record<WeatherType, number> = {
  clear: 0.35,  // Laminar thermal updrafts
  rain: 2.45,   // Intense convective squalls & shearing gusts
  snow: 0.65,   // Steady crystalline subsidence
  mist: 0.85,   // Smooth boundary layer advection
  aurora: 0.40, // Geomagnetic ion drift
};

/**
 * Computes Prandtl-Glauert aerodynamic Mach compression on cloud moisture.
 */
export function calculateMachCompression(speedMode: SpeedMode): number {
  return MACH_COMPRESSION_FACTORS[speedMode] ?? 1.0;
}

/**
 * Computes the Reynolds fluid turbulence index for cloud formations based on weather,
 * speed mode, and user wind tuning.
 */
export function calculateReynoldsTurbulence(
  weather: WeatherType,
  speedMode: SpeedMode,
  windSpeedScale: number = 1.0
): { index: number; label: string } {
  const base = WEATHER_TURBULENCE_BASE[weather] ?? 0.5;
  const speedWeight = speedMode === 'mach' ? 1.45 : speedMode === 'cinematic' ? 0.72 : 1.0;
  const windWeight = Math.min(2.5, Math.max(0.2, windSpeedScale));

  const index = Math.round(base * speedWeight * (0.6 + windWeight * 0.4) * 100) / 100;

  let label: string;
  if (index < 0.6) {
    label = '안정 층류 (Laminar)';
  } else if (index < 1.1) {
    label = '온화한 대류 (Mild Drift)';
  } else if (index < 2.0) {
    label = '중등도 난류 (Moderate Eddy)';
  } else if (index < 2.8) {
    label = '강한 전단 난류 (High Shear)';
  } else {
    label = '초음속 충격 와류 (Shock Turbulence)';
  }

  return { index, label };
}

/**
 * Computes fully coupled effective cloud drift velocity scale.
 * Combines weather drift, flight speed mode, user wind slider, and optional dragon surge.
 */
export function calculateEffectiveCloudVelocity(
  weather: WeatherType,
  speedMode: SpeedMode,
  windSpeedScale: number = 1.0,
  dragonSurge: number = 1.0
): number {
  const cfg = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.clear;
  const speedMult = FLIGHT_SPEED_MULTIPLIER[speedMode] ?? 1.0;
  const clampedWind = Math.min(3.0, Math.max(0.1, windSpeedScale));
  const clampedSurge = Math.min(4.0, Math.max(1.0, dragonSurge));

  return cfg.cloudSpeedMult * speedMult * clampedWind * clampedSurge;
}

/**
 * Computes fully coupled effective cloud density scale.
 * Couples weather saturation, user cloud density slider, and Mach compression.
 */
export function calculateEffectiveCloudDensity(
  weather: WeatherType,
  cloudDensityScale: number = 1.0,
  speedMode: SpeedMode = 'normal'
): number {
  const cfg = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.clear;
  const machCompression = calculateMachCompression(speedMode);
  const clampedDensity = Math.min(2.5, Math.max(0.2, cloudDensityScale));

  return Math.round(cfg.cloudDensityMod * clampedDensity * machCompression * 1000) / 1000;
}

/**
 * Pure physics telemetry calculation for the Atmosphere Studio UI and canvas engine.
 */
export function calculateCloudPhysicsTelemetry(
  weather: WeatherType,
  speedMode: SpeedMode,
  settings: Pick<CustomAtmosphereSettings, 'cloudDensityScale' | 'windSpeedScale'>,
  dragonSurge: number = 1.0
): CloudPhysicsTelemetry {
  const cfg = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.clear;
  const baseKmh = FLIGHT_SPEED_KMH[speedMode] ?? 850;
  const machCompression = calculateMachCompression(speedMode);

  const effectiveVelocityScale = calculateEffectiveCloudVelocity(
    weather,
    speedMode,
    settings.windSpeedScale,
    dragonSurge
  );

  const effectiveDensityScale = calculateEffectiveCloudDensity(
    weather,
    settings.cloudDensityScale,
    speedMode
  );

  const { index: reynoldsTurbulence, label: turbulenceLabel } = calculateReynoldsTurbulence(
    weather,
    speedMode,
    settings.windSpeedScale
  );

  // Apparent speed in km/h based on base craft velocity scaled by weather and wind
  const apparentSpeedKmH = Math.round(baseKmh * (cfg.cloudSpeedMult * 0.7 + 0.3) * settings.windSpeedScale * dragonSurge);

  // Dynamic aerodynamic drag coefficient Cd based on density and turbulence
  const aerodynamicDrag = Math.round((0.42 + effectiveDensityScale * 0.28 + (reynoldsTurbulence > 1.5 ? 0.25 : 0)) * 100) / 100;

  // Lateral wind drift
  const lateralWindVelocity = Math.round(cfg.windX * settings.windSpeedScale * (FLIGHT_SPEED_MULTIPLIER[speedMode] * 0.5 + 0.5) * 100) / 100;

  // Downwash rate
  const downwashRate = Math.round(effectiveVelocityScale * 0.6 * 100) / 100;

  return {
    weather,
    weatherName: cfg.name,
    speedMode,
    effectiveVelocityScale: Math.round(effectiveVelocityScale * 100) / 100,
    apparentSpeedKmH,
    effectiveDensityScale,
    effectiveDensityPercent: Math.round(effectiveDensityScale * 100),
    machCompressionFactor: machCompression,
    reynoldsTurbulence,
    turbulenceLabel,
    aerodynamicDrag,
    lateralWindVelocity,
    downwashRate,
  };
}
