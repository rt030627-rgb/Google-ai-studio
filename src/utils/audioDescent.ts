/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherType } from './descentEngine';

// Procedural Web Audio Ambient Soundscape (Wind, Sub-bass drone, and celestial encounters)
let audioCtx: AudioContext | null = null;
let windGainNode: GainNode | null = null;
let droneGainNode: GainNode | null = null;
let weatherFilterNode: BiquadFilterNode | null = null;
let masterWeatherPanner: StereoPannerNode | null = null;
let masterAmbientGain: GainNode | null = null;
let auroraGainNode: GainNode | null = null;
let auroraOscs: OscillatorNode[] = [];
let auroraLfoOsc: OscillatorNode | null = null;
let ambientThunderInterval: ReturnType<typeof setInterval> | null = null;

let isAudioRunning = false;
let currentVolumeScale = 1.0;
let currentWeatherAudioMode: WeatherType = 'clear';
let weatherFxIntensity = 1.0; // 0.0 ~ 1.5
let weatherSpatialWidth = 0.85; // 0.0 ~ 1.0

export type AudioChannelId = 'deep_space' | 'lofi_stardust' | 'cyber_tempest';

export interface AudioChannelInfo {
  id: AudioChannelId;
  name: string;
  tagline: string;
  color: string;
  freqDescriptor: string;
}

export const AUDIO_CHANNELS: AudioChannelInfo[] = [
  {
    id: 'deep_space',
    name: 'Deep Space Drone',
    tagline: '55Hz sub-bass meditation & filtered interstellar solar breeze',
    color: '#38bdf8',
    freqDescriptor: '55Hz Sub-Bass Sine',
  },
  {
    id: 'lofi_stardust',
    name: 'Lo-Fi Stardust Lounge',
    tagline: 'Mellow celestial pentatonic chimes & nostalgic tape warmth',
    color: '#a78bfa',
    freqDescriptor: 'Pentatonic Star Chimes',
  },
  {
    id: 'cyber_tempest',
    name: 'Cyber Tempest Pulse',
    tagline: 'Driving 16th-note electro synth bassline & neon arpeggios',
    color: '#ec4899',
    freqDescriptor: '128 BPM Pulse Arp',
  },
];

export interface WeatherAudioProfile {
  id: WeatherType;
  name: string;
  koreanName: string;
  tagline: string;
  filterType: BiquadFilterType;
  cutoffFreq: number; // Hz
  filterQ: number;
  windGainMod: number; // Multiplier on wind noise
  droneGainMod: number; // Multiplier on cosmic drone
  spatialWidth: number; // 0.0 to 1.0
  hasThunder: boolean;
  hasAuroraHarmony: boolean;
  color: string;
  dspDescription: string;
}

export const WEATHER_AUDIO_PROFILES: Record<WeatherType, WeatherAudioProfile> = {
  rain: {
    id: 'rain',
    name: 'Thunderstorm Squall',
    koreanName: '폭풍우 & 3D 뇌우 스콜',
    tagline: '저역통과 뇌우 필터링, 주기적 입체 롤링 천둥 및 빗소리 질감',
    filterType: 'lowpass',
    cutoffFreq: 280,
    filterQ: 2.2,
    windGainMod: 1.5,
    droneGainMod: 1.3,
    spatialWidth: 0.9,
    hasThunder: true,
    hasAuroraHarmony: false,
    color: '#38bdf8',
    dspDescription: 'Lowpass 280Hz · Resonant Q 2.2 · 3D Spatial Thunder Engine',
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora Borealis Harmony',
    koreanName: '코스믹 오로라 몽환 하모니',
    tagline: '신비로운 5성부 신스 화음 패드, 고역대 셔링 및 부유하는 코러스',
    filterType: 'peaking',
    cutoffFreq: 1850,
    filterQ: 1.6,
    windGainMod: 0.6,
    droneGainMod: 0.8,
    spatialWidth: 0.95,
    hasThunder: false,
    hasAuroraHarmony: true,
    color: '#34d399',
    dspDescription: 'Peaking 1.85kHz · Multi-Voice Synth Drone · Slow LFO Chorus',
  },
  snow: {
    id: 'snow',
    name: 'Polar Snow Subsidence',
    koreanName: '고요한 극지방 설원 흡음',
    tagline: '신적설에 의한 고주파 흡음 감쇠, 차가운 깃털 바람결과 미세 빙정',
    filterType: 'lowpass',
    cutoffFreq: 210,
    filterQ: 0.7,
    windGainMod: 0.8,
    droneGainMod: 0.9,
    spatialWidth: 0.65,
    hasThunder: false,
    hasAuroraHarmony: false,
    color: '#bae6fd',
    dspDescription: 'Lowpass 210Hz Damping · Quiet Crystalline Whistle',
  },
  mist: {
    id: 'mist',
    name: 'Maritime Fog Inversion',
    koreanName: '해무 역전층 소나 펄스',
    tagline: '짙은 안개 속 중역대 흡수 노치, 공간 확산 및 원거리 저주파 펄스',
    filterType: 'bandpass',
    cutoffFreq: 380,
    filterQ: 1.4,
    windGainMod: 1.1,
    droneGainMod: 1.2,
    spatialWidth: 0.75,
    hasThunder: false,
    hasAuroraHarmony: false,
    color: '#a5b4fc',
    dspDescription: 'Bandpass 380Hz Notch · Diffuse Reverb Pulse',
  },
  clear: {
    id: 'clear',
    name: 'Solar Breeze Wide Panorama',
    koreanName: '쾌청 와이드 파노라마',
    tagline: '개방된 광대역 주파수, 온화한 태양풍 및 맑은 고역대 투과',
    filterType: 'lowpass',
    cutoffFreq: 2400,
    filterQ: 0.5,
    windGainMod: 1.0,
    droneGainMod: 1.0,
    spatialWidth: 0.8,
    hasThunder: false,
    hasAuroraHarmony: false,
    color: '#fde047',
    dspDescription: 'Wide Open 2.4kHz · Linear Stereo Panorama',
  },
};

let activeAudioChannel: AudioChannelId = 'deep_space';
let channelSequencerTimer: ReturnType<typeof setInterval> | null = null;
let sequencerStep = 0;

function stopChannelSequencer() {
  if (channelSequencerTimer) {
    clearInterval(channelSequencerTimer);
    channelSequencerTimer = null;
  }
}

function startChannelSequencer() {
  stopChannelSequencer();
  if (!isAudioRunning) return;

  if (activeAudioChannel === 'lofi_stardust') {
    // Pentatonic scale notes (A minor pentatonic: A4, C5, D5, E5, G5)
    const lofiNotes = [440, 523.25, 587.33, 659.25, 783.99];
    channelSequencerTimer = setInterval(() => {
      try {
        const ctx = getAudioContext();
        if (!ctx || !isAudioRunning) return;
        const note = lofiNotes[Math.floor(Math.random() * lofiNotes.length)];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note, ctx.currentTime);

        const vol = 0.028 * currentVolumeScale;
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.25);
      } catch {
        // Ignore audio errors
      }
    }, 1800);
  } else if (activeAudioChannel === 'cyber_tempest') {
    // 16th note synth bass arpeggio in 128 BPM (~117ms per 16th step)
    const arpBassNotes = [110, 110, 130.81, 146.83, 110, 164.81, 146.83, 196];
    channelSequencerTimer = setInterval(() => {
      try {
        const ctx = getAudioContext();
        if (!ctx || !isAudioRunning) return;
        const note = arpBassNotes[sequencerStep % arpBassNotes.length];
        sequencerStep++;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.14);

        const vol = 0.022 * currentVolumeScale;
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.17);
      } catch {
        // Ignore audio errors
      }
    }, 220);
  }
}

export function getCurrentAudioChannel(): AudioChannelId {
  return activeAudioChannel;
}

export function setAudioChannel(channelId: AudioChannelId) {
  activeAudioChannel = channelId;
  if (isAudioRunning) {
    startChannelSequencer();
  }
}

let isVisibilityListenerBound = false;

export function setupAudioVisibilityManagement() {
  if (typeof document === 'undefined' || isVisibilityListenerBound) return;
  isVisibilityListenerBound = true;
  document.addEventListener('visibilitychange', () => {
    if (!audioCtx) return;
    if (document.hidden) {
      if (audioCtx.state === 'running') {
        audioCtx.suspend().catch(() => {});
      }
    } else {
      if (isAudioRunning && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    }
  });
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      setupAudioVisibilityManagement();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended' && (!document.hidden || !isAudioRunning)) {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Start or stop the ambient rolling thunder scheduler when in thunderstorm/rain mode
 */
function updateAmbientThunderScheduler(hasThunder: boolean) {
  if (ambientThunderInterval) {
    clearInterval(ambientThunderInterval);
    ambientThunderInterval = null;
  }

  if (hasThunder && isAudioRunning) {
    ambientThunderInterval = setInterval(() => {
      if (!isAudioRunning || currentWeatherAudioMode !== 'rain') return;
      // Trigger distant natural thunder with randomized panning
      const pan = (Math.random() * 1.6) - 0.8;
      playSpatialThunderclap(pan, 0.45 * weatherFxIntensity);
    }, 13000 + Math.random() * 9000);
  }
}

/**
 * Initialize or smoothly update the continuous aurora synth harmony drone
 */
function updateAuroraHarmonyEngine(active: boolean) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (active && isAudioRunning) {
    if (!auroraGainNode) {
      auroraGainNode = ctx.createGain();
      auroraGainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
      if (masterWeatherPanner) {
        auroraGainNode.connect(masterWeatherPanner);
      } else {
        auroraGainNode.connect(ctx.destination);
      }
    }

    if (auroraOscs.length === 0) {
      // Ethereal celestial chord voicing: F#3, C#4, F4, G#4, D#5
      const freqs = [185.0, 277.18, 349.23, 415.30, 622.25];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        if (panner && auroraGainNode) {
          // Spread voices across the stereo soundstage
          const panVal = ((idx / (freqs.length - 1)) * 1.6 - 0.8) * weatherSpatialWidth;
          panner.pan.setValueAtTime(panVal, ctx.currentTime);
          osc.connect(panner);
          panner.connect(auroraGainNode);
        } else if (auroraGainNode) {
          osc.connect(auroraGainNode);
        }

        osc.start();
        auroraOscs.push(osc);
      });
    }

    const targetGain = 0.045 * currentVolumeScale * weatherFxIntensity;
    auroraGainNode.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.8);
  } else {
    if (auroraGainNode) {
      auroraGainNode.gain.setTargetAtTime(0.00001, ctx.currentTime, 0.5);
    }
  }
}

export function startAmbientDescentSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (isAudioRunning) return;

    // Master ambient gain node
    masterAmbientGain = ctx.createGain();
    masterAmbientGain.gain.setValueAtTime(1.0, ctx.currentTime);
    masterAmbientGain.connect(ctx.destination);

    // 3D Master Stereo Panner Node
    if (ctx.createStereoPanner) {
      masterWeatherPanner = ctx.createStereoPanner();
      masterWeatherPanner.pan.setValueAtTime(0.0, ctx.currentTime);
      masterWeatherPanner.connect(masterAmbientGain);
    }

    // Dynamic Weather Biquad Filter Node
    const profile = WEATHER_AUDIO_PROFILES[currentWeatherAudioMode] || WEATHER_AUDIO_PROFILES.clear;
    weatherFilterNode = ctx.createBiquadFilter();
    weatherFilterNode.type = profile.filterType;
    weatherFilterNode.frequency.setValueAtTime(profile.cutoffFreq, ctx.currentTime);
    weatherFilterNode.Q.setValueAtTime(profile.filterQ, ctx.currentTime);

    if (masterWeatherPanner) {
      weatherFilterNode.connect(masterWeatherPanner);
    } else {
      weatherFilterNode.connect(masterAmbientGain);
    }

    // 1. Procedural Wind generator using white noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    windGainNode = ctx.createGain();
    const windTarget = 0.06 * currentVolumeScale * profile.windGainMod * weatherFxIntensity;
    windGainNode.gain.setValueAtTime(windTarget, ctx.currentTime);

    whiteNoise.connect(windGainNode);
    windGainNode.connect(weatherFilterNode);
    whiteNoise.start();

    // 2. Cosmic sub-bass drone
    const droneOsc = ctx.createOscillator();
    droneOsc.type = 'sine';
    droneOsc.frequency.setValueAtTime(55, ctx.currentTime); // A1 note

    droneGainNode = ctx.createGain();
    const droneTarget = 0.04 * currentVolumeScale * profile.droneGainMod * weatherFxIntensity;
    droneGainNode.gain.setValueAtTime(droneTarget, ctx.currentTime);

    droneOsc.connect(droneGainNode);
    if (masterWeatherPanner) {
      droneGainNode.connect(masterWeatherPanner);
    } else {
      droneGainNode.connect(masterAmbientGain);
    }
    droneOsc.start();

    isAudioRunning = true;
    startChannelSequencer();

    // Apply active weather dynamic DSP
    applyWeatherAudioDsp(currentWeatherAudioMode);
  } catch {
    // Ignore audio error if blocked
  }
}

export function stopAmbientDescentSound() {
  try {
    stopChannelSequencer();
    updateAmbientThunderScheduler(false);
    updateAuroraHarmonyEngine(false);

    if (windGainNode && audioCtx) {
      windGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
    }
    if (droneGainNode && audioCtx) {
      droneGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
    }
    if (auroraGainNode && audioCtx) {
      auroraGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
    }
    isAudioRunning = false;
  } catch {
    // Ignore
  }
}

function applyWeatherAudioDsp(weather: WeatherType) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const profile = WEATHER_AUDIO_PROFILES[weather] || WEATHER_AUDIO_PROFILES.clear;

  // 1. Smoothly transition biquad filter frequency and resonance
  if (weatherFilterNode) {
    weatherFilterNode.type = profile.filterType;
    weatherFilterNode.frequency.setTargetAtTime(profile.cutoffFreq, ctx.currentTime, 0.4);
    weatherFilterNode.Q.setTargetAtTime(profile.filterQ, ctx.currentTime, 0.4);
  }

  // 2. Adjust wind noise and drone balance for weather conditions
  if (windGainNode) {
    const windTarget = 0.06 * currentVolumeScale * profile.windGainMod * weatherFxIntensity;
    windGainNode.gain.setTargetAtTime(windTarget, ctx.currentTime, 0.3);
  }
  if (droneGainNode) {
    const droneTarget = 0.04 * currentVolumeScale * profile.droneGainMod * weatherFxIntensity;
    droneGainNode.gain.setTargetAtTime(droneTarget, ctx.currentTime, 0.3);
  }

  // 3. Update spatial aurora harmony and storm thunder schedulers
  updateAuroraHarmonyEngine(profile.hasAuroraHarmony);
  updateAmbientThunderScheduler(profile.hasThunder);
}

/**
 * Updates the real-time weather spatial audio profile
 */
export function setWeatherAudioMode(weather: WeatherType) {
  currentWeatherAudioMode = weather;
  if (isAudioRunning) {
    applyWeatherAudioDsp(weather);
  }
}

export function getWeatherAudioMode(): WeatherType {
  return currentWeatherAudioMode;
}

export function getWeatherAudioProfile(weather: WeatherType): WeatherAudioProfile {
  return WEATHER_AUDIO_PROFILES[weather] || WEATHER_AUDIO_PROFILES.clear;
}

export function setWeatherFxIntensity(intensity: number) {
  weatherFxIntensity = Math.max(0.0, Math.min(2.0, intensity));
  if (isAudioRunning) {
    applyWeatherAudioDsp(currentWeatherAudioMode);
  }
}

export function getWeatherFxIntensity(): number {
  return weatherFxIntensity;
}

export function setSpatialPannerWidth(width: number) {
  weatherSpatialWidth = Math.max(0.0, Math.min(1.0, width));
  const ctx = getAudioContext();
  if (ctx && masterWeatherPanner) {
    // Gently adapt panning width
    masterWeatherPanner.pan.setTargetAtTime(0.0, ctx.currentTime, 0.2);
  }
}

export function getSpatialPannerWidth(): number {
  return weatherSpatialWidth;
}

/**
 * Update ambient wind and drone gain based on studio slider (0.0 to 1.5)
 */
export function setAmbientVolumeScale(scale: number) {
  try {
    const cl = Math.max(0, Math.min(2, scale));
    currentVolumeScale = cl;
    if (isAudioRunning) {
      applyWeatherAudioDsp(currentWeatherAudioMode);
    }
  } catch {
    // Ignore
  }
}

/**
 * 3D Spatial Rolling Thunderclap with initial lightning channel snap
 * and deep reverberating acoustic rumble sweeping across the stereo field
 */
export function playSpatialThunderclap(pan: number = 0.0, intensity: number = 1.0) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const clampedPan = Math.max(-1.0, Math.min(1.0, pan * weatherSpatialWidth));
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(clampedPan, ctx.currentTime);
      // Dynamic spatial roll across the sky (sound travels from strike origin)
      panner.pan.linearRampToValueAtTime(-clampedPan * 0.4, ctx.currentTime + 2.2);
      panner.connect(ctx.destination);
    }

    const outputNode: AudioNode = panner || ctx.destination;

    // 1. Initial acoustic lightning channel snap (sawtooth high-speed pulse)
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(380, ctx.currentTime);
    snapOsc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.16);

    const snapVol = 0.08 * currentVolumeScale * intensity * weatherFxIntensity;
    snapGain.gain.setValueAtTime(snapVol, ctx.currentTime);
    snapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    snapOsc.connect(snapGain);
    snapGain.connect(outputNode);
    snapOsc.start(ctx.currentTime);
    snapOsc.stop(ctx.currentTime + 0.2);

    // 2. Heavy rolling atmospheric rumble (lowpass noise buffer)
    const dur = 2.4;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const out = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      out[i] = Math.random() * 2 - 1;
    }

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(45, ctx.currentTime + dur);

    const rumbleGain = ctx.createGain();
    const rumbleVol = 0.09 * currentVolumeScale * intensity * weatherFxIntensity;
    rumbleGain.gain.setValueAtTime(0.001, ctx.currentTime + 0.06);
    rumbleGain.gain.exponentialRampToValueAtTime(rumbleVol, ctx.currentTime + 0.28);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

    noiseSrc.connect(filter);
    filter.connect(rumbleGain);
    rumbleGain.connect(outputNode);

    noiseSrc.start(ctx.currentTime + 0.06);
    noiseSrc.stop(ctx.currentTime + dur + 0.1);
  } catch {
    // Ignore
  }
}

/**
 * Backward compatible playThunderclapSound with default spatial panning
 */
export function playThunderclapSound(pan?: number) {
  const finalPan = pan !== undefined ? pan : (Math.random() * 1.4 - 0.7);
  playSpatialThunderclap(finalPan, 1.0);
}

/**
 * Play a lush ethereal aurora harmony chord (for manual audition or celestial events)
 */
export function playAuroraHarmonyChord(durationSec: number = 2.4) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const chordFreqs = [277.18, 349.23, 415.30, 554.37, 698.46]; // Ethereal C# maj7 chord
    const masterGain = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.05 * currentVolumeScale * weatherFxIntensity, ctx.currentTime + 0.5);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);

    if (panner) {
      panner.pan.setValueAtTime(-0.5 * weatherSpatialWidth, ctx.currentTime);
      panner.pan.linearRampToValueAtTime(0.5 * weatherSpatialWidth, ctx.currentTime + durationSec);
      masterGain.connect(panner);
      panner.connect(ctx.destination);
    } else {
      masterGain.connect(ctx.destination);
    }

    chordFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.connect(masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationSec + 0.1);
    });
  } catch {
    // Ignore
  }
}

export function triggerStarSparkleChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [659.25, 880, 1174.66, 1318.51];
    const note = notes[Math.floor(Math.random() * notes.length)];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note, ctx.currentTime);

    gain.gain.setValueAtTime(0.03 * currentVolumeScale, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Ignore
  }
}

/**
 * AI Entity Encounter Chimes
 */
export function playAIEncounterSound(type: 'gpt' | 'claude' | 'deepseek') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Celestial Sub-bass Shockwave Impact (synchronized with camera shake)
    try {
      const thudOsc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thudOsc.type = 'sine';
      const startFreq = type === 'gpt' ? 110 : type === 'claude' ? 75 : 90;
      thudOsc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      thudOsc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.24);

      thudGain.gain.setValueAtTime(0.065 * currentVolumeScale, ctx.currentTime);
      thudGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.26);

      thudOsc.connect(thudGain);
      thudGain.connect(ctx.destination);
      thudOsc.start();
      thudOsc.stop(ctx.currentTime + 0.28);
    } catch {
      // Ignore sub-bass error
    }

    if (type === 'gpt') {
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.025 * currentVolumeScale, ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + 0.2);
      });
    } else if (type === 'claude') {
      const freqs = [440, 554.37, 659.25, 880];
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.03 * currentVolumeScale, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1280, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.04 * currentVolumeScale, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    }
  } catch {
    // Ignore
  }
}

/**
 * Play a bespoke celestial synthesizer chime (for sound studio test pads)
 */
export function playCelestialSynthNote(
  freq: number = 528,
  type: OscillatorType = 'triangle',
  durationSec: number = 0.65
) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const vol = 0.05 * currentVolumeScale;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationSec + 0.05);
  } catch {
    // Ignore
  }
}

/**
 * Procedural synthesis of a colossal celestial dragon encounter
 */
export function playDragonRoarAndWingsSound(durationSec: number = 3.0) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t0 = ctx.currentTime;
    const dur = Math.max(1.5, Math.min(6.0, durationSec));
    const tEnd = t0 + dur;
    const tFadeIn = t0 + dur * 0.28;
    const tFadeOutStart = t0 + dur * 0.62;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, t0);
    masterGain.gain.exponentialRampToValueAtTime(0.14 * currentVolumeScale, tFadeIn);
    masterGain.gain.setValueAtTime(0.14 * currentVolumeScale, tFadeOutStart);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, tEnd);
    masterGain.connect(ctx.destination);

    // Deep sub-bass vocal cord resonance
    const roarOsc = ctx.createOscillator();
    const roarFilter = ctx.createBiquadFilter();
    roarOsc.type = 'sawtooth';
    roarOsc.frequency.setValueAtTime(58, t0);
    roarOsc.frequency.linearRampToValueAtTime(84, t0 + dur * 0.45);
    roarOsc.frequency.exponentialRampToValueAtTime(32, tEnd);

    roarFilter.type = 'lowpass';
    roarFilter.frequency.setValueAtTime(140, t0);
    roarFilter.frequency.linearRampToValueAtTime(360, t0 + dur * 0.35);
    roarFilter.frequency.linearRampToValueAtTime(90, tEnd);

    roarOsc.connect(roarFilter);
    roarFilter.connect(masterGain);
    roarOsc.start(t0);
    roarOsc.stop(tEnd);
  } catch {
    // Ignore
  }
}

export function playDragonFlybySound() {
  playDragonRoarAndWingsSound(3.2);
}

export function playMeteorShootingSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t0 = ctx.currentTime;
    const dur = 0.55;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, t0);
    osc.frequency.exponentialRampToValueAtTime(260, t0 + dur);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t0);
    filter.frequency.exponentialRampToValueAtTime(300, t0 + dur);
    filter.Q.setValueAtTime(1.5, t0);

    const vol = 0.035 * currentVolumeScale;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    // Ignore
  }
}

export function playBlackHoleSingularityDrone() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t0 = ctx.currentTime;
    const dur = 2.5;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t0);
    osc.frequency.exponentialRampToValueAtTime(24, t0 + dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, t0);
    filter.frequency.exponentialRampToValueAtTime(50, t0 + dur);

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.exponentialRampToValueAtTime(0.06 * currentVolumeScale, t0 + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    // Ignore
  }
}

export function playRingCollectChime(comboLevel: number = 1) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseFreqs = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    const noteIdx = Math.min(baseFreqs.length - 1, Math.max(0, comboLevel - 1));
    const freq = baseFreqs[noteIdx];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = comboLevel > 4 ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const vol = 0.038 * currentVolumeScale;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.38);
  } catch {
    // Ignore
  }
}

export function playSatelliteRadioBeepSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const blipFreqs = [1760, 2640];
    blipFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = ctx.currentTime + idx * 0.06;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.02 * currentVolumeScale, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    });
  } catch {
    // Ignore
  }
}

// Backward compatibility aliases
export const playBlackHoleSingularitySound = playBlackHoleSingularityDrone;
export const playStardustRingCollectSound = playRingCollectChime;

