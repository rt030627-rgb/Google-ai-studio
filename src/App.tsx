/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelDescentCanvas } from './components/PixelDescentCanvas';
import { ObservatoryCodexModal } from './components/ObservatoryCodexModal';
import { AtmosphereStudioDrawer } from './components/AtmosphereStudioDrawer';
import { ObservatoryRadarDeck } from './components/ObservatoryRadarDeck';
import { SoundscapeMixerModal } from './components/SoundscapeMixerModal';
import { GeminiGifStudioModal } from './components/GeminiGifStudioModal';
import { CinematicViewpointModal } from './components/CinematicViewpointModal';
import { CinematicViewpointQuickBar } from './components/CinematicViewpointQuickBar';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { AtmosphericAltimeterGauge } from './components/AtmosphericAltimeterGauge';
import { AudioLedVisualizer } from './components/AudioLedVisualizer';
import { AIAvatarIcon } from './components/AIAvatarIcon';
import {
  startAmbientDescentSound,
  stopAmbientDescentSound,
  triggerStarSparkleChime,
  playDragonRoarAndWingsSound,
  playMeteorShootingSound,
  playBlackHoleSingularitySound,
  setWeatherAudioMode,
} from './utils/audioDescent';
import {
  calculateAltitudeTelemetry,
  generateWatermarkText,
} from './utils/altitudeTelemetry';
import {
  TIME_PHASES,
  WeatherType,
  WEATHER_CONFIGS,
  CustomAtmosphereSettings,
  DEFAULT_ATMOSPHERE_SETTINGS,
  triggerCelestialHaptic,
  getScreenJitterKeyframes,
  getRedAlertStrobeTimeline,
} from './utils/descentEngine';
import {
  CinematicViewpoint,
  loadAllViewpoints,
  createCustomViewpoint,
} from './utils/viewpointEngine';
import {
  CanvasVideoRecorder,
  isCanvasRecordingSupported,
  formatCamcorderTime,
} from './utils/canvasRecorder';
import { ArcadeGameState, createInitialArcadeState } from './utils/arcadeRingEngine';
import { OrbitalSatellite } from './utils/satelliteEngine';
import { SettingsModal } from './components/SettingsModal';
import { ConstellationLoreCard } from './components/ConstellationLoreCard';
import { CelestialAsterism } from './utils/starChartEngine';
import { SimulationErrorBoundary } from './components/SimulationErrorBoundary';
import { SimulationProvider, useSimulationTranslation } from './context/SimulationContext';
import { recordFlightMetrics } from './utils/flightLogBlackbox';
import {
  UserSettingsProfile,
  loadSettings,
  saveSettings,
} from './utils/settingsStorage';
import {
  loadSavedFlightSession,
  saveFlightSession,
  clearSavedFlightSession,
  CURRENT_SESSION_VERSION,
} from './utils/flightSessionStorage';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Download,
  Sparkles,
  Sun,
  Moon,
  Sunset,
  Sunrise,
  Zap,
  Gauge,
  Tv,
  Eye,
  Compass,
  Play,
  Pause,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudSun,
  Shuffle,
  BookOpen,
  Sliders,
  Columns2,
  Monitor,
  Film,
  Crosshair,
  Route,
  Vibrate,
  Flame,
  Bookmark,
  Keyboard,
  Video,
  CircleDot,
  Trophy,
  Target,
  Radio,
  Settings,
  X,
} from 'lucide-react';

function MainSimulationApp() {
  const { language, setLanguage, t } = useSimulationTranslation();

  // Automatic Flight Session Recovery Engine
  const initialFlightSession = useMemo(() => loadSavedFlightSession(), []);
  const [restoredSessionNotice, setRestoredSessionNotice] = useState<{
    altitudeKm: number;
    weather: string;
    layout: string;
  } | null>(() => {
    if (!initialFlightSession) return null;
    const km = Math.round(calculateAltitudeTelemetry(initialFlightSession.cycleProgress, 'normal', false, 0).altitudeKm);
    return {
      altitudeKm: km,
      weather: initialFlightSession.weatherMode,
      layout: initialFlightSession.viewLayout,
    };
  });

  // Auto-dismiss the restore notice after 6.5s
  useEffect(() => {
    if (restoredSessionNotice) {
      const timer = window.setTimeout(() => {
        setRestoredSessionNotice(null);
      }, 6500);
      return () => window.clearTimeout(timer);
    }
  }, [restoredSessionNotice]);

  // Operational Layout Mode: 'standard' (full HUD) | 'split-radar' (observatory split terminal) | 'cinematic' (pure theater)
  const [viewLayout, setViewLayout] = useState<'standard' | 'split-radar' | 'cinematic'>(
    () => initialFlightSession?.viewLayout ?? 'standard'
  );

  // Modals & Panels
  const [isCodexOpen, setIsCodexOpen] = useState<boolean>(false);
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [isAudioMixerOpen, setIsAudioMixerOpen] = useState<boolean>(false);
  const [isGifStudioOpen, setIsGifStudioOpen] = useState<boolean>(false);
  const [isViewpointModalOpen, setIsViewpointModalOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [userSettings, setUserSettings] = useState<UserSettingsProfile>(() => loadSettings());
  const [isIdle, setIsIdle] = useState<boolean>(false);
  const idleTimeoutRef = useRef<number | null>(null);

  const handleUpdateUserSettings = useCallback((updated: Partial<UserSettingsProfile>) => {
    setUserSettings((prev) => {
      const next = { ...prev, ...updated };
      saveSettings(next);
      if (updated.crtScanlines !== undefined) {
        setShowScanlines(updated.crtScanlines);
      }
      return next;
    });
  }, []);

  // Cinematic Viewpoints State
  const [viewpoints, setViewpoints] = useState<CinematicViewpoint[]>(() => loadAllViewpoints());
  const [activeViewpointId, setActiveViewpointId] = useState<string | null>(
    () => initialFlightSession?.activeViewpointId ?? null
  );
  const [viewpointToast, setViewpointToast] = useState<{ message: string; color: string } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const handleRefreshViewpoints = useCallback(() => {
    setViewpoints(loadAllViewpoints());
  }, []);

  // Time & Physics Controls
  const [cycleProgress, setCycleProgress] = useState<number>(
    () => initialFlightSession?.cycleProgress ?? 0.5
  );
  const [isAutoCycle, setIsAutoCycle] = useState<boolean>(
    () => initialFlightSession?.isAutoCycle ?? true
  );
  const [speedMode, setSpeedMode] = useState<'cinematic' | 'normal' | 'mach'>(
    () => initialFlightSession?.speedMode ?? 'normal'
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [showScanlines, setShowScanlines] = useState<boolean>(
    () => initialFlightSession?.showScanlines ?? userSettings.crtScanlines ?? false
  );
  const [showStarTrails, setShowStarTrails] = useState<boolean>(
    () => initialFlightSession?.showStarTrails ?? true
  );
  const [showTrajectoryLine, setShowTrajectoryLine] = useState<boolean>(
    () => initialFlightSession?.showTrajectoryLine ?? true
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);

  // 60FPS In-Browser Camcorder Video Recorder State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const recorderRef = useRef<CanvasVideoRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);

  // Steerable Glider Flight Mode State
  const [gliderFlightEnabled, setGliderFlightEnabled] = useState<boolean>(
    () => initialFlightSession?.gliderFlightEnabled ?? false
  );
  const [gliderTelemetry, setGliderTelemetry] = useState<{
    offsetX: number;
    offsetY: number;
    vx: number;
    vy: number;
    bankAngle: number;
  } | null>(null);

  // Constellation Star-Chart & Lore State
  const [starChartEnabled, setStarChartEnabled] = useState<boolean>(
    () => initialFlightSession?.starChartEnabled ?? false
  );
  const [selectedAsterism, setSelectedAsterism] = useState<CelestialAsterism | null>(null);

  // Custom Atmosphere Tuning
  const [atmosphereSettings, setAtmosphereSettings] = useState<CustomAtmosphereSettings>(
    () => initialFlightSession?.atmosphereSettings ?? { ...DEFAULT_ATMOSPHERE_SETTINGS }
  );

  // Weather state: 'auto' links directly to time phase; or manual override
  const [weatherMode, setWeatherMode] = useState<'auto' | WeatherType>(
    () => initialFlightSession?.weatherMode ?? 'auto'
  );

  // Arcade Stardust Ring Challenge Mode State
  const [arcadeModeEnabled, setArcadeModeEnabled] = useState<boolean>(
    () => initialFlightSession?.arcadeModeEnabled ?? false
  );
  const [arcadeGameState, setArcadeGameState] = useState<ArcadeGameState>(() => createInitialArcadeState());

  // Reset Flight Session Handler
  const handleResetFlightSession = useCallback(() => {
    clearSavedFlightSession();
    setCycleProgress(0.5);
    setIsAutoCycle(true);
    setSpeedMode('normal');
    setWeatherMode('auto');
    setAtmosphereSettings({ ...DEFAULT_ATMOSPHERE_SETTINGS });
    setViewLayout('standard');
    setGliderFlightEnabled(false);
    setStarChartEnabled(false);
    setArcadeModeEnabled(false);
    setActiveViewpointId(null);
    setRestoredSessionNotice(null);
  }, []);

  // Periodic & Lifecycle-based Auto-Save Flight Session
  useEffect(() => {
    const doSave = () => {
      saveFlightSession({
        cycleProgress,
        isAutoCycle,
        speedMode,
        weatherMode,
        atmosphereSettings,
        viewLayout,
        showScanlines,
        showStarTrails,
        showTrajectoryLine,
        gliderFlightEnabled,
        starChartEnabled,
        arcadeModeEnabled,
        activeViewpointId,
        savedAt: Date.now(),
        version: CURRENT_SESSION_VERSION,
      });
    };

    // Throttle auto-save every 2.5 seconds during continuous flight
    const timer = window.setTimeout(doSave, 2500);

    const onBeforeUnload = () => {
      doSave();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        doSave();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [
    cycleProgress,
    isAutoCycle,
    speedMode,
    weatherMode,
    atmosphereSettings,
    viewLayout,
    showScanlines,
    showStarTrails,
    showTrajectoryLine,
    gliderFlightEnabled,
    starChartEnabled,
    arcadeModeEnabled,
    activeViewpointId,
  ]);

  // Active AI Encounter notification
  const [activeEncounterName, setActiveEncounterName] = useState<string | null>(null);
  const [activeEncounterColor, setActiveEncounterColor] = useState<string>('#38bdf8');
  const [activeEncounterPhysics, setActiveEncounterPhysics] = useState<string>('');
  const [summonEvent, setSummonEvent] = useState<{ type: 'gpt' | 'claude' | 'deepseek'; id: number } | null>(null);

  // Mythic Dragon Encounter State
  const [dragonEncounterEvent, setDragonEncounterEvent] = useState<{ id: number; timestamp: number } | null>(null);
  const [isDragonEncounterActive, setIsDragonEncounterActive] = useState<boolean>(false);
  const [activeDragonInfo, setActiveDragonInfo] = useState<{ name: string; badge: string; color: string } | null>(null);

  const handleTriggerDragonEncounter = useCallback(() => {
    setDragonEncounterEvent({ id: Date.now(), timestamp: Date.now() });
    playDragonRoarAndWingsSound(3.0);
  }, []);

  // Pixel Meteor Shower State (diurnal twilight & midnight cascade)
  const [meteorShowerSurge, setMeteorShowerSurge] = useState<{ id: number; timestamp: number } | null>(null);
  const [isMeteorShowerActive, setIsMeteorShowerActive] = useState<boolean>(false);

  const handleTriggerMeteorShower = useCallback(() => {
    setMeteorShowerSurge({ id: Date.now(), timestamp: Date.now() });
    if (soundEnabled) playMeteorShootingSound();
  }, [soundEnabled]);

  // Gargantua Black Hole Singularity Event State
  const [blackHoleTrigger, setBlackHoleTrigger] = useState<{ id: number; timestamp: number } | null>(null);
  const [isBlackHoleActive, setIsBlackHoleActive] = useState<boolean>(false);

  const handleTriggerBlackHole = useCallback(() => {
    setBlackHoleTrigger({ id: Date.now(), timestamp: Date.now() });
    if (soundEnabled) playBlackHoleSingularitySound();
  }, [soundEnabled]);

  // Orbital Satellite Telemetry Hover State
  const [hoveredSatellite, setHoveredSatellite] = useState<OrbitalSatellite | null>(null);

  // Red Alert Corner Warning Flasher (strictly linked to activeEncounterName, flashes for 1s and disappears)
  const [showRedAlertBeacon, setShowRedAlertBeacon] = useState<boolean>(false);
  const alertTimeoutRef = useRef<number | null>(null);

  const triggerRedAlertBeacon = useCallback(() => {
    setShowRedAlertBeacon(true);
    if (alertTimeoutRef.current) {
      window.clearTimeout(alertTimeoutRef.current);
    }
    alertTimeoutRef.current = window.setTimeout(() => {
      setShowRedAlertBeacon(false);
      alertTimeoutRef.current = null;
    }, 1000);
  }, []);

  useEffect(() => {
    if (activeEncounterName) {
      triggerRedAlertBeacon();
    } else {
      setShowRedAlertBeacon(false);
      if (alertTimeoutRef.current) {
        window.clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = null;
      }
    }
    return () => {
      if (alertTimeoutRef.current) {
        window.clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [activeEncounterName, triggerRedAlertBeacon]);

  // Current phase info
  const currentPhaseIndex = Math.floor(cycleProgress * 4) % 4;
  const currentPhase = TIME_PHASES[currentPhaseIndex];

  // Active computed weather
  const activeWeather: WeatherType =
    weatherMode === 'auto' ? currentPhase.defaultWeather : weatherMode;
  const activeWeatherInfo = WEATHER_CONFIGS[activeWeather];

  // Synchronize active flight weather with Web Audio DSP filters and spatial soundscape
  useEffect(() => {
    setWeatherAudioMode(activeWeather);
  }, [activeWeather]);

  // Toggle ambient soundscape
  const toggleSound = () => {
    if (!soundEnabled) {
      startAmbientDescentSound();
      setSoundEnabled(true);
      triggerStarSparkleChime();
    } else {
      stopAmbientDescentSound();
      setSoundEnabled(false);
    }
  };

  // Full-screen Jitter & Haptic feedback state
  const [isScreenJitter, setIsScreenJitter] = useState<boolean>(false);
  const [jitterColor, setJitterColor] = useState<string>('#38bdf8');
  const jitterTimerRef = useRef<number | null>(null);

  // Trigger high-impact screen jitter and device haptic vibration
  const handleEncounterTrigger = useCallback((type: 'gpt' | 'claude' | 'deepseek') => {
    // 1. Device Haptic Vibration API
    triggerCelestialHaptic(type);

    // 2. Full-screen tactile jitter animation & shockwave flash
    const colorMap: Record<string, string> = {
      gpt: '#10A37F',
      claude: '#F59E0B',
      deepseek: '#00E5FF',
    };
    setJitterColor(colorMap[type] || '#38bdf8');
    setIsScreenJitter(true);

    if (jitterTimerRef.current) {
      window.clearTimeout(jitterTimerRef.current);
    }
    jitterTimerRef.current = window.setTimeout(() => {
      setIsScreenJitter(false);
      jitterTimerRef.current = null;
    }, 420);
  }, []);

  // Dispatch summon
  const handleSummon = (type: 'gpt' | 'claude' | 'deepseek') => {
    setSummonEvent({ type, id: Date.now() });
    handleEncounterTrigger(type);
    triggerRedAlertBeacon();
    triggerStarSparkleChime();
  };

  // Toggle browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Real-time Altitude & Layer Telemetry
  const telemetry = useMemo(() => {
    return calculateAltitudeTelemetry(
      cycleProgress,
      speedMode,
      isDragonEncounterActive,
      0
    );
  }, [cycleProgress, speedMode, isDragonEncounterActive]);

  // Save current frame as wallpaper PNG with retro telemetry watermark
  const handleDownloadSnapshot = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    const scale = 4;
    exportCanvas.width = canvas.width * scale;
    exportCanvas.height = canvas.height * scale;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);

    // Retro Sci-Fi Watermark Banner
    const watermarkText = generateWatermarkText(telemetry.altitudeKm, currentPhase.name, activeWeatherInfo.name);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fillRect(0, exportCanvas.height - 38, exportCanvas.width, 38);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(watermarkText, 20, exportCanvas.height - 14);

    const link = document.createElement('a');
    link.download = `gemini-descent-${currentPhase.id}-${activeWeather}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
    triggerStarSparkleChime();
  }, [currentPhase.id, currentPhase.name, activeWeather, activeWeatherInfo.name, telemetry.altitudeKm]);

  // Toggle 60FPS Video Camcorder Recording
  const handleToggleVideoRecording = useCallback(async () => {
    if (isRecording) {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setIsRecording(false);
      if (recorderRef.current) {
        const blob = await recorderRef.current.stop();
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
          recorderRef.current.downloadRecording(`gemini-flight-${timestamp}.${ext}`);
          triggerStarSparkleChime();
        }
        recorderRef.current = null;
      }
    } else {
      const canvas = canvasElementRef.current || document.querySelector('canvas');
      if (!canvas) return;
      if (!isCanvasRecordingSupported()) return;

      const rec = new CanvasVideoRecorder(canvas, { fps: 60 });
      const started = rec.start();
      if (!started) return;

      recorderRef.current = rec;
      setIsRecording(true);
      setRecordingSeconds(0);
      triggerStarSparkleChime();

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            handleToggleVideoRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Preset quick jumper
  const jumpToPhase = useCallback((phaseIdx: number) => {
    setCycleProgress((phaseIdx * 0.25 + 0.02) % 1.0);
    setIsAutoCycle(false);
    if (soundEnabled) triggerStarSparkleChime();
  }, [soundEnabled]);

  const isAnyModalOpen =
    isCodexOpen ||
    isStudioOpen ||
    isAudioMixerOpen ||
    isGifStudioOpen ||
    isViewpointModalOpen ||
    isShortcutsOpen ||
    isSettingsOpen ||
    !!selectedAsterism;

  // Track if mouse is directly hovering over HUD controls so it doesn't auto-fade mid-interaction
  const isHoveringControlsRef = useRef<boolean>(false);

  // Compute whether HUD elements should smoothly hide based on user settings and idle state
  const shouldHideBottomHud =
    (userSettings.autoHideHud ?? true) && isIdle && !isAnyModalOpen;

  const handleControlsMouseEnter = useCallback(() => {
    isHoveringControlsRef.current = true;
    setIsIdle(false);
    if (idleTimeoutRef.current) {
      window.clearTimeout(idleTimeoutRef.current);
    }
  }, []);

  const handleControlsMouseLeave = useCallback(() => {
    isHoveringControlsRef.current = false;
    if (idleTimeoutRef.current) {
      window.clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = window.setTimeout(() => {
      if (!isHoveringControlsRef.current) {
        setIsIdle(true);
      }
    }, 3200);
  }, []);

  // Smart Idle Activity Listener (Auto-hides HUD after 3.2s of mouse/keyboard inactivity)
  useEffect(() => {
    const handleActivity = () => {
      setIsIdle(false);
      if (idleTimeoutRef.current) {
        window.clearTimeout(idleTimeoutRef.current);
      }
      idleTimeoutRef.current = window.setTimeout(() => {
        if (!isHoveringControlsRef.current) {
          setIsIdle(true);
        }
      }, 3200);
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('mousedown', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });

    handleActivity();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (idleTimeoutRef.current) {
        window.clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (e.code === 'Space') {
        e.preventDefault();
        setIsAutoCycle((prev) => !prev);
      } else if (key === '1') {
        jumpToPhase(0);
      } else if (key === '2') {
        jumpToPhase(1);
      } else if (key === '3') {
        jumpToPhase(2);
      } else if (key === '4') {
        jumpToPhase(3);
      } else if (key === 'd') {
        handleTriggerDragonEncounter();
      } else if (key === 'm') {
        handleTriggerMeteorShower();
      } else if (key === 'g') {
        handleEncounterTrigger('gpt');
      } else if (key === 'c') {
        handleEncounterTrigger('claude');
      } else if (key === 's') {
        handleEncounterTrigger('deepseek');
      } else if (key === 'b') {
        handleTriggerBlackHole();
      } else if (key === 't') {
        setArcadeModeEnabled((prev) => !prev);
      } else if (key === 'r') {
        handleToggleVideoRecording();
      } else if (key === 'x') {
        setGliderFlightEnabled((prev) => !prev);
      } else if (key === 'k') {
        setStarChartEnabled((prev) => {
          if (prev) setSelectedAsterism(null);
          return !prev;
        });
      } else if (key === 'v') {
        setIsViewpointModalOpen((prev) => !prev);
      } else if (key === 'z') {
        setViewLayout((prev) => (prev === 'cinematic' ? 'standard' : 'cinematic'));
      } else if (key === 'o') {
        setIsCodexOpen((prev) => !prev);
      } else if (key === 'a') {
        setIsStudioOpen((prev) => !prev);
      } else if (key === 'p') {
        handleDownloadSnapshot();
      } else if (key === 'f') {
        toggleFullscreen();
      } else if (key === '?' || key === 'h') {
        setIsShortcutsOpen((prev) => !prev);
      } else if (key === ',') {
        setIsSettingsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (selectedAsterism) {
          setSelectedAsterism(null);
          return;
        }
        setIsCodexOpen(false);
        setIsStudioOpen(false);
        setIsAudioMixerOpen(false);
        setIsGifStudioOpen(false);
        setIsViewpointModalOpen(false);
        setIsShortcutsOpen(false);
        setIsSettingsOpen(false);
        setSelectedAsterism(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    jumpToPhase,
    handleTriggerDragonEncounter,
    handleTriggerMeteorShower,
    handleTriggerBlackHole,
    handleEncounterTrigger,
    handleDownloadSnapshot,
    handleToggleVideoRecording,
    toggleFullscreen,
    selectedAsterism,
  ]);

  // Cinematic Viewpoint Apply Handler
  const handleApplyViewpoint = useCallback((vp: CinematicViewpoint) => {
    setActiveViewpointId(vp.id);
    setCycleProgress(vp.cycleProgress);
    setIsAutoCycle(false); // Pause auto-progression so user can enjoy the curated scene
    setWeatherMode(vp.weatherMode);
    setSpeedMode(vp.speedMode);
    setAtmosphereSettings({ ...vp.atmosphereSettings });
    setShowScanlines(vp.showScanlines);
    setShowStarTrails(vp.showStarTrails);
    setShowTrajectoryLine(vp.showTrajectoryLine);
    if (vp.viewLayout) {
      setViewLayout(vp.viewLayout);
    }
    triggerStarSparkleChime();

    // Trigger visual toast confirmation
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setViewpointToast({
      message: `시네마틱 뷰포인트 점프: [${vp.name}] 로드됨`,
      color: vp.accentColor || '#38bdf8',
    });
    toastTimeoutRef.current = window.setTimeout(() => {
      setViewpointToast(null);
      toastTimeoutRef.current = null;
    }, 3200);
  }, []);

  // Quick Save Current Viewpoint (one-click bookmark from HUD)
  const handleQuickSaveCurrent = useCallback(() => {
    const phaseTag = currentPhase.name.split(' ')[0] || '현재';
    const weatherName = weatherMode === 'auto' ? '시간연동' : WEATHER_CONFIGS[activeWeather]?.name.split(' ')[0] || weatherMode;
    const newVp = createCustomViewpoint({
      name: `${phaseTag} ${weatherName} 뷰`,
      description: `${currentPhase.name} · ${activeWeatherInfo.name} · ${speedMode} 속도 저장`,
      cycleProgress,
      weatherMode,
      speedMode,
      atmosphereSettings,
      showScanlines,
      showStarTrails,
      showTrajectoryLine,
      viewLayout,
      accentColor: '#38bdf8',
      iconType: 'custom',
    });

    handleRefreshViewpoints();
    setActiveViewpointId(newVp.id);
    triggerStarSparkleChime();

    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setViewpointToast({
      message: `뷰포인트 저장 완료: [${newVp.name}]`,
      color: '#34d399',
    });
    toastTimeoutRef.current = window.setTimeout(() => {
      setViewpointToast(null);
      toastTimeoutRef.current = null;
    }, 3200);
  }, [
    currentPhase.name,
    weatherMode,
    activeWeather,
    activeWeatherInfo.name,
    speedMode,
    cycleProgress,
    atmosphereSettings,
    showScanlines,
    showStarTrails,
    showTrajectoryLine,
    viewLayout,
    handleRefreshViewpoints,
  ]);

  const handleActiveEncounterChange = useCallback((name: string | null, color: string, physics?: string) => {
    setActiveEncounterName(name);
    setActiveEncounterColor(color);
    if (physics) setActiveEncounterPhysics(physics);
  }, []);

  return (
    <motion.div
      animate={
        isScreenJitter
          ? getScreenJitterKeyframes(1.0)
          : { x: 0, y: 0, rotate: 0 }
      }
      transition={{
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative w-screen h-screen bg-slate-950 overflow-hidden flex flex-col font-sans select-none text-slate-100"
    >
      {/* High-Impact Celestial Shockwave & Chromatic Flash Overlay */}
      <AnimatePresence>
        {isScreenJitter && (
          <motion.div
            key="screen-jitter-shockwave"
            initial={{ opacity: 0.75, scale: 1.02 }}
            animate={{ opacity: 0, scale: 1.0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38, ease: 'easeOut' }}
            className="fixed inset-0 pointer-events-none z-50"
            style={{
              background: `radial-gradient(circle at center, transparent 32%, ${jitterColor}35 80%, ${jitterColor}75 100%)`,
              boxShadow: `inset 0 0 95px ${jitterColor}95`,
              mixBlendMode: 'screen',
            }}
          />
        )}
      </AnimatePresence>

      {/* Main Viewport Container */}
      <div className="relative flex-1 w-full h-full flex overflow-hidden">
        {/* Main Canvas View Area with Framer Motion Layout Animation */}
        <motion.div
          layout
          initial={false}
          animate={{
            width: viewLayout === 'split-radar' ? '62%' : '100%',
          }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 30,
            mass: 0.95,
          }}
          className="relative h-full overflow-hidden shrink-0"
        >
          <PixelDescentCanvas
            autoCycle={isAutoCycle}
            manualCycleProgress={cycleProgress}
            onCycleUpdate={(progress) => {
              if (cycleProgress > 0.92 && progress < 0.08) {
                recordFlightMetrics({ totalDescentCycles: 1, totalKmTraveled: 140 });
              }
              setCycleProgress(progress);
            }}
            speedMode={speedMode}
            showScanlines={showScanlines}
            showStarTrails={showStarTrails}
            showTrajectoryLine={showTrajectoryLine}
            soundEnabled={soundEnabled}
            activeWeather={activeWeather}
            summonEvent={summonEvent}
            dragonEncounterTrigger={dragonEncounterEvent}
            meteorShowerSurge={meteorShowerSurge}
            onActiveEncounterChange={handleActiveEncounterChange}
            onDragonEncounterActiveChange={(active, name, badge, color) => {
              setIsDragonEncounterActive(active);
              if (active && name) {
                setActiveDragonInfo({ name, badge: badge || '', color: color || '#ef4444' });
              } else if (!active) {
                setActiveDragonInfo(null);
              }
            }}
            onMeteorShowerActiveChange={(active) => setIsMeteorShowerActive(active)}
            onEncounterTrigger={handleEncounterTrigger}
            onFpsUpdate={setFps}
            atmosphereSettings={atmosphereSettings}
            gliderFlightEnabled={gliderFlightEnabled}
            onGliderStateChange={setGliderTelemetry}
            starChartEnabled={starChartEnabled}
            selectedAsterismId={selectedAsterism?.id ?? null}
            onAsterismSelect={(ast) => setSelectedAsterism(ast)}
            blackHoleTrigger={blackHoleTrigger}
            onBlackHoleActiveChange={(active) => {
              if (active && !isBlackHoleActive) {
                recordFlightMetrics({ blackHoleFlybys: 1 });
              }
              setIsBlackHoleActive(active);
            }}
            arcadeModeEnabled={arcadeModeEnabled}
            onArcadeStateChange={(newArcade) => {
              if (newArcade.ringsCollected > arcadeGameState.ringsCollected) {
                const diff = newArcade.ringsCollected - arcadeGameState.ringsCollected;
                recordFlightMetrics({ ringsCollected: diff, highestScore: newArcade.score });
              }
              setArcadeGameState(newArcade);
            }}
            onHoveredSatelliteChange={(sat) => {
              if (sat && !hoveredSatellite) {
                recordFlightMetrics({ satellitesTracked: 1 });
              }
              setHoveredSatellite(sat);
            }}
            onCanvasReady={(c) => {
              canvasElementRef.current = c;
            }}
          />

          {/* Retro Camcorder 60FPS Recording HUD Overlay */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                key="camcorder-rec-hud"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-4 left-4 z-40 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-red-950/80 border border-red-500/60 text-red-200 backdrop-blur-md shadow-2xl font-mono text-xs select-none"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-bold text-red-400">● REC</span>
                <span>{formatCamcorderTime(recordingSeconds * 1000)}</span>
                <span className="text-[10px] text-red-300/70 border-l border-red-500/30 pl-2">60 FPS // HD</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Steerable Glider Flight Telemetry HUD Overlay */}
          <AnimatePresence>
            {gliderFlightEnabled && (
              <motion.div
                key="glider-flight-hud"
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="absolute top-4 right-4 sm:top-5 sm:right-1/2 sm:translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-950/85 border border-indigo-400/50 text-indigo-200 backdrop-blur-md shadow-xl font-mono text-[11px] select-none"
              >
                <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span className="font-bold text-white">GLIDER STEERING</span>
                <span className="text-slate-400 hidden sm:inline">[WASD / Arrows]</span>
                {gliderTelemetry && (
                  <span className="text-cyan-400 text-[10px] bg-indigo-900/40 px-1.5 py-0.5 rounded border border-indigo-500/30">
                    ROLL {(gliderTelemetry.bankAngle * (180 / Math.PI)).toFixed(1)}°
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Constellation Celestial Star-Chart HUD Overlay */}
          <AnimatePresence>
            {starChartEnabled && (
              <motion.div
                key="starchart-hud"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="absolute top-16 left-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-cyan-950/85 border border-cyan-400/50 text-cyan-200 backdrop-blur-md shadow-xl font-mono text-[11px] select-none"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="font-bold text-white">STAR-CHART [K]</span>
                <span className="text-cyan-300 text-[10px] hidden sm:inline">
                  {selectedAsterism ? `✦ [선택됨: ${selectedAsterism.koreanName}]` : '✦ 별자리를 클릭하여 신화 설화 & 천문 해설 보기'}
                </span>
                {selectedAsterism && (
                  <button
                    onClick={() => setSelectedAsterism(null)}
                    className="ml-1 text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    해제
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gargantua Black Hole Singularity Active Alert Banner */}
          <AnimatePresence>
            {isBlackHoleActive && (
              <motion.div
                key="blackhole-banner"
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-28 left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none"
              >
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-purple-950/90 border border-purple-500/60 text-purple-200 backdrop-blur-md shadow-2xl shadow-purple-950/60 font-mono text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                  <span className="font-bold text-white tracking-wider">✦ GARGANTUA SINGULARITY</span>
                  <span className="text-cyan-300 text-[10px] bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500/30">
                    GRAVITATIONAL LENSING
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Arcade Stardust Challenge Scoreboard HUD */}
          <AnimatePresence>
            {arcadeModeEnabled && (
              <motion.div
                key="arcade-score-hud"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-16 right-4 z-40 flex flex-col items-end gap-1 px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-amber-500/50 text-amber-200 backdrop-blur-md shadow-xl font-mono select-none"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>STARDUST: {arcadeGameState.score.toString().padStart(6, '0')}</span>
                  {arcadeGameState.combo > 1 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] animate-bounce">
                      x{arcadeGameState.combo >= 10 ? 8 : arcadeGameState.combo >= 6 ? 4 : 2} COMBO!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span>HIGH: {arcadeGameState.highScore.toString().padStart(6, '0')}</span>
                  <span>RINGS: {arcadeGameState.ringsCollected}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hovered Orbital Satellite Telemetry Card */}
          <AnimatePresence>
            {hoveredSatellite && (
              <motion.div
                key="sat-telemetry-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40 max-w-sm w-full p-3.5 rounded-2xl bg-slate-950/90 border border-sky-400/50 text-slate-100 backdrop-blur-md shadow-2xl font-mono text-xs select-none pointer-events-none"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                    <span className="font-bold text-white">{hoveredSatellite.name}</span>
                  </div>
                  <span className="text-[10px] text-sky-400">{hoveredSatellite.designation}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-300 mb-2">
                  <div>ALT: <span className="text-white font-bold">{hoveredSatellite.altitudeKm} km</span></div>
                  <div>VEL: <span className="text-white font-bold">{hoveredSatellite.orbitSpeedKmS} km/s</span></div>
                  <div>INC: <span className="text-white font-bold">{hoveredSatellite.inclinationDeg}°</span></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {hoveredSatellite.lore}
                </p>
                <div className="mt-2 text-[9px] text-cyan-400 text-center font-bold">
                  ✦ CLICK SATELLITE TO TRANSMIT TELEMETRY RADIO PING ✦
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Real-time Atmospheric Layer Altimeter HUD Gauge */}
          <AtmosphericAltimeterGauge
            telemetry={telemetry}
            speedMode={speedMode}
            isDragonActive={isDragonEncounterActive}
            className={`transition-opacity duration-500 ${
              shouldHideBottomHud && viewLayout !== 'cinematic'
                ? 'opacity-0 pointer-events-none'
                : 'opacity-100 pointer-events-auto'
            }`}
          />

          {/* Floating Dragon Encounter Banner (Shows when Dragon silhouette soars across sky) */}
          <AnimatePresence>
            {isDragonEncounterActive && (
              <motion.div
                key="dragon-encounter-alert"
                initial={{ y: -25, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -25, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              >
                <div
                  className="flex items-center gap-3 px-5 py-2 rounded-2xl border bg-slate-950/95 backdrop-blur-md shadow-2xl transition-all"
                  style={{
                    borderColor: activeDragonInfo?.color || '#ef4444',
                    boxShadow: `0 0 35px ${activeDragonInfo?.color || '#ef4444'}50`,
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    <div
                      className="w-4 h-4 rounded-full animate-ping"
                      style={{ backgroundColor: activeDragonInfo?.color || '#ef4444' }}
                    />
                    <Flame
                      className="w-3.5 h-3.5 absolute"
                      style={{ color: activeDragonInfo?.color || '#ef4444' }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="font-pixel text-xs tracking-wider text-white flex items-center gap-2">
                      <span className="font-bold" style={{ color: activeDragonInfo?.color || '#ef4444' }}>
                        DRAGON ENCOUNTER:
                      </span>
                      <span>{activeDragonInfo?.name || '성운룡'} 실루엣 비행 중</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        구름 가속 +275%
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-sans font-medium border"
                        style={{
                          backgroundColor: `${activeDragonInfo?.color || '#ef4444'}25`,
                          borderColor: `${activeDragonInfo?.color || '#ef4444'}50`,
                          color: activeDragonInfo?.color || '#fca5a5',
                        }}
                      >
                        {activeDragonInfo?.badge || '성광 공명 발광'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Encounter Alert Banner (Shows when AI entity descends) */}
          <AnimatePresence>
            {activeEncounterName && (
              <motion.div
                key="encounter-alert"
                initial={{ y: -20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              >
                <div
                  className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border backdrop-blur-md shadow-2xl"
                  style={{
                    backgroundColor: 'rgba(5, 7, 22, 0.92)',
                    borderColor: activeEncounterColor,
                    boxShadow: `0 0 35px ${activeEncounterColor}60`,
                  }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full animate-ping shrink-0"
                    style={{ backgroundColor: activeEncounterColor }}
                  />
                  <div>
                    <div className="font-pixel text-xs sm:text-sm text-white tracking-wider flex items-center gap-2">
                      <span>CELESTIAL SUMMON:</span>
                      <span style={{ color: activeEncounterColor }}>
                        {activeEncounterName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        밀도 +50%
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-amber-400" />
                        카메라 쉐이크
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                        <Crosshair className="w-2.5 h-2.5 text-indigo-400" />
                        포커스 줌인 1.3x
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Route className="w-2.5 h-2.5 text-emerald-400" />
                        발광 궤적 라인
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <Vibrate className="w-2.5 h-2.5 text-rose-400" />
                        스크린 진동 & 햅틱
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                      <span className="font-medium" style={{ color: activeEncounterColor }}>
                        {activeEncounterPhysics || '고유 물리 궤적 및 화염 방출'}
                      </span>
                      <span>·</span>
                      <span className="text-amber-300/90 font-medium">미세 진동 타격감 활성화</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Cinematic Viewpoint Notification Toast */}
          <AnimatePresence>
            {viewpointToast && (
              <motion.div
                key="viewpoint-toast"
                initial={{ y: -20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
              >
                <div
                  className="flex items-center gap-2.5 px-4 py-2 rounded-2xl border backdrop-blur-md shadow-2xl"
                  style={{
                    backgroundColor: 'rgba(5, 7, 22, 0.94)',
                    borderColor: viewpointToast.color,
                    boxShadow: `0 0 28px ${viewpointToast.color}45`,
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full animate-ping shrink-0"
                    style={{ backgroundColor: viewpointToast.color }}
                  />
                  <Bookmark className="w-3.5 h-3.5 shrink-0" style={{ color: viewpointToast.color }} />
                  <span className="font-pixel text-xs text-white tracking-wide">
                    {viewpointToast.message}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header Overlay with Framer Motion Fade and Slide (Hidden in Cinematic view) */}
          <AnimatePresence>
            {viewLayout !== 'cinematic' && (
              <motion.header
                key="app-header"
                initial={{ y: -30, opacity: 0 }}
                animate={{
                  y: shouldHideBottomHud ? (userSettings.reduceMotion ? 0 : -26) : 0,
                  opacity: shouldHideBottomHud ? 0 : 1,
                  scale: shouldHideBottomHud ? (userSettings.reduceMotion ? 1 : 0.98) : 1,
                }}
                exit={{ y: -35, opacity: 0 }}
                transition={{
                  y: shouldHideBottomHud
                    ? { duration: 0.65, ease: [0.4, 0, 0.2, 1] }
                    : { type: 'spring', stiffness: 320, damping: 28, mass: 0.75 },
                  opacity: {
                    duration: shouldHideBottomHud ? 0.65 : 0.22,
                    ease: shouldHideBottomHud ? [0.4, 0, 0.2, 1] : [0.16, 1, 0.3, 1],
                  },
                  scale: {
                    duration: shouldHideBottomHud ? 0.65 : 0.22,
                    ease: [0.16, 1, 0.3, 1],
                  },
                }}
                style={{
                  pointerEvents: shouldHideBottomHud ? 'none' : 'auto',
                }}
                onMouseEnter={handleControlsMouseEnter}
                onMouseLeave={handleControlsMouseLeave}
                className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-5 flex items-start justify-between will-change-transform"
              >
                {/* Title & Status */}
                <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-2xl max-w-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h1 className="font-pixel text-xs sm:text-sm tracking-wider text-white flex items-center gap-2">
                        GEMINI <span className="text-cyan-400">DESCENT</span>
                      </h1>
                      <div className="text-[10px] sm:text-[11px] text-slate-300 font-medium tracking-tight mt-0.5 flex items-center gap-2">
                        <span>{currentPhase.name}</span>
                        {isAutoCycle && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-sans font-medium border border-emerald-500/30">
                            시간 순환
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Weather Status Indicator Banner */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex flex-wrap items-center gap-2">
                    <div className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5 text-[11px]">
                      {activeWeather === 'rain' && <CloudRain className="w-3.5 h-3.5 text-blue-400 animate-bounce" />}
                      {activeWeather === 'snow' && <CloudSnow className="w-3.5 h-3.5 text-sky-200 animate-pulse" />}
                      {activeWeather === 'mist' && <CloudFog className="w-3.5 h-3.5 text-indigo-300" />}
                      {activeWeather === 'clear' && <CloudSun className="w-3.5 h-3.5 text-amber-300" />}
                      {activeWeather === 'aurora' && <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />}
                      <span className="text-slate-200 font-semibold">{activeWeatherInfo.name}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
                      {activeWeatherInfo.cloudBadge}
                    </span>
                    {(currentPhase.id === 'midnight' || currentPhase.id === 'twilight' || isMeteorShowerActive) && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-indigo-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1 shadow-[0_0_10px_rgba(56,189,248,0.3)] animate-pulse">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>픽셀 유성우 활성화</span>
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                      {activeWeatherInfo.cloudDescription}
                    </span>
                  </div>
                </div>

                {/* Top Navigation & Layout Switcher Controls with Framer Motion layoutId Pill */}
                <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {/* Segmented Layout Mode Switcher */}
                  <div className="relative flex items-center bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-1 shadow-lg">
                    {[
                      { id: 'standard' as const, label: '표준', icon: Monitor, title: '표준 뷰: 풀 캔버스 및 통합 제어 데크' },
                      { id: 'split-radar' as const, label: '분할 레이더', icon: Columns2, title: '분할 관측소: 캔버스 + 실시간 궤도 레이더 텔레메트리' },
                      { id: 'cinematic' as const, label: '시네마틱', icon: Film, title: '시네마틱 젠 모드: UI 숨김 순수 도트 감상' },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = viewLayout === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setViewLayout(tab.id)}
                          className={`relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors z-10 ${
                            isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                          }`}
                          title={tab.title}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeLayoutPill"
                              className="absolute inset-0 bg-cyan-600 rounded-lg shadow-md -z-10"
                              transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 30,
                              }}
                            />
                          )}
                          <Icon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Open Celestial Codex Modal */}
                  <button
                    onClick={() => setIsCodexOpen(true)}
                    className="px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
                    title="인공지능 성좌 관측 도감 열기"
                  >
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span className="hidden md:inline">천체 도감</span>
                  </button>

                  {/* Open Atmosphere Studio Drawer */}
                  <button
                    onClick={() => setIsStudioOpen(true)}
                    className="px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
                    title="대기 및 구름 물리 정밀 조율 스튜디오 열기"
                  >
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span className="hidden md:inline">대기 스튜디오</span>
                  </button>

                  {/* Open Gemini Pixel GIF Studio */}
                  <button
                    onClick={() => setIsGifStudioOpen(true)}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600/20 via-indigo-600/20 to-pink-600/20 hover:from-cyan-600/30 hover:to-pink-600/30 border border-pink-500/40 text-pink-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-pink-500/10 transition-all active:scale-95"
                    title="Google Gemini 로고 픽셀 GIF 애니메이션 스튜디오 열기"
                  >
                    <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                    <span className="hidden md:inline">GIF 스튜디오</span>
                  </button>

                  {/* Open Cinematic Viewpoints Modal */}
                  <button
                    onClick={() => setIsViewpointModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
                    title="시네마틱 뷰포인트 북마크 & 퀵 점프 목록 열기"
                  >
                    <Bookmark className="w-4 h-4 text-cyan-400" />
                    <span className="hidden md:inline">뷰포인트</span>
                  </button>

                  {/* Soundscape Mixer Modal Button & Retro LED Spectrum Visualizer */}
                  <div className="flex items-center gap-1.5">
                    <AudioLedVisualizer
                      isPlaying={soundEnabled}
                      isDragonActive={isDragonEncounterActive}
                      isMeteorActive={isMeteorShowerActive}
                      onToggleSound={toggleSound}
                    />
                    <button
                      onClick={() => setIsAudioMixerOpen(true)}
                      aria-label="사운드스케이프 스튜디오"
                      className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-lg ${
                        soundEnabled
                          ? 'bg-indigo-600/30 border-indigo-500/60 text-cyan-300 ring-1 ring-cyan-400/40'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title="코스믹 사운드스케이프 & 신스 패드 열기"
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Keyboard Shortcuts Cheatsheet Button */}
                  <button
                    onClick={() => setIsShortcutsOpen(true)}
                    aria-label="단축키 안내"
                    className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-sky-400 hover:text-white transition-all shadow-lg active:scale-95"
                    title="키보드 단축키 안내 [?] / [H]"
                  >
                    <Keyboard className="w-4 h-4" />
                  </button>

                  {/* Language Quick Toggle [KO / EN] */}
                  <button
                    onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
                    aria-label="언어 전환 / Switch Language"
                    className="px-2.5 py-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all shadow-lg active:scale-95 text-xs font-mono font-bold flex items-center gap-1"
                    title={language === 'ko' ? 'Switch to English' : '한국어로 전환'}
                  >
                    <span>{language === 'ko' ? 'KO' : 'EN'}</span>
                  </button>

                  {/* Flight System Preferences Modal Button */}
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    aria-label="시스템 환경설정"
                    className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-lg active:scale-95"
                    title="시스템 환경설정 및 오디오/그래픽 프로필 [⚙]"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    aria-label="전체화면"
                    className="p-2.5 rounded-xl bg-slate-950/70 backdrop-blur-md border border-slate-800 text-slate-400 hover:text-white transition-all shadow-lg"
                    title="전체화면 전환"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  {/* Steerable Glider Flight Mode Button [X] */}
                  <button
                    onClick={() => setGliderFlightEnabled((p) => !p)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all active:scale-95 ${
                      gliderFlightEnabled
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-600/30'
                        : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                    title="글라이더 직접 조종 모드 켜기/끄기 [X] (WASD / 방향키 조종)"
                  >
                    <Crosshair className={`w-4 h-4 ${gliderFlightEnabled ? 'text-cyan-300 animate-spin' : 'text-slate-400'}`} style={{ animationDuration: '6s' }} />
                    <span className="hidden md:inline">글라이더 [X]</span>
                  </button>

                  {/* Arcade Stardust Ring Challenge Mode [T] */}
                  <button
                    onClick={() => setArcadeModeEnabled((p) => !p)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all active:scale-95 ${
                      arcadeModeEnabled
                        ? 'bg-amber-600 border-amber-400 text-white shadow-amber-600/30'
                        : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-amber-400 hover:text-white'
                    }`}
                    title="아케이드 스타더스트 링 수집 챌린지 켜기/끄기 [T]"
                  >
                    <Trophy className={`w-4 h-4 ${arcadeModeEnabled ? 'text-amber-300 animate-bounce' : 'text-amber-400'}`} />
                    <span className="hidden md:inline">스타더스트 [T]</span>
                  </button>

                  {/* Gargantua Black Hole Singularity Encounter [B] */}
                  <button
                    onClick={handleTriggerBlackHole}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all active:scale-95 ${
                      isBlackHoleActive
                        ? 'bg-purple-900 border-purple-400 text-purple-200 shadow-purple-900/40 animate-pulse'
                        : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-purple-400 hover:text-white'
                    }`}
                    title="블랙홀 사건의 지평선 특이점 왜곡 소환 [B]"
                  >
                    <CircleDot className={`w-4 h-4 ${isBlackHoleActive ? 'text-purple-300 animate-spin' : 'text-purple-400'}`} />
                    <span className="hidden md:inline">블랙홀 [B]</span>
                  </button>

                  {/* Constellation Star-Chart & Lore Navigation Button [K] */}
                  <button
                    onClick={() => setStarChartEnabled((p) => !p)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all active:scale-95 ${
                      starChartEnabled
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/40 shadow-cyan-900/30'
                        : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                    title="성간 별자리 성도 & 천체 항법 켜기/끄기 [K]"
                  >
                    <Compass className={`w-4 h-4 ${starChartEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
                    <span className="hidden md:inline">별자리 성도 [K]</span>
                  </button>

                  {/* 60FPS In-Browser Video Camcorder Recording Button [R] */}
                  <button
                    onClick={handleToggleVideoRecording}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all active:scale-95 ${
                      isRecording
                        ? 'bg-red-600 border-red-400 text-white animate-pulse shadow-red-600/40'
                        : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-red-400 hover:text-white'
                    }`}
                    title="인브라우저 60FPS 비디오 캠코더 녹화 시작/정지 [R]"
                  >
                    {isRecording ? (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                        <span>● REC {recordingSeconds}s</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 text-red-400" />
                        <span className="hidden lg:inline">60FPS 녹화 [R]</span>
                      </>
                    )}
                  </button>

                  {/* Snapshot Capture Button */}
                  <button
                    onClick={handleDownloadSnapshot}
                    className="px-3.5 py-2.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 active:scale-98 transition-all"
                    title="현재 프레임을 고해상도 픽셀 PNG로 저장"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden lg:inline">도트 캡처</span>
                  </button>
                </div>
              </motion.header>
            )}
          </AnimatePresence>

          {/* Automatic Flight Session Restored Notification Toast */}
          <AnimatePresence>
            {restoredSessionNotice && (
              <motion.div
                key="session-restored-banner"
                initial={{ opacity: 0, y: -24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.96 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/92 border border-cyan-500/40 backdrop-blur-xl shadow-2xl shadow-cyan-950/60 text-xs text-slate-200 select-none max-w-[90vw]"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
                  <span className="font-semibold text-cyan-300 truncate">
                    {language === 'ko' ? '이전 비행 상태 자동 복구됨' : 'Flight State Auto-Restored'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono truncate">
                    {restoredSessionNotice.altitudeKm.toLocaleString()}km · {restoredSessionNotice.weather} · {restoredSessionNotice.layout}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetFlightSession}
                    className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-[10px] font-medium transition-colors cursor-pointer"
                    title={language === 'ko' ? '비행 초기화 및 처음부터 시작' : 'Reset flight to defaults'}
                  >
                    {language === 'ko' ? '초기화' : 'Reset'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestoredSessionNotice(null)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={language === 'ko' ? '닫기' : 'Dismiss'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Dock for Cinematic Mode with Framer Motion Entrance */}
          <AnimatePresence>
            {viewLayout === 'cinematic' && (
              <motion.div
                key="cinematic-dock"
                initial={{ y: 25, opacity: 0, scale: 0.95 }}
                animate={{
                  y: shouldHideBottomHud ? (userSettings.reduceMotion ? 0 : 20) : 0,
                  opacity: shouldHideBottomHud ? 0 : 1,
                  scale: shouldHideBottomHud ? 0.95 : 1,
                }}
                exit={{ y: 25, opacity: 0, scale: 0.95 }}
                transition={{
                  y: shouldHideBottomHud
                    ? { duration: 0.65, ease: [0.4, 0, 0.2, 1] }
                    : { type: 'spring', stiffness: 320, damping: 28, mass: 0.75 },
                  opacity: {
                    duration: shouldHideBottomHud ? 0.65 : 0.22,
                    ease: shouldHideBottomHud ? [0.4, 0, 0.2, 1] : [0.16, 1, 0.3, 1],
                  },
                }}
                style={{
                  pointerEvents: shouldHideBottomHud ? 'none' : 'auto',
                }}
                onMouseEnter={handleControlsMouseEnter}
                onMouseLeave={handleControlsMouseLeave}
                className="absolute bottom-5 right-5 z-30 flex items-center gap-2 will-change-transform"
              >
                <button
                  onClick={() => setViewLayout('standard')}
                  className="px-3.5 py-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-xs text-slate-300 hover:text-white flex items-center gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>컨트롤 보기 (표준 복원)</span>
                </button>

                <button
                  onClick={() => setIsViewpointModalOpen(true)}
                  className="p-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 hover:text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                  title="시네마틱 뷰포인트 점프 & 북마크"
                >
                  <Bookmark className="w-4 h-4 text-cyan-400" />
                </button>

                <button
                  onClick={() => setIsCodexOpen(true)}
                  className="p-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                  title="천체 도감"
                >
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                </button>

                <button
                  onClick={() => setIsGifStudioOpen(true)}
                  className="p-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-pink-500/40 text-pink-300 hover:text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                  title="Gemini 픽셀 GIF 스튜디오"
                >
                  <Sparkles className="w-4 h-4 text-pink-400" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Floating Control Deck with Framer Motion Fade and Slide */}
          <AnimatePresence>
            {viewLayout === 'standard' && (
              <motion.footer
                key="bottom-controls"
                initial={{ y: 40, opacity: 0 }}
                animate={{
                  y: shouldHideBottomHud ? (userSettings.reduceMotion ? 0 : 36) : 0,
                  opacity: shouldHideBottomHud ? 0 : 1,
                  scale: shouldHideBottomHud ? (userSettings.reduceMotion ? 1 : 0.96) : 1,
                }}
                exit={{ y: 45, opacity: 0 }}
                transition={{
                  y: shouldHideBottomHud
                    ? { duration: 0.65, ease: [0.4, 0, 0.2, 1] }
                    : { type: 'spring', stiffness: 340, damping: 28, mass: 0.75 },
                  opacity: {
                    duration: shouldHideBottomHud ? 0.65 : 0.22,
                    ease: shouldHideBottomHud ? [0.4, 0, 0.2, 1] : [0.16, 1, 0.3, 1],
                  },
                  scale: {
                    duration: shouldHideBottomHud ? 0.65 : 0.22,
                    ease: [0.16, 1, 0.3, 1],
                  },
                }}
                style={{
                  pointerEvents: shouldHideBottomHud ? 'none' : 'auto',
                }}
                onMouseEnter={handleControlsMouseEnter}
                onMouseLeave={handleControlsMouseLeave}
                className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-5 flex flex-col items-center gap-2 will-change-transform"
              >
                {/* Cinematic Viewpoint Quick Jump Ribbon */}
                <CinematicViewpointQuickBar
                  viewpoints={viewpoints}
                  activeViewpointId={activeViewpointId}
                  onApplyViewpoint={handleApplyViewpoint}
                  onOpenModal={() => setIsViewpointModalOpen(true)}
                  onQuickSaveCurrent={handleQuickSaveCurrent}
                />

                {/* Top sub-strip: AI Entity Summon Buttons & Weather Preset Selectors */}
                <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-2xl px-3.5 py-2 shadow-xl max-w-4xl">
                  {/* Weather Mode Chips */}
                  <div className="flex items-center gap-1 border-r border-slate-800/80 pr-2.5 mr-1">
                    <span className="text-[10px] text-slate-400 font-medium mr-1 hidden md:inline">
                      기상 이벤트:
                    </span>
                    <button
                      onClick={() => setWeatherMode('auto')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        weatherMode === 'auto'
                          ? 'bg-cyan-600 text-white shadow-md'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                      title="시간대 자동 연동 (새벽: 해무, 낮: 소나기, 밤: 눈)"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span>시간연동</span>
                    </button>

                    <button
                      onClick={() => setWeatherMode('rain')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        weatherMode === 'rain'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                      title="폭풍우 & 거대 암운 (구름 속도 x2.5 · 밀도 +55%)"
                    >
                      <CloudRain className="w-3 h-3" />
                      <span>소나기</span>
                    </button>

                    <button
                      onClick={() => setWeatherMode('snow')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        weatherMode === 'snow'
                          ? 'bg-sky-600 text-white shadow-md'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                      title="설산 눈 내리기 & 정적의 설운 (구름 속도 x0.6 · 밀도 +35%)"
                    >
                      <CloudSnow className="w-3 h-3" />
                      <span>눈 내리기</span>
                    </button>

                    <button
                      onClick={() => setWeatherMode('mist')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        weatherMode === 'mist'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                      title="저고도 해무 & 운무층 드리프트 (구름 속도 x1.3 · 밀도 +20%)"
                    >
                      <CloudFog className="w-3 h-3" />
                      <span>안개</span>
                    </button>

                    <button
                      onClick={() => setWeatherMode('aurora')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        weatherMode === 'aurora'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                      title="코스믹 오로라 & 몽환적 서행 구름 (구름 속도 x0.5 · 밀도 -10%)"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>오로라</span>
                    </button>

                    <button
                      onClick={() => setWeatherMode('clear')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        weatherMode === 'clear'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                      title="쾌청 & 가벼운 깃털 뭉게구름 (구름 속도 x0.8 · 밀도 -25%)"
                    >
                      <CloudSun className="w-3 h-3" />
                      <span>쾌청</span>
                    </button>
                  </div>

                  {/* AI Entity Summons */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-medium mr-1 hidden lg:inline">
                      성좌 조우:
                    </span>
                    <button
                      onClick={() => handleSummon('gpt')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                      title="OpenAI GPT 에메랄드 이중 나선 소용돌이 소환 (미세 카메라 쉐이크 & 파티클 +50%)"
                    >
                      <AIAvatarIcon type="gpt" size={14} className="rounded-sm" />
                      <span>GPT 출현</span>
                    </button>

                    <button
                      onClick={() => handleSummon('claude')}
                      className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/50 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                      title="Anthropic Claude 태양 홍염 중력 포물선 소환 (태양 지진파 카메라 쉐이크 & 파티클 +50%)"
                    >
                      <AIAvatarIcon type="claude" size={14} className="rounded-sm" />
                      <span>Claude 출현</span>
                    </button>

                    <button
                      onClick={() => handleSummon('deepseek')}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/50 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                      title="DeepSeek 퀀텀 음파 유체 파동 소환 (유체 파동 롤링 쉐이크 & 파티클 +50%)"
                    >
                      <AIAvatarIcon type="deepseek" size={14} className="rounded-sm" />
                      <span>DeepSeek 출현</span>
                    </button>

                    <div className="h-4 w-[1px] bg-slate-800" />

                    {/* Dragon Encounter Trigger Button */}
                    <button
                      id="dragon-encounter-btn"
                      onClick={handleTriggerDragonEncounter}
                      className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                        isDragonEncounterActive
                          ? 'bg-rose-900/80 border-rose-500 text-rose-100 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'
                          : 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-600/50 text-rose-300 hover:text-white'
                      }`}
                      title="드래곤 조우: 배경에 거대한 성운룡 실루엣이 날개짓하며 지나가고 제미나이 로고가 붉은빛으로 강렬하게 발광합니다"
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span>드래곤 조우</span>
                      {isDragonEncounterActive && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      )}
                    </button>

                    {/* Pixel Meteor Shower Trigger Button */}
                    <button
                      id="meteor-shower-btn"
                      onClick={() => {
                        setMeteorShowerSurge({ id: Date.now(), timestamp: Date.now() });
                        triggerStarSparkleChime();
                      }}
                      className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                        currentPhase.id === 'midnight' || currentPhase.id === 'twilight' || isMeteorShowerActive
                          ? 'bg-indigo-900/80 border-cyan-400/80 text-cyan-200 shadow-[0_0_15px_rgba(56,189,248,0.45)]'
                          : 'bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-700/50 text-indigo-300 hover:text-white'
                      }`}
                      title="픽셀 유성우: 밤과 미드나잇 하늘에 무작위로 긴 궤적을 그리며 떨어지는 유성우를 관측하거나 즉시 소환합니다 (화면 하단 은은한 잔상광 잔류)"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{currentPhase.id === 'midnight' || currentPhase.id === 'twilight' ? '유성우 관측' : '유성우 소환'}</span>
                      {(currentPhase.id === 'midnight' || currentPhase.id === 'twilight' || isMeteorShowerActive) && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Main Time & Speed Control Strip */}
                <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-2xl px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs max-w-5xl">
                  {/* Auto Cycle Progression Slider & Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAutoCycle(!isAutoCycle)}
                      className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                        isAutoCycle
                          ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                      title={isAutoCycle ? '자동 시간 흐름 정지' : '자동 시간 흐름 시작'}
                    >
                      {isAutoCycle ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span className="text-[11px] font-medium hidden md:inline">
                        {isAutoCycle ? '시간 자동 흐름' : '시간 정지'}
                      </span>
                    </button>

                    {/* Time Slider */}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.005"
                      value={cycleProgress}
                      onChange={(e) => {
                        setCycleProgress(parseFloat(e.target.value));
                        setIsAutoCycle(false);
                      }}
                      className="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      title="시간대 수동 조절"
                    />
                  </div>

                  <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

                  {/* Quick Phase Jumper Buttons */}
                  <div className="flex items-center gap-1">
                    {[
                      { idx: 0, label: '새벽', icon: Sunrise },
                      { idx: 1, label: '골든/정오', icon: Sun },
                      { idx: 2, label: '트와일라잇', icon: Sunset },
                      { idx: 3, label: '미드나잇', icon: Moon },
                    ].map((p) => {
                      const Icon = p.icon;
                      const active = currentPhaseIndex === p.idx;
                      return (
                        <button
                          key={p.idx}
                          onClick={() => jumpToPhase(p.idx)}
                          className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[11px] font-medium transition-all ${
                            active
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-slate-900/60 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

                  {/* Descent Velocity */}
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'cinematic' as const, label: '느리게', icon: Compass },
                      { id: 'normal' as const, label: '표준', icon: Gauge },
                      { id: 'mach' as const, label: '마하', icon: Zap },
                    ].map((s) => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSpeedMode(s.id)}
                          className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[11px] font-medium transition-all ${
                            speedMode === s.id
                              ? 'bg-cyan-600 text-white shadow-md'
                              : 'bg-slate-900/60 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

                  {/* Toggles */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowStarTrails(!showStarTrails)}
                      className={`p-1.5 rounded-lg transition-all ${
                        showStarTrails
                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                      title="스타 궤적 토글"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setShowScanlines(!showScanlines)}
                      className={`p-1.5 rounded-lg transition-all ${
                        showScanlines
                          ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                      title="CRT 레트로 브라운관 필터 토글"
                    >
                      <Tv className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setShowTrajectoryLine(!showTrajectoryLine)}
                      className={`p-1.5 rounded-lg transition-all ${
                        showTrajectoryLine
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                      title={showTrajectoryLine ? "성좌 조우 발광 궤적 파티클 라인 활성화 (클릭하여 끄기)" : "성좌 조우 발광 궤적 파티클 라인 비활성화 (클릭하여 켜기)"}
                    >
                      <Route className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.footer>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Split Panel: Observatory Telemetry Radar Deck with Framer Motion Slide & Fade */}
        <AnimatePresence>
          {viewLayout === 'split-radar' && (
            <motion.aside
              key="split-radar-aside"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 30,
                mass: 0.9,
                opacity: { duration: 0.25 },
              }}
              className="hidden md:flex md:w-[38%] h-full z-10 shrink-0"
            >
              <ObservatoryRadarDeck
                activeWeather={activeWeather}
                cycleProgress={cycleProgress}
                activeEncounterName={activeEncounterName}
                activeEncounterColor={activeEncounterColor}
                fps={fps}
                onSummon={handleSummon}
                onWeatherSelect={setWeatherMode}
                onOpenCodex={() => setIsCodexOpen(true)}
                onOpenStudio={() => setIsStudioOpen(true)}
                onOpenGifStudio={() => setIsGifStudioOpen(true)}
                onOpenViewpoints={() => setIsViewpointModalOpen(true)}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Dedicated Modals & Drawers */}
      <ObservatoryCodexModal
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
        onSummon={handleSummon}
      />

      <AtmosphereStudioDrawer
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        settings={atmosphereSettings}
        onChange={setAtmosphereSettings}
        activeWeather={activeWeather}
        onWeatherSelect={setWeatherMode}
        speedMode={speedMode}
        onSpeedModeChange={setSpeedMode}
      />

      <SoundscapeMixerModal
        isOpen={isAudioMixerOpen}
        onClose={() => setIsAudioMixerOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        activeWeather={activeWeather}
        onWeatherSelect={setWeatherMode}
      />

      <GeminiGifStudioModal
        isOpen={isGifStudioOpen}
        onClose={() => setIsGifStudioOpen(false)}
      />

      <CinematicViewpointModal
        isOpen={isViewpointModalOpen}
        onClose={() => setIsViewpointModalOpen(false)}
        viewpoints={viewpoints}
        activeViewpointId={activeViewpointId}
        onApplyViewpoint={handleApplyViewpoint}
        onRefreshViewpoints={handleRefreshViewpoints}
        currentCycleProgress={cycleProgress}
        currentWeatherMode={weatherMode}
        currentSpeedMode={speedMode}
        currentAtmosphereSettings={atmosphereSettings}
        currentShowScanlines={showScanlines}
        currentShowStarTrails={showStarTrails}
        currentShowTrajectoryLine={showTrajectoryLine}
        currentViewLayout={viewLayout}
      />

      {/* Keyboard Shortcuts Command Deck Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Flight System Preferences Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={userSettings}
        onUpdateSettings={handleUpdateUserSettings}
      />

      {/* Constellation Mythological Lore & Astronomy Tooltip Card Modal */}
      <ConstellationLoreCard
        isOpen={!!selectedAsterism && starChartEnabled}
        asterism={selectedAsterism}
        onClose={() => setSelectedAsterism(null)}
      />

      {/* Idle Zen Mode Indicator Pill */}
      <AnimatePresence>
        {(viewLayout === 'cinematic' || shouldHideBottomHud) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 0.8, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-3.5 py-1 rounded-full bg-slate-950/80 border border-slate-700/60 backdrop-blur-md text-[10px] font-mono text-slate-300 flex items-center gap-2 shadow-2xl select-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            <span>CINEMATIC ZEN // MOVE MOUSE OR PRESS [Z] / [?] FOR CONTROLS</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Red Corner Hazard Warning Beacon Lights (Flashing 1s on Celestial Encounter) */}
      <AnimatePresence>
        {showRedAlertBeacon && (
          <motion.div
            key="corner-red-alert-beacon"
            id="corner-red-alert-beacon"
            data-testid="corner-red-alert-beacon"
            initial={{ opacity: 0 }}
            animate={{
              opacity: getRedAlertStrobeTimeline(1.0).keyframes,
            }}
            transition={{
              duration: 1.0,
              ease: 'easeInOut',
              times: getRedAlertStrobeTimeline(1.0).times,
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.15, ease: 'easeOut' },
            }}
            className="fixed inset-0 pointer-events-none z-[70] overflow-hidden"
          >
            {/* 4 Corner Ambient Crimson Radiant Flares */}
            <div className="absolute -top-12 -left-12 w-80 h-80 rounded-full bg-red-600/50 blur-3xl pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-red-600/50 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-80 h-80 rounded-full bg-red-600/50 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-80 h-80 rounded-full bg-red-600/50 blur-3xl pointer-events-none" />

            {/* Tactical Sci-Fi Corner Warning Brackets & Flashing LEDs */}
            {/* Top-Left Corner */}
            <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5 pointer-events-none">
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-red-500/90 animate-ping" />
                  <div className="absolute w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white shadow-[0_0_18px_#ef4444]" />
                </div>
                <span className="font-pixel text-xs tracking-wider text-red-100 font-bold bg-red-950/95 border-2 border-red-500 px-2.5 py-1 rounded-md shadow-[0_0_20px_rgba(239,68,68,0.9)] flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  ALERT // CORNER 01
                </span>
              </div>
              <div className="w-28 h-1.5 bg-gradient-to-r from-red-500 to-transparent shadow-[0_0_12px_#ef4444]" />
              <div className="h-16 w-1.5 bg-gradient-to-b from-red-500 to-transparent shadow-[0_0_12px_#ef4444]" />
            </div>

            {/* Top-Right Corner */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="font-pixel text-xs tracking-wider text-red-100 font-bold bg-red-950/95 border-2 border-red-500 px-2.5 py-1 rounded-md shadow-[0_0_20px_rgba(239,68,68,0.9)] flex items-center gap-1.5">
                  PROXIMITY WARNING // 02
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                </span>
                <div className="relative flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-red-500/90 animate-ping" />
                  <div className="absolute w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white shadow-[0_0_18px_#ef4444]" />
                </div>
              </div>
              <div className="w-28 h-1.5 bg-gradient-to-l from-red-500 to-transparent shadow-[0_0_12px_#ef4444]" />
              <div className="h-16 w-1.5 bg-gradient-to-b from-red-500 to-transparent shadow-[0_0_12px_#ef4444]" />
            </div>

            {/* Bottom-Left Corner */}
            <div className="absolute bottom-4 left-4 flex flex-col items-start gap-1.5 pointer-events-none">
              <div className="h-16 w-1.5 bg-gradient-to-t from-red-500 to-transparent shadow-[0_0_12px_#ef4444]" />
              <div className="w-28 h-1.5 bg-gradient-to-r from-red-500 to-transparent shadow-[0_0_12px_#ef4444]" />
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-red-500/90 animate-ping" />
                  <div className="absolute w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white shadow-[0_0_18px_#ef4444]" />
                </div>
                <span className="font-pixel text-xs tracking-wider text-red-100 font-bold bg-red-950/95 border-2 border-red-500 px-2.5 py-1 rounded-md shadow-[0_0_20px_rgba(239,68,68,0.9)] flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  RADAR LOCK // 03
                </span>
              </div>
            </div>

            {/* Bottom-Right Corner */}
            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1.5 pointer-events-none">
              <div className="h-16 w-1.5 bg-gradient-to-t from-red-500 to-transparent shadow-[0_0_12px_#ef4444]" />
              <div className="w-28 h-1.5 bg-gradient-to-l from-red-500 to-transparent shadow-[0_0_12px_#ef4444]" />
              <div className="flex items-center gap-2">
                <span className="font-pixel text-xs tracking-wider text-red-100 font-bold bg-red-950/95 border-2 border-red-500 px-2.5 py-1 rounded-md shadow-[0_0_20px_rgba(239,68,68,0.9)] flex items-center gap-1.5">
                  CRITICAL MASS // 04
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                </span>
                <div className="relative flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-red-500/90 animate-ping" />
                  <div className="absolute w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white shadow-[0_0_18px_#ef4444]" />
                </div>
              </div>
            </div>

            {/* Perimeter Crimson Emergency Strobe Border */}
            <div className="absolute inset-0 border-4 border-red-500/80 shadow-[inset_0_0_90px_rgba(239,68,68,0.7)] pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function App() {
  return (
    <SimulationErrorBoundary>
      <SimulationProvider>
        <MainSimulationApp />
      </SimulationProvider>
    </SimulationErrorBoundary>
  );
}
