/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  CustomAtmosphereSettings,
  DEFAULT_ATMOSPHERE_SETTINGS,
  WeatherType,
  WEATHER_CONFIGS,
} from '../utils/descentEngine';
import {
  calculateCloudPhysicsTelemetry,
  SpeedMode,
  FLIGHT_SPEED_KMH,
} from '../utils/cloudPhysicsEngine';
import {
  Sliders,
  X,
  RotateCcw,
  Wind,
  Cloud,
  Zap,
  Sparkles,
  Tv,
  Grid,
  Film,
  Check,
  Gauge,
  Activity,
  Compass,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudSun,
  Flame,
} from 'lucide-react';
import { triggerStarSparkleChime } from '../utils/audioDescent';

interface AtmosphereStudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CustomAtmosphereSettings;
  onChange: (settings: CustomAtmosphereSettings) => void;
  activeWeather: WeatherType;
  onWeatherSelect: (weather: WeatherType) => void;
  speedMode?: SpeedMode;
  onSpeedModeChange?: (mode: SpeedMode) => void;
}

export const AtmosphereStudioDrawer: React.FC<AtmosphereStudioDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onChange,
  activeWeather,
  onWeatherSelect,
  speedMode = 'normal',
  onSpeedModeChange,
}) => {
  if (!isOpen) return null;

  // Real-time aerodynamic and cloud physics telemetry
  const cloudTelemetry = useMemo(() => {
    return calculateCloudPhysicsTelemetry(activeWeather, speedMode, settings);
  }, [activeWeather, speedMode, settings]);

  const updateSetting = <K extends keyof CustomAtmosphereSettings>(
    key: K,
    val: CustomAtmosphereSettings[K]
  ) => {
    onChange({
      ...settings,
      [key]: val,
    });
  };

  const applyPreset = (presetName: 'typhoon' | 'aurora' | 'breeze' | 'machJet' | 'marineMist' | 'default') => {
    triggerStarSparkleChime();
    if (presetName === 'typhoon') {
      onWeatherSelect('rain');
      if (onSpeedModeChange) onSpeedModeChange('mach');
      onChange({
        ...settings,
        cloudDensityScale: 1.6,
        windSpeedScale: 2.2,
        shakeIntensityScale: 1.4,
        auroraVibrancyScale: 0.6,
        crtScanlineIntensity: 0.28,
      });
    } else if (presetName === 'machJet') {
      onWeatherSelect('clear');
      if (onSpeedModeChange) onSpeedModeChange('mach');
      onChange({
        ...settings,
        cloudDensityScale: 0.9,
        windSpeedScale: 2.6,
        shakeIntensityScale: 1.2,
        auroraVibrancyScale: 1.0,
      });
    } else if (presetName === 'aurora') {
      onWeatherSelect('aurora');
      if (onSpeedModeChange) onSpeedModeChange('cinematic');
      onChange({
        ...settings,
        cloudDensityScale: 0.85,
        windSpeedScale: 0.5,
        shakeIntensityScale: 0.8,
        auroraVibrancyScale: 1.8,
        crtScanlineIntensity: 0.18,
      });
    } else if (presetName === 'marineMist') {
      onWeatherSelect('mist');
      if (onSpeedModeChange) onSpeedModeChange('normal');
      onChange({
        ...settings,
        cloudDensityScale: 1.35,
        windSpeedScale: 1.2,
        shakeIntensityScale: 1.0,
        auroraVibrancyScale: 0.8,
      });
    } else if (presetName === 'breeze') {
      onWeatherSelect('clear');
      if (onSpeedModeChange) onSpeedModeChange('normal');
      onChange({
        ...settings,
        cloudDensityScale: 0.75,
        windSpeedScale: 0.85,
        shakeIntensityScale: 1.0,
        auroraVibrancyScale: 1.0,
      });
    } else {
      if (onSpeedModeChange) onSpeedModeChange('normal');
      onChange({ ...DEFAULT_ATMOSPHERE_SETTINGS });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-slate-950/95 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 overflow-hidden animate-in slide-in-from-right-10 duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-pixel text-xs sm:text-sm text-white tracking-wide">
                대기 & 구름 물리 스튜디오
              </h2>
              <p className="text-[10px] text-slate-400">
                기상 모드 및 비행 속도 연동 구름 유체역학 조율
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

        {/* Content Sliders & Telemetry Deck */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* Real-time Physical Cloud Aerodynamics HUD */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900/80 to-indigo-950/40 border border-cyan-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-semibold text-white">
                  실시간 구름 공기역학 텔레메트리
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 font-mono text-cyan-300">
                {WEATHER_CONFIGS[activeWeather]?.name} · {speedMode.toUpperCase()}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* Relative Flow Velocity */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" />
                  <span>체감 기류 유속</span>
                </div>
                <div className="text-sm font-mono font-bold text-cyan-300 mt-1">
                  {cloudTelemetry.apparentSpeedKmH.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">km/h</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                  배율 {cloudTelemetry.effectiveVelocityScale}x ({speedMode === 'mach' ? '초음속 돌파' : speedMode === 'cinematic' ? '저속 활공' : '순항'})
                </div>
              </div>

              {/* Effective Cloud Density */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-sky-400" />
                  <span>유효 구름 밀도</span>
                </div>
                <div className="text-sm font-mono font-bold text-sky-300 mt-1">
                  {cloudTelemetry.effectiveDensityPercent}%
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                  부피 배율 {cloudTelemetry.effectiveDensityScale}x
                </div>
              </div>

              {/* Mach Compression Effect */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>마하 압축률 (충격파)</span>
                </div>
                <div className="text-sm font-mono font-bold text-amber-300 mt-1">
                  {cloudTelemetry.machCompressionFactor}x
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                  {speedMode === 'mach' ? '프란틀-글라우어트 응결' : '정적 대기압'}
                </div>
              </div>

              {/* Reynolds Turbulence Index */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-indigo-400" />
                  <span>레이놀즈 난류 지수</span>
                </div>
                <div className="text-sm font-mono font-bold text-indigo-300 mt-1">
                  {cloudTelemetry.reynoldsTurbulence} <span className="text-[10px] font-normal text-slate-400">Re</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                  {cloudTelemetry.turbulenceLabel}
                </div>
              </div>
            </div>

            {/* Aerodynamic Drag & Slipstream info bar */}
            <div className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/70 text-[10px] text-slate-300 flex items-center justify-between font-mono">
              <span className="text-slate-400">동적 공기 항력 계수 (Cd):</span>
              <span className="text-emerald-400 font-bold">{cloudTelemetry.aerodynamicDrag}</span>
              <span className="text-slate-400 ml-2">측풍:</span>
              <span className="text-cyan-400 font-bold">{cloudTelemetry.lateralWindVelocity} px/s</span>
            </div>
          </div>

          {/* Interactive Coupling: Flight Speed Mode Selector */}
          <div className="space-y-2">
            <div className="text-[11px] font-sans font-medium text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>비행 속도 모드 연동 (Flight Speed)</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-300">
                {FLIGHT_SPEED_KMH[speedMode].toLocaleString()} km/h
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cinematic' as const, label: '느리게', mult: '0.55x', desc: '감압 층류', icon: Compass },
                { id: 'normal' as const, label: '표준', mult: '1.0x', desc: '순항 자연풍', icon: Gauge },
                { id: 'mach' as const, label: '마하', mult: '2.2x', desc: '초음속 압축', icon: Zap },
              ].map((s) => {
                const Icon = s.icon;
                const active = speedMode === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSpeedModeChange && onSpeedModeChange(s.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 ${
                      active
                        ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400/40'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{s.label}</span>
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 mt-1">{s.mult}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{s.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Coupling: Weather Mode Selectors */}
          <div className="space-y-2">
            <div className="text-[11px] font-sans font-medium text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                <span>기상 모드 물리 연동 (Weather Mode)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {WEATHER_CONFIGS[activeWeather]?.cloudBadge}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'clear' as const, label: '쾌청', icon: CloudSun, color: 'text-amber-400' },
                { id: 'rain' as const, label: '소나기', icon: CloudRain, color: 'text-blue-400' },
                { id: 'snow' as const, label: '눈', icon: CloudSnow, color: 'text-sky-300' },
                { id: 'mist' as const, label: '안개', icon: CloudFog, color: 'text-indigo-300' },
                { id: 'aurora' as const, label: '오로라', icon: Sparkles, color: 'text-emerald-400' },
              ].map((w) => {
                const Icon = w.icon;
                const active = activeWeather === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => onWeatherSelect(w.id)}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 active:scale-95 ${
                      active
                        ? 'bg-slate-900 border-cyan-400 text-white shadow-md ring-1 ring-cyan-400/40'
                        : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${w.color}`} />
                    <span className="text-[10px] font-medium">{w.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Atmosphere & Physical Presets */}
          <div>
            <div className="text-[11px] font-sans font-medium text-slate-400 mb-2.5 flex items-center justify-between">
              <span>대기 & 기류 시나리오 프리셋</span>
              <button
                onClick={() => applyPreset('default')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-sans"
                title="기본 물리값으로 초기화"
              >
                <RotateCcw className="w-3 h-3" />
                <span>초기화</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => applyPreset('typhoon')}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                  폭풍우 스콜
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  마하 비행 & 밀도 폭증
                </div>
              </button>

              <button
                onClick={() => applyPreset('machJet')}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                  제트기류 질주
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  마하 압축 충격파
                </div>
              </button>

              <button
                onClick={() => applyPreset('aurora')}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                  환상 극광
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  오로라 + 서행 층류
                </div>
              </button>

              <button
                onClick={() => applyPreset('marineMist')}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                  해무 역전층
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  저고도 운무 드리프트
                </div>
              </button>

              <button
                onClick={() => applyPreset('breeze')}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-amber-400 group-hover:text-amber-300">
                  온화한 쾌청
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  조각구름 & 순항 자연풍
                </div>
              </button>

              <button
                onClick={() => applyPreset('default')}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-slate-300 group-hover:text-white">
                  물리 표준값
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  밸런스 프로필 복원
                </div>
              </button>
            </div>
          </div>

          {/* Section 1: Cloud & Drift Physics */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                <span>구름 유체역학 및 미세 조율 (Fine Tuning)</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">
                체감 {cloudTelemetry.apparentSpeedKmH} km/h
              </span>
            </div>

            {/* Cloud Density Scale */}
            <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">구름 생성 밀도 계수 (Density Scale)</span>
                <span className="font-mono text-cyan-400 text-[11px]">
                  {Math.round(settings.cloudDensityScale * 100)}% (유효 {cloudTelemetry.effectiveDensityPercent}%)
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={settings.cloudDensityScale}
                onChange={(e) => updateSetting('cloudDensityScale', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>0.5x (희박 권운)</span>
                <span>1.0x (표준 적운)</span>
                <span>2.0x (짙은 암운)</span>
              </div>
            </div>

            {/* Wind Drift Velocity Scale */}
            <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">제트기류 풍속 계수 (Wind Velocity Scale)</span>
                <span className="font-mono text-cyan-400 text-[11px]">
                  {Math.round(settings.windSpeedScale * 100)}% (배율 {cloudTelemetry.effectiveVelocityScale}x)
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={settings.windSpeedScale}
                onChange={(e) => updateSetting('windSpeedScale', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>0.2x (정적 침강)</span>
                <span>1.0x (자연풍)</span>
                <span>3.0x (초강풍 제트기류)</span>
              </div>
            </div>
          </div>

          {/* Section 2: Atmosphere & Cosmic Lighting */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>우주 조명 및 오로라 극광</span>
            </div>

            {/* Aurora Luminance */}
            <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">오로라 극광 휘도 (Luminance)</span>
                <span className="font-mono text-emerald-400 text-[11px]">
                  {Math.round(settings.auroraVibrancyScale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.2"
                step="0.1"
                value={settings.auroraVibrancyScale}
                onChange={(e) => updateSetting('auroraVibrancyScale', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>0.5x (은은함)</span>
                <span>1.0x (표준)</span>
                <span>2.2x (찬란한 극광)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Camera Shake & Haptics */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>화면 진동 및 타격감 (Camera Shake)</span>
            </div>

            <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">소환 충격 진동 배율 (Trauma Multiplier)</span>
                <span className="font-mono text-amber-400 text-[11px]">
                  {Math.round(settings.shakeIntensityScale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.1"
                value={settings.shakeIntensityScale}
                onChange={(e) => updateSetting('shakeIntensityScale', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>0% (진동 끔)</span>
                <span>100% (표준 타격감)</span>
                <span>200% (강렬한 지진파)</span>
              </div>
            </div>
          </div>

          {/* Section 4: Retro Shaders & Display */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-2">
              <Tv className="w-3.5 h-3.5 text-indigo-400" />
              <span>레트로 디스플레이 및 셰이더</span>
            </div>

            {/* CRT Scanline slider */}
            <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">CRT 브라운관 주사선 (Scanline)</span>
                <span className="font-mono text-indigo-400 text-[11px]">
                  {Math.round(settings.crtScanlineIntensity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.02"
                value={settings.crtScanlineIntensity}
                onChange={(e) => updateSetting('crtScanlineIntensity', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>

            {/* Toggles: Pixel Grid & Cinema Bars */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => updateSetting('showPixelGrid', !settings.showPixelGrid)}
                className={`p-3 rounded-2xl border text-xs font-medium flex items-center gap-2 transition-all ${
                  settings.showPixelGrid
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>픽셀 격자망</span>
                {settings.showPixelGrid && <Check className="w-3.5 h-3.5 ml-auto text-indigo-400" />}
              </button>

              <button
                onClick={() => updateSetting('cinemaBars', !settings.cinemaBars)}
                className={`p-3 rounded-2xl border text-xs font-medium flex items-center gap-2 transition-all ${
                  settings.cinemaBars
                    ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>2.39:1 시네마바</span>
                {settings.cinemaBars && <Check className="w-3.5 h-3.5 ml-auto text-cyan-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <Wind className="w-3 h-3 text-cyan-400" />
            <span>현재: {WEATHER_CONFIGS[activeWeather]?.name} · {cloudTelemetry.apparentSpeedKmH} km/h ({cloudTelemetry.effectiveDensityPercent}%)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
          >
            적용 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
