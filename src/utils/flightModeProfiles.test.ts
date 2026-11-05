import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILT_IN_FLIGHT_PROFILES,
  STORAGE_PROFILES_KEY,
  sanitizeFlightProfile,
  loadAllFlightModeProfiles,
  loadCustomProfilesFromStorage,
  saveCustomFlightProfile,
  deleteCustomFlightProfile,
  findMatchingFlightProfile,
  FlightModeProfile,
} from './flightModeProfiles.js';
import { DEFAULT_USER_SETTINGS, UserSettingsProfile } from './settingsStorage.js';

// In-memory mock localStorage
const mockStorage = new Map<string, string>();
const fakeLocalStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => { mockStorage.set(key, String(value)); },
  removeItem: (key: string) => { mockStorage.delete(key); },
  clear: () => { mockStorage.clear(); },
};

describe('Flight Mode Profiles Engine', () => {
  beforeEach(() => {
    mockStorage.clear();
    // @ts-expect-error Mocking window.localStorage for test
    globalThis.window = { localStorage: fakeLocalStorage };
  });

  it('BUILT_IN_FLIGHT_PROFILES should contain 4 distinctive presets with valid configurations', () => {
    assert.equal(BUILT_IN_FLIGHT_PROFILES.length, 4);

    const cinematic = BUILT_IN_FLIGHT_PROFILES.find((p) => p.tag === 'CINEMATIC');
    assert.ok(cinematic);
    assert.equal(cinematic.settings.particleBudget, 'ultra');
    assert.equal(cinematic.settings.fpsLimit, 0); // Uncapped

    const performance = BUILT_IN_FLIGHT_PROFILES.find((p) => p.tag === 'PERFORMANCE');
    assert.ok(performance);
    assert.equal(performance.settings.particleBudget, 'low');
    assert.equal(performance.settings.bloomGlow, false);
    assert.equal(performance.settings.screenShake, 0.0);

    const retro = BUILT_IN_FLIGHT_PROFILES.find((p) => p.tag === 'RETRO');
    assert.ok(retro);
    assert.equal(retro.settings.crtScanlines, true);
    assert.ok(retro.settings.screenShake > 0.5);

    const zen = BUILT_IN_FLIGHT_PROFILES.find((p) => p.tag === 'ZEN');
    assert.ok(zen);
    assert.equal(zen.settings.isMuted, true);
    assert.equal(zen.settings.autoHideHud, true);
  });

  it('sanitizeFlightProfile should recover safely from null or corrupted objects', () => {
    assert.equal(sanitizeFlightProfile(null), null);
    assert.equal(sanitizeFlightProfile('corrupted_string'), null);
    assert.equal(sanitizeFlightProfile({}), null); // Missing id

    const validRaw = {
      id: 'test-custom-1',
      name: 'My Special Night Flight',
      settings: {
        ...DEFAULT_USER_SETTINGS,
        particleBudget: 'ultra',
      },
    };
    const sanitized = sanitizeFlightProfile(validRaw);
    assert.ok(sanitized);
    assert.equal(sanitized.id, 'test-custom-1');
    assert.equal(sanitized.name, 'My Special Night Flight');
    assert.equal(sanitized.settings.particleBudget, 'ultra');
  });

  it('saveCustomFlightProfile and deleteCustomFlightProfile should manage custom profiles in storage', () => {
    const customSettings: UserSettingsProfile = {
      ...DEFAULT_USER_SETTINGS,
      particleBudget: 'low',
      screenShake: 0.2,
      isMuted: true,
    };

    const saved = saveCustomFlightProfile('Eco Low Power', customSettings, 'Battery saving custom configuration');
    assert.ok(saved.id.startsWith('custom-profile-'));
    assert.equal(saved.name, 'Eco Low Power');
    assert.equal(saved.tag, 'CUSTOM');
    assert.equal(saved.isBuiltIn, false);

    // Verify stored profiles
    const customList = loadCustomProfilesFromStorage();
    assert.equal(customList.length, 1);
    assert.equal(customList[0].id, saved.id);

    // Verify all profiles list includes both built-in (4) and custom (1)
    const allProfiles = loadAllFlightModeProfiles();
    assert.equal(allProfiles.length, 5);

    // Deleting built-in profile should fail and be rejected
    const deleteBuiltInResult = deleteCustomFlightProfile('profile-cinematic');
    assert.equal(deleteBuiltInResult, false);

    // Deleting custom profile should succeed
    const deleteCustomResult = deleteCustomFlightProfile(saved.id);
    assert.equal(deleteCustomResult, true);
    assert.equal(loadCustomProfilesFromStorage().length, 0);
  });

  it('findMatchingFlightProfile should accurately detect matching profile', () => {
    const allProfiles = loadAllFlightModeProfiles();
    const cinematicPreset = BUILT_IN_FLIGHT_PROFILES.find((p) => p.tag === 'CINEMATIC')!;

    const match = findMatchingFlightProfile(cinematicPreset.settings, allProfiles);
    assert.ok(match);
    assert.equal(match.id, cinematicPreset.id);

    // Modified settings should not match
    const modifiedSettings: UserSettingsProfile = {
      ...cinematicPreset.settings,
      particleBudget: 'low',
    };
    const noMatch = findMatchingFlightProfile(modifiedSettings, allProfiles);
    assert.notEqual(noMatch?.id, cinematicPreset.id);
  });
});
