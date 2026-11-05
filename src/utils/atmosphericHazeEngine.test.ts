import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAtmosphericHaze,
  renderAtmosphericHazeCanvas,
  WEATHER_HAZE_PROFILES,
} from './atmosphericHazeEngine.js';
import { WeatherType } from './descentEngine.js';

describe('Atmospheric Haze Filter & Optical Depth Engine', () => {
  it('calculateAtmosphericHaze should return near-zero haze and sharp clarity at high altitude (cycleProgress=0.0)', () => {
    const highSpaceHaze = calculateAtmosphericHaze(0.0, 'clear');

    assert.equal(highSpaceHaze.hazeFactor, 0.0);
    assert.equal(highSpaceHaze.blurPx, 0.0);
    assert.equal(highSpaceHaze.contrastPercent, 100);
    assert.equal(highSpaceHaze.brightnessPercent, 100);
    assert.equal(highSpaceHaze.saturationPercent, 100);
    assert.equal(highSpaceHaze.veilAlpha, 0.0);
    assert.equal(highSpaceHaze.cssFilter, 'none');
    assert.ok(highSpaceHaze.altitudeKm >= 135.0);
  });

  it('calculateAtmosphericHaze should return pronounced haze and visual depth at ground level (cycleProgress=1.0)', () => {
    const surfaceHaze = calculateAtmosphericHaze(1.0, 'mist');

    assert.ok(surfaceHaze.hazeFactor > 0.85);
    assert.ok(surfaceHaze.blurPx > 0.4);
    assert.ok(surfaceHaze.contrastPercent < 90);
    assert.ok(surfaceHaze.veilAlpha > 0.2);
    assert.ok(surfaceHaze.altitudeKm <= 2.0);
    assert.notEqual(surfaceHaze.cssFilter, 'none');
    assert.match(surfaceHaze.cssFilter, /blur|contrast/);
  });

  it('calculateAtmosphericHaze should differentiate weather profiles correctly', () => {
    const progress = 0.85; // Low troposphere

    const mistHaze = calculateAtmosphericHaze(progress, 'mist');
    const rainHaze = calculateAtmosphericHaze(progress, 'rain');
    const snowHaze = calculateAtmosphericHaze(progress, 'snow');
    const clearHaze = calculateAtmosphericHaze(progress, 'clear');
    const auroraHaze = calculateAtmosphericHaze(progress, 'aurora');

    // Mist should have the heaviest haze and lowest contrast
    assert.ok(mistHaze.hazeFactor > rainHaze.hazeFactor);
    assert.ok(rainHaze.hazeFactor > snowHaze.hazeFactor);
    assert.ok(snowHaze.hazeFactor > clearHaze.hazeFactor);
    assert.ok(clearHaze.contrastPercent > mistHaze.contrastPercent);

    // Weather specific veil RGB palettes
    assert.deepEqual(mistHaze.veilRgb, WEATHER_HAZE_PROFILES.mist.veilRgb);
    assert.deepEqual(rainHaze.veilRgb, WEATHER_HAZE_PROFILES.rain.veilRgb);
    assert.deepEqual(snowHaze.veilRgb, WEATHER_HAZE_PROFILES.snow.veilRgb);
    assert.deepEqual(auroraHaze.veilRgb, WEATHER_HAZE_PROFILES.aurora.veilRgb);
    assert.deepEqual(clearHaze.veilRgb, WEATHER_HAZE_PROFILES.clear.veilRgb);
  });

  it('calculateAtmosphericHaze should handle negative, NaN, and extreme values resiliently', () => {
    const fromNaN = calculateAtmosphericHaze(NaN, 'clear');
    assert.ok(Number.isFinite(fromNaN.hazeFactor));
    assert.ok(Number.isFinite(fromNaN.blurPx));

    const fromNegative = calculateAtmosphericHaze(-0.75, 'clear');
    assert.ok(fromNegative.hazeFactor >= 0.0 && fromNegative.hazeFactor <= 1.0);

    const fromExtreme = calculateAtmosphericHaze(9999.85, 'mist');
    assert.ok(fromExtreme.hazeFactor >= 0.0 && fromExtreme.hazeFactor <= 1.0);

    // Invalid weather fallback
    // @ts-expect-error Testing invalid runtime weather fallback
    const fallbackWeather = calculateAtmosphericHaze(0.5, 'invalid_weather');
    assert.ok(fallbackWeather.hazeFactor >= 0.0);
  });

  it('calculateAtmosphericHaze should scale with custom atmosphere settings', () => {
    const standardHaze = calculateAtmosphericHaze(0.7, 'clear', {
      cloudDensityScale: 1.0,
      windSpeedScale: 1.0,
      shakeIntensityScale: 1.0,
      auroraVibrancyScale: 1.0,
      starTwinkleSpeed: 1.0,
      crtScanlineIntensity: 0.22,
      showPixelGrid: false,
      cinemaBars: false,
    });

    const amplifiedHaze = calculateAtmosphericHaze(0.7, 'clear', {
      cloudDensityScale: 2.0,
      windSpeedScale: 1.0,
      shakeIntensityScale: 1.0,
      auroraVibrancyScale: 1.0,
      starTwinkleSpeed: 1.0,
      crtScanlineIntensity: 0.22,
      showPixelGrid: false,
      cinemaBars: false,
    });

    assert.ok(amplifiedHaze.hazeFactor > standardHaze.hazeFactor);
  });

  it('renderAtmosphericHazeCanvas should skip rendering at high altitude (vacuum)', () => {
    let fillRectCalled = false;
    const fakeCtx = {
      save: () => {},
      restore: () => {},
      createLinearGradient: () => ({
        addColorStop: () => {},
      }),
      fillRect: () => {
        fillRectCalled = true;
      },
    } as unknown as CanvasRenderingContext2D;

    const highSpaceConfig = calculateAtmosphericHaze(0.0, 'clear');
    renderAtmosphericHazeCanvas(fakeCtx, 480, 300, highSpaceConfig, 0);

    assert.equal(fillRectCalled, false);
  });

  it('renderAtmosphericHazeCanvas should draw atmospheric gradient veil at low altitudes', () => {
    let fillRectCalls = 0;
    const fakeCtx = {
      save: () => {},
      restore: () => {},
      createLinearGradient: () => ({
        addColorStop: () => {},
      }),
      fillRect: () => {
        fillRectCalls++;
      },
    } as unknown as CanvasRenderingContext2D;

    const surfaceMistConfig = calculateAtmosphericHaze(0.95, 'mist');
    renderAtmosphericHazeCanvas(fakeCtx, 480, 300, surfaceMistConfig, 100);

    assert.ok(fillRectCalls >= 1);
  });
});
