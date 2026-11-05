/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherType } from './descentEngine';

export interface CloudShadowBlob {
  ox: number;
  oy: number;
  r: number;
}

export interface CloudShadowSource {
  x: number;
  y: number;
  speed: number;
  blobs: CloudShadowBlob[];
  layer: 'bg' | 'mid' | 'fg';
  alpha: number;
}

export interface WindVector {
  windX: number;       // Lateral wind velocity (-3.0 ~ +3.0)
  windSpeed: number;   // Vertical / airflow speed magnitude (0.2 ~ 5.0)
  gustTurbulence?: number;
}

export interface CloudShadowDriftOffset {
  driftX: number;        // Smooth lateral gliding displacement
  driftY: number;        // Gentle vertical terrain slope undulation
  shearAngle: number;    // Wind shear distortion angle in radians
  trailStretch: number;  // Aerodynamic footprint stretch factor along wind axis
}

export interface DynamicShadowModulation {
  opacityMod: number;         // Dynamic multiplier for shadow opacity (0.85 ~ 1.18)
  densityMod: number;         // Dynamic density/footprint scaling factor (0.92 ~ 1.12)
  colorDepthMod: number;      // Depth/darkness scaling factor (higher = deeper obsidian core)
  dynamicShadowColor: string; // Real-time computed RGBA shadow color
  breathingPhase: number;     // Normalized harmonic oscillation (-1.0 ~ 1.0)
  eddyTurbulence: number;     // High-frequency convective eddy component
}

export interface CloudShadowOpticalConfig {
  altitudeKm: number;
  shadowAlpha: number;       // 0.05 ~ 0.58 (darker at low altitude, dynamically modulated)
  sharpness: number;         // 0.3 ~ 1.0 (sharper, less penumbra at low altitude)
  scaleMultiplier: number;   // shadow footprint expansion/contraction
  offsetX: number;           // Sun directional lateral offset (pixels)
  offsetY: number;           // Vertical ground projection offset (pixels)
  shadowColor: string;       // Color tint tailored to weather & real-time modulated color depth
  weatherContrastFactor: number;
  // Wind drift animation properties
  windVector: WindVector;
  driftX: number;
  driftY: number;
  shearAngle: number;
  trailStretch: number;
  // Gaussian blur soft shadow filter radius
  gaussianBlurRadius: number;
  // Dynamic opacity & color depth modulation
  dynamicModulation: DynamicShadowModulation;
}

/**
 * Calculates continuous wind drift animation displacement, terrain undulation,
 * and aerodynamic wind-shear stretch.
 */
export function calculateCloudShadowDrift(
  windVector: WindVector = { windX: 0.25, windSpeed: 1.0 },
  tick: number = 0,
  cloudLayer: 'bg' | 'mid' | 'fg' = 'mid'
): CloudShadowDriftOffset {
  const safeWindX = Number.isFinite(windVector.windX) ? windVector.windX : 0.25;
  const safeWindSpeed = Number.isFinite(windVector.windSpeed) ? Math.max(0.1, windVector.windSpeed) : 1.0;
  
  // Layer parallax multiplier: Foreground clouds drift faster than distant background layers
  const layerMult = cloudLayer === 'fg' ? 1.4 : cloudLayer === 'mid' ? 1.0 : 0.65;

  // Continuous gliding cycle: smooth undulating wave driven by wind velocity
  const glideFrequency = 0.024 * (safeWindSpeed * 0.7 + 0.3);
  const waveCycle = Math.sin(tick * glideFrequency);
  const secondaryWave = Math.cos(tick * glideFrequency * 0.65);

  // Directional drift: proportional to wind direction (sign) and magnitude
  // Shadows lead/lag slightly as wind gusts across the terrain surface
  const windSign = safeWindX >= 0 ? 1 : -1;
  const windMagnitude = Math.abs(safeWindX);
  const baseDriftX = (safeWindX * 7.5 * layerMult) + (waveCycle * 3.8 * Math.min(2.0, windMagnitude + 0.4));

  // Vertical terrain undulation: shadows ripple slightly as they slide over terrain elevation
  const driftY = (secondaryWave * 2.2 * Math.min(1.8, safeWindSpeed)) + (Math.sin(tick * 0.04) * 0.6);

  // Aerodynamic wind shear angle: tilts the shadow ellipse along the airflow vector
  // Bounded between -0.35 and +0.35 radians
  const rawShear = Math.atan2(safeWindSpeed * 0.35, safeWindX) - Math.PI * 0.5;
  const shearAngle = Math.max(-0.35, Math.min(0.35, rawShear * 0.45));

  // Trail stretch: high winds stretch the shadow footprint along the drift trajectory
  const speedStretchFactor = Math.min(1.4, 1.0 + windMagnitude * 0.08 + (safeWindSpeed - 1.0) * 0.05);
  const trailStretch = Math.max(0.95, speedStretchFactor);

  return {
    driftX: baseDriftX,
    driftY,
    shearAngle,
    trailStretch,
  };
}

/**
 * Calculates real-time dynamic opacity and color depth (density) modulation
 * driven by altitude atmospheric layers and prevailing weather conditions.
 *
 * Atmospheric Physics Rationale:
 * - Low Altitude (< 15km, troposphere): Dense boundary layer thermal convection
 *   and moist eddy turbulence induce organic breathing waves (±8% to ±14% opacity amplitude)
 *   and rich, dark obsidian-indigo color depth.
 * - High Altitude (> 60km, stratosphere/mesosphere/orbit): Thin laminar airflow and
 *   near-vacuum conditions dampen turbulence (±1% to ±3% micro-wisp fluctuation)
 *   with diffuse, washed-out Rayleigh slate-blue tint.
 * - Weather conditions govern wave frequency, color base tones, and turbulence harmonics:
 *   * 'rain': Fast multi-frequency convective gloom pulse, deepest charcoal-black saturation.
 *   * 'snow': Alpine crispness, crystalline shimmer, cool high-contrast indigo.
 *   * 'mist': Soft vapor diffusion, gentle breathing cycle, reduced color contrast.
 *   * 'aurora': Geomagnetic flux resonance wave with subtle violet-cyan hue pulse.
 *   * 'clear': Diurnal thermal convection rhythmic breathing.
 */
export function calculateDynamicShadowModulation(
  altitudeKm: number,
  weather: WeatherType = 'clear',
  tick: number = 0
): DynamicShadowModulation {
  const safeAlt = Number.isFinite(altitudeKm) ? Math.max(0.1, Math.min(140.0, altitudeKm)) : 10.0;
  const safeTick = Number.isFinite(tick) ? tick : 0;
  const groundProximity = Math.max(0, Math.min(1, 1.0 - safeAlt / 120.0));

  // Weather-specific frequency and base color configurations
  let baseFreq = 0.038;
  let eddyFreq = 0.088;
  let weatherAmp = 1.0;
  let baseR = 12;
  let baseG = 18;
  let baseB = 40;

  switch (weather) {
    case 'rain':
      // Storm convective gusts: faster turbulence cycle, brooding dark tones
      baseFreq = 0.052;
      eddyFreq = 0.124;
      weatherAmp = 1.35;
      baseR = 5;
      baseG = 10;
      baseB = 22;
      break;
    case 'snow':
      // Crystalline alpine atmosphere: cool crisp blue-indigo
      baseFreq = 0.032;
      eddyFreq = 0.076;
      weatherAmp = 1.1;
      baseR = 12;
      baseG = 24;
      baseB = 58;
      break;
    case 'mist':
      // Foggy vapor diffusion: slow gentle undulating breathing
      baseFreq = 0.022;
      eddyFreq = 0.054;
      weatherAmp = 0.72;
      baseR = 22;
      baseG = 30;
      baseB = 52;
      break;
    case 'aurora':
      // Geomagnetic flux resonance: ethereal violet pulse
      baseFreq = 0.042;
      eddyFreq = 0.096;
      weatherAmp = 1.15;
      baseR = 16;
      baseG = 10;
      baseB = 36;
      break;
    case 'clear':
    default:
      // Golden sunlight thermal convection
      baseFreq = 0.036;
      eddyFreq = 0.082;
      weatherAmp = 1.0;
      baseR = 9;
      baseG = 16;
      baseB = 38;
      break;
  }

  // Harmonic breathing wave + secondary micro-eddy turbulence
  const primaryWave = Math.sin(safeTick * baseFreq);
  const eddyTurbulence = Math.cos(safeTick * eddyFreq) * 0.45;
  const combinedHarmonic = primaryWave * 0.75 + eddyTurbulence * 0.25;

  // Altitude modulation scale: low tropospheric altitudes experience greater convective amplitude
  // High space: minimal breathing (0.02), Ground level: dynamic breathing (0.12)
  const altitudeBreathingScale = 0.02 + 0.10 * Math.pow(groundProximity, 1.3);
  const totalModulationAmp = altitudeBreathingScale * weatherAmp;

  // Real-time opacity multiplier (centered at 1.0)
  const opacityMod = Math.max(0.82, Math.min(1.22, 1.0 + combinedHarmonic * totalModulationAmp));

  // Dynamic density / footprint expansion modulation (subtle breathing of the cloud mass)
  const densityMod = Math.max(0.90, Math.min(1.15, 1.0 + primaryWave * (0.015 + 0.05 * groundProximity)));

  // Color Depth Modulation:
  // Low altitude deepens color saturation (deep obsidian core); high altitude washes it out.
  // Real-time micro-fluctuation dynamically richens the shadow depth on breathing peaks.
  const baseColorDepth = 0.75 + 0.50 * Math.pow(groundProximity, 1.4);
  const dynamicColorDepth = baseColorDepth * (1.0 + combinedHarmonic * 0.06 * weatherAmp);
  const colorDepthMod = Math.max(0.70, Math.min(1.35, dynamicColorDepth));

  // Calculate dynamic RGBA shadow color reflecting real-time color depth
  // When color depth is high (dense, low altitude), RGB components are compressed lower toward rich black-indigo
  const depthCompression = Math.max(0.45, Math.min(1.15, 1.45 - colorDepthMod * 0.5));
  
  // Aurora weather features subtle geomagnetic hue resonance
  let rShift = 0;
  let bShift = 0;
  if (weather === 'aurora') {
    rShift = Math.sin(safeTick * 0.05) * 4;
    bShift = Math.cos(safeTick * 0.045) * 5;
  }

  const r = Math.max(2, Math.min(50, Math.round(baseR * depthCompression + rShift)));
  const g = Math.max(4, Math.min(60, Math.round(baseG * depthCompression)));
  const b = Math.max(10, Math.min(80, Math.round(baseB * depthCompression + bShift)));
  const dynamicShadowColor = `rgba(${r}, ${g}, ${b}, 1)`;

  return {
    opacityMod,
    densityMod,
    colorDepthMod,
    dynamicShadowColor,
    breathingPhase: primaryWave,
    eddyTurbulence,
  };
}

/**
 * Calculates dynamic Gaussian blur radius (in pixels) for cloud shadows based on
 * atmospheric flight altitude, penumbral sharpness, and prevailing weather conditions.
 *
 * Atmospheric Optics Rationale:
 * - High Altitudes (60km ~ 140km, mesosphere/thermosphere): Sunlight traverses long, oblique
 *   atmospheric column paths, undergoing broad Rayleigh scattering that diffuses shadow boundaries
 *   into a soft, wide penumbra (3.5px ~ 6.0px).
 * - Low Altitudes (< 15km down to 0km, troposphere): Clouds are close to planetary terrain surface;
 *   diffuse scattering angles are narrow, creating crisp, sharp umbral boundaries (0.8px ~ 1.8px).
 * - Weather conditions govern light dispersion:
 *   * 'mist': Thick water vapor micro-droplets amplify optical scattering (+1.4px).
 *   * 'rain': Heavy overcast and dense moisture expand diffusion slightly (+0.6px).
 *   * 'aurora': Ionospheric geomagnetic glow softens shadow edges (+0.8px).
 *   * 'snow': Cold crystalline arctic air provides high optical contrast and tighter edges (-0.3px).
 *   * 'clear': Baseline solar penumbra.
 */
export function calculateCloudShadowBlurRadius(
  altitudeKm: number,
  sharpness: number = 0.5,
  weather: WeatherType = 'clear'
): number {
  const safeAlt = Number.isFinite(altitudeKm) ? Math.max(0.1, Math.min(140.0, altitudeKm)) : 10.0;
  const altFactor = Math.max(0, Math.min(1, safeAlt / 120.0));

  // Base Gaussian blur: 1.2px near ground up to 4.8px at 120km
  let blur = 1.2 + altFactor * 3.6;

  // Penumbral sharpness dampening: higher sharpness (near terrain) contracts blur
  const safeSharpness = Number.isFinite(sharpness) ? Math.max(0.2, Math.min(1.0, sharpness)) : 0.5;
  blur *= (1.35 - safeSharpness * 0.55);

  // Weather-specific atmospheric diffusion
  switch (weather) {
    case 'mist':
      blur += 1.4;
      break;
    case 'rain':
      blur += 0.6;
      break;
    case 'aurora':
      blur += 0.8;
      break;
    case 'snow':
      blur -= 0.3;
      break;
    case 'clear':
    default:
      break;
  }

  return Math.max(0.6, Math.min(8.0, Math.round(blur * 10) / 10));
}

/**
 * Calculates altitude-based shadow opacity, sharpness, projection offsets,
 * wind-driven terrain drift, and real-time dynamic opacity and color depth modulation.
 */
export function calculateCloudShadowOpticals(
  altitudeKm: number,
  weather: WeatherType = 'clear',
  cycleProgress: number = 0.5,
  cloudDensityScale: number = 1.0,
  windVector: WindVector = { windX: 0.25, windSpeed: 1.0 },
  tick: number = 0
): CloudShadowOpticalConfig {
  const safeAlt = Number.isFinite(altitudeKm) ? Math.max(0.1, Math.min(140.0, altitudeKm)) : 10.0;
  
  // Normalized ground proximity: 0.0 (high space at 140km) to 1.0 (ground touchdown at 0km)
  const groundProximity = Math.max(0, Math.min(1, 1.0 - safeAlt / 120.0));
  
  // Non-linear perceptual darkening: steepens as craft approaches troposphere (<15km)
  // Low altitude yields up to ~0.50 opacity; high altitude drops to ~0.06
  const baseAlpha = 0.05 + 0.42 * Math.pow(groundProximity, 1.45);
  
  // Sharpness: 1.0 = sharpest umbra, 0.35 = softest diffuse blur
  const sharpness = 0.35 + 0.65 * Math.pow(groundProximity, 1.2);

  // Dynamic Gaussian blur soft shadow radius adapting to altitude and weather
  const gaussianBlurRadius = calculateCloudShadowBlurRadius(safeAlt, sharpness, weather);

  // Real-time dynamic opacity and color depth modulation
  const dynamicMod = calculateDynamicShadowModulation(safeAlt, weather, tick);
  
  // Footprint scale: High altitude spreads shadow slightly wider due to diffuse scattering
  const scaleMultiplier = (1.25 - 0.25 * groundProximity) *
    Math.max(0.7, Math.min(1.5, cloudDensityScale)) *
    dynamicMod.densityMod;

  // Sun directional lateral offset: sunlight angle shifts slightly through diurnal cycle
  // Morning: light from east (cast right-to-left), Noon: nearly vertical, Evening: cast left-to-right
  const sunAngle = ((cycleProgress % 1.0) - 0.5) * Math.PI * 0.75;
  const offsetX = Math.sin(sunAngle) * (18 + 14 * (1.0 - groundProximity));
  
  // Vertical projection distance from cloud base down to the planet surface
  // At lower altitude, the apparent distance between cloud and ground shortens
  const offsetY = 28 + 22 * (1.0 - groundProximity * 0.5);

  // Weather-specific contrast factor
  let weatherContrastFactor = 1.0;

  switch (weather) {
    case 'rain':
      weatherContrastFactor = 1.25;
      break;
    case 'snow':
      weatherContrastFactor = 1.15;
      break;
    case 'mist':
      weatherContrastFactor = 0.75;
      break;
    case 'aurora':
      weatherContrastFactor = 0.90;
      break;
    case 'clear':
    default:
      weatherContrastFactor = 1.05;
      break;
  }

  // Combine base alpha, weather contrast, and dynamic real-time opacity modulation
  const modulatedAlpha = baseAlpha * weatherContrastFactor * dynamicMod.opacityMod;
  const finalAlpha = Math.max(0.03, Math.min(0.58, modulatedAlpha));

  // Calculate wind drift animation offset
  const drift = calculateCloudShadowDrift(windVector, tick, 'mid');

  return {
    altitudeKm: safeAlt,
    shadowAlpha: finalAlpha,
    sharpness,
    scaleMultiplier,
    offsetX,
    offsetY,
    shadowColor: dynamicMod.dynamicShadowColor,
    weatherContrastFactor,
    windVector,
    driftX: drift.driftX,
    driftY: drift.driftY,
    shearAngle: drift.shearAngle,
    trailStretch: drift.trailStretch,
    gaussianBlurRadius,
    dynamicModulation: dynamicMod,
  };
}

export interface EarthPlanetBounds {
  centerX: number;
  centerY: number;
  radius: number;
  terrainHorizonY: number;
}

/**
 * Maps a cloud's position and blobs into terrain shadow footprints projected
 * onto the planetary surface, incorporating wind direction drift kinematics.
 */
export function projectCloudShadowFootprint(
  cloud: CloudShadowSource,
  config: CloudShadowOpticalConfig,
  bounds: EarthPlanetBounds,
  smoothCloudDensity: number = 1.0,
  tick: number = 0
): {
  shadowX: number;
  shadowY: number;
  effectiveAlpha: number;
  shearAngle: number;
  trailStretch: number;
  blobs: Array<{ ox: number; oy: number; r: number }>;
} | null {
  // Individual cloud micro-drift based on cloud layer and position
  const layerMult = cloud.layer === 'fg' ? 1.35 : cloud.layer === 'mid' ? 1.0 : 0.7;
  const individualDriftX = config.driftX * layerMult;
  const individualDriftY = config.driftY * layerMult;

  // Compute ground-projected coordinates with wind drift
  const shadowX = cloud.x + config.offsetX + individualDriftX;
  
  // Perspective compression: project downward toward planetary continent elevation (y: 200 ~ 270)
  // Higher clouds cast shadows further down on the terrain, sliding along the drift offset
  const groundElevation = bounds.terrainHorizonY + (cloud.y * 0.22) + config.offsetY + individualDriftY;
  const shadowY = Math.max(bounds.terrainHorizonY - 10, Math.min(bounds.centerY + 20, groundElevation));

  // Layer alpha modifier: foreground & mid clouds cast more distinct ground shadows than faint bg wisps
  const layerWeight = cloud.layer === 'fg' ? 1.0 : cloud.layer === 'mid' ? 0.85 : 0.55;
  const effectiveAlpha = Math.max(0.02, Math.min(0.58, config.shadowAlpha * cloud.alpha * layerWeight));

  // Compute scaled shadow blobs
  const projectedBlobs: Array<{ ox: number; oy: number; r: number }> = [];
  const density = Math.max(0.5, smoothCloudDensity);

  for (let b = 0; b < cloud.blobs.length; b++) {
    const blob = cloud.blobs[b];
    // Scale shadow radius based on altitude sharpness (sharper = tighter, softer = wider)
    const baseR = blob.r * (0.85 * config.scaleMultiplier);
    const r = Math.max(2, baseR * density);
    const ox = blob.ox * config.scaleMultiplier * (density > 1.2 ? 1.1 : 1.0);
    // Flatten shadow vertically to match planetary spherical oblique angle
    const oy = blob.oy * config.scaleMultiplier * 0.55;

    projectedBlobs.push({ ox, oy, r });
  }

  return {
    shadowX,
    shadowY,
    effectiveAlpha,
    shearAngle: config.shearAngle,
    trailStretch: config.trailStretch,
    blobs: projectedBlobs,
  };
}

/**
 * Renders the terrain cloud shadows directly into the canvas context with
 * wind-driven sliding drift motion.
 * MUST be called while the planet curvature clipping path is active so shadows
 * perfectly drape over oceans, coastlines, plains, and mountain ridges without
 * leaking into the atmosphere.
 */
export function renderCloudShadowLayer(
  ctx: CanvasRenderingContext2D,
  clouds: CloudShadowSource[],
  config: CloudShadowOpticalConfig,
  bounds: EarthPlanetBounds,
  smoothCloudDensity: number = 1.0,
  tick: number = 0
): void {
  if (config.shadowAlpha <= 0.02) return;

  ctx.save();

  // Apply Gaussian blur soft shadow filter for natural atmospheric penumbra diffusion
  const blurPx = config.gaussianBlurRadius ?? 2.0;
  let filterApplied = false;
  try {
    if (typeof ctx.filter === 'string') {
      ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
      filterApplied = true;
    }
  } catch {
    // Graceful fallback for mock canvas contexts or unsupported platforms
  }

  for (let i = 0; i < clouds.length; i++) {
    const cloud = clouds[i];
    const footprint = projectCloudShadowFootprint(cloud, config, bounds, smoothCloudDensity, tick);
    if (!footprint) continue;

    ctx.save();
    ctx.globalAlpha = footprint.effectiveAlpha;
    ctx.fillStyle = config.shadowColor;

    const cx = Math.floor(footprint.shadowX);
    const cy = Math.floor(footprint.shadowY);

    // Render each blob as an oblique flattened shadow ellipse with wind shear orientation
    for (let b = 0; b < footprint.blobs.length; b++) {
      const blob = footprint.blobs[b];
      const bx = cx + Math.floor(blob.ox);
      const by = cy + Math.floor(blob.oy);
      const rx = Math.max(2, Math.floor(blob.r * 1.35 * footprint.trailStretch));
      const ry = Math.max(1, Math.floor(blob.r * 0.45)); // Oblique ground flattening

      ctx.beginPath();
      ctx.ellipse(bx, by, rx, ry, footprint.shearAngle, 0, Math.PI * 2);
      ctx.fill();

      // Sharp inner umbra core rendered when altitude is low (< 15km)
      if (config.sharpness > 0.65) {
        ctx.save();
        ctx.globalAlpha = footprint.effectiveAlpha * 0.45;
        if (filterApplied) {
          try {
            ctx.filter = `blur(${Math.max(0.5, blurPx * 0.45).toFixed(1)}px)`;
          } catch {
            // Graceful fallback
          }
        }
        ctx.beginPath();
        ctx.ellipse(
          bx,
          by,
          Math.max(1, Math.floor(rx * 0.65)),
          Math.max(1, Math.floor(ry * 0.65)),
          footprint.shearAngle,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  if (filterApplied) {
    try {
      ctx.filter = 'none';
    } catch {
      // Graceful fallback
    }
  }

  ctx.restore();
}

export interface CloudShadowDensityMetrics {
  altitudeKm: number;
  altitudeLayer: string;           // E.g., '대류권 (Troposphere)'
  baseAlphaPercent: number;        // Baseline theoretical alpha
  dynamicOpacityPercent: number;   // Real-time modulated opacity %
  opacityModFactor: number;        // Opacity multiplier (0.82 ~ 1.22)
  densityModFactor: number;        // Density multiplier (0.90 ~ 1.15)
  colorDepthModFactor: number;     // Color depth / darkness multiplier (0.70 ~ 1.35)
  shadowColorRgba: string;         // Real-time computed RGBA color
  sharpnessScore: number;          // 0.35 ~ 1.0 (umbra sharpness)
  gaussianBlurRadius: number;      // Real-time Gaussian blur radius in pixels
  breathingCyclePercent: number;   // -100% ~ +100%
  eddyTurbulenceAmp: number;       // Micro eddy turbulence amplitude
  weatherType: WeatherType;
  driftVelocityX: number;
  driftVelocityY: number;
  shearAngleDeg: number;
  trailStretch: number;
}

/**
 * Calculates real-time cloud shadow density and optical telemetry metrics.
 */
export function calculateCloudShadowDensityMetrics(
  config: CloudShadowOpticalConfig,
  weather: WeatherType = 'clear'
): CloudShadowDensityMetrics {
  const alt = config.altitudeKm;
  let altitudeLayer = '대류권 (Troposphere)';
  if (alt > 85.0) {
    altitudeLayer = '열권 (진공 / 극초고도)';
  } else if (alt > 50.0) {
    altitudeLayer = '중간권 (초희박 기압)';
  } else if (alt > 15.0) {
    altitudeLayer = '성층권 (오존 및 층류)';
  } else if (alt > 2.0) {
    altitudeLayer = '대류권 (운저 및 대류)';
  } else {
    altitudeLayer = '지표 경계층 (행성 표면)';
  }

  const safeAlt = Number.isFinite(alt) ? Math.max(0.1, Math.min(140.0, alt)) : 10.0;
  const groundProximity = Math.max(0, Math.min(1, 1.0 - safeAlt / 120.0));
  const baseAlpha = 0.05 + 0.42 * Math.pow(groundProximity, 1.45);
  const gaussianBlurRadius =
    config.gaussianBlurRadius ?? calculateCloudShadowBlurRadius(safeAlt, config.sharpness, weather);

  return {
    altitudeKm: safeAlt,
    altitudeLayer,
    baseAlphaPercent: Math.round(baseAlpha * config.weatherContrastFactor * 1000) / 10,
    dynamicOpacityPercent: Math.round(config.shadowAlpha * 1000) / 10,
    opacityModFactor: Math.round(config.dynamicModulation.opacityMod * 1000) / 1000,
    densityModFactor: Math.round(config.dynamicModulation.densityMod * 1000) / 1000,
    colorDepthModFactor: Math.round(config.dynamicModulation.colorDepthMod * 1000) / 1000,
    shadowColorRgba: config.shadowColor,
    sharpnessScore: Math.round(config.sharpness * 100) / 100,
    gaussianBlurRadius: Math.round(gaussianBlurRadius * 10) / 10,
    breathingCyclePercent: Math.round(config.dynamicModulation.breathingPhase * 100),
    eddyTurbulenceAmp: Math.round(config.dynamicModulation.eddyTurbulence * 1000) / 1000,
    weatherType: weather,
    driftVelocityX: Math.round(config.driftX * 10) / 10,
    driftVelocityY: Math.round(config.driftY * 10) / 10,
    shearAngleDeg: Math.round(config.shearAngle * (180 / Math.PI) * 10) / 10,
    trailStretch: Math.round(config.trailStretch * 100) / 100,
  };
}

/**
 * Renders an interactive diagnostic debug overlay visualizing real-time altitude-driven
 * opacity modulation, color depth, footprint projections, and hover density tooltips.
 */
export function renderCloudShadowDebugOverlay(
  ctx: CanvasRenderingContext2D,
  clouds: CloudShadowSource[],
  config: CloudShadowOpticalConfig,
  bounds: EarthPlanetBounds,
  tick: number = 0,
  cursorCoords?: { x: number; y: number } | null,
  smoothCloudDensity: number = 1.0
): void {
  ctx.save();

  const metrics = calculateCloudShadowDensityMetrics(config, config.weatherContrastFactor > 1.2 ? 'rain' : 'clear');

  // 1. Projection diagnostic rays and wireframe footprint outlines
  ctx.lineWidth = 1;
  for (let i = 0; i < clouds.length; i++) {
    const cloud = clouds[i];
    const footprint = projectCloudShadowFootprint(cloud, config, bounds, smoothCloudDensity, tick);
    if (!footprint) continue;

    const cx = Math.floor(footprint.shadowX);
    const cy = Math.floor(footprint.shadowY);

    // Dotted projection vector from cloud down to ground footprint
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(cloud.x, cloud.y);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Outlines of projected shadow blobs
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    for (let b = 0; b < footprint.blobs.length; b++) {
      const blob = footprint.blobs[b];
      const bx = cx + Math.floor(blob.ox);
      const by = cy + Math.floor(blob.oy);
      const rx = Math.max(2, Math.floor(blob.r * 1.35 * footprint.trailStretch));
      const ry = Math.max(1, Math.floor(blob.r * 0.45));

      ctx.beginPath();
      ctx.ellipse(bx, by, rx, ry, footprint.shearAngle, 0, Math.PI * 2);
      ctx.stroke();

      // Sharp inner umbra core outline
      if (config.sharpness > 0.65) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
        ctx.beginPath();
        ctx.ellipse(bx, by, Math.max(1, Math.floor(rx * 0.65)), Math.max(1, Math.floor(ry * 0.65)), footprint.shearAngle, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      }
    }

    // Footprint center reticle
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.9)';
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy);
    ctx.lineTo(cx + 3, cy);
    ctx.moveTo(cx, cy - 3);
    ctx.lineTo(cx, cy + 3);
    ctx.stroke();
  }

  // 2. HUD Telemetry Terminal Box (Upper Right: 308 x 8, w: 164, h: 110)
  const boxX = 308;
  const boxY = 8;
  const boxW = 164;
  const boxH = 110;

  // Box background & cyan neon border
  ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Corner tech accents
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(boxX - 1, boxY - 1, 3, 3);
  ctx.fillRect(boxX + boxW - 2, boxY - 1, 3, 3);
  ctx.fillRect(boxX - 1, boxY + boxH - 2, 3, 3);
  ctx.fillRect(boxX + boxW - 2, boxY + boxH - 2, 3, 3);

  // Title
  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('✦ SHADOW DENSITY DEBUG [U]', boxX + 6, boxY + 12);

  // Altitude & Layer
  ctx.font = '8px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`ALT: ${metrics.altitudeKm.toFixed(1)} km`, boxX + 6, boxY + 24);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`[${metrics.altitudeLayer.slice(0, 5)}]`, boxX + 88, boxY + 24);

  // Opacity Bar & Value
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`OPACITY: ${metrics.dynamicOpacityPercent}% (×${metrics.opacityModFactor.toFixed(2)})`, boxX + 6, boxY + 36);

  // 10-Segment Opacity Meter
  const barX = boxX + 6;
  const barY = boxY + 40;
  const filledBars = Math.min(10, Math.max(1, Math.round((config.shadowAlpha / 0.55) * 10)));
  for (let s = 0; s < 10; s++) {
    ctx.fillStyle = s < filledBars ? (s > 7 ? '#f59e0b' : '#38bdf8') : 'rgba(51, 65, 85, 0.6)';
    ctx.fillRect(barX + s * 15, barY, 13, 3);
  }

  // Density & Color Depth
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`DENSITY: ×${metrics.densityModFactor.toFixed(2)}  DEPTH: ×${metrics.colorDepthModFactor.toFixed(2)}`, boxX + 6, boxY + 54);

  // Swatch Box & Shadow Color
  ctx.fillStyle = config.shadowColor;
  ctx.fillRect(boxX + 6, boxY + 60, 10, 8);
  ctx.strokeStyle = '#64748b';
  ctx.strokeRect(boxX + 6, boxY + 60, 10, 8);

  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`COLOR: ${config.shadowColor.replace(/rgba\(|\, 1\)/g, '')}`, boxX + 20, boxY + 67);

  // Drift & Shear
  ctx.fillStyle = '#94a3b8';
  const driftSign = config.driftX >= 0 ? '+' : '';
  ctx.fillText(`DRIFT: ${driftSign}${config.driftX.toFixed(1)}px | SHEAR: ${metrics.shearAngleDeg}°`, boxX + 6, boxY + 79);

  // Convective Harmonic Wave Pulse
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('BREATHE:', boxX + 6, boxY + 91);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(boxX + 54, boxY + 85, 28, 6);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(Math.max(boxX + 54, Math.min(boxX + 78, boxX + 54 + (config.dynamicModulation.breathingPhase + 1.0) * 12)), boxY + 86, 3, 4);
  ctx.fillText(`EDDY: ${(metrics.eddyTurbulenceAmp * 100).toFixed(0)}%`, boxX + 88, boxY + 91);

  // Gaussian Soft Shadow Blur Metric
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`SOFT BLUR: ${metrics.gaussianBlurRadius.toFixed(1)}px (Gaussian Penumbra)`, boxX + 6, boxY + 103);

  // 3. Interactive Floating Cursor Tooltip (When pointer hovers near terrain / shadow zone)
  if (cursorCoords && cursorCoords.y >= bounds.terrainHorizonY - 15) {
    const tipW = 126;
    const tipH = 54;
    let tipX = cursorCoords.x + 8;
    let tipY = cursorCoords.y - tipH - 6;
    if (tipX + tipW > 476) tipX = cursorCoords.x - tipW - 8;
    if (tipY < 4) tipY = cursorCoords.y + 14;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(tipX, tipY, tipW, tipH);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.strokeRect(tipX, tipY, tipW, tipH);

    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('SHADOW TELEMETRY', tipX + 5, tipY + 9);

    ctx.font = '7px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`ALT: ${metrics.altitudeKm.toFixed(1)} km`, tipX + 5, tipY + 18);
    ctx.fillText(`OPACITY: ${metrics.dynamicOpacityPercent}%`, tipX + 5, tipY + 27);
    ctx.fillText(`DENSITY: ${(metrics.densityModFactor * 100).toFixed(0)}%  DEPTH: ×${metrics.colorDepthModFactor.toFixed(2)}`, tipX + 5, tipY + 36);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`BLUR: ${metrics.gaussianBlurRadius.toFixed(1)}px | DRIFT: ${driftSign}${config.driftX.toFixed(1)}px`, tipX + 5, tipY + 45);
  }

  ctx.restore();
}
