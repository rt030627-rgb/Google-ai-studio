import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_USER_SETTINGS,
  sanitizeSettings,
  clamp,
  getMaxParticleCount,
  type UserSettingsProfile,
} from './settingsStorage.js';

test('Settings Storage Engine', async (t) => {
  await t.test('clamp should restrict values within bounds and fallback on NaN', () => {
    assert.equal(clamp(0.5, 0, 1, 0.7), 0.5);
    assert.equal(clamp(-0.5, 0, 1, 0.7), 0);
    assert.equal(clamp(2.5, 0, 1, 0.7), 1);
    assert.equal(clamp(NaN, 0, 1, 0.7), 0.7);
    assert.equal(clamp('invalid', 0, 1, 0.7), 0.7);
    assert.equal(clamp(Infinity, 0, 1, 0.7), 0.7);
  });

  await t.test('sanitizeSettings should recover gracefully from null or invalid object', () => {
    const fromNull = sanitizeSettings(null);
    assert.deepEqual(fromNull, DEFAULT_USER_SETTINGS);

    const fromString = sanitizeSettings('corrupted_json');
    assert.deepEqual(fromString, DEFAULT_USER_SETTINGS);
  });

  await t.test('sanitizeSettings should enforce valid ranges and types on partially malformed settings', () => {
    const malformed = {
      masterVolume: 999, // Should clamp to 1.0
      windVolume: -5,    // Should clamp to 0.0
      particleBudget: 'hyper_warp_extreme', // Invalid budget -> fallback to balanced
      crtScanlines: 'true', // Not boolean -> fallback to true
      fpsLimit: 144, // Invalid target -> fallback to 60
    };

    const sanitized = sanitizeSettings(malformed);
    assert.equal(sanitized.masterVolume, 1.0);
    assert.equal(sanitized.windVolume, 0.0);
    assert.equal(sanitized.particleBudget, 'balanced');
    assert.equal(sanitized.crtScanlines, true);
    assert.equal(sanitized.fpsLimit, 60);
    assert.equal(sanitized.screenShake, DEFAULT_USER_SETTINGS.screenShake);
  });

  await t.test('sanitizeSettings should preserve valid customized settings', () => {
    const custom: UserSettingsProfile = {
      masterVolume: 0.35,
      windVolume: 0.4,
      radioVolume: 0.25,
      sfxVolume: 0.9,
      isMuted: true,
      muteOnBlur: false,
      particleBudget: 'ultra',
      screenShake: 0.2,
      crtScanlines: false,
      bloomGlow: false,
      fpsLimit: 30,
      reduceMotion: true,
      autoHideHud: false,
    };

    const sanitized = sanitizeSettings(custom);
    assert.deepEqual(sanitized, custom);
  });

  await t.test('getMaxParticleCount should return correct budget limits', () => {
    assert.equal(getMaxParticleCount('low'), 18);
    assert.equal(getMaxParticleCount('balanced'), 45);
    assert.equal(getMaxParticleCount('ultra'), 95);
    // @ts-expect-error test fallback
    assert.equal(getMaxParticleCount('unknown'), 45);
  });
});
