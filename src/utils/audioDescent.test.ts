import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  AUDIO_CHANNELS,
  getCurrentAudioChannel,
  setAudioChannel,
  WEATHER_AUDIO_PROFILES,
  getWeatherAudioMode,
  setWeatherAudioMode,
  getWeatherAudioProfile,
  getWeatherFxIntensity,
  setWeatherFxIntensity,
  getSpatialPannerWidth,
  setSpatialPannerWidth,
  playSpatialThunderclap,
  playThunderclapSound,
  playAuroraHarmonyChord,
} from './audioDescent.ts';
import { WeatherType } from './descentEngine.ts';

describe('Cosmic Lo-Fi Synth Radio Channels', () => {
  it('should provide exactly 3 well-defined radio channels', () => {
    assert.strictEqual(AUDIO_CHANNELS.length, 3);
    const channelIds = AUDIO_CHANNELS.map((ch) => ch.id);
    assert.ok(channelIds.includes('deep_space'));
    assert.ok(channelIds.includes('lofi_stardust'));
    assert.ok(channelIds.includes('cyber_tempest'));
  });

  it('should default to deep_space channel', () => {
    const current = getCurrentAudioChannel();
    assert.strictEqual(typeof current, 'string');
  });

  it('should allow switching between radio channels safely', () => {
    setAudioChannel('lofi_stardust');
    assert.strictEqual(getCurrentAudioChannel(), 'lofi_stardust');

    setAudioChannel('cyber_tempest');
    assert.strictEqual(getCurrentAudioChannel(), 'cyber_tempest');

    setAudioChannel('deep_space');
    assert.strictEqual(getCurrentAudioChannel(), 'deep_space');
  });

  it('should have descriptive metadata and hex color for each channel', () => {
    for (const channel of AUDIO_CHANNELS) {
      assert.ok(channel.name.length > 0);
      assert.ok(channel.tagline.length > 0);
      assert.ok(channel.color.startsWith('#'));
      assert.ok(channel.freqDescriptor.length > 0);
    }
  });
});

describe('Weather 3D Spatial Audio & DSP Filter Engine', () => {
  const weathers: WeatherType[] = ['rain', 'aurora', 'snow', 'mist', 'clear'];

  it('should define sound profiles for all 5 weather modes', () => {
    for (const w of weathers) {
      const profile = WEATHER_AUDIO_PROFILES[w];
      assert.ok(profile, `Profile for weather '${w}' must exist`);
      assert.strictEqual(profile.id, w);
      assert.ok(profile.cutoffFreq > 0, 'Cutoff frequency must be positive');
      assert.ok(profile.filterQ > 0, 'Filter resonance Q must be positive');
      assert.ok(profile.dspDescription.length > 0, 'DSP description must be provided');
      assert.ok(profile.koreanName.length > 0, 'Korean name must be provided');
    }
  });

  it('rain profile should enable thunder and lowpass filter', () => {
    const rain = WEATHER_AUDIO_PROFILES.rain;
    assert.strictEqual(rain.filterType, 'lowpass');
    assert.strictEqual(rain.hasThunder, true);
    assert.strictEqual(rain.hasAuroraHarmony, false);
    assert.ok(rain.windGainMod > 1.0, 'Rain should amplify stormy wind noise');
  });

  it('aurora profile should enable multi-voice synth harmony and peaking filter', () => {
    const aurora = WEATHER_AUDIO_PROFILES.aurora;
    assert.strictEqual(aurora.filterType, 'peaking');
    assert.strictEqual(aurora.hasThunder, false);
    assert.strictEqual(aurora.hasAuroraHarmony, true);
  });

  it('snow profile should have dampening lowpass filter', () => {
    const snow = WEATHER_AUDIO_PROFILES.snow;
    assert.strictEqual(snow.filterType, 'lowpass');
    assert.strictEqual(snow.hasThunder, false);
    assert.strictEqual(snow.hasAuroraHarmony, false);
    assert.ok(snow.cutoffFreq < 300, 'Snow should dampen higher frequencies');
  });

  it('mist profile should have bandpass filter characteristics', () => {
    const mist = WEATHER_AUDIO_PROFILES.mist;
    assert.strictEqual(mist.filterType, 'bandpass');
  });

  it('should switch and query active weather audio mode safely', () => {
    setWeatherAudioMode('rain');
    assert.strictEqual(getWeatherAudioMode(), 'rain');
    assert.strictEqual(getWeatherAudioProfile('rain').id, 'rain');

    setWeatherAudioMode('aurora');
    assert.strictEqual(getWeatherAudioMode(), 'aurora');
    assert.strictEqual(getWeatherAudioProfile('aurora').id, 'aurora');

    setWeatherAudioMode('clear');
    assert.strictEqual(getWeatherAudioMode(), 'clear');
  });

  it('should clamp and update weather FX intensity safely', () => {
    setWeatherFxIntensity(1.25);
    assert.strictEqual(getWeatherFxIntensity(), 1.25);

    setWeatherFxIntensity(-0.5);
    assert.strictEqual(getWeatherFxIntensity(), 0.0);

    setWeatherFxIntensity(3.0);
    assert.strictEqual(getWeatherFxIntensity(), 2.0);

    // Reset to normal
    setWeatherFxIntensity(1.0);
    assert.strictEqual(getWeatherFxIntensity(), 1.0);
  });

  it('should clamp and update 3D spatial width safely', () => {
    setSpatialPannerWidth(0.75);
    assert.strictEqual(getSpatialPannerWidth(), 0.75);

    setSpatialPannerWidth(-0.2);
    assert.strictEqual(getSpatialPannerWidth(), 0.0);

    setSpatialPannerWidth(1.5);
    assert.strictEqual(getSpatialPannerWidth(), 1.0);

    // Reset
    setSpatialPannerWidth(0.85);
    assert.strictEqual(getSpatialPannerWidth(), 0.85);
  });

  it('audio triggers should execute safely without throwing in headless environments', () => {
    assert.doesNotThrow(() => {
      playSpatialThunderclap(-0.5, 1.0);
      playSpatialThunderclap(0.8, 1.2);
      playThunderclapSound(0.0);
      playThunderclapSound();
      playAuroraHarmonyChord(1.5);
    });
  });
});
