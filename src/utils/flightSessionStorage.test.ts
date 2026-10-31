import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeFlightSession,
  DEFAULT_FLIGHT_SESSION,
  FLIGHT_SESSION_STORAGE_KEY,
  loadSavedFlightSession,
  saveFlightSession,
  clearSavedFlightSession,
  hasSavedFlightSession,
  SavedFlightSession,
} from './flightSessionStorage.js';

// In-memory localStorage mock for node test runner environment
const mockStorage = new Map<string, string>();
const fakeLocalStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => { mockStorage.set(key, String(value)); },
  removeItem: (key: string) => { mockStorage.delete(key); },
  clear: () => { mockStorage.clear(); },
};

describe('Flight Session Storage Engine', () => {
  beforeEach(() => {
    mockStorage.clear();
    // @ts-expect-error Mocking window.localStorage for test
    globalThis.window = { localStorage: fakeLocalStorage };
  });

  it('sanitizeFlightSession should recover with default session when given null or invalid inputs', () => {
    const fromNull = sanitizeFlightSession(null);
    assert.equal(fromNull.cycleProgress, DEFAULT_FLIGHT_SESSION.cycleProgress);
    assert.equal(fromNull.speedMode, DEFAULT_FLIGHT_SESSION.speedMode);
    assert.equal(fromNull.weatherMode, DEFAULT_FLIGHT_SESSION.weatherMode);
    assert.equal(fromNull.viewLayout, DEFAULT_FLIGHT_SESSION.viewLayout);

    const fromString = sanitizeFlightSession('corrupted_string');
    assert.equal(fromString.cycleProgress, DEFAULT_FLIGHT_SESSION.cycleProgress);
  });

  it('sanitizeFlightSession should clamp cycleProgress between 0.0 and 1.0', () => {
    const underflow = sanitizeFlightSession({ cycleProgress: -0.8 });
    assert.equal(underflow.cycleProgress, 0.0);

    const overflow = sanitizeFlightSession({ cycleProgress: 2.5 });
    assert.equal(overflow.cycleProgress, 1.0);

    const nanValue = sanitizeFlightSession({ cycleProgress: NaN });
    assert.equal(nanValue.cycleProgress, DEFAULT_FLIGHT_SESSION.cycleProgress);

    const valid = sanitizeFlightSession({ cycleProgress: 0.73 });
    assert.equal(valid.cycleProgress, 0.73);
  });

  it('sanitizeFlightSession should validate and normalize enum values', () => {
    const invalidEnums = sanitizeFlightSession({
      speedMode: 'hypersonic_invalid',
      weatherMode: 'tornado_invalid',
      viewLayout: 'vr_mode_invalid',
    });

    assert.equal(invalidEnums.speedMode, DEFAULT_FLIGHT_SESSION.speedMode);
    assert.equal(invalidEnums.weatherMode, DEFAULT_FLIGHT_SESSION.weatherMode);
    assert.equal(invalidEnums.viewLayout, DEFAULT_FLIGHT_SESSION.viewLayout);

    const validEnums = sanitizeFlightSession({
      speedMode: 'mach',
      weatherMode: 'snow',
      viewLayout: 'split-radar',
    });

    assert.equal(validEnums.speedMode, 'mach');
    assert.equal(validEnums.weatherMode, 'snow');
    assert.equal(validEnums.viewLayout, 'split-radar');
  });

  it('sanitizeFlightSession should clamp custom atmosphere settings safely', () => {
    const session = sanitizeFlightSession({
      atmosphereSettings: {
        cloudDensityScale: 999, // Should clamp to max 2.0
        windSpeedScale: -50,   // Should clamp to min 0.2
        shakeIntensityScale: 10, // Should clamp to max 2.0
      },
    });

    assert.equal(session.atmosphereSettings.cloudDensityScale, 2.0);
    assert.equal(session.atmosphereSettings.windSpeedScale, 0.2);
    assert.equal(session.atmosphereSettings.shakeIntensityScale, 2.0);
  });

  it('saveFlightSession and loadSavedFlightSession should persist and restore session faithfully', () => {
    const testSession: SavedFlightSession = {
      cycleProgress: 0.85,
      isAutoCycle: false,
      speedMode: 'mach',
      weatherMode: 'aurora',
      atmosphereSettings: {
        cloudDensityScale: 1.4,
        windSpeedScale: 1.2,
        shakeIntensityScale: 0.9,
        auroraVibrancyScale: 1.8,
        starTwinkleSpeed: 1.5,
        crtScanlineIntensity: 0.4,
        showPixelGrid: false,
        cinemaBars: true,
      },
      viewLayout: 'cinematic',
      showScanlines: true,
      showStarTrails: false,
      showTrajectoryLine: true,
      gliderFlightEnabled: true,
      starChartEnabled: true,
      arcadeModeEnabled: false,
      activeViewpointId: 'vp-midnight-aurora',
      savedAt: 123456789,
      version: 1,
    };

    assert.equal(hasSavedFlightSession(), false);
    const saveSuccess = saveFlightSession(testSession);
    assert.equal(saveSuccess, true);
    assert.equal(hasSavedFlightSession(), true);

    const loaded = loadSavedFlightSession();
    assert.ok(loaded);
    assert.equal(loaded.cycleProgress, 0.85);
    assert.equal(loaded.isAutoCycle, false);
    assert.equal(loaded.speedMode, 'mach');
    assert.equal(loaded.weatherMode, 'aurora');
    assert.equal(loaded.viewLayout, 'cinematic');
    assert.equal(loaded.gliderFlightEnabled, true);
    assert.equal(loaded.starChartEnabled, true);
    assert.equal(loaded.activeViewpointId, 'vp-midnight-aurora');

    // Clear session test
    const clearSuccess = clearSavedFlightSession();
    assert.equal(clearSuccess, true);
    assert.equal(hasSavedFlightSession(), false);
    assert.equal(loadSavedFlightSession(), null);
  });

  it('loadSavedFlightSession should recover gracefully from corrupted JSON', () => {
    fakeLocalStorage.setItem(FLIGHT_SESSION_STORAGE_KEY, '{ invalid_malformed_json :::');
    const result = loadSavedFlightSession();
    assert.equal(result, null);
  });
});
