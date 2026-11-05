/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_WEATHER_TYPES,
  createWeatherTransitionState,
  startWeatherTransition,
  updateWeatherTransition,
  normalizeWeights,
  smoothstep,
  easeInOutSine,
  WEATHER_TRANSITION_CONFIGS,
} from './weatherTransitionEngine';

describe('Atmospheric Weather Transition Engine', () => {
  it('should initialize with 100% weight on initial weather and inactive transition', () => {
    const state = createWeatherTransitionState('clear', 60);
    assert.equal(state.currentWeather, 'clear');
    assert.equal(state.targetWeather, 'clear');
    assert.equal(state.isTransitioning, false);
    assert.equal(state.progress, 1.0);
    assert.equal(state.blendWeights.clear, 1.0);
    assert.equal(state.blendWeights.rain, 0.0);
    assert.equal(state.blendWeights.snow, 0.0);
    assert.equal(state.blendWeights.mist, 0.0);
    assert.equal(state.blendWeights.aurora, 0.0);
    assert.equal(state.particles.length, 64);
  });

  it('should fallback cleanly on invalid weather type', () => {
    // @ts-expect-error testing invalid input
    const state = createWeatherTransitionState('invalid_weather', 60);
    assert.equal(state.currentWeather, 'clear');
    assert.equal(state.blendWeights.clear, 1.0);
  });

  it('should trigger transition and spawn atmospheric transition particles', () => {
    const state = createWeatherTransitionState('clear', 50);
    const triggered = startWeatherTransition(state, 'rain', 480, 300);
    assert.equal(triggered, true);
    assert.equal(state.isTransitioning, true);
    assert.equal(state.sourceWeather, 'clear');
    assert.equal(state.targetWeather, 'rain');
    assert.equal(state.progress, 0.0);
    assert.equal(state.frontActive, true);

    const activeParticles = state.particles.filter((p) => p.active);
    assert.ok(activeParticles.length > 0, 'Particles should be spawned for transition');
    assert.ok(activeParticles.every((p) => p.life === 0 && p.alpha > 0));
  });

  it('should not re-trigger transition if target is already identical and transitioning', () => {
    const state = createWeatherTransitionState('clear', 50);
    startWeatherTransition(state, 'snow', 480, 300);
    const duplicate = startWeatherTransition(state, 'snow', 480, 300);
    assert.equal(duplicate, false);
  });

  it('should advance progress and interpolate blend weights smoothly towards 1.0', () => {
    const state = createWeatherTransitionState('rain', 50);
    startWeatherTransition(state, 'snow', 480, 300);

    // Run half the duration
    for (let t = 0; t < 25; t++) {
      updateWeatherTransition(state, 1.0, 480, 300);
    }

    assert.ok(state.isTransitioning);
    assert.ok(state.progress > 0.4 && state.progress < 0.6, `Progress should be around 0.5: ${state.progress}`);
    assert.ok(state.blendWeights.snow > 0.3, `Snow weight should be rising: ${state.blendWeights.snow}`);
    assert.ok(state.blendWeights.rain > 0.3, `Rain weight should be fading: ${state.blendWeights.rain}`);

    // Run past full duration
    for (let t = 0; t < 35; t++) {
      updateWeatherTransition(state, 1.0, 480, 300);
    }

    assert.equal(state.isTransitioning, false);
    assert.equal(state.currentWeather, 'snow');
    assert.equal(state.targetWeather, 'snow');
    assert.equal(state.progress, 1.0);
    assert.equal(state.blendWeights.snow, 1.0);
    assert.equal(state.blendWeights.rain, 0.0);
  });

  it('should handle mid-transition redirection without abrupt snapping', () => {
    const state = createWeatherTransitionState('rain', 60);
    startWeatherTransition(state, 'snow', 480, 300);

    // Run a few ticks
    for (let t = 0; t < 20; t++) {
      updateWeatherTransition(state, 1.0, 480, 300);
    }

    // Mid-transition switch to aurora
    const redirected = startWeatherTransition(state, 'aurora', 480, 300);
    assert.equal(redirected, true);
    assert.equal(state.targetWeather, 'aurora');
    assert.equal(state.sourceWeather, 'snow');
    assert.equal(state.progress, 0.0);

    // Next tick should advance smoothly towards aurora
    updateWeatherTransition(state, 1.0, 480, 300);
    assert.ok(state.blendWeights.aurora >= 0);
  });

  it('should accurately calculate mathematical easing functions', () => {
    assert.equal(smoothstep(0, 1, 0), 0);
    assert.equal(smoothstep(0, 1, 1), 1);
    assert.equal(smoothstep(0, 1, 0.5), 0.5);
    assert.equal(easeInOutSine(0), 0);
    assert.equal(easeInOutSine(1), 1);
    assert.ok(Math.abs(easeInOutSine(0.5) - 0.5) < 0.01);
  });

  it('should normalize weights accurately across all weather types', () => {
    const normalized = normalizeWeights({
      clear: 2,
      rain: 2,
      snow: 0,
      mist: 0,
      aurora: 0,
    });
    assert.equal(normalized.clear, 0.5);
    assert.equal(normalized.rain, 0.5);
    assert.equal(normalized.snow, 0);

    const zeroFallback = normalizeWeights({
      clear: 0,
      rain: 0,
      snow: 0,
      mist: 0,
      aurora: 0,
    });
    assert.equal(zeroFallback.clear, 1);
  });

  it('should have valid transition configs for every weather type', () => {
    for (const w of ALL_WEATHER_TYPES) {
      const cfg = WEATHER_TRANSITION_CONFIGS[w];
      assert.ok(cfg, `Config for ${w} must exist`);
      assert.ok(cfg.particlePalette.length > 0);
      assert.ok(cfg.particleKinds.length > 0);
      assert.ok(typeof cfg.frontGlowColor === 'string');
      assert.ok(typeof cfg.descriptionKo === 'string');
      assert.ok(typeof cfg.descriptionEn === 'string');
    }
  });
});
