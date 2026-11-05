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
  Zap,
  Compass,
  Bookmark,
  Trash2,
  Plus,
  Award,
} from 'lucide-react';
import {
  type UserSettingsProfile,
  type ParticleBudget,
  type FpsTarget,
  resetSettings,
} from '../utils/settingsStorage';
import {
  FLIGHT_LOG_BADGES,
  loadUnlockedBadges,
  type UnlockedBadgeRecord,
} from '../utils/flightLogBadgeEngine';
import { getBadgeIcon } from './FlightLogBadgeDeck';
import {
  type FlightModeProfile,
  loadAllFlightModeProfiles,
  saveCustomFlightProfile,
  deleteCustomFlightProfile,
  findMatchingFlightProfile,
} from '../utils/flightModeProfiles';
import {
  clearSavedFlightSession,
  loadSavedFlightSession,
  downloadFlightSessionFile,
  importFlightSessionFromJson,
  type SavedFlightSession,
  DEFAULT_FLIGHT_SESSION,
} from '../utils/flightSessionStorage';
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

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettingsProfile;
  onUpdateSettings: (updated: Partial<UserSettingsProfile>) => void;
  currentFlightSession?: SavedFlightSession | null;
  getCurrentFlightSession?: () => SavedFlightSession;
  onRestoreFlightSession?: (session: SavedFlightSession) => void;
  onResetFlightSession?: () => void;
}

type SettingsTab = 'profiles' | 'graphics' | 'audio' | 'accessibility' | 'blackbox';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  currentFlightSession,
  getCurrentFlightSession,
  onRestoreFlightSession,
  onResetFlightSession,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('graphics');
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [backupStatusMessage, setBackupStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [flightStats, setFlightStats] = useState<FlightStatistics | null>(null);
  const [activeSessionSummary, setActiveSessionSummary] = useState<SavedFlightSession | null>(null);
  const [profiles, setProfiles] = useState<FlightModeProfile[]>(() => loadAllFlightModeProfiles());
  const [newProfileName, setNewProfileName] = useState('');
  const [unlockedBadges, setUnlockedBadges] = useState<Record<string, UnlockedBadgeRecord>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionFileInputRef = useRef<HTMLInputElement>(null);

  const { language, setLanguage, t } = useSimulationTranslation();
  const dispatch = useSimulationDispatch();

  useEffect(() => {
    if (isOpen) {
      setFlightStats(loadFlightStatistics());
      setUnlockedBadges(loadUnlockedBadges());
      setBackupStatusMessage(null);
      setProfiles(loadAllFlightModeProfiles());
      const session =
        currentFlightSession ??
        (getCurrentFlightSession ? getCurrentFlightSession() : loadSavedFlightSession());
      setActiveSessionSummary(session);
    }
  }, [isOpen, currentFlightSession, getCurrentFlightSession]);

  const activeProfile = React.useMemo(
    () => findMatchingFlightProfile(settings, profiles),
    [settings, profiles]
  );

  const handleApplyProfile = (profile: FlightModeProfile) => {
    onUpdateSettings(profile.settings);
    triggerSavedIndicator();
    setBackupStatusMessage({
      text: `${language === 'ko' ? (profile.nameKo || profile.name) : profile.name} · ${t('profileAppliedSuccess')}`,
      isError: false,
    });
  };

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newProfileName.trim()) return;

    const saved = saveCustomFlightProfile(newProfileName.trim(), settings);
    setProfiles(loadAllFlightModeProfiles());
    setNewProfileName('');
    triggerSavedIndicator();
    setBackupStatusMessage({
      text: `${saved.name} · ${t('profileSavedSuccess')}`,
      isError: false,
    });
  };

  const handleDeleteProfile = (id: string, name: string) => {
    const success = deleteCustomFlightProfile(id);
    if (success) {
      setProfiles(loadAllFlightModeProfiles());
      setBackupStatusMessage({
        text: `${name} · ${t('profileDeletedSuccess')}`,
        isError: false,
      });
    }
  };

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

  const handleExportFlightSession = () => {
    const sessionToExport =
      currentFlightSession ??
      (getCurrentFlightSession ? getCurrentFlightSession() : loadSavedFlightSession()) ??
      DEFAULT_FLIGHT_SESSION;

    const success = downloadFlightSessionFile(sessionToExport);
    if (success) {
      setBackupStatusMessage({ text: t('flightSessionExportSuccess') });
    } else {
      setBackupStatusMessage({ text: 'Failed to export flight session JSON file.', isError: true });
    }
  };

  const handleImportFlightSession = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importFlightSessionFromJson(content);
        if (res.success && res.session) {
          setBackupStatusMessage({ text: t('flightSessionImportSuccess') });
          setActiveSessionSummary(res.session);
          if (onRestoreFlightSession) {
            onRestoreFlightSession(res.session);
          }
        } else {
          setBackupStatusMessage({
            text: `${t('flightSessionImportError')} (${res.error || 'corrupted payload'})`,
            isError: true,
          });
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
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-800/60 bg-slate-950/40 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              activeTab === 'profiles'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'ko' ? '비행 모드 프로필' : 'Flight Profiles'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('graphics')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
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
          {activeTab === 'profiles' && (
            <div className="space-y-6">
              {/* Header description with active profile status */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>{t('flightProfilesTitle')}</span>
                  </div>
                  {activeProfile ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {language === 'ko' ? (activeProfile.nameKo || activeProfile.name) : activeProfile.name}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
                      CUSTOM COMBINATION
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t('flightProfilesDesc')}
                </p>
              </div>

              {/* Status Message if any */}
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

              {/* Built-in Presets Grid */}
              <div>
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-2.5">
                  {language === 'ko' ? '기본 권장 비행 모드 프리셋' : 'Built-in Mode Presets'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profiles.filter((p) => p.isBuiltIn).map((profile) => {
                    const isActive = activeProfile?.id === profile.id;
                    const pSettings = profile.settings;
                    return (
                      <div
                        key={profile.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                          isActive
                            ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/5'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-xs text-slate-200">
                              {language === 'ko' ? (profile.nameKo || profile.name) : profile.name}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${
                              isActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}>
                              {profile.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-normal mb-3">
                            {language === 'ko' ? (profile.descriptionKo || profile.description) : profile.description}
                          </p>

                          {/* Quick Spec Pills */}
                          <div className="flex flex-wrap gap-1.5 mb-3 text-[10px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                              {pSettings.particleBudget.toUpperCase()} Particles
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-300">
                              {pSettings.fpsLimit === 0 ? 'VSync Uncapped' : `${pSettings.fpsLimit} FPS`}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                              {pSettings.isMuted ? 'Muted' : `Vol ${Math.round(pSettings.masterVolume * 100)}%`}
                            </span>
                            {pSettings.crtScanlines && (
                              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                                CRT ON
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyProfile(profile)}
                          disabled={isActive}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                              : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 hover:text-white border border-cyan-500/40 active:scale-95'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{t('activeProfileTag')}</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{t('applyProfile')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Current Settings as Custom Profile Section */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                  <Bookmark className="w-4 h-4 text-cyan-400" />
                  <span>{t('saveCurrentAsProfile')}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {language === 'ko'
                    ? '현재 설정된 그래픽 퍼포먼스(파티클, FPS, 진동)와 오디오 볼륨 조합을 나만의 프로필로 저장합니다.'
                    : 'Save your current active graphics and audio mixer settings into a reusable preset.'}
                </p>

                <form onSubmit={handleSaveProfile} className="flex gap-2">
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder={t('profileNamePlaceholder')}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    maxLength={32}
                  />
                  <button
                    type="submit"
                    disabled={!newProfileName.trim()}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ko' ? '저장' : 'Save'}</span>
                  </button>
                </form>
              </div>

              {/* User Saved Custom Profiles List */}
              <div>
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-2.5">
                  {language === 'ko' ? '내 저장된 사용자 프로필' : 'User Custom Profiles'}
                </span>

                {profiles.filter((p) => !p.isBuiltIn).length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                    {language === 'ko'
                      ? '저장된 사용자 정의 프로필이 없습니다. 위에서 현재 설정을 나만의 프로필로 등록해보세요.'
                      : 'No custom profiles saved yet. Save your customized settings above.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profiles.filter((p) => !p.isBuiltIn).map((profile) => {
                      const isActive = activeProfile?.id === profile.id;
                      const pSettings = profile.settings;
                      return (
                        <div
                          key={profile.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                            isActive
                              ? 'bg-amber-950/20 border-amber-500/50'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-200">{profile.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                {profile.badge}
                              </span>
                              {isActive && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                              <span>Budget: {pSettings.particleBudget}</span>
                              <span>·</span>
                              <span>FPS: {pSettings.fpsLimit === 0 ? 'Uncapped' : pSettings.fpsLimit}</span>
                              <span>·</span>
                              <span>Sound: {pSettings.isMuted ? 'Muted' : `${Math.round(pSettings.masterVolume * 100)}%`}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleApplyProfile(profile)}
                              disabled={isActive}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                              }`}
                            >
                              {isActive ? t('activeProfileTag') : t('applyProfile')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProfile(profile.id, profile.name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                              aria-label={`Delete ${profile.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

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

              {/* Celestial Encounter Shake Intensity Slider (1 ~ 10) */}
              <div className="pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="font-medium text-slate-200 block">
                      {language === 'ko' ? '천체 조우 진동 강도' : 'Celestial Encounter Shake Intensity'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {language === 'ko'
                        ? '인공지능 성좌 조우 및 특이점 소환 시 발생하는 화면 흔들림 및 햅틱 진동'
                        : 'Screen jitter & haptic feedback on AI constellation encounter'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {settings.encounterShakeIntensity ?? 6} / 10
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={settings.encounterShakeIntensity ?? 6}
                  onChange={(e) => handleSliderChange('encounterShakeIntensity', parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>1 ({language === 'ko' ? '약함' : 'Soft'})</span>
                  <span>6 ({language === 'ko' ? '표준' : 'Standard'})</span>
                  <span>10 ({language === 'ko' ? '최대' : 'Seismic'})</span>
                </div>
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

              {/* HUD Overall Opacity Slider (20% ~ 100%) */}
              <div className="pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="font-medium text-slate-200 block">
                      {t('hudOpacityLabel')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {t('hudOpacityDesc')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {Math.round((settings.hudOpacity ?? 1) * 100)}%
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={settings.hudOpacity ?? 1}
                  onChange={(e) => handleSliderChange('hudOpacity', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  aria-label={t('hudOpacityLabel')}
                  data-testid="hud-opacity-slider"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>20% ({language === 'ko' ? '최대 투명' : 'Min Glass'})</span>
                  <span>60% ({language === 'ko' ? '반투명' : 'Semi-transparent'})</span>
                  <span>100% ({language === 'ko' ? '불투명' : 'Opaque'})</span>
                </div>
              </div>

              {/* Local System Time Auto Night Mode & Midnight Weather */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-200 block">
                    {language === 'ko' ? '로컬 시스템 시간 기반 야간 모드 / 미드나잇' : 'System Time Auto Night & Midnight Theme'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {language === 'ko'
                      ? '오후 8시~오전 6시 접속 시 다크 모드 및 심우주 미드나잇 설정을 자동으로 로드'
                      : 'Auto-loads Dark Mode and Midnight snow weather when launching between 8 PM and 6 AM'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('autoSystemNightTheme')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    settings.autoSystemNightTheme ? 'bg-cyan-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.autoSystemNightTheme ? 'translate-x-5' : 'translate-x-0'
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

                {/* Flight Log Milestone Badges Showcase */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>{language === 'ko' ? '비행 뱃지 & 마일스톤 업적' : 'Flight Log Badges & Milestones'}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {Object.keys(unlockedBadges).length} / {FLIGHT_LOG_BADGES.length} {language === 'ko' ? '달성' : 'UNLOCKED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {FLIGHT_LOG_BADGES.map((badge) => {
                      const isUnlocked = !!unlockedBadges[badge.id];
                      return (
                        <div
                          key={badge.id}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                            isUnlocked
                              ? 'bg-slate-900/90 border-slate-700/80'
                              : 'bg-slate-950/40 border-slate-800/60 opacity-50'
                          }`}
                          style={
                            isUnlocked
                              ? {
                                  borderColor: `${badge.accentColor}50`,
                                  boxShadow: `0 0 12px ${badge.glowColor}`,
                                }
                              : undefined
                          }
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{
                              backgroundColor: isUnlocked ? `${badge.accentColor}25` : '#1e293b',
                              color: isUnlocked ? badge.accentColor : '#64748b',
                              border: `1px solid ${isUnlocked ? badge.accentColor : '#334155'}`,
                            }}
                          >
                            {getBadgeIcon(badge.iconName, 'w-4 h-4')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span
                                className="text-xs font-mono font-bold truncate"
                                style={{ color: isUnlocked ? '#ffffff' : '#94a3b8' }}
                              >
                                {language === 'ko' ? badge.koreanName : badge.name}
                              </span>
                              <span
                                className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded"
                                style={{
                                  color: isUnlocked ? badge.accentColor : '#64748b',
                                  backgroundColor: isUnlocked ? `${badge.accentColor}18` : '#0f172a',
                                }}
                              >
                                {badge.rarity}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                              {language === 'ko' ? badge.koreanDescription : badge.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
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

              {/* Live Flight Session State Export / Import */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>{t('flightSessionStateTitle')}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    JSON SYNC
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t('flightSessionStateDesc')}
                </p>

                {/* Session Telemetry Snapshot Chips */}
                {activeSessionSummary && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      Progress: {Math.round(activeSessionSummary.cycleProgress * 100)}%
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                      Weather: {activeSessionSummary.weatherMode.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-300">
                      Speed: {activeSessionSummary.speedMode.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                      Layout: {activeSessionSummary.viewLayout}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleExportFlightSession}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-600/25 hover:bg-cyan-600/40 border border-cyan-500/50 text-cyan-200 hover:text-white font-medium transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>{t('exportFlightSession')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => sessionFileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-medium transition-all active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>{t('importFlightSession')}</span>
                  </button>
                  <input
                    type="file"
                    ref={sessionFileInputRef}
                    onChange={handleImportFlightSession}
                    accept=".json,application/json"
                    className="hidden"
                  />
                </div>
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
                    onResetFlightSession?.();
                    setBackupStatusMessage({
                      text: language === 'ko' ? '새 비행 세션이 시작되었으며 3D 궤도 강하가 시작됩니다.' : 'New flight session started with 3D orbital descent.',
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
