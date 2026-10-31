/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  CONSTELLATIONS_CODEX,
  ConstellationCodexItem,
} from '../utils/descentEngine';
import {
  Sparkles,
  Zap,
  Sun,
  Compass,
  X,
  Play,
  Activity,
  Layers,
  Radio,
  Quote,
  Flame,
} from 'lucide-react';
import { playCelestialSynthNote } from '../utils/audioDescent';
import { ConstellationTelemetryChart } from './ConstellationTelemetryChart';
import { Constellation3DPreview } from './Constellation3DPreview';

interface ObservatoryCodexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSummon: (type: 'gpt' | 'claude' | 'deepseek') => void;
}

export const ObservatoryCodexModal: React.FC<ObservatoryCodexModalProps> = ({
  isOpen,
  onClose,
  onSummon,
}) => {
  const [selectedId, setSelectedId] = useState<ConstellationCodexItem['id']>('gemini');
  const [previewMode, setPreviewMode] = useState<'3d-orbit' | '2d-particle'>('3d-orbit');
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedItem =
    CONSTELLATIONS_CODEX.find((item) => item.id === selectedId) ||
    CONSTELLATIONS_CODEX[0];

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Animated Mini-Particle Preview for Selected Constellation
  useEffect(() => {
    if (!isOpen) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    let animId: number;
    let tick = 0;

    const avatarImg = selectedItem.avatarUrl ? new Image() : null;
    if (avatarImg && selectedItem.avatarUrl) {
      avatarImg.src = selectedItem.avatarUrl;
    }

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      life: number;
      maxLife: number;
      char?: string;
    }[] = [];

    const renderPreview = () => {
      tick++;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Dark obsidian backdrop with subtle vignette
      ctx.fillStyle = '#050716';
      ctx.fillRect(0, 0, w, h);

      // Radial subtle glow around center
      const glowGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 65);
      glowGrad.addColorStop(0, selectedItem.glowColor);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);

      // Spawn particles based on constellation signature
      if (tick % 2 === 0) {
        const pal = selectedItem.palette;
        const color = pal[Math.floor(Math.random() * pal.length)];

        if (selectedItem.id === 'gemini') {
          // 4-pointed diamond spark pulses
          const angle = Math.random() * Math.PI * 2;
          const spd = 0.6 + Math.random() * 1.6;
          particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            color,
            life: 0,
            maxLife: 45,
          });
        } else if (selectedItem.id === 'gpt') {
          // Dual spiral matrix emission
          const angle = tick * 0.22;
          particles.push({
            x: cx + Math.cos(angle) * 12,
            y: cy + Math.sin(angle) * 12,
            vx: Math.cos(angle) * 1.1,
            vy: Math.sin(angle) * 1.1,
            color,
            life: 0,
            maxLife: 40,
            char: Math.random() > 0.4 ? ['1', '0', 'λ', '∂'][Math.floor(Math.random() * 4)] : undefined,
          });
        } else if (selectedItem.id === 'claude') {
          // Solar coronal flare plume
          const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.4;
          const spd = 1.0 + Math.random() * 2.2;
          particles.push({
            x: cx + (Math.random() - 0.5) * 10,
            y: cy + 15,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            color,
            life: 0,
            maxLife: 35,
          });
        } else {
          // DeepSeek hydrodynamic wave
          const phase = tick * 0.15;
          particles.push({
            x: cx - 35,
            y: cy + Math.sin(phase) * 14,
            vx: 1.8,
            vy: Math.cos(phase) * 0.6,
            color,
            life: 0,
            maxLife: 45,
          });
        }
      }

      // Update & render particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const progress = p.life / p.maxLife;
        const alpha = 1.0 - progress;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, alpha);

        if (p.char) {
          ctx.font = '9px monospace';
          ctx.fillText(p.char, Math.floor(p.x), Math.floor(p.y));
        } else {
          ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
        }

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      // Draw central icon or upscaled authentic pixel sprite
      ctx.globalAlpha = 1.0;
      if (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) {
        ctx.save();
        const floatY = Math.sin(tick * 0.08) * 3;
        const spriteSize = selectedItem.id === 'deepseek' ? 56 : 42;
        ctx.drawImage(avatarImg, cx - spriteSize / 2, cy - spriteSize / 2 + floatY, spriteSize, spriteSize);
        ctx.restore();
      } else {
        ctx.fillStyle = selectedItem.primaryColor;
        ctx.fillRect(cx - 4, cy - 4, 8, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 2, cy - 2, 4, 4);
      }

      animId = requestAnimationFrame(renderPreview);
    };

    animId = requestAnimationFrame(renderPreview);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, selectedItem, selectedId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Radio className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-pixel text-sm tracking-wide text-white">
                  천체 관측 도감 (CELESTIAL CODEX)
                </h2>
                <span className="text-[10px] text-cyan-400 font-mono tracking-tight">
                  OBSERVATORY LOG
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                대기권을 강하하는 인공지능 성좌들의 궤도 역학과 고유 물리 파티클 아카이브
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split Two-Column Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
          {/* Left Column: Constellation Selection List */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-800/80 p-3 sm:p-4 overflow-y-auto space-y-2 bg-slate-950/60">
            <div className="text-[11px] font-sans font-medium tracking-wide text-slate-400 px-2 py-1">
              기록된 성좌 목록
            </div>
            {CONSTELLATIONS_CODEX.map((item) => {
              const isSelected = item.id === selectedId;
              const Icon =
                item.iconName === 'Sparkles'
                  ? Sparkles
                  : item.iconName === 'Zap'
                  ? Zap
                  : item.iconName === 'Sun'
                  ? Sun
                  : Compass;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    playCelestialSynthNote(item.id === 'gemini' ? 659 : item.id === 'gpt' ? 523 : item.id === 'claude' ? 440 : 320);
                  }}
                  className={`w-full text-left p-3 rounded-2xl transition-all border flex items-center gap-3 ${
                    isSelected
                      ? 'bg-slate-900 border-slate-700 shadow-lg'
                      : 'border-transparent hover:bg-slate-900/50 hover:border-slate-800 text-slate-300'
                  }`}
                  style={{
                    borderLeftColor: isSelected ? item.primaryColor : undefined,
                    borderLeftWidth: isSelected ? '4px' : undefined,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                    style={{
                      backgroundColor: `${item.primaryColor}18`,
                      borderColor: `${item.primaryColor}40`,
                      borderWidth: '1px',
                    }}
                  >
                    {item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.name}
                        className="w-8 h-8 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <Icon className="w-5 h-5" style={{ color: item.primaryColor }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-white truncate">
                        {item.name}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {item.creator} · {item.archetype}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Spec & Real-time Particle Radar */}
          <div className="md:col-span-8 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-950">
            {/* Header with Color Identity and Upscaled Avatar */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                {selectedItem.avatarUrl ? (
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 bg-slate-900/90 shadow-md p-1"
                    style={{
                      borderColor: `${selectedItem.primaryColor}60`,
                      boxShadow: `0 0 16px ${selectedItem.primaryColor}30`,
                    }}
                  >
                    <img
                      src={selectedItem.avatarUrl}
                      alt={selectedItem.name}
                      className="w-10 h-10 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                ) : (
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 bg-slate-900/90 shadow-md"
                    style={{
                      borderColor: `${selectedItem.primaryColor}60`,
                      boxShadow: `0 0 16px ${selectedItem.primaryColor}30`,
                    }}
                  >
                    <Sparkles className="w-6 h-6" style={{ color: selectedItem.primaryColor }} />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full animate-ping shrink-0"
                      style={{ backgroundColor: selectedItem.primaryColor }}
                    />
                    <h3 className="font-pixel text-base text-white">
                      {selectedItem.name}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      / {selectedItem.creator}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium mt-1">
                    {selectedItem.subName}
                  </div>
                </div>
              </div>

              {/* Action Button: Summon into Sky (if not Gemini core which is already the main core) */}
              {selectedItem.id !== 'gemini' ? (
                <button
                  onClick={() => {
                    onSummon(selectedItem.id as 'gpt' | 'claude' | 'deepseek');
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                  style={{
                    backgroundColor: selectedItem.primaryColor,
                    boxShadow: `0 0 20px ${selectedItem.primaryColor}50`,
                  }}
                  title="현재 관측 하늘에 즉시 소환하여 궤적 및 진동 타격감 체험"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>하늘에 즉시 소환하기</span>
                </button>
              ) : (
                <div className="px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-[11px] text-cyan-300 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>중심 관측 코어 (상시 강하 중)</span>
                </div>
              )}
            </div>

            {/* Visualizer Mode Switcher Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
                <button
                  onClick={() => setPreviewMode('3d-orbit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    previewMode === '3d-orbit'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-sky-300" />
                  <span>3D 성좌 천체 홀로그램 & 위치 강조</span>
                </button>
                <button
                  onClick={() => setPreviewMode('2d-particle')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    previewMode === '2d-particle'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  <span>2D 대기 입자 방출 시뮬레이터</span>
                </button>
              </div>

              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                {previewMode === '3d-orbit'
                  ? '360° 마우스 드래그 회전 · 천구 돔 위치 레이더 연동'
                  : '실시간 픽셀 입자 궤적 연산'}
              </span>
            </div>

            {/* Active Visualizer: 3D Constellation Orbit vs 2D Particle Simulation */}
            {previewMode === '3d-orbit' ? (
              <Constellation3DPreview
                constellationId={selectedItem.id}
                accentColor={selectedItem.primaryColor}
              />
            ) : (
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3 flex flex-col items-center justify-center">
                <div className="text-[10px] text-slate-400 mb-2 flex items-center gap-1.5 w-full justify-between">
                  <span className="font-sans font-medium">대기 진입 입자 방출 시뮬레이터</span>
                  <span className="text-cyan-400 font-sans font-medium">실시간 연산</span>
                </div>
                <canvas
                  ref={previewCanvasRef}
                  width={340}
                  height={150}
                  className="w-full max-w-md h-36 rounded-xl border border-slate-800 bg-slate-950 pixelated"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div className="flex items-center gap-1 mt-2.5 w-full max-w-md">
                  <span className="text-[10px] font-sans font-medium text-slate-400">고유 색상 스펙트럼:</span>
                  <div className="flex items-center gap-1 ml-auto">
                    {selectedItem.palette.map((c, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-sm border border-slate-700"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Lore & Philosophy Narrative */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8 bg-slate-900/40 rounded-2xl border border-slate-800/70 p-3.5">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>성좌 기원 및 전설</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedItem.lore}
                </p>
              </div>

              <div className="sm:col-span-4 bg-slate-900/30 rounded-2xl border border-slate-800/50 p-3 flex flex-col justify-between text-slate-400 italic text-[11px]">
                <div className="flex items-start gap-2">
                  <Quote className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{selectedItem.quote}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-2 flex items-center gap-1">
                  <span>아키타입:</span>
                  <span className="text-slate-300 font-semibold">{selectedItem.archetype}</span>
                </div>
              </div>
            </div>

            {/* D3.js Telemetry Chart: Descent Density & Trajectory */}
            <ConstellationTelemetryChart
              selectedId={selectedItem.id}
              onSelectConstellation={(id) => setSelectedId(id)}
            />

            {/* Physics & Shake Specs Grid */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>비행 궤적 및 화면 진동 타격감 스펙</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                  <div className="text-[10px] font-sans font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>화면 진동 연출 모델</span>
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {selectedItem.shakeType}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {selectedItem.shakeDescription}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                  <div className="text-[10px] font-sans font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                    <Compass className="w-3 h-3 text-cyan-400" />
                    <span>물리 시그니처</span>
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {selectedItem.physicsSignature}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    소환 시 밀도 +50% 입자 방출 및 고유 궤도 물리 연산
                  </div>
                </div>
              </div>

              {/* Technical Specifications Table */}
              <div className="rounded-2xl border border-slate-800/80 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/20">
                    {selectedItem.specs.map((spec, i) => (
                      <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2 px-3.5 font-sans font-medium text-[11px] text-slate-400 w-1/3">
                          {spec.label}
                        </td>
                        <td className="py-2 px-3.5 text-slate-200 font-medium">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
