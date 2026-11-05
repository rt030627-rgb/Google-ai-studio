/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCloudShadowOpticals,
  calculateCloudShadowBlurRadius,
  calculateCloudShadowDrift,
  calculateDynamicShadowModulation,
  calculateCloudShadowDensityMetrics,
  renderCloudShadowDebugOverlay,
  projectCloudShadowFootprint,
  renderCloudShadowLayer,
  CloudShadowSource,
  EarthPlanetBounds,
  DynamicShadowModulation,
  CloudShadowDensityMetrics,
} from './cloudShadowEngine';

describe('CloudShadowEngine (Altitude-Driven Terrain Shadows & Wind Drift)', () => {
  it('should increase shadow darkness (alpha) monotonically as altitude descends', () => {
    const highAlt = calculateCloudShadowOpticals(120.0, 'clear', 0.5);
    const midAlt = calculateCloudShadowOpticals(45.0, 'clear', 0.5);
    const tropoAlt = calculateCloudShadowOpticals(10.0, 'clear', 0.5);
    const groundAlt = calculateCloudShadowOpticals(1.0, 'clear', 0.5);

    assert.ok(highAlt.shadowAlpha < midAlt.shadowAlpha, `High alt (${highAlt.shadowAlpha}) should be fainter than mid alt (${midAlt.shadowAlpha})`);
    assert.ok(midAlt.shadowAlpha < tropoAlt.shadowAlpha, `Mid alt (${midAlt.shadowAlpha}) should be fainter than tropo alt (${tropoAlt.shadowAlpha})`);
    assert.ok(tropoAlt.shadowAlpha < groundAlt.shadowAlpha, `Tropo alt (${tropoAlt.shadowAlpha}) should be fainter than ground alt (${groundAlt.shadowAlpha})`);
    assert.ok(groundAlt.shadowAlpha > 0.35, `Ground altitude shadow should be distinctly dark: ${groundAlt.shadowAlpha}`);
  });

  it('should increase sharpness as altitude descends', () => {
    const highAlt = calculateCloudShadowOpticals(100.0, 'clear', 0.5);
    const groundAlt = calculateCloudShadowOpticals(2.0, 'clear', 0.5);

    assert.ok(highAlt.sharpness < groundAlt.sharpness, `Ground altitude sharpness (${groundAlt.sharpness}) should exceed high space sharpness (${highAlt.sharpness})`);
    assert.ok(groundAlt.sharpness > 0.85, 'Ground altitude should have high sharpness for crisp umbra');
  });

  it('should adapt shadow contrast and color according to weather conditions', () => {
    const clearOpt = calculateCloudShadowOpticals(10.0, 'clear', 0.5);
    const rainOpt = calculateCloudShadowOpticals(10.0, 'rain', 0.5);
    const mistOpt = calculateCloudShadowOpticals(10.0, 'mist', 0.5);
    const snowOpt = calculateCloudShadowOpticals(10.0, 'snow', 0.5);

    assert.ok(rainOpt.weatherContrastFactor > clearOpt.weatherContrastFactor, 'Rainstorm should have higher gloom contrast factor');
    assert.ok(mistOpt.weatherContrastFactor < clearOpt.weatherContrastFactor, 'Mist should diffuse and soften shadow contrast');
    assert.notEqual(rainOpt.shadowColor, clearOpt.shadowColor);
    assert.notEqual(snowOpt.shadowColor, clearOpt.shadowColor);
  });

  it('should adjust directional sun offset based on diurnal cycle progress', () => {
    const morning = calculateCloudShadowOpticals(20.0, 'clear', 0.1); // East sun
    const noon = calculateCloudShadowOpticals(20.0, 'clear', 0.5);    // Zenith sun
    const evening = calculateCloudShadowOpticals(20.0, 'clear', 0.9); // West sun

    assert.ok(morning.offsetX < 0, `Morning shadow should offset westward: ${morning.offsetX}`);
    assert.ok(Math.abs(noon.offsetX) < 1.0, `Noon shadow should be centered near 0: ${noon.offsetX}`);
    assert.ok(evening.offsetX > 0, `Evening shadow should offset eastward: ${evening.offsetX}`);
  });

  it('should calculate wind drift sliding displacement aligned with wind direction', () => {
    // Westward wind (negative windX like rainstorm)
    const westWind = calculateCloudShadowDrift({ windX: -2.0, windSpeed: 2.5 }, 10, 'mid');
    // Eastward wind (positive windX like mist)
    const eastWind = calculateCloudShadowDrift({ windX: 2.0, windSpeed: 2.5 }, 10, 'mid');

    assert.ok(westWind.driftX < 0, `Westward wind should yield negative driftX: ${westWind.driftX}`);
    assert.ok(eastWind.driftX > 0, `Eastward wind should yield positive driftX: ${eastWind.driftX}`);
    assert.ok(Number.isFinite(westWind.driftY));
    assert.ok(Number.isFinite(westWind.shearAngle));
    assert.ok(westWind.trailStretch >= 1.0, 'High wind speed should stretch shadow trail');
  });

  it('should apply layer parallax to wind drift displacement', () => {
    const fgDrift = calculateCloudShadowDrift({ windX: 1.5, windSpeed: 1.8 }, 50, 'fg');
    const bgDrift = calculateCloudShadowDrift({ windX: 1.5, windSpeed: 1.8 }, 50, 'bg');

    assert.ok(Math.abs(fgDrift.driftX) > Math.abs(bgDrift.driftX), 'Foreground clouds should glide faster than background');
  });

  it('should produce continuous gliding animation displacement across ticks', () => {
    const tickA = calculateCloudShadowDrift({ windX: 1.0, windSpeed: 1.2 }, 0, 'mid');
    const tickB = calculateCloudShadowDrift({ windX: 1.0, windSpeed: 1.2 }, 30, 'mid');
    const tickC = calculateCloudShadowDrift({ windX: 1.0, windSpeed: 1.2 }, 60, 'mid');

    assert.notEqual(tickA.driftX, tickB.driftX, 'Drift displacement should undulate across ticks');
    assert.notEqual(tickB.driftX, tickC.driftX);
    assert.ok(Number.isFinite(tickB.driftX));
  });

  it('should safely clamp extreme or NaN altitudes and wind vectors', () => {
    const nanAlt = calculateCloudShadowOpticals(NaN, 'clear', 0.5);
    assert.ok(Number.isFinite(nanAlt.shadowAlpha));
    assert.ok(Number.isFinite(nanAlt.sharpness));
    assert.ok(Number.isFinite(nanAlt.driftX));

    const nanWind = calculateCloudShadowDrift({ windX: NaN, windSpeed: NaN }, 0, 'mid');
    assert.ok(Number.isFinite(nanWind.driftX));
    assert.ok(Number.isFinite(nanWind.driftY));
    assert.ok(Number.isFinite(nanWind.shearAngle));
  });

  it('should accurately project cloud shadow footprint with perspective flattening and wind drift', () => {
    const mockCloud: CloudShadowSource = {
      x: 200,
      y: 80,
      speed: 1.2,
      layer: 'mid',
      alpha: 0.85,
      blobs: [
        { ox: 0, oy: 0, r: 20 },
        { ox: 15, oy: -5, r: 16 },
      ],
    };

    const opt = calculateCloudShadowOpticals(8.0, 'clear', 0.5, 1.0, { windX: -1.5, windSpeed: 2.0 }, 25);
    const bounds: EarthPlanetBounds = {
      centerX: 240,
      centerY: 480,
      radius: 288,
      terrainHorizonY: 190,
    };

    const footprint = projectCloudShadowFootprint(mockCloud, opt, bounds, 1.0, 25);
    assert.ok(footprint !== null);
    assert.ok(footprint.shadowY >= bounds.terrainHorizonY);
    assert.ok(footprint.effectiveAlpha > 0);
    assert.equal(footprint.blobs.length, 2);
    assert.ok(Number.isFinite(footprint.shearAngle));
    assert.ok(footprint.trailStretch >= 1.0);

    // Verify oblique flattening factor
    assert.ok(footprint.blobs[0].oy === 0);
    assert.ok(footprint.blobs[1].oy < -1);
  });

  it('should execute renderCloudShadowLayer safely on mock canvas context with drift shear', () => {
    const calls: string[] = [];
    const mockCtx = {
      save: () => calls.push('save'),
      restore: () => calls.push('restore'),
      beginPath: () => calls.push('beginPath'),
      ellipse: () => calls.push('ellipse'),
      fill: () => calls.push('fill'),
      globalAlpha: 1.0,
      fillStyle: '#000000',
    } as unknown as CanvasRenderingContext2D;

    const clouds: CloudShadowSource[] = [
      {
        x: 100,
        y: 60,
        speed: 1.0,
        layer: 'fg',
        alpha: 0.9,
        blobs: [{ ox: 0, oy: 0, r: 15 }],
      },
    ];

    const opt = calculateCloudShadowOpticals(5.0, 'clear', 0.5, 1.0, { windX: 1.2, windSpeed: 1.5 }, 40);
    const bounds: EarthPlanetBounds = {
      centerX: 240,
      centerY: 480,
      radius: 288,
      terrainHorizonY: 190,
    };

    renderCloudShadowLayer(mockCtx, clouds, opt, bounds, 1.0, 40);
    assert.ok(calls.includes('save'));
    assert.ok(calls.includes('fill'));
    assert.ok(calls.includes('ellipse'));
  });

  it('should modulate dynamic opacity and breathing phase continuously across ticks', () => {
    const mod0 = calculateDynamicShadowModulation(8.0, 'clear', 0);
    const mod25 = calculateDynamicShadowModulation(8.0, 'clear', 25);
    const mod50 = calculateDynamicShadowModulation(8.0, 'clear', 50);

    assert.ok(Number.isFinite(mod0.opacityMod));
    assert.ok(Number.isFinite(mod25.opacityMod));
    assert.ok(Number.isFinite(mod50.opacityMod));
    assert.notEqual(mod0.opacityMod, mod25.opacityMod, 'Opacity modulation should vary dynamically with tick');
    assert.notEqual(mod25.opacityMod, mod50.opacityMod);
    assert.ok(mod0.opacityMod >= 0.82 && mod0.opacityMod <= 1.22, 'Opacity mod within safe physiological bounds');
  });

  it('should produce deeper color depth and greater breathing amplitude at lower tropospheric altitudes', () => {
    const highSpaceMod = calculateDynamicShadowModulation(120.0, 'clear', 20);
    const groundMod = calculateDynamicShadowModulation(1.5, 'clear', 20);

    // Color depth at ground should exceed high space
    assert.ok(
      groundMod.colorDepthMod > highSpaceMod.colorDepthMod,
      `Ground color depth (${groundMod.colorDepthMod}) should be deeper than high space (${highSpaceMod.colorDepthMod})`
    );

    // Test breathing wave variance across multiple ticks
    let highSpaceSpread = 0;
    let groundSpread = 0;
    for (let t = 0; t < 100; t += 20) {
      const h = calculateDynamicShadowModulation(120.0, 'clear', t).opacityMod;
      const g = calculateDynamicShadowModulation(2.0, 'clear', t).opacityMod;
      highSpaceSpread = Math.max(highSpaceSpread, Math.abs(h - 1.0));
      groundSpread = Math.max(groundSpread, Math.abs(g - 1.0));
    }
    assert.ok(
      groundSpread > highSpaceSpread,
      `Boundary layer thermal eddies at low altitude (${groundSpread}) should exceed high space laminar breathing (${highSpaceSpread})`
    );
  });

  it('should customize dynamic color and frequency across weather conditions', () => {
    const rainMod = calculateDynamicShadowModulation(10.0, 'rain', 15);
    const snowMod = calculateDynamicShadowModulation(10.0, 'snow', 15);
    const mistMod = calculateDynamicShadowModulation(10.0, 'mist', 15);
    const auroraMod = calculateDynamicShadowModulation(10.0, 'aurora', 15);
    const clearMod = calculateDynamicShadowModulation(10.0, 'clear', 15);

    // Weather colors should be tailored to atmospheric optical properties
    assert.notEqual(rainMod.dynamicShadowColor, clearMod.dynamicShadowColor);
    assert.notEqual(snowMod.dynamicShadowColor, clearMod.dynamicShadowColor);
    assert.notEqual(mistMod.dynamicShadowColor, clearMod.dynamicShadowColor);
    assert.notEqual(auroraMod.dynamicShadowColor, clearMod.dynamicShadowColor);

    // Storm gloom (rain) has higher contrast / deeper color depth than diffused mist
    assert.ok(rainMod.colorDepthMod > mistMod.colorDepthMod, 'Rain should have richer darkness/depth than diffused mist');
  });

  it('should integrate dynamicModulation into calculateCloudShadowOpticals safely', () => {
    const optA = calculateCloudShadowOpticals(12.0, 'clear', 0.5, 1.0, { windX: 0.5, windSpeed: 1.0 }, 10);
    const optB = calculateCloudShadowOpticals(12.0, 'clear', 0.5, 1.0, { windX: 0.5, windSpeed: 1.0 }, 60);

    assert.ok(optA.dynamicModulation !== undefined);
    assert.ok(optA.shadowAlpha >= 0.03 && optA.shadowAlpha <= 0.58);
    assert.ok(optA.shadowColor.startsWith('rgba('));
    assert.notEqual(optA.shadowAlpha, optB.shadowAlpha, 'Real-time shadowAlpha should modulate subtly across ticks');
  });

  it('should gracefully handle invalid and NaN values in calculateDynamicShadowModulation', () => {
    const nanMod = calculateDynamicShadowModulation(NaN, 'clear', NaN);
    assert.ok(Number.isFinite(nanMod.opacityMod));
    assert.ok(Number.isFinite(nanMod.densityMod));
    assert.ok(Number.isFinite(nanMod.colorDepthMod));
    assert.ok(nanMod.dynamicShadowColor.startsWith('rgba('));
  });

  it('should accurately calculate cloud shadow density metrics and altitude atmospheric layers', () => {
    const highSpaceOpt = calculateCloudShadowOpticals(100.0, 'clear', 0.5, 1.0, { windX: 1.0, windSpeed: 1.2 }, 10);
    const midAtmoOpt = calculateCloudShadowOpticals(35.0, 'rain', 0.5, 1.0, { windX: -2.0, windSpeed: 2.5 }, 10);
    const groundOpt = calculateCloudShadowOpticals(1.2, 'snow', 0.5, 1.0, { windX: 0.5, windSpeed: 1.0 }, 10);

    const highMetrics = calculateCloudShadowDensityMetrics(highSpaceOpt, 'clear');
    const midMetrics = calculateCloudShadowDensityMetrics(midAtmoOpt, 'rain');
    const groundMetrics = calculateCloudShadowDensityMetrics(groundOpt, 'snow');

    assert.ok(highMetrics.altitudeLayer.includes('열권'), `High space layer should be Thermosphere: ${highMetrics.altitudeLayer}`);
    assert.ok(midMetrics.altitudeLayer.includes('성층권'), `35km layer should be Stratosphere: ${midMetrics.altitudeLayer}`);
    assert.ok(groundMetrics.altitudeLayer.includes('지표 경계층'), `1.2km layer should be Boundary Layer: ${groundMetrics.altitudeLayer}`);

    assert.ok(groundMetrics.dynamicOpacityPercent > highMetrics.dynamicOpacityPercent);
    assert.ok(groundMetrics.colorDepthModFactor > highMetrics.colorDepthModFactor);
    assert.ok(Number.isFinite(highMetrics.driftVelocityX));
    assert.ok(Number.isFinite(midMetrics.shearAngleDeg));
    assert.equal(midMetrics.weatherType, 'rain');
  });

  it('should render cloud shadow debug overlay safely on canvas with projection vectors and telemetry box', () => {
    const calls: string[] = [];
    const textCalls: string[] = [];
    const mockCtx = {
      save: () => calls.push('save'),
      restore: () => calls.push('restore'),
      beginPath: () => calls.push('beginPath'),
      moveTo: () => calls.push('moveTo'),
      lineTo: () => calls.push('lineTo'),
      stroke: () => calls.push('stroke'),
      fillRect: () => calls.push('fillRect'),
      strokeRect: () => calls.push('strokeRect'),
      ellipse: () => calls.push('ellipse'),
      fillText: (text: string) => textCalls.push(text),
      setLineDash: () => calls.push('setLineDash'),
      lineWidth: 1,
      strokeStyle: '#000000',
      fillStyle: '#000000',
      font: '',
    } as unknown as CanvasRenderingContext2D;

    const clouds: CloudShadowSource[] = [
      {
        x: 120,
        y: 60,
        speed: 1.0,
        layer: 'fg',
        alpha: 0.9,
        blobs: [{ ox: 0, oy: 0, r: 18 }],
      },
    ];

    const opt = calculateCloudShadowOpticals(8.5, 'clear', 0.5, 1.0, { windX: 1.2, windSpeed: 1.4 }, 30);
    const bounds: EarthPlanetBounds = {
      centerX: 240,
      centerY: 480,
      radius: 288,
      terrainHorizonY: 190,
    };

    renderCloudShadowDebugOverlay(mockCtx, clouds, opt, bounds, 30, { x: 200, y: 220 }, 1.0);

    assert.ok(calls.includes('save'));
    assert.ok(calls.includes('fillRect'));
    assert.ok(calls.includes('strokeRect'));
    assert.ok(calls.includes('ellipse'));
    assert.ok(textCalls.some((t) => t.includes('SHADOW DENSITY DEBUG')));
    assert.ok(textCalls.some((t) => t.includes('OPACITY')));
    assert.ok(textCalls.some((t) => t.includes('SHADOW TELEMETRY'))); // Hover tooltip rendered!
  });

  it('should handle edge cases and null cursor coordinates in renderCloudShadowDebugOverlay', () => {
    const mockCtx = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      ellipse: () => {},
      fillText: () => {},
      setLineDash: () => {},
      lineWidth: 1,
      strokeStyle: '#000000',
      fillStyle: '#000000',
      font: '',
    } as unknown as CanvasRenderingContext2D;

    const opt = calculateCloudShadowOpticals(NaN, 'clear', 0.5, 1.0, { windX: NaN, windSpeed: NaN }, 0);
    const bounds: EarthPlanetBounds = {
      centerX: 240,
      centerY: 480,
      radius: 288,
      terrainHorizonY: 190,
    };

    // Should not throw even with null cursor and NaN configuration
    assert.doesNotThrow(() => {
      renderCloudShadowDebugOverlay(mockCtx, [], opt, bounds, 0, null, 1.0);
    });
  });

  it('should calculate dynamic Gaussian blur radius scaling with altitude and penumbral sharpness', () => {
    const highSpaceBlur = calculateCloudShadowBlurRadius(120.0, 0.35, 'clear');
    const stratosphereBlur = calculateCloudShadowBlurRadius(40.0, 0.55, 'clear');
    const groundBlur = calculateCloudShadowBlurRadius(1.5, 0.95, 'clear');

    assert.ok(highSpaceBlur > stratosphereBlur, `High space blur (${highSpaceBlur}) should exceed stratosphere (${stratosphereBlur})`);
    assert.ok(stratosphereBlur > groundBlur, `Stratosphere blur (${stratosphereBlur}) should exceed ground blur (${groundBlur})`);
    assert.ok(groundBlur >= 0.6 && groundBlur <= 1.8, `Ground blur should be tight: ${groundBlur}`);
    assert.ok(highSpaceBlur >= 3.0, `High space blur should diffuse widely: ${highSpaceBlur}`);
  });

  it('should modulate Gaussian blur radius according to atmospheric weather', () => {
    const clearBlur = calculateCloudShadowBlurRadius(15.0, 0.6, 'clear');
    const mistBlur = calculateCloudShadowBlurRadius(15.0, 0.6, 'mist');
    const snowBlur = calculateCloudShadowBlurRadius(15.0, 0.6, 'snow');
    const rainBlur = calculateCloudShadowBlurRadius(15.0, 0.6, 'rain');

    assert.ok(mistBlur > clearBlur, `Mist (${mistBlur}) should disperse light wider than clear (${clearBlur})`);
    assert.ok(rainBlur > clearBlur, `Rain (${rainBlur}) should disperse light wider than clear (${clearBlur})`);
    assert.ok(snowBlur < clearBlur, `Alpine snow (${snowBlur}) should have crisper edges than clear (${clearBlur})`);
  });

  it('should include gaussianBlurRadius in CloudShadowOpticalConfig and CloudShadowDensityMetrics', () => {
    const opt = calculateCloudShadowOpticals(18.0, 'mist', 0.5);
    assert.ok(typeof opt.gaussianBlurRadius === 'number');
    assert.ok(opt.gaussianBlurRadius > 0);

    const metrics = calculateCloudShadowDensityMetrics(opt, 'mist');
    assert.ok(typeof metrics.gaussianBlurRadius === 'number');
    assert.equal(metrics.gaussianBlurRadius, Math.round(opt.gaussianBlurRadius * 10) / 10);
  });

  it('should apply Gaussian blur filter to canvas context and restore it to none', () => {
    const filterStates: string[] = [];
    let currentFilter = 'none';
    const mockCtx = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      ellipse: () => {},
      fill: () => {},
      get filter() {
        return currentFilter;
      },
      set filter(val: string) {
        currentFilter = val;
        filterStates.push(val);
      },
      globalAlpha: 1.0,
      fillStyle: '#000000',
    } as unknown as CanvasRenderingContext2D;

    const clouds: CloudShadowSource[] = [
      {
        x: 100,
        y: 80,
        speed: 1.0,
        layer: 'mid',
        alpha: 0.9,
        blobs: [{ ox: 0, oy: 0, r: 12 }],
      },
    ];

    const opt = calculateCloudShadowOpticals(10.0, 'mist', 0.5);
    const bounds: EarthPlanetBounds = {
      centerX: 240,
      centerY: 480,
      radius: 288,
      terrainHorizonY: 190,
    };

    renderCloudShadowLayer(mockCtx, clouds, opt, bounds, 1.0, 0);

    // Verify filter was set to blur and restored to none
    assert.ok(filterStates.some((f) => f.startsWith('blur(')), `Filter states should contain blur(): ${JSON.stringify(filterStates)}`);
    assert.equal(filterStates[filterStates.length - 1], 'none', 'Filter must be reset to none at the end');
  });
});
