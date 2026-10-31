/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CinematicViewpoint,
  createCustomViewpoint,
  deleteCustomViewpoint,
  getViewpointBadgeSummary,
  getPhaseTagFromProgress,
} from '../utils/viewpointEngine';
import {
  CustomAtmosphereSettings,
  WeatherType,
  WEATHER_CONFIGS,
} from '../utils/descentEngine';
import {
  Bookmark,
  Sparkles,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudFog,
  Zap,
  Trash2,
  X,
  Play,
  Check,
  Plus,
  Compass,
  Film,
  Tv,
  Layers,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { triggerStarSparkleChime } from '../utils/audioDescent';

interface CinematicViewpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewpoints: CinematicViewpoint[];
  activeViewpointId: string | null;
  onApplyViewpoint: (viewpoint: CinematicViewpoint) => void;
  onRefreshViewpoints: () => void;
  // Current atmospheric parameters to capture
  currentCycleProgress: number;
  currentWeatherMode: 'auto' | WeatherType;
  currentSpeedMode: 'cinematic' | 'normal' | 'mach';
  currentAtmosphereSettings: CustomAtmosphereSettings;
  currentShowScanlines: boolean;
  currentShowStarTrails: boolean;
  currentShowTrajectoryLine: boolean;
  currentViewLayout: 'standard' | 'split-radar' | 'cinematic';
}

const PRESET_COLOR_CHOICES = [
  { label: '에메랄드', hex: '#34d399' },
  { label: '시안 블루', hex: '#38bdf8' },
  { label: '앰버 골드', hex: '#fbbf24' },
  { label: '퍼플 코스믹', hex: '#a78bfa' },
  { label: '로즈 네온', hex: '#fb7185' },
];

export const CinematicViewpointModal: React.FC<CinematicViewpointModalProps> = ({
  isOpen,
  onClose,
  viewpoints,
  activeViewpointId,
  onApplyViewpoint,
  onRefreshViewpoints,
  currentCycleProgress,
  currentWeatherMode,
  currentSpeedMode,
  currentAtmosphereSettings,
  currentShowScanlines,
  currentShowStarTrails,
  currentShowTrajectoryLine,
  currentViewLayout,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'presets' | 'custom'>('all');
  const [isSaveDrawerOpen, setIsSaveDrawerOpen] = useState<boolean>(false);
  const [newViewpointName, setNewViewpointName] = useState<string>('');
  const [newViewpointDesc, setNewViewpointDesc] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#38bdf8');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPhaseTag = getPhaseTagFromProgress(currentCycleProgress);
  const currentWeatherName =
    currentWeatherMode === 'auto'
      ? '시간 연동'
      : WEATHER_CONFIGS[currentWeatherMode]?.name.split(' ')[0] || currentWeatherMode;

  const handleOpenSaveForm = () => {
    setIsSaveDrawerOpen(true);
    setSaveSuccessMsg(null);
    if (!newViewpointName) {
      setNewViewpointName(`${currentPhaseTag} ${currentWeatherName} 시네마틱 뷰`);
    }
  };

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = newViewpointName.trim() || `${currentPhaseTag} 맞춤 뷰포인트`;
    const newVp = createCustomViewpoint({
      name: finalName,
      description:
        newViewpointDesc.trim() ||
        `${currentPhaseTag} 대기 · ${currentWeatherName} 날씨 · ${currentSpeedMode} 속도 조합`,
      cycleProgress: currentCycleProgress,
      weatherMode: currentWeatherMode,
      speedMode: currentSpeedMode,
      atmosphereSettings: currentAtmosphereSettings,
      showScanlines: currentShowScanlines,
      showStarTrails: currentShowStarTrails,
      showTrajectoryLine: currentShowTrajectoryLine,
      viewLayout: currentViewLayout,
      accentColor: selectedColor,
      iconType: 'custom',
    });

    triggerStarSparkleChime();
    onRefreshViewpoints();
    setSaveSuccessMsg(`'${finalName}' 뷰포인트가 저장되었습니다!`);
    setTimeout(() => {
      setIsSaveDrawerOpen(false);
      setSaveSuccessMsg(null);
      setNewViewpointName('');
      setNewViewpointDesc('');
    }, 1200);
  };

  const handleDelete = (id: string, name: string) => {
    const success = deleteCustomViewpoint(id);
    if (success) {
      triggerStarSparkleChime();
      onRefreshViewpoints();
    }
  };

  const filteredViewpoints = viewpoints.filter((vp) => {
    if (filterTab === 'presets') return vp.isPreset;
    if (filterTab === 'custom') return !vp.isPreset;
    return true;
  });

  const renderIcon = (type: string, accentColor: string) => {
    switch (type) {
      case 'aurora':
        return <Sparkles className="w-4 h-4" style={{ color: accentColor }} />;
      case 'meteor':
        return <Zap className="w-4 h-4" style={{ color: accentColor }} />;
      case 'fog':
        return <CloudFog className="w-4 h-4" style={{ color: accentColor }} />;
      case 'sun':
        return <CloudSun className="w-4 h-4" style={{ color: accentColor }} />;
      case 'rain':
        return <CloudRain className="w-4 h-4" style={{ color: accentColor }} />;
      default:
        return <Bookmark className="w-4 h-4" style={{ color: accentColor }} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950/95 border border-slate-800/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Bookmark className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="font-pixel text-sm sm:text-base tracking-wider text-white flex items-center gap-2">
                CINEMATIC <span className="text-cyan-400">VIEWPOINTS</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                특정 대기 상태와 기상 이벤트 조합을 저장하고 퀵 점프로 즉시 감상
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenSaveForm}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>현재 설정 저장</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Atmosphere Live Snapshot Bar */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">현재 관측 상태:</span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
              {currentPhaseTag} ({(currentCycleProgress * 100).toFixed(0)}%)
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
              기상: {currentWeatherName}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
              속도: {currentSpeedMode}
            </span>
            {currentAtmosphereSettings.cinemaBars && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                와이드 스크린
              </span>
            )}
            {currentShowScanlines && (
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px]">
                CRT 스캔라인
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline">
            총 {viewpoints.length}개의 뷰포인트 등록됨
          </span>
        </div>

        {/* Save New Viewpoint Drawer */}
        {isSaveDrawerOpen && (
          <form
            onSubmit={handleSaveCurrent}
            className="p-4 sm:p-5 bg-slate-900/90 border-b border-cyan-500/30 space-y-3.5 animate-slide-down"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs sm:text-sm text-cyan-300 flex items-center gap-1.5">
                <Bookmark className="w-4 h-4" />
                <span>현재 대기 상태를 새 뷰포인트로 저장</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSaveDrawerOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                닫기
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  뷰포인트 이름 *
                </label>
                <input
                  type="text"
                  required
                  value={newViewpointName}
                  onChange={(e) => setNewViewpointName(e.target.value)}
                  placeholder="예: 황혼의 보랏빛 오로라 강하"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  메모 / 설명 (선택)
                </label>
                <input
                  type="text"
                  value={newViewpointDesc}
                  onChange={(e) => setNewViewpointDesc(e.target.value)}
                  placeholder="예: 오로라와 잔잔한 뭉게구름이 어우러진 힐링 뷰"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Accent Color Selection & Quick Name Presets */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">강조 색상:</span>
                <div className="flex items-center gap-1.5">
                  {PRESET_COLOR_CHOICES.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setSelectedColor(col.hex)}
                      className={`w-6 h-6 rounded-lg transition-transform flex items-center justify-center ${
                        selectedColor === col.hex ? 'scale-110 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.label}
                    >
                      {selectedColor === col.hex && <Check className="w-3.5 h-3.5 text-black font-bold" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaveDrawerOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/30"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>북마크 저장</span>
                </button>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}
          </form>
        )}

        {/* Viewpoint Tabs */}
        <div className="px-4 pt-3 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            {[
              { id: 'all' as const, label: '전체 목록' },
              { id: 'presets' as const, label: '추천 프리셋' },
              { id: 'custom' as const, label: '내가 저장한 뷰' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                  filterTab === tab.id
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-500">
            {filteredViewpoints.length}개 표시 중
          </span>
        </div>

        {/* Viewpoints Cards Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 max-h-[58vh]">
          {filteredViewpoints.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              {filterTab === 'custom'
                ? '저장된 커스텀 뷰포인트가 없습니다. 상단의 "현재 설정 저장" 버튼을 눌러 지금 보고 있는 하늘을 북마크하세요!'
                : '표시할 뷰포인트가 없습니다.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredViewpoints.map((vp) => {
                const summary = getViewpointBadgeSummary(vp);
                const isActive = activeViewpointId === vp.id;

                return (
                  <div
                    key={vp.id}
                    className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 flex flex-col justify-between gap-3 ${
                      isActive
                        ? 'bg-slate-900/90 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                        : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                    }`}
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: vp.accentColor || '#38bdf8',
                    }}
                  >
                    <div>
                      {/* Top row: Title & Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="p-1.5 rounded-lg shrink-0"
                            style={{ backgroundColor: `${vp.accentColor}20` }}
                          >
                            {renderIcon(vp.iconType, vp.accentColor)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-semibold text-xs sm:text-sm text-white">
                                {vp.name}
                              </h4>
                              {isActive && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-sans font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                  적용 중
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {vp.isPreset ? '공식 추천 프리셋' : '사용자 저장 뷰'}
                            </span>
                          </div>
                        </div>

                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-sans font-medium border shrink-0"
                          style={{
                            backgroundColor: `${vp.accentColor}18`,
                            borderColor: `${vp.accentColor}40`,
                            color: vp.accentColor,
                          }}
                        >
                          {summary.phaseLabel}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                        {vp.description}
                      </p>

                      {/* Parameter Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        <span className="px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800 text-[10px] text-slate-300">
                          기상: {summary.weatherLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800 text-[10px] text-slate-300">
                          속도: {summary.speedLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800 text-[10px] text-slate-300">
                          구름 밀도: {vp.atmosphereSettings.cloudDensityScale}x
                        </span>
                        {summary.hasCinemaBars && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 flex items-center gap-1">
                            <Film className="w-2.5 h-2.5" />
                            와이드
                          </span>
                        )}
                        {summary.hasCrt && (
                          <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-[10px] text-rose-300 flex items-center gap-1">
                            <Tv className="w-2.5 h-2.5" />
                            CRT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-500">
                        진행도 {Math.round(vp.cycleProgress * 100)}%
                      </span>

                      <div className="flex items-center gap-2">
                        {!vp.isPreset && (
                          <button
                            onClick={() => handleDelete(vp.id, vp.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="뷰포인트 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onApplyViewpoint(vp);
                            onClose();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-md ${
                            isActive
                              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{isActive ? '다시 로드' : '즉시 점프'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            💡 팁: 하단 컨트롤 데크의 퀵 점프 칩을 누르면 모달을 열지 않고도 1클릭으로 바로 전환됩니다.
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs hover:bg-slate-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
