/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AtmosphericLayerId = 'thermosphere' | 'mesosphere' | 'stratosphere' | 'troposphere' | 'planetary_surface';

export interface AtmosphericLayerInfo {
  id: AtmosphericLayerId;
  name: string;
  shortTag: string;
  minAltKm: number;
  maxAltKm: number;
  color: string;
  accentHex: string;
  description: string;
  keyPhenomena: string;
}

export const ATMOSPHERIC_LAYERS: AtmosphericLayerInfo[] = [
  {
    id: 'thermosphere',
    name: 'Thermosphere (Upper Ionosphere)',
    shortTag: 'THERMO',
    minAltKm: 85,
    maxAltKm: 140,
    color: '#818cf8',
    accentHex: '#a855f7',
    description: 'Rarefied plasma sheath with high-energy cosmic radiation and aurora curtains',
    keyPhenomena: 'Auroral Ionization & Deep Space Silence',
  },
  {
    id: 'mesosphere',
    name: 'Mesosphere (Meteoric Boundary)',
    shortTag: 'MESO',
    minAltKm: 50,
    maxAltKm: 85,
    color: '#38bdf8',
    accentHex: '#0ea5e9',
    description: 'Sub-zero layer where celestial meteors ignite and leave burning stardust trails',
    keyPhenomena: 'Meteor Ablation & Noctilucent Bands',
  },
  {
    id: 'stratosphere',
    name: 'Stratosphere (Ozone Glider)',
    shortTag: 'STRATO',
    minAltKm: 15,
    maxAltKm: 50,
    color: '#34d399',
    accentHex: '#10b981',
    description: 'Ultra-stable laminar flight corridor with expansive curvature horizon views',
    keyPhenomena: 'Supersonic Gliding & Ozone Shielding',
  },
  {
    id: 'troposphere',
    name: 'Troposphere (Cloud Weather Decks)',
    shortTag: 'TROPO',
    minAltKm: 3,
    maxAltKm: 15,
    color: '#fbbf24',
    accentHex: '#f59e0b',
    description: 'Dense turbulent cloud formations, heavy squalls, snowfall, and mountain drafts',
    keyPhenomena: 'Precipitation Systems & Volumetric Vapor',
  },
  {
    id: 'planetary_surface',
    name: 'Planetary Horizon (Coast & Ridges)',
    shortTag: 'SURFACE',
    minAltKm: 0,
    maxAltKm: 3,
    color: '#f43f5e',
    accentHex: '#ec4899',
    description: 'Emerald continents, midnight city light constellations, and coastal tides',
    keyPhenomena: 'Touchdown Vector & Biome Illumination',
  },
];

export interface AltitudeTelemetryData {
  altitudeKm: number;
  currentLayer: AtmosphericLayerInfo;
  layerIndex: number;
  layerProgress: number; // 0.0 ~ 1.0 within current layer
  totalProgress: number; // 0.0 ~ 1.0 from 140km down to 0km
  pressureHpa: number;
  temperatureC: number;
  speedKmh: number;
  machNumber: number;
  plasmaFrictionIntensity: number; // 0.0 ~ 1.0
  isLayerTransition: boolean;
  transitionMessage?: string;
}

/**
 * Calculates real-time telemetry based on diurnal progress, flight speed mode, and dragon surge
 */
export function calculateAltitudeTelemetry(
  cycleProgress: number,
  speedMode: 'cinematic' | 'normal' | 'mach',
  isDragonActive: boolean = false,
  tick: number = 0
): AltitudeTelemetryData {
  // Normalize progress to [0.0, 1.0]
  const norm = ((cycleProgress % 1.0) + 1.0) % 1.0;

  // Altitude descends through a smooth non-linear curve from 138.0 km down to 0.4 km
  // High altitude has longer hang time, lower atmosphere speeds up slightly
  const baseAlt = 138.0 * Math.pow(1.0 - norm, 1.15) + 0.4;
  const altitudeKm = Math.max(0.2, Math.min(140.0, Math.round(baseAlt * 10) / 10));

  // Determine current atmospheric layer
  let layerIndex = 0;
  for (let i = 0; i < ATMOSPHERIC_LAYERS.length; i++) {
    const l = ATMOSPHERIC_LAYERS[i];
    if (altitudeKm >= l.minAltKm && altitudeKm <= l.maxAltKm) {
      layerIndex = i;
      break;
    }
  }
  const currentLayer = ATMOSPHERIC_LAYERS[layerIndex] || ATMOSPHERIC_LAYERS[ATMOSPHERIC_LAYERS.length - 1];

  // Layer progress (1.0 at layer top down to 0.0 at layer bottom)
  const layerSpan = Math.max(0.1, currentLayer.maxAltKm - currentLayer.minAltKm);
  const layerProgress = Math.max(0, Math.min(1, (altitudeKm - currentLayer.minAltKm) / layerSpan));
  const totalProgress = Math.max(0, Math.min(1, 1.0 - (altitudeKm / 140.0)));

  // Barometric pressure calculation (exponential decay with scale height ~7.4 km)
  // At sea level: ~1013.25 hPa, at 80km: ~0.01 hPa
  const pressureHpa = Math.max(
    0.01,
    Math.round(1013.25 * Math.exp(-altitudeKm / 7.4) * 100) / 100
  );

  // Approximate temperature profile across atmospheric layers (Standard Atmosphere model)
  let temperatureC = -15;
  if (altitudeKm > 85) {
    // Thermosphere warms up due to solar absorption
    temperatureC = Math.round(-85 + (altitudeKm - 85) * 4.2);
  } else if (altitudeKm > 50) {
    // Mesosphere drops to freezing minimum
    temperatureC = Math.round(-2.5 - (altitudeKm - 50) * 2.35);
  } else if (altitudeKm > 15) {
    // Stratosphere warms up due to ozone UV absorption
    temperatureC = Math.round(-56 + (altitudeKm - 15) * 1.5);
  } else {
    // Troposphere warms up towards Earth surface
    temperatureC = Math.round(15 - (altitudeKm * 4.7));
  }

  // Speed calculation based on speedMode and Dragon flyby shockwaves
  let baseSpeedKmh = 1420; // Supersonic base
  if (speedMode === 'cinematic') baseSpeedKmh = 720;
  if (speedMode === 'mach') baseSpeedKmh = 3850;

  if (isDragonActive) {
    baseSpeedKmh *= 2.75; // Dragon atmospheric wake surge
  }

  // Micro jitter variations in speed
  const speedJitter = Math.sin(tick * 0.1) * 12 + Math.cos(tick * 0.05) * 6;
  const speedKmh = Math.max(200, Math.round(baseSpeedKmh + speedJitter));
  const speedOfSound = 1225; // km/h at standard atmosphere
  const machNumber = Math.round((speedKmh / speedOfSound) * 100) / 100;

  // Re-entry plasma friction intensity: peaks during high Mach and when piercing dense layers
  let plasmaFriction = 0.0;
  if (machNumber > 2.0) {
    plasmaFriction += (machNumber - 2.0) * 0.18;
  }
  if (isDragonActive) {
    plasmaFriction += 0.45;
  }
  // Transition compression heating at ~50km and ~15km
  const nearBoundary = Math.abs(altitudeKm - 50) < 3 || Math.abs(altitudeKm - 15) < 2;
  if (nearBoundary) {
    plasmaFriction += 0.25;
  }
  const plasmaFrictionIntensity = Math.max(0, Math.min(1, Math.round(plasmaFriction * 100) / 100));

  // Check if actively crossing a layer threshold (within 1.5 km of boundary)
  let isLayerTransition = false;
  let transitionMessage: string | undefined = undefined;

  for (let b = 1; b < ATMOSPHERIC_LAYERS.length; b++) {
    const boundaryAlt = ATMOSPHERIC_LAYERS[b].maxAltKm;
    if (Math.abs(altitudeKm - boundaryAlt) <= 1.2) {
      isLayerTransition = true;
      transitionMessage = `TRANSITIONING // ENTERING ${ATMOSPHERIC_LAYERS[b].shortTag}`;
      break;
    }
  }

  return {
    altitudeKm,
    currentLayer,
    layerIndex,
    layerProgress,
    totalProgress,
    pressureHpa,
    temperatureC,
    speedKmh,
    machNumber,
    plasmaFrictionIntensity,
    isLayerTransition,
    transitionMessage,
  };
}

/**
 * Formats altitude with unit string
 */
export function formatAltitudeDisplay(altitudeKm: number): string {
  if (altitudeKm >= 100) {
    return `${altitudeKm.toFixed(0)} KM`;
  }
  return `${altitudeKm.toFixed(1)} KM`;
}

/**
 * Formats Mach number
 */
export function formatMachDisplay(mach: number): string {
  return `M ${mach.toFixed(2)}`;
}

/**
 * Generates an aesthetic retro sci-fi watermark banner string
 */
export function generateWatermarkText(
  altitudeKm: number,
  phaseName: string = 'DESCENT',
  weatherName: string = 'CLEAR'
): string {
  const altStr = formatAltitudeDisplay(altitudeKm);
  const cleanPhase = phaseName.replace(/\(.*?\)/g, '').trim().toUpperCase();
  const cleanWeather = weatherName.replace(/\(.*?\)/g, '').trim().toUpperCase();
  return `✦ GOOGLE GEMINI DESCENT // ALT ${altStr} // ${cleanPhase} · ${cleanWeather} // 16-BIT RASTERIZER`;
}

/**
 * Calculates 8 normalized frequency equalizer bands (0.0 ~ 1.0)
 * Simulates a hardware LED spectrum display reacting dynamically to sound states
 */
export function calculateLedEqualizerBands(
  isPlaying: boolean,
  tick: number,
  isDragonActive: boolean = false,
  isMeteorActive: boolean = false,
  windScale: number = 1.0
): number[] {
  if (!isPlaying) {
    return [0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08]; // Resting idle baseline
  }

  const bands: number[] = [];
  const normalizedWind = Math.max(0.2, Math.min(2.5, windScale));

  for (let i = 0; i < 8; i++) {
    // Fundamental frequencies: lower bands are sub-bass & drone, higher bands are chimes & wind sizzle
    const speed = 0.08 + i * 0.035;
    const phaseOffset = i * 0.85;

    let amp =
      0.35 * Math.sin(tick * speed + phaseOffset) +
      0.25 * Math.cos(tick * (speed * 0.7) + i * 1.2) +
      0.35;

    // Scale with wind parameter
    amp *= 0.65 + normalizedWind * 0.35;

    // Sub-bass boost for lower bands (bands 0, 1, 2)
    if (i <= 2) {
      amp += 0.15 * Math.sin(tick * 0.04);
    }

    // Dragon roar massively boosts sub-bass and mid frequencies (bands 0-4)
    if (isDragonActive) {
      if (i <= 3) amp = Math.min(1.0, amp + 0.48);
      else amp = Math.min(1.0, amp + 0.28);
    }

    // Meteor shower boosts high crystalline bands (bands 5-7)
    if (isMeteorActive && i >= 5) {
      amp = Math.min(1.0, amp + 0.38 + 0.15 * Math.sin(tick * 0.35 + i));
    }

    // Clamp strictly within [0.05, 1.0]
    bands.push(Math.max(0.06, Math.min(1.0, Math.round(amp * 100) / 100)));
  }

  return bands;
}
