/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialOrbitalZoomState,
  calculateOrbitalZoomFrame,
  updateOrbitalZoomState,
  easeOrbitalZoom,
  generateWarpStreakLines,
  DEFAULT_ORBITAL_ZOOM_CONFIG,
} from './cinematicOrbitalZoomEngine.ts';

describe('Cinematic 3D Orbital Zoom Engine', () => {
  it('createInitialOrbitalZoomState should initialize inactive state by default', () => {
    const idle = createInitialOrbitalZoomState(false);
    assert.equal(idle.isActive, false);
    assert.equal(idle.progress, 1.0);
    assert.equal(idle.phase, 'settled');
    assert.equal(idle.scale, 1.0);
    assert.equal(idle.altitudeKm, 12);
  });

  it('createInitialOrbitalZoomState should initialize active space orbit state when triggered', () => {
    const active = createInitialOrbitalZoomState(true, 101, 3600);
    assert.equal(active.isActive, true);
    assert.equal(active.triggerId, 101);
    assert.equal(active.durationMs, 3600);
    assert.equal(active.progress, 0.0);
    assert.equal(active.phase, 'space_orbit');
    assert.equal(active.scale, DEFAULT_ORBITAL_ZOOM_CONFIG.startScale);
    assert.equal(active.altitudeKm, DEFAULT_ORBITAL_ZOOM_CONFIG.initialAltitudeKm);
  });

  it('easeOrbitalZoom should be bounded between 0 and 1 with monotonic acceleration', () => {
    assert.equal(easeOrbitalZoom(0), 0);
    assert.equal(easeOrbitalZoom(1), 1);
    assert.equal(easeOrbitalZoom(0.5), 0.5);

    let prev = 0;
    for (let t = 0.05; t <= 1.0; t += 0.05) {
      const curr = easeOrbitalZoom(t);
      assert.ok(curr >= prev, `Expected ${curr} >= ${prev} at t=${t}`);
      prev = curr;
    }
  });

  it('calculateOrbitalZoomFrame should correctly traverse all four phases', () => {
    // 1. Space Orbit (p = 0.1)
    const spaceFrame = calculateOrbitalZoomFrame(0.1);
    assert.equal(spaceFrame.phase, 'space_orbit');
    assert.ok(spaceFrame.altitudeKm > 250);
    assert.ok(spaceFrame.scale < 0.45);
    assert.ok(spaceFrame.pitch < -0.05); // tilted downward
    assert.equal(spaceFrame.warpStreakIntensity, 0);

    // 2. Atmospheric Re-entry (p = 0.55)
    const reentryFrame = calculateOrbitalZoomFrame(0.55);
    assert.equal(reentryFrame.phase, 'atmospheric_reentry');
    assert.ok(reentryFrame.altitudeKm < 150 && reentryFrame.altitudeKm > 20);
    assert.ok(reentryFrame.scale > 0.6);
    assert.ok(reentryFrame.warpStreakIntensity > 0.5); // Peak warp streaks
    assert.ok(reentryFrame.plasmaReentryHeatAlpha > 0.5); // Peak re-entry plasma

    // 3. Cloud Breakthrough (p = 0.88)
    const cloudFrame = calculateOrbitalZoomFrame(0.88);
    assert.equal(cloudFrame.phase, 'cloud_breakthrough');
    assert.ok(cloudFrame.altitudeKm <= 25);
    assert.ok(cloudFrame.cloudVaporAlpha > 0.4); // Condensation mist peaks
    assert.ok(cloudFrame.scale >= 0.98);

    // 4. Settled Cruise (p = 1.0)
    const settledFrame = calculateOrbitalZoomFrame(1.0);
    assert.equal(settledFrame.phase, 'settled');
    assert.equal(settledFrame.altitudeKm, 12);
    assert.equal(settledFrame.scale, 1.0);
    assert.equal(settledFrame.pitch, 0); // Level horizon
    assert.equal(settledFrame.warpStreakIntensity, 0);
    assert.equal(settledFrame.plasmaReentryHeatAlpha, 0);
    assert.equal(settledFrame.cloudVaporAlpha, 0);
  });

  it('altitude should decrease monotonically throughout the zoom sequence', () => {
    let lastAlt = 999;
    for (let step = 0; step <= 20; step++) {
      const p = step / 20;
      const frame = calculateOrbitalZoomFrame(p);
      assert.ok(
        frame.altitudeKm <= lastAlt,
        `Expected alt ${frame.altitudeKm} <= ${lastAlt} at progress ${p}`
      );
      lastAlt = frame.altitudeKm;
    }
    assert.equal(lastAlt, 12);
  });

  it('updateOrbitalZoomState should increment progress and terminate at 1.0', () => {
    let state = createInitialOrbitalZoomState(true, 1, 2000);
    assert.equal(state.isActive, true);

    // Step by 500ms
    state = updateOrbitalZoomState(state, 500);
    assert.equal(state.isActive, true);
    assert.equal(state.progress, 0.25);

    // Step another 1000ms (1500ms total, 75%)
    state = updateOrbitalZoomState(state, 1000);
    assert.equal(state.isActive, true);
    assert.equal(state.progress, 0.75);

    // Step another 600ms (2100ms total -> should complete)
    state = updateOrbitalZoomState(state, 600);
    assert.equal(state.isActive, false);
    assert.equal(state.progress, 1.0);
    assert.equal(state.phase, 'settled');
  });

  it('generateWarpStreakLines should return valid radial streaks', () => {
    const streaks = generateWarpStreakLines(24, 480, 300);
    assert.equal(streaks.length, 24);
    for (const s of streaks) {
      assert.ok(s.angle >= 0 && s.angle <= Math.PI * 2 + 1);
      assert.ok(s.maxR > s.minR);
      assert.ok(s.speed > 0);
      assert.ok(s.alpha > 0);
    }
  });
});
