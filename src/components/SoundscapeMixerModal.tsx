/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  X,
  Music,
  Wind,
  Disc,
  Sparkles,
  Radio,
  Waves,
  Zap,
  Sliders,
  CloudRain,
  CloudSnow,
  CloudFog,
  Sun,
  Headphones,
} from 'lucide-react';
import {
  playCelestialSynthNote,
  setAmbientVolumeScale,
  AUDIO_CHANNELS,
  getCurrentAudioChannel,
  setAudioChannel,
  AudioChannelId,
  WEATHER_AUDIO_PROFILES,
  WeatherAudioProfile,
  setWeatherAudioMode,
  getWeatherAudioMode,
  setWeatherFxIntensity,
  getWeatherFxIntensity,
  setSpatialPannerWidth,
  getSpatialPannerWidth,
  playSpatialThunderclap,
  playAuroraHarmonyChord,
} from '../utils/audioDescent';
import { WeatherType } from '../utils/descentEngine';

interface SoundscapeMixerModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeWeather?: WeatherType;
  onWeatherSelect?: (w: WeatherType) => void;
}

export const SoundscapeMixerModal: React.FC<SoundscapeMixerModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  activeWeather,
  onWeatherSelect,
}) => {
  const [volumeScale, setVolumeScale] = useState<number>(1.0);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<AudioChannelId>(getCurrentAudioChannel());

  // Weather spatial audio states
  const [currentWeather, setCurrentWeather] = useState<WeatherType>(
    () => activeWeather || getWeatherAudioMode()
  );
  const [fxIntensity, setFxIntensityState] = useState<number>(() => getWeatherFxIntensity());
  const [spatialWidth, setSpatialWidthState] = useState<number>(() => getSpatialPannerWidth());
  const [auditioningFx, setAuditioningFx] = useState<'thunder' | 'aurora' | null>(null);

  useEffect(() => {
    if (activeWeather) {
      setCurrentWeather(activeWeather);
    }
  }, [activeWeather]);

  if (!isOpen) return null;

  const activeProfile: WeatherAudioProfile =
    WEATHER_AUDIO_PROFILES[currentWeather] || WEATHER_AUDIO_PROFILES.clear;

  const notes = [
    { label: '도 (C5)', freq: 523.25, color: '#38bdf8', desc: '코스믹 하이퍼스페이스' },
    { label: '미 (E5)', freq: 659.25, color: '#34d399', desc: '에메랄드 나선 공명' },
    { label: '솔 (G5)', freq: 783.99, color: '#fbbf24', desc: '태양 홍염 펄스' },
    { label: '시 (B5)', freq: 987.77, color: '#a855f7', desc: '심우주 오로라 칠' },
  ];

  const handlePlayPad = (idx: number, freq: number) => {
    setActivePad(idx);
    playCelestialSynthNote(freq, 'triangle', 0.8);
    setTimeout(() => setActivePad(null), 300);
  };

  const handleVolumeChange = (v: number) => {
    setVolumeScale(v);
    setAmbientVolumeScale(v);
  };

  const handleChannelSelect = (channelId: AudioChannelId) => {
    setSelectedChannel(channelId);
    setAudioChannel(channelId);
  };

  const handleSelectWeather = (w: WeatherType) => {
    setCurrentWeather(w);
    setWeatherAudioMode(w);
    if (onWeatherSelect) {
      onWeatherSelect(w);
    }
  };

  const handleFxIntensityChange = (val: number) => {
    setFxIntensityState(val);
    setWeatherFxIntensity(val);
  };

  const handleSpatialWidthChange = (val: number) => {
    setSpatialWidthState(val);
    setSpatialPannerWidth(val);
  };

  const handleAuditionThunder = () => {
    setAuditioningFx('thunder');
    const randomPan = (Math.random() * 1.6 - 0.8); // 3D stereo localization
    playSpatialThunderclap(randomPan, 1.2);
    setTimeout(() => setAuditioningFx(null), 1200);
  };

  const handleAuditionAurora = () => {
    setAuditioningFx('aurora');
    playAuroraHarmonyChord(3.0);
    setTimeout(() => setAuditioningFx(null), 1500);
  };

  const weatherTabs: Array<{ id: WeatherType; label: string; icon: React.ReactNode; color: string }> = [
    { id: 'rain', label: '폭풍우', icon: <CloudRain className="w-3.5 h-3.5" />, color: '#38bdf8' },
    { id: 'aurora', label: '오로라', icon: <Sparkles className="w-3.5 h-3.5" />, color: '#34d399' },
    { id: 'snow', label: '설원', icon: <CloudSnow className="w-3.5 h-3.5" />, color: '#bae6fd' },
    { id: 'mist', label: '해무', icon: <CloudFog className="w-3.5 h-3.5" />, color: '#a5b4fc' },
    { id: 'clear', label: '쾌청', icon: <Sun className="w-3.5 h-3.5" />, color: '#fde047' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Headphones className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-pixel text-xs sm:text-sm text-white tracking-wide">
                코스믹 사운드스케이프 & 3D 기상 입체 음향
              </h2>
              <p className="text-[10px] text-slate-400">
                Web Audio DSP Biquad 필터링 및 3D 공간 음향 제어 스튜디오
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Main Soundscape Power Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  soundEnabled
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-semibold text-white">
                  대기 음향 엔진 {soundEnabled ? '활성 (ON)' : '음소거 (MUTE)'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  바람소리 노이즈 필터, 서브베이스 드론 & 실시간 DSP 체인
                </div>
              </div>
            </div>

            <button
              onClick={onToggleSound}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
                soundEnabled
                  ? 'bg-indigo-600 text-white shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {soundEnabled ? '사운드 끄기' : '사운드 켜기'}
            </button>
          </div>

          {/* Real-time Weather Spatial Audio & DSP Filter Section */}
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>실시간 기상 입체 음향 및 DSP 필터 (Weather Spatial Audio)</span>
              </div>
              <span
                className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider border"
                style={{
                  backgroundColor: `${activeProfile.color}15`,
                  borderColor: `${activeProfile.color}40`,
                  color: activeProfile.color,
                }}
              >
                DSP: {activeProfile.filterType.toUpperCase()}
              </span>
            </div>

            {/* Weather Mode Selector Switcher */}
            <div className="grid grid-cols-5 gap-1.5">
              {weatherTabs.map((tab) => {
                const isSelected = currentWeather === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectWeather(tab.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 shadow-md ring-1'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    style={{
                      borderColor: isSelected ? tab.color : undefined,
                      boxShadow: isSelected ? `0 0 12px ${tab.color}40` : undefined,
                    }}
                  >
                    <span style={{ color: isSelected ? tab.color : 'inherit' }}>
                      {tab.icon}
                    </span>
                    <span className="text-[10px] font-medium leading-none">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Weather DSP Status Card */}
            <div
              className="p-3 rounded-xl border bg-slate-950/60 space-y-1.5 transition-all"
              style={{ borderColor: `${activeProfile.color}35` }}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: activeProfile.color }}
                  />
                  <span>{activeProfile.koreanName}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Cutoff {activeProfile.cutoffFreq}Hz · Q {activeProfile.filterQ}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {activeProfile.tagline}
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
                  {activeProfile.dspDescription}
                </span>
                {activeProfile.hasThunder && (
                  <span className="px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/80 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-sky-400" />
                    입체 롤링 천둥 엔진 연동
                  </span>
                )}
                {activeProfile.hasAuroraHarmony && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    5성부 신스 드론 & LFO 코러스
                  </span>
                )}
              </div>
            </div>

            {/* Weather FX Intensity & Spatial Width Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    기상 FX 증폭률 (FX Intensity)
                  </span>
                  <span className="font-mono text-amber-400 text-[10px]">
                    {Math.round(fxIntensity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={fxIntensity}
                  onChange={(e) => handleFxIntensityChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              <div className="space-y-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Waves className="w-3 h-3 text-cyan-400" />
                    3D 입체 파노라마 폭 (Spatial Width)
                  </span>
                  <span className="font-mono text-cyan-400 text-[10px]">
                    {Math.round(spatialWidth * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={spatialWidth}
                  onChange={(e) => handleSpatialWidthChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* Quick Audition Test Buttons */}
            <div className="pt-1 space-y-1.5">
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span>실시간 Web Audio DSP 즉시 청취 (Real-time Audition)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAuditionThunder}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    auditioningFx === 'thunder'
                      ? 'bg-sky-600/30 border-sky-400 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                      : 'bg-slate-950/80 border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <Zap
                    className={`w-3.5 h-3.5 text-sky-400 ${
                      auditioningFx === 'thunder' ? 'animate-bounce' : ''
                    }`}
                  />
                  <span>3D 천둥소리 청취</span>
                </button>

                <button
                  onClick={handleAuditionAurora}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    auditioningFx === 'aurora'
                      ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                      : 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <Sparkles
                    className={`w-3.5 h-3.5 text-emerald-400 ${
                      auditioningFx === 'aurora' ? 'animate-spin' : ''
                    }`}
                  />
                  <span>오로라 신스 화음</span>
                </button>
              </div>
            </div>
          </div>

          {/* Volume Control */}
          <div className="bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <span>앰비언트 대기 볼륨 (Volume Scale)</span>
              </span>
              <span className="font-mono text-cyan-400 text-[11px]">
                {Math.round(volumeScale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.5"
              step="0.05"
              value={volumeScale}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* 3-Channel Cosmic Lo-Fi Synth Radio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span>3-채널 코스믹 신스 라디오 (Cosmic Lo-Fi Radio)</span>
              </span>
              <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                <Waves className="w-3 h-3 animate-pulse" />
                <span>LIVE SYNTH</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Web Audio 기반 실시간 절차적 3개 오디오 채널 중 원하는 분위기를 선택하세요.
            </p>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {AUDIO_CHANNELS.map((ch) => {
                const isSelected = selectedChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => handleChannelSelect(ch.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-indigo-400/80 shadow-md ring-1 ring-indigo-400/30'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: ch.color,
                          boxShadow: isSelected ? `0 0 10px ${ch.color}` : 'none',
                        }}
                      />
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span>{ch.name}</span>
                          {isSelected && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                              ON AIR
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {ch.tagline}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 hidden sm:inline">
                      {ch.freqDescriptor}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Celestial Synthesizer Chime Pads */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>성간 신디사이저 차임 패드 (Celestial Chimes)</span>
            </div>
            <p className="text-[10px] text-slate-400">
              클릭하여 천체 공명 주파수를 실시간으로 연주할 수 있습니다.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {notes.map((n, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePlayPad(idx, n.freq)}
                  className={`p-3 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between h-20 ${
                    activePad === idx
                      ? 'bg-indigo-950/80 border-indigo-400 shadow-lg scale-98'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                  style={{
                    borderColor: activePad === idx ? n.color : undefined,
                    boxShadow: activePad === idx ? `0 0 15px ${n.color}50` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Disc className="w-3 h-3" style={{ color: n.color }} />
                      <span>{n.label}</span>
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: n.color }}>
                      {n.freq.toFixed(0)} Hz
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {n.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
