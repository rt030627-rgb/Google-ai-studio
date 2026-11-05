/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CINEMATIC_VIEWPOINTS,
  loadAllViewpoints,
  createCustomViewpoint,
  deleteCustomViewpoint,
  getPhaseTagFromProgress,
  getViewpointBadgeSummary,
  loadCustomViewpointsFromStorage,
  saveCustomViewpointsToStorage,
  resetCustomViewpoints,
  STORAGE_VIEWPOINTS_KEY,
} from './viewpointEngine.ts';
import { DEFAULT_ATMOSPHERE_SETTINGS } from './descentEngine.ts';

// Mock localStorage in Node environment
const mockStorage: Record<string, string> = {};
if (typeof globalThis.window === 'undefined') {
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        for (const k in mockStorage) delete mockStorage[k];
      },
    },
  };
}

test('DEFAULT_CINEMATIC_VIEWPOINTS contains valid iconic presets', () => {
  assert.equal(DEFAULT_CINEMATIC_VIEWPOINTS.length >= 5, true);

  for (const vp of DEFAULT_CINEMATIC_VIEWPOINTS) {
    assert.equal(typeof vp.id, 'string');
    assert.equal(typeof vp.name, 'string');
    assert.equal(vp.isPreset, true);
    assert.equal(vp.cycleProgress >= 0 && vp.cycleProgress <= 1, true);
    assert.equal(['auto', 'clear', 'rain', 'snow', 'mist', 'aurora'].includes(vp.weatherMode), true);
    assert.equal(['cinematic', 'normal', 'mach'].includes(vp.speedMode), true);
    assert.equal(typeof vp.atmosphereSettings.cloudDensityScale, 'number');
  }
});

test('getPhaseTagFromProgress correctly categorizes cycle progress into 4 phases', () => {
  assert.equal(getPhaseTagFromProgress(0.05), '새벽');
  assert.equal(getPhaseTagFromProgress(0.20), '새벽');
  assert.equal(getPhaseTagFromProgress(0.35), '골든아워');
  assert.equal(getPhaseTagFromProgress(0.60), '트와일라잇');
  assert.equal(getPhaseTagFromProgress(0.85), '미드나잇');
});

test('createCustomViewpoint generates new custom viewpoint and saves to storage', () => {
  resetCustomViewpoints();

  const newVp = createCustomViewpoint({
    name: '나만의 사이버 네온 관측소',
    cycleProgress: 0.65,
    weatherMode: 'aurora',
    speedMode: 'cinematic',
    atmosphereSettings: {
      ...DEFAULT_ATMOSPHERE_SETTINGS,
      auroraVibrancyScale: 1.9,
    },
    showScanlines: true,
    showStarTrails: true,
    showTrajectoryLine: true,
  });

  assert.equal(newVp.name, '나만의 사이버 네온 관측소');
  assert.equal(newVp.isPreset, false);
  assert.equal(newVp.tag, '트와일라잇');
  assert.equal(newVp.weatherMode, 'aurora');
  assert.equal(newVp.speedMode, 'cinematic');
  assert.equal(newVp.atmosphereSettings.auroraVibrancyScale, 1.9);

  const stored = loadCustomViewpointsFromStorage();
  assert.equal(stored.length, 1);
  assert.equal(stored[0].id, newVp.id);

  const all = loadAllViewpoints();
  assert.equal(all.length, DEFAULT_CINEMATIC_VIEWPOINTS.length + 1);
  assert.equal(all[all.length - 1].id, newVp.id);
});

test('deleteCustomViewpoint deletes user viewpoints but protects built-in presets', () => {
  resetCustomViewpoints();

  const newVp = createCustomViewpoint({
    name: '삭제 테스트 뷰포인트',
    cycleProgress: 0.15,
    weatherMode: 'mist',
    speedMode: 'normal',
    atmosphereSettings: DEFAULT_ATMOSPHERE_SETTINGS,
    showScanlines: false,
    showStarTrails: false,
    showTrajectoryLine: false,
  });

  // Attempt to delete built-in preset -> must return false
  const presetDeleteResult = deleteCustomViewpoint('preset-twilight-aurora');
  assert.equal(presetDeleteResult, false);

  // Attempt to delete custom viewpoint -> must return true
  const customDeleteResult = deleteCustomViewpoint(newVp.id);
  assert.equal(customDeleteResult, true);

  const stored = loadCustomViewpointsFromStorage();
  assert.equal(stored.length, 0);
});

test('getViewpointBadgeSummary returns correct formatted badges', () => {
  const vp = DEFAULT_CINEMATIC_VIEWPOINTS[0];
  const summary = getViewpointBadgeSummary(vp);

  assert.equal(summary.phaseLabel, '트와일라잇');
  assert.equal(summary.weatherLabel, '오로라');
  assert.equal(summary.speedLabel, '느리게');
  assert.equal(summary.hasCinemaBars, true);
});

test('loadCustomViewpointsFromStorage recovers safely from corrupted JSON', () => {
  mockStorage[STORAGE_VIEWPOINTS_KEY] = 'INVALID_JSON_CORRUPTED{[';
  const loaded = loadCustomViewpointsFromStorage();
  assert.deepEqual(loaded, []);
});
