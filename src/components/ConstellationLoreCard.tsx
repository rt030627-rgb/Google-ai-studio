/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CelestialAsterism,
  AsterismStar,
} from '../utils/starChartEngine';
import {
  Sparkles,
  X,
  Compass,
  BookOpen,
  Telescope,
  Star,
  Info,
  Radio,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import { triggerStarSparkleChime, playSatelliteRadioBeepSound } from '../utils/audioDescent';

interface ConstellationLoreCardProps {
  asterism: CelestialAsterism | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'lore' | 'astronomy' | 'stars';

export const ConstellationLoreCard: React.FC<ConstellationLoreCardProps> = ({
  asterism,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('lore');
  const [selectedStar, setSelectedStar] = useState<AsterismStar | null>(null);

  if (!isOpen || !asterism) return null;

  const handleStarClick = (star: AsterismStar) => {
    setSelectedStar(star);
    playSatelliteRadioBeepSound();
  };

  const handleSoundChime = () => {
    triggerStarSparkleChime();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 pointer-events-none">
        {/* Semi-transparent backdrop for mobile/desktop dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] pointer-events-auto"
        />

        {/* Floating Observatory Holographic Constellation Card */}
        <motion.div
          key={asterism.id}
          initial={{ opacity: 0, scale: 0.92, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 18 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative pointer-events-auto w-full max-w-lg rounded-2xl bg-slate-950/95 border shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col text-slate-100 max-h-[85vh] z-10"
          style={{
            borderColor: `${asterism.color}60`,
            boxShadow: `0 15px 40px -10px ${asterism.color}33, 0 0 25px ${asterism.color}22`,
          }}
        >
          {/* Top Cosmic Glow Ambient Accent */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-32 rounded-full blur-3xl pointer-events-none opacity-40"
            style={{ backgroundColor: asterism.color }}
          />

          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/60 relative z-10 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg shrink-0"
                style={{
                  backgroundColor: `${asterism.color}15`,
                  borderColor: `${asterism.color}50`,
                }}
              >
                <Compass className="w-5 h-5 animate-spin-slow" style={{ color: asterism.color }} />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-pixel text-xs sm:text-sm text-white tracking-wider flex items-center gap-1.5">
                    {asterism.name}
                  </h3>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border"
                    style={{
                      backgroundColor: `${asterism.color}20`,
                      borderColor: `${asterism.color}60`,
                      color: asterism.color,
                    }}
                  >
                    {asterism.koreanName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <span>{asterism.subName}</span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono text-[10px] text-slate-500">
                    좌표 ({asterism.centerPoint.x}, {asterism.centerPoint.y})
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleSoundChime}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="성간 별빛 공명 사운드 재생"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="닫기 [ESC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800/80 bg-slate-950/80 px-4 pt-2 gap-2 text-xs">
            <button
              onClick={() => setActiveTab('lore')}
              className={`pb-2.5 px-2.5 font-medium flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'lore'
                  ? 'border-cyan-400 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>신화적 설화</span>
            </button>

            <button
              onClick={() => setActiveTab('astronomy')}
              className={`pb-2.5 px-2.5 font-medium flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'astronomy'
                  ? 'border-indigo-400 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Telescope className="w-3.5 h-3.5 text-indigo-400" />
              <span>천문학적 의미</span>
            </button>

            <button
              onClick={() => setActiveTab('stars')}
              className={`pb-2.5 px-2.5 font-medium flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'stars'
                  ? 'border-amber-400 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>구성 항성 ({asterism.stars.length})</span>
            </button>
          </div>

          {/* Tab Body Content */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs leading-relaxed">
            {/* Tab 1: Mythological Lore */}
            {activeTab === 'lore' && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                {/* Lore Origin Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-cyan-300">
                    설화 기원
                  </span>
                  <span className="text-slate-300 text-[11px] font-medium">
                    {asterism.mythologicalLore.origin}
                  </span>
                </div>

                {/* Narrative Story Prose */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-200 space-y-2">
                  <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>성좌 전승 및 설화 (Lore Chronicle)</span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-slate-300">
                    {asterism.mythologicalLore.story}
                  </p>
                </div>

                {/* Cultural Symbolism */}
                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-semibold text-cyan-300">상징적 의미와 전승 가치</div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {asterism.mythologicalLore.symbolism}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 2: Astronomical Significance */}
            {activeTab === 'astronomy' && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                {/* Astronomical Spec Table */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">성좌군 (Family)</div>
                    <div className="font-semibold text-white mt-0.5">
                      {asterism.astronomicalSignificance.constellationFamily}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">관측 최적기</div>
                    <div className="font-semibold text-indigo-300 mt-0.5">
                      {asterism.astronomicalSignificance.bestSeason}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2">
                    <div className="text-[10px] text-slate-400">지구와의 평균 광도 거리</div>
                    <div className="font-mono text-cyan-300 font-semibold mt-0.5">
                      {asterism.astronomicalSignificance.distanceLy}
                    </div>
                  </div>
                </div>

                {/* Navigational Role */}
                <div className="p-3.5 rounded-xl bg-indigo-950/25 border border-indigo-500/30 space-y-1.5">
                  <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-indigo-400" />
                    <span>천체 항법 및 방향 지침 (Navigational Guide)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {asterism.astronomicalSignificance.navigationalRole}
                  </p>
                </div>

                {/* Notable Deep-Sky Objects */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Telescope className="w-3.5 h-3.5 text-amber-400" />
                    <span>주요 심우주 천체 (Deep-Sky Targets)</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                    {asterism.astronomicalSignificance.notableObjects.map((obj, i) => (
                      <li key={i} className="leading-tight">
                        <span className="text-slate-200">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Tab 3: Member Stars */}
            {activeTab === 'stars' && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="text-[11px] text-slate-400">
                  항성을 클릭하여 분광형 및 상세 천문 제원을 확인하세요:
                </div>

                {/* Star Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {asterism.stars.map((s, idx) => {
                    const isStarSelected = selectedStar?.label === s.label;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleStarClick(s)}
                        className={`p-2.5 rounded-xl border text-left transition-all active:scale-98 cursor-pointer ${
                          isStarSelected
                            ? 'bg-amber-950/50 border-amber-400/80 ring-1 ring-amber-400/40 text-white'
                            : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-amber-300 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{s.label || `Star #${idx + 1}`}</span>
                          </span>
                          {s.bayerName && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {s.bayerName}
                            </span>
                          )}
                        </div>

                        {s.stellarType && (
                          <div className="text-[10px] text-slate-400 mt-1 truncate">
                            {s.stellarType}
                          </div>
                        )}

                        <div className="text-[9px] font-mono text-slate-500 mt-1 flex items-center justify-between">
                          <span>광도: {s.magnitudeValue !== undefined ? `${s.magnitudeValue}등급` : `크기 ${s.mag}px`}</span>
                          <span>좌표: ({Math.round(s.x)}, {Math.round(s.y)})</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Star Details Panel */}
                {selectedStar && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 text-[11px] space-y-1 animate-in fade-in">
                    <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>{selectedStar.label} 천체 분광 분석</span>
                    </div>
                    <div className="text-slate-300">
                      분광형: <span className="text-white font-mono">{selectedStar.stellarType || '주계열성'}</span>
                    </div>
                    {selectedStar.magnitudeValue && (
                      <div className="text-slate-300">
                        겉보기 등급: <span className="text-amber-300 font-mono">{selectedStar.magnitudeValue} mag</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-mono text-[10px]">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>[K] 성도 닫기 · [ESC] 창 닫기</span>
            </span>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              확인 및 닫기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
