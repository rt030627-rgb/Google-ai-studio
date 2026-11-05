/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Rocket,
  Flame,
  Trophy,
  Sparkles,
  Compass,
  Gauge,
  CircleDot,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  FlightLogBadge,
  FLIGHT_LOG_BADGES,
  UnlockedBadgeRecord,
} from '../utils/flightLogBadgeEngine';

interface FlightLogBadgeDeckProps {
  unlockedBadges: Record<string, UnlockedBadgeRecord>;
  language: 'ko' | 'en';
  onBadgeSelect?: (badge: FlightLogBadge) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const getBadgeIcon = (iconName: string, className = 'w-3.5 h-3.5') => {
  switch (iconName) {
    case 'Zap':
      return <Zap className={className} />;
    case 'Rocket':
      return <Rocket className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Trophy':
      return <Trophy className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Gauge':
      return <Gauge className={className} />;
    case 'CircleDot':
      return <CircleDot className={className} />;
    default:
      return <Award className={className} />;
  }
};

export const FlightLogBadgeDeck: React.FC<FlightLogBadgeDeckProps> = ({
  unlockedBadges,
  language,
  onBadgeSelect,
  className = '',
  style,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredBadge, setHoveredBadge] = useState<FlightLogBadge | null>(null);

  const unlockedCount = Object.keys(unlockedBadges).length;
  const totalCount = FLIGHT_LOG_BADGES.length;

  return (
    <div
      style={style}
      className={`fixed left-3 top-[17.5rem] z-20 pointer-events-auto select-none transition-all duration-300 ${className}`}
    >
      <div
        className="bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-2 shadow-2xl transition-all duration-300 w-56"
        style={{
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.65)',
        }}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-300 font-bold">
              {language === 'ko' ? '비행 뱃지' : 'FLIGHT BADGES'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/30">
              {unlockedCount}/{totalCount}
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Collapse badges' : 'Expand badges'}
              className="p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Compact Horizontal Icon Ribbon (Always Visible) */}
        <div className="flex items-center justify-between gap-1 pt-1.5 px-0.5">
          {FLIGHT_LOG_BADGES.slice(0, 8).map((badge) => {
            const isUnlocked = !!unlockedBadges[badge.id];
            return (
              <button
                key={badge.id}
                type="button"
                onClick={() => {
                  setIsExpanded(true);
                  setHoveredBadge(badge);
                  onBadgeSelect?.(badge);
                }}
                onMouseEnter={() => setHoveredBadge(badge)}
                onMouseLeave={() => setHoveredBadge(null)}
                className={`relative w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                  isUnlocked
                    ? 'border shadow-sm'
                    : 'bg-slate-900/60 border border-slate-800/60 text-slate-600 opacity-40 hover:opacity-75'
                }`}
                style={
                  isUnlocked
                    ? {
                        backgroundColor: `${badge.accentColor}18`,
                        borderColor: `${badge.accentColor}70`,
                        color: badge.accentColor,
                        boxShadow: `0 0 8px ${badge.glowColor}`,
                      }
                    : undefined
                }
                title={`${language === 'ko' ? badge.koreanName : badge.name} ${
                  isUnlocked ? '✦ UNLOCKED' : '🔒 LOCKED'
                }`}
              >
                {getBadgeIcon(badge.iconName, 'w-3 h-3')}
                {isUnlocked && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: badge.accentColor }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Hover / Active Badge Tooltip Preview */}
        {hoveredBadge && (
          <div
            className="mt-2 p-1.5 rounded-lg bg-slate-900/95 border text-[10px] font-mono flex flex-col gap-0.5 transition-all"
            style={{
              borderColor: `${hoveredBadge.accentColor}50`,
              boxShadow: `0 0 14px ${hoveredBadge.glowColor}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1" style={{ color: hoveredBadge.accentColor }}>
                {getBadgeIcon(hoveredBadge.iconName, 'w-3 h-3')}
                <span>{language === 'ko' ? hoveredBadge.koreanName : hoveredBadge.name}</span>
              </span>
              <span
                className={`text-[8.5px] px-1 py-0.2 rounded font-semibold ${
                  unlockedBadges[hoveredBadge.id]
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {unlockedBadges[hoveredBadge.id]
                  ? language === 'ko'
                    ? '달성됨'
                    : 'UNLOCKED'
                  : language === 'ko'
                  ? '미달성'
                  : 'LOCKED'}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 leading-tight">
              {language === 'ko' ? hoveredBadge.koreanDescription : hoveredBadge.description}
            </p>
          </div>
        )}

        {/* Expanded Badge Detail Grid */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 pt-2 border-t border-slate-800/80 flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar"
            >
              {FLIGHT_LOG_BADGES.map((badge) => {
                const isUnlocked = !!unlockedBadges[badge.id];
                return (
                  <div
                    key={badge.id}
                    onMouseEnter={() => setHoveredBadge(badge)}
                    className={`p-1.5 rounded-lg border flex items-start gap-2 transition-all ${
                      isUnlocked
                        ? 'bg-slate-900/70'
                        : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                    }`}
                    style={
                      isUnlocked
                        ? {
                            borderColor: `${badge.accentColor}40`,
                          }
                        : undefined
                    }
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: isUnlocked ? `${badge.accentColor}25` : '#1e293b',
                        color: isUnlocked ? badge.accentColor : '#64748b',
                        border: `1px solid ${isUnlocked ? badge.accentColor : '#334155'}`,
                      }}
                    >
                      {getBadgeIcon(badge.iconName, 'w-3.5 h-3.5')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[9.5px] font-mono font-bold truncate"
                          style={{ color: isUnlocked ? '#f1f5f9' : '#94a3b8' }}
                        >
                          {language === 'ko' ? badge.koreanName : badge.name}
                        </span>
                        <span
                          className="text-[8px] font-mono uppercase px-1 rounded"
                          style={{
                            color: isUnlocked ? badge.accentColor : '#64748b',
                            backgroundColor: isUnlocked ? `${badge.accentColor}15` : '#0f172a',
                          }}
                        >
                          {badge.rarity}
                        </span>
                      </div>
                      <p className="text-[8.5px] text-slate-400 leading-tight truncate">
                        {language === 'ko' ? badge.koreanDescription : badge.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
