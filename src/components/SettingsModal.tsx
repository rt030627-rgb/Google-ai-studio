import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Monitor,
  Sparkles,
  Sliders,
  RotateCcw,
  Eye,
  Activity,
  Check,
  Languages,
  Database,
  Download,
  Upload,
  AlertCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  type UserSettingsProfile,
  type ParticleBudget,
  type FpsTarget,
  resetSettings,
} from '../utils/settingsStorage';
import { clearSavedFlightSession } from '../utils/flightSessionStorage';
import {
  useSimulationTranslation,
  useSimulationDispatch,
  useSimulationState,
} from '../context/SimulationContext';
import {
  loadFlightStatistics,
  downloadBackupFile,
  restoreProfileFromJson,
  FlightStatistics,
} from '../utils/flightLogBlackbox';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettingsProfile;
  onUpdateSettings: (updated: Partial<UserSettingsProfile>) => void;
}

type SettingsTab = 'graphics' | 'audio' | 'accessibility' | 'blackbox';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('graphics');
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [backupStatusMessage, setBackupStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [flightStats, setFlightStats] = useState<FlightStatistics | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { language, setLanguage, t } = useSimulationTranslation();
  const dispatch = useSimulationDispatch();

  useEffect(() => {
    if (isOpen) {
      setFlightStats(loadFlightStatistics());
      setBackupStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerSavedIndicator = () => {
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 1500);
  };

  const handleSliderChange = (key: keyof UserSettingsProfile, val: number) => {
    onUpdateSettings({ [key]: val });
    triggerSavedIndicator();
  };

  const handleToggle = (key: keyof UserSettingsProfile) => {
    onUpdateSettings({ [key]: !settings[key] });
    triggerSavedIndicator();
  };

  const handleBudgetSelect = (budget: ParticleBudget) => {
    onUpdateSettings({ particleBudget: budget });
    triggerSavedIndicator();
  };

  const handleFpsSelect = (fps: FpsTarget) => {
    onUpdateSettings({ fpsLimit: fps });
    triggerSavedIndicator();
  };

  const handleResetDefaults = () => {
    const defaults = resetSettings();
    onUpdateSettings(defaults);
    triggerSavedIndicator();
  };

  const handleExportBackup = () => {
    const success = downloadBackupFile();
    if (success) {
      setBackupStatusMessage({ text: t('backupExportSuccess') });
    } else {
      setBackupStatusMessage({ text: 'Failed to create backup blob.', isError: true });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = restoreProfileFromJson(content);
        if (res.success) {
          setBackupStatusMessage({ text: t('backupImportSuccess') });
          setFlightStats(loadFlightStatistics());
          // Refresh context settings
          try {
            const raw = localStorage.getItem('gemini_descent_user_settings_v1');
            if (raw) onUpdateSettings(JSON.parse(raw));
          } catch {
            // Ignore
          }
        } else {
          setBackupStatusMessage({ text: `${t('backupImportError')} (${res.error})`, isError: true });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">{t('settingsTitle')}</h2>
              <span className="text-xs text-slate-400">v1.2 · Hardened Telemetry Architecture</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Language Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 mr-1">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                  language === 'en' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ko')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                  language === 'ko' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                한국어
              </button>
            </div>

            {showSavedFeedback && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 transition-opacity">
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-800/60 bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('graphics')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'graphics'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{language === 'ko' ? '그래픽 & FX' : 'Graphics & FX'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{language === 'ko' ? '오디오 믹서' : 'Audio Mixer'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('accessibility')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'accessibility'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{language === 'ko' ? '접근성 & UX' : 'Accessibility'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blackbox')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'blackbox'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-200">{language === 'ko' ? '블랙박스 백업' : 'Blackbox Backup'}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {activeTab === 'graphics' && (
            <div className="space-y-5">
              {/* Particle Density Budget */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-200">{t('particleBudget')}</span>
                  <span className="text-slate-400 font-mono">
                    {settings.particleBudget.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  {(['low', 'balanced', 'ultra'] as ParticleBudget[]).map((budget) => (
                    <button
                      key={budget}
                      type="button"
                      onClick={() => handleBudgetSelect(budget)}
                      className={`py-1.5 px-3 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${
                        settings.particleBudget === budget
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {budget === 'ultra' ? t('budgetUltra') : budget === 'balanced' ? t('budgetBalanced') : t('budgetLow')}
                    </button>
                  ))}
                </div>
              </div>

              {/* FPS Limiter */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-200">{language === 'ko' ? '최대 프레임 제한' : 'Target Refresh Rate'}</span>
                  <span className="text-slate-400 font-mono">
                    {settings.fpsLimit === 0 ? 'V-SYNC UNLIMITED' : `${settings.fpsLimit} FPS`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  {([30, 60, 0] as FpsTarget[]).map((fps) => (
                    <button
                      key={fps}
                      type="button"
                      onClick={() => handleFpsSelect(fps)}
                      className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                        settings.fpsLimit === fps
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {fps === 0 ? 'VSync (Uncapped)' : `${fps} FPS Target`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screen Shake Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-slate-200">{language === 'ko' ? '화면 흔들림 및 난기류 진동' : 'Camera Turbulence Vibration'}</span>
                  <span className="text-slate-400 font-mono">
                    {Math.round(settings.screenShake * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.screenShake}
                  onChange={(e) => handleSliderChange('screenShake', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Bloom Glow Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="font-medium text-slate-200 block">{t('bloomGlow')}</span>
                  <span className="text-[11px] text-slate-400">
                    {language === 'ko' ? '방열판 이온화 및 가르간튀아 강착원반 광채' : 'Accretion disk plasma emission & re-entry flares'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('bloomGlow')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    settings.bloomGlow ? 'bg-cyan-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.bloomGlow ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* CRT Scanlines Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-200 block">{t('retroScanlines')}</span>
                  <span className="text-[11px] text-slate-400">
                    {language === 'ko' ? '1980년대 아케이드 모니터 아날로그 라인' : '1980s retro CRT flight monitor overlay'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('crtScanlines')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    settings.crtScanlines ? 'bg-cyan-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.crtScanlines ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-5">
              {/* Master Mute Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  {settings.isMuted ? (
                    <VolumeX className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-cyan-400" />
                  )}
                  <div>
                    <span className="font-medium text-slate-200 block">{t('audioMuted')}</span>
                    <span className="text-[11px] text-slate-400">
                      {language === 'ko' ? '신스 라디오 및 사운드 효과 즉시 음소거' : 'Instantly silence all procedural synths and sfx'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('isMuted')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    settings.isMuted ? 'bg-rose-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.isMuted ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Master Volume Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-slate-200">{t('audioMasterVolume')}</span>
                  <span className="text-slate-400 font-mono">
                    {Math.round(settings.masterVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.masterVolume}
                  onChange={(e) => handleSliderChange('masterVolume', parseFloat(e.target.value))}
                  disabled={settings.isMuted}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-40"
                />
              </div>

              {/* Background Tab Auto-Mute */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="font-medium text-slate-200 block">
                    {language === 'ko' ? '백그라운드 탭 자동 절전 및 음소거' : 'Auto-Suspend on Background Tab'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {language === 'ko' ? '다른 탭이나 창 전환 시 배터리와 CPU 절약' : 'Saves battery & stops CPU audio processing when tab loses focus'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('muteOnBlur')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    settings.muteOnBlur ? 'bg-cyan-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.muteOnBlur ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-200 block">
                    {language === 'ko' ? '모션 애니메이션 감소' : 'Reduce Motion & Flashes'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {language === 'ko' ? '급격한 카메라 흔들림과 붉은 경보 플래시 완화' : 'Dampens camera shake and intense red alert strobes'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('reduceMotion')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    settings.reduceMotion ? 'bg-cyan-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.reduceMotion ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-200 block">
                    {language === 'ko' ? '스마트 젠 자동 HUD 페이드' : 'Smart Zen Auto-Fade HUD'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {language === 'ko' ? '3.5초간 비활동 시 비행 정보창 부드럽게 숨김' : 'Fades telemetry HUD after 3.5s of idle stillness'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('autoHideHud')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    settings.autoHideHud ? 'bg-cyan-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.autoHideHud ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Reset Defaults */}
              <div className="pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('resetDefaults')}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'blackbox' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{t('blackboxTitle')}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    LOCAL PERSISTENCE ACTIVE
                  </span>
                </div>

                {/* Career Stats Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">{t('totalKmTraveled')}</span>
                    <span className="text-base font-mono font-bold text-cyan-300">
                      {(flightStats?.totalKmTraveled || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">km</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">{t('ringsCollectedStat')}</span>
                    <span className="text-base font-mono font-bold text-amber-300">
                      {(flightStats?.ringsCollected || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">rings</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">{t('highestScoreStat')}</span>
                    <span className="text-base font-mono font-bold text-purple-300">
                      {(flightStats?.highestScore || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">pts</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">{t('flightSessionsCount')}</span>
                    <span className="text-base font-mono font-bold text-emerald-300">
                      {(flightStats?.totalDescentCycles || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">cycles</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {backupStatusMessage && (
                <div
                  className={`p-3 rounded-lg border flex items-center gap-2 text-xs ${
                    backupStatusMessage.isError
                      ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                      : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  }`}
                >
                  {backupStatusMessage.isError ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  ) : (
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  )}
                  <span>{backupStatusMessage.text}</span>
                </div>
              )}

              {/* Backup & Restore Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 hover:text-white font-medium transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('exportBackup')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-medium transition-all active:scale-95 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{t('importBackup')}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  accept=".json,application/json"
                  className="hidden"
                />
              </div>

              {/* Flight Session Cache Reset */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-300 block">
                    {language === 'ko' ? '비행 세션 자동 복구 캐시' : 'Flight Session Auto-Recovery Cache'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {language === 'ko' ? '고도, 기상, 레이아웃 등 현재 비행 세션 기록' : 'Altitude, weather, layout and active mode states'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearSavedFlightSession();
                    setBackupStatusMessage({
                      text: language === 'ko' ? '저장된 비행 세션이 초기화되었습니다.' : 'Saved flight session cleared successfully.',
                      isError: false,
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'ko' ? '세션 캐시 초기화' : 'Clear Session'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Profile stored locally · Zero cloud dependency</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            {t('saveAndClose')}
          </button>
        </div>
      </div>
    </div>
  );
};
