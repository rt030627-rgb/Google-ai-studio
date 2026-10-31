/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import {
  WeatherType,
  WEATHER_CONFIGS,
  TIME_PHASES,
} from '../utils/descentEngine';
import {
  Radio,
  Gauge,
  Wind,
  Compass,
  Zap,
  Activity,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudSun,
  Sparkles,
  Bookmark,
} from 'lucide-react';
import { triggerStarSparkleChime, playCelestialSynthNote } from '../utils/audioDescent';
import { AIAvatarIcon } from './AIAvatarIcon';

interface ObservatoryRadarDeckProps {
  activeWeather: WeatherType;
  cycleProgress: number;
  activeEncounterName: string | null;
  activeEncounterColor: string;
  fps: number;
  onSummon: (type: 'gpt' | 'claude' | 'deepseek') => void;
  onWeatherSelect: (weather: WeatherType) => void;
  onOpenCodex: () => void;
  onOpenStudio: () => void;
  onOpenGifStudio?: () => void;
  onOpenViewpoints?: () => void;
}

export const ObservatoryRadarDeck: React.FC<ObservatoryRadarDeckProps> = ({
  activeWeather,
  cycleProgress,
  activeEncounterName,
  activeEncounterColor,
  fps,
  onSummon,
  onWeatherSelect,
  onOpenCodex,
  onOpenStudio,
  onOpenGifStudio,
  onOpenViewpoints,
}) => {
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const phaseIndex = Math.floor(cycleProgress * 4) % 4;
  const currentPhase = TIME_PHASES[phaseIndex];
  const weatherInfo = WEATHER_CONFIGS[activeWeather];

  // Dynamic telemetry calculations
  const altitudeKm = (384 - (cycleProgress % 0.25) * 4 * 140).toFixed(1);
  const pressureHpa =
    activeWeather === 'rain'
      ? 982 + Math.round(Math.sin(Date.now() * 0.001) * 3)
      : activeWeather === 'snow'
      ? 1008
      : activeWeather === 'mist'
      ? 1012
      : 1022;

  // Radar animation loop
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const renderRadar = () => {
      angle = (angle + 0.035) % (Math.PI * 2);
      const w = canvas.width;
      const h = canvas.height;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const r = w * 0.44;

      // Clear dark background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Radar Concentric Circles
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 1;
      for (let cr = 1; cr <= 3; cr++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (r / 3) * cr, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.stroke();

      // Radar Sweep Fan
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle - 0.4, angle);
      ctx.closePath();
      const sweepGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      sweepGrad.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
      sweepGrad.addColorStop(1, 'rgba(34, 211, 238, 0.02)');
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // Sweep Beam Line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Central Gemini Star Core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 2, cy - 2, 4, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - 1, cy - 1, 2, 2);

      // Tracked entities on radar
      if (activeEncounterName) {
        const pingAngle = (Date.now() * 0.0008) % (Math.PI * 2);
        const pingDist = r * 0.65;
        const ex = cx + Math.cos(pingAngle) * pingDist;
        const ey = cy + Math.sin(pingAngle) * pingDist;

        ctx.fillStyle = activeEncounterColor;
        ctx.beginPath();
        ctx.arc(ex, ey, 3, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing radar blip ring
        const pulseR = 4 + (Date.now() % 800) * 0.012;
        ctx.strokeStyle = activeEncounterColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ex, ey, pulseR, 0, Math.PI * 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(renderRadar);
    };

    animId = requestAnimationFrame(renderRadar);
    return () => cancelAnimationFrame(animId);
  }, [activeEncounterName, activeEncounterColor]);

  return (
    <div className="w-full h-full bg-slate-950/95 border-l border-slate-800 flex flex-col text-slate-100 overflow-y-auto p-4 sm:p-5 space-y-4">
      {/* Deck Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h2 className="font-pixel text-xs tracking-wider text-white">
            관측소 텔레메트리 레이더
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
            {fps} FPS
          </span>
          <span className="font-mono text-[10px] text-cyan-400">
            RADAR-01
          </span>
        </div>
      </div>

      {/* Orbit Radar Display Screen */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-3 flex flex-col items-center">
        <div className="w-full flex items-center justify-between text-[10px] text-slate-400 mb-2">
          <span className="font-sans font-medium">성간 궤도 스캔 (ORBIT SWEEP)</span>
          <span className="text-cyan-400 font-mono">RANGE: 400KM</span>
        </div>
        <canvas
          ref={radarCanvasRef}
          width={180}
          height={180}
          className="rounded-full border border-cyan-500/30 shadow-lg shadow-cyan-500/10 pixelated"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="mt-2.5 w-full text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-sans font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            <span>Gemini 중심점</span>
          </span>
          {activeEncounterName ? (
            <span className="font-sans font-medium" style={{ color: activeEncounterColor }}>
              {activeEncounterName} 추적 중
            </span>
          ) : (
            <span className="text-slate-400 font-sans font-medium">외곽 궤도 대기 중</span>
          )}
        </div>
      </div>

      {/* Atmospheric Telemetry Gauges */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1 font-sans font-medium">
            <Gauge className="w-3 h-3 text-cyan-400" />
            <span>강하 고도</span>
          </div>
          <div className="text-base font-mono font-bold text-white tracking-tight">
            {altitudeKm} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
          <div className="text-[10px] font-sans text-cyan-400/80 mt-0.5">
            {currentPhase.name.split(' ')[0]} 궤적
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1 font-sans font-medium">
            <Wind className="w-3 h-3 text-blue-400" />
            <span>대기 기압</span>
          </div>
          <div className="text-base font-mono font-bold text-white tracking-tight">
            {pressureHpa} <span className="text-xs font-normal text-slate-400">hPa</span>
          </div>
          <div className="text-[10px] font-sans text-blue-400/80 mt-0.5">
            {weatherInfo.name.split(' ')[0]} 전선
          </div>
        </div>
      </div>

      {/* Live Atmospheric Sound Spectrum Bars */}
      <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1 font-sans font-medium">
            <Activity className="w-3 h-3 text-indigo-400" />
            <span>대기 음향 스펙트럼</span>
          </span>
          <span className="text-indigo-400 font-mono">44.1 kHz</span>
        </div>
        <div className="flex items-end gap-1 h-10 pt-1">
          {[40, 65, 80, 50, 90, 75, 45, 85, 95, 60, 70, 55, 80, 65].map((baseH, idx) => {
            const dynamicHeight = Math.max(12, Math.min(100, baseH + Math.sin(Date.now() * 0.005 + idx) * 20));
            return (
              <div
                key={idx}
                className="flex-1 rounded-sm bg-gradient-to-t from-indigo-600 via-cyan-500 to-emerald-400 transition-all duration-75"
                style={{ height: `${dynamicHeight}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Weather Switcher Deck */}
      <div className="space-y-2 pt-1 border-t border-slate-800">
        <div className="text-[11px] font-sans font-medium tracking-wide text-slate-400">
          기상 환경 오버라이드
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'clear' as const, label: '쾌청 (Clear)', icon: CloudSun, color: 'text-amber-400' },
            { id: 'rain' as const, label: '소나기 (Rain)', icon: CloudRain, color: 'text-blue-400' },
            { id: 'snow' as const, label: '설산 눈 (Snow)', icon: CloudSnow, color: 'text-sky-300' },
            { id: 'mist' as const, label: '해무 (Mist)', icon: CloudFog, color: 'text-indigo-300' },
            { id: 'aurora' as const, label: '오로라 (Aurora)', icon: Sparkles, color: 'text-emerald-400' },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeWeather === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onWeatherSelect(item.id);
                  triggerStarSparkleChime();
                }}
                className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all text-xs font-sans ${
                  active
                    ? 'bg-slate-800 border-cyan-500/60 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Celestial Summons Dispatch Deck */}
      <div className="space-y-2 pt-1 border-t border-slate-800">
        <div className="text-[11px] font-sans font-medium tracking-wide text-slate-400">
          성좌 긴급 소환 (DISPATCH)
        </div>
        <div className="space-y-1.5">
          <button
            onClick={() => onSummon('gpt')}
            className="w-full p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between transition-all active:scale-98"
          >
            <span className="flex items-center gap-2">
              <AIAvatarIcon type="gpt" size={18} className="rounded" />
              <span>OpenAI GPT (에메랄드 나선)</span>
            </span>
            <span className="text-[10px] font-sans font-medium text-emerald-400">소환</span>
          </button>

          <button
            onClick={() => onSummon('claude')}
            className="w-full p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-between transition-all active:scale-98"
          >
            <span className="flex items-center gap-2">
              <AIAvatarIcon type="claude" size={18} className="rounded" />
              <span>Anthropic Claude (태양 홍염)</span>
            </span>
            <span className="text-[10px] font-sans font-medium text-amber-400">소환</span>
          </button>

          <button
            onClick={() => onSummon('deepseek')}
            className="w-full p-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center justify-between transition-all active:scale-98"
          >
            <span className="flex items-center gap-2">
              <AIAvatarIcon type="deepseek" size={18} className="rounded" />
              <span>DeepSeek (퀀텀 유체 파동)</span>
            </span>
            <span className="text-[10px] font-sans font-medium text-cyan-400">소환</span>
          </button>
        </div>
      </div>

      {/* Navigation to Codex, Studio, GIF Studio, and Viewpoints */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
        <button
          onClick={onOpenCodex}
          className="flex-1 min-w-[70px] py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 font-medium transition-all text-center"
        >
          천체 도감
        </button>
        <button
          onClick={onOpenStudio}
          className="flex-1 min-w-[70px] py-2 px-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-xs text-indigo-200 font-medium transition-all text-center"
        >
          대기 스튜디오
        </button>
        {onOpenViewpoints && (
          <button
            onClick={onOpenViewpoints}
            className="flex-1 min-w-[70px] py-2 px-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-xs text-cyan-200 font-medium transition-all text-center flex items-center justify-center gap-1"
          >
            <Bookmark className="w-3 h-3 text-cyan-300" />
            <span>뷰포인트</span>
          </button>
        )}
        {onOpenGifStudio && (
          <button
            onClick={onOpenGifStudio}
            className="flex-1 min-w-[70px] py-2 px-2 rounded-xl bg-gradient-to-r from-cyan-900/40 to-pink-900/40 hover:from-cyan-800/50 hover:to-pink-800/50 border border-pink-500/40 text-xs text-pink-200 font-medium transition-all text-center flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-pink-400" />
            <span>GIF 생성</span>
          </button>
        )}
      </div>
    </div>
  );
};
