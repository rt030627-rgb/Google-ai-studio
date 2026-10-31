import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TRANSLATIONS, t, getInitialLanguage, saveLanguage, STORAGE_LANG_KEY } from './i18n.js';

describe('i18n Translation Engine', () => {
  it('should have parity across all keys between English and Korean dictionaries', () => {
    const enKeys = Object.keys(TRANSLATIONS.en).sort();
    const koKeys = Object.keys(TRANSLATIONS.ko).sort();

    assert.deepEqual(enKeys, koKeys, 'EN and KO dictionaries must have identical keys');
  });

  it('should translate correctly for English and Korean keys', () => {
    assert.equal(t('altitudeKm', 'en'), 'ALTITUDE');
    assert.equal(t('altitudeKm', 'ko'), '고도');
    assert.equal(t('rings', 'en'), 'STARDUST RINGS');
    assert.equal(t('rings', 'ko'), '스타더스트 링');
  });

  it('should fallback gracefully to English if invalid language is provided', () => {
    // @ts-expect-error Testing runtime fallback
    assert.equal(t('appTitle', 'fr'), 'GEMINI PIXEL DESCENT');
  });

  it('should handle getInitialLanguage with fallback', () => {
    const lang = getInitialLanguage();
    assert.ok(lang === 'en' || lang === 'ko');
  });
});
