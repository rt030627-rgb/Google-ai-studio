/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CinematicViewpoint,
} from '../utils/viewpointEngine';
import {
  Bookmark,
  Sparkles,
  Zap,
  CloudFog,
  CloudSun,
  CloudRain,
  Plus,
  FolderHeart,
} from 'lucide-react';

interface CinematicViewpointQuickBarProps {
  viewpoints: CinematicViewpoint[];
  activeViewpointId: string | null;
  onApplyViewpoint: (viewpoint: CinematicViewpoint) => void;
  onOpenModal: () => void;
  onQuickSaveCurrent: () => void;
  className?: string;
}

export const CinematicViewpointQuickBar: React.FC<CinematicViewpointQuickBarProps> = ({
  viewpoints,
  activeViewpointId,
  onApplyViewpoint,
  onOpenModal,
  onQuickSaveCurrent,
  className = '',
}) => {
  // Show all presets + user custom viewpoints (limit first 6-7 for compact HUD fit)
  const displayViewpoints = viewpoints.slice(0, 7);

  const getIcon = (type: string, color: string) => {
    switch (type) {
      case 'aurora':
        return <Sparkles className="w-3 h-3" style={{ color }} />;
      case 'meteor':
        return <Zap className="w-3 h-3" style={{ color }} />;
      case 'fog':
        return <CloudFog className="w-3 h-3" style={{ color }} />;
      case 'sun':
        return <CloudSun className="w-3 h-3" style={{ color }} />;
      case 'rain':
        return <CloudRain className="w-3 h-3" style={{ color }} />;
      default:
        return <Bookmark className="w-3 h-3" style={{ color }} />;
    }
  };

  return (
    <div
      className={`pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-2xl px-3 py-1.5 shadow-xl max-w-5xl ${className}`}
    >
      <div className="flex items-center gap-1.5 pr-1.5 border-r border-slate-800/80">
        <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[11px] font-pixel text-slate-300 tracking-wider hidden sm:inline">
          VIEWPOINT:
        </span>
      </div>

      {/* Quick Jump Buttons */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
        {displayViewpoints.map((vp) => {
          const isActive = activeViewpointId === vp.id;
          return (
            <button
              key={vp.id}
              onClick={() => onApplyViewpoint(vp)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-slate-900 border text-white shadow-md'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/70 text-slate-300 hover:text-white'
              }`}
              style={{
                borderColor: isActive ? vp.accentColor : undefined,
                boxShadow: isActive ? `0 0 12px ${vp.accentColor}40` : undefined,
              }}
              title={`${vp.name} (${vp.tag}) - 클릭하여 즉시 이동`}
            >
              {getIcon(vp.iconType, vp.accentColor)}
              <span className="truncate max-w-[110px] sm:max-w-[140px]">{vp.name}</span>
              {isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-ping"
                  style={{ backgroundColor: vp.accentColor }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="h-4 w-[1px] bg-slate-800" />

      {/* Quick Save Current State */}
      <button
        onClick={onQuickSaveCurrent}
        className="px-2 py-1 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
        title="현재 감상 중인 대기/기상 조합을 새 뷰포인트로 저장"
      >
        <Plus className="w-3 h-3 text-cyan-400" />
        <span className="hidden sm:inline">현재 뷰 저장</span>
      </button>

      {/* Viewpoint Management Modal Button */}
      <button
        onClick={onOpenModal}
        className="p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-sm"
        title="시네마틱 뷰포인트 전체 목록 및 관리 열기"
      >
        <FolderHeart className="w-3.5 h-3.5 text-pink-400" />
      </button>
    </div>
  );
};
