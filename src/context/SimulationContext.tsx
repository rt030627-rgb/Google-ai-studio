import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import {
  type UserSettingsProfile,
  loadSettings,
  saveSettings,
  DEFAULT_USER_SETTINGS,
} from '../utils/settingsStorage';
import {
  type ArcadeGameState,
  createInitialArcadeState,
} from '../utils/arcadeRingEngine';
import type { OrbitalSatellite } from '../utils/satelliteEngine';
import {
  type SupportedLanguage,
  type TranslationDictionary,
  getInitialLanguage,
  saveLanguage,
  t,
} from '../utils/i18n';

export type ViewMode = 'standard' | 'split-radar' | 'zen';
export type DiurnalPhase = 'dawn' | 'noon' | 'twilight' | 'midnight';
export type WeatherPreset = 'clear' | 'rain' | 'snow' | 'mist' | 'aurora' | 'auto';
export type SpeedMode = 'cinematic' | 'normal' | 'mach';
export type DragonVariant = 'Void Amethyst' | 'Glacial Frost' | 'Nebula Emerald' | 'Solar Flare' | 'Crimson Inferno';
export type ConstellationType = 'gpt' | 'claude' | 'deepseek';

export interface FlightTelemetry {
  altitudeKm: number;
  machSpeed: number;
  barometricHpa: number;
  temperatureC: number;
}

export interface SimulationState {
  // Navigation & View Mode
  viewMode: ViewMode;
  isZenMode: boolean;

  // Environment & Atmosphere
  diurnalPhase: DiurnalPhase;
  weatherPreset: WeatherPreset;
  speedMode: SpeedMode;
  cloudDensity: number;
  windSpeed: number;
  screenShakeIntensity: number;
  crtScanlines: boolean;
  starTrails: boolean;

  // Flight Physics & Glider
  telemetry: FlightTelemetry;
  gliderOffset: { x: number; y: number };
  gliderRollAngle: number;
  isGliderActive: boolean;

  // Active Entities & Encounters
  activeDragon: DragonVariant | null;
  dragonSurgeFactor: number;
  meteorCascadeCount: number;
  blackHoleActive: boolean;
  blackHoleTrigger: number;
  arcadeModeEnabled: boolean;
  arcadeGameState: ArcadeGameState;
  hoveredSatellite: OrbitalSatellite | null;
  activeConstellation: ConstellationType | null;

  // Modal Dialogs
  isGifStudioOpen: boolean;
  isAtmosphereModalOpen: boolean;
  isObservatoryOpen: boolean;
  isSoundscapeModalOpen: boolean;
  isShortcutsOpen: boolean;
  isSettingsOpen: boolean;
  isConstellationChartOpen: boolean;
  isRecordingVideo: boolean;

  // Persistent User Preferences & Localization
  userSettings: UserSettingsProfile;
  language: SupportedLanguage;
}

export const INITIAL_SIMULATION_STATE: SimulationState = {
  viewMode: 'standard',
  isZenMode: false,
  diurnalPhase: 'twilight',
  weatherPreset: 'auto',
  speedMode: 'normal',
  cloudDensity: 1.0,
  windSpeed: 1.0,
  screenShakeIntensity: 0.8,
  crtScanlines: true,
  starTrails: false,
  telemetry: {
    altitudeKm: 140.0,
    machSpeed: 1.16,
    barometricHpa: 0.05,
    temperatureC: -85,
  },
  gliderOffset: { x: 0, y: 0 },
  gliderRollAngle: 0,
  isGliderActive: false,
  activeDragon: null,
  dragonSurgeFactor: 1.0,
  meteorCascadeCount: 0,
  blackHoleActive: false,
  blackHoleTrigger: 0,
  arcadeModeEnabled: false,
  arcadeGameState: createInitialArcadeState(),
  hoveredSatellite: null,
  activeConstellation: null,
  isGifStudioOpen: false,
  isAtmosphereModalOpen: false,
  isObservatoryOpen: false,
  isSoundscapeModalOpen: false,
  isShortcutsOpen: false,
  isSettingsOpen: false,
  isConstellationChartOpen: false,
  isRecordingVideo: false,
  userSettings: DEFAULT_USER_SETTINGS,
  language: getInitialLanguage(),
};

export type SimulationAction =
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'TOGGLE_ZEN_MODE'; payload?: boolean }
  | { type: 'SET_DIURNAL_PHASE'; payload: DiurnalPhase }
  | { type: 'SET_WEATHER_PRESET'; payload: WeatherPreset }
  | { type: 'SET_SPEED_MODE'; payload: SpeedMode }
  | { type: 'SET_CLOUD_DENSITY'; payload: number }
  | { type: 'SET_WIND_SPEED'; payload: number }
  | { type: 'SET_SCREEN_SHAKE'; payload: number }
  | { type: 'TOGGLE_CRT_SCANLINES'; payload?: boolean }
  | { type: 'TOGGLE_STAR_TRAILS'; payload?: boolean }
  | { type: 'UPDATE_TELEMETRY'; payload: Partial<FlightTelemetry> }
  | { type: 'UPDATE_GLIDER'; payload: { offset?: { x: number; y: number }; roll?: number; active?: boolean } }
  | { type: 'SET_ACTIVE_DRAGON'; payload: DragonVariant | null }
  | { type: 'SET_DRAGON_SURGE'; payload: number }
  | { type: 'TRIGGER_METEORS' }
  | { type: 'TRIGGER_BLACK_HOLE' }
  | { type: 'SET_BLACK_HOLE_ACTIVE'; payload: boolean }
  | { type: 'TOGGLE_ARCADE_MODE'; payload?: boolean }
  | { type: 'UPDATE_ARCADE_STATE'; payload: ArcadeGameState }
  | { type: 'SET_HOVERED_SATELLITE'; payload: OrbitalSatellite | null }
  | { type: 'SUMMON_CONSTELLATION'; payload: ConstellationType | null }
  | { type: 'SET_MODAL'; payload: { modal: 'gifStudio' | 'atmosphere' | 'observatory' | 'soundscape' | 'shortcuts' | 'settings' | 'chart'; open: boolean } }
  | { type: 'SET_RECORDING_VIDEO'; payload: boolean }
  | { type: 'SET_LANGUAGE'; payload: SupportedLanguage }
  | { type: 'UPDATE_USER_SETTINGS'; payload: Partial<UserSettingsProfile> }
  | { type: 'RESET_FLIGHT_STATE' };

export function simulationReducer(state: SimulationState, action: SimulationAction): SimulationState {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload,
        isZenMode: action.payload === 'zen',
      };

    case 'TOGGLE_ZEN_MODE': {
      const nextZen = action.payload !== undefined ? action.payload : !state.isZenMode;
      return {
        ...state,
        isZenMode: nextZen,
        viewMode: nextZen ? 'zen' : state.viewMode === 'zen' ? 'standard' : state.viewMode,
      };
    }

    case 'SET_DIURNAL_PHASE':
      return { ...state, diurnalPhase: action.payload };

    case 'SET_WEATHER_PRESET':
      return { ...state, weatherPreset: action.payload };

    case 'SET_SPEED_MODE':
      return { ...state, speedMode: action.payload };

    case 'SET_CLOUD_DENSITY':
      return { ...state, cloudDensity: Math.max(0.2, Math.min(2.5, action.payload)) };

    case 'SET_WIND_SPEED':
      return { ...state, windSpeed: Math.max(0.2, Math.min(3.0, action.payload)) };

    case 'SET_SCREEN_SHAKE':
      return { ...state, screenShakeIntensity: Math.max(0, Math.min(1.0, action.payload)) };

    case 'TOGGLE_CRT_SCANLINES':
      return {
        ...state,
        crtScanlines: action.payload !== undefined ? action.payload : !state.crtScanlines,
      };

    case 'TOGGLE_STAR_TRAILS':
      return {
        ...state,
        starTrails: action.payload !== undefined ? action.payload : !state.starTrails,
      };

    case 'UPDATE_TELEMETRY':
      return {
        ...state,
        telemetry: { ...state.telemetry, ...action.payload },
      };

    case 'UPDATE_GLIDER':
      return {
        ...state,
        gliderOffset: action.payload.offset !== undefined ? action.payload.offset : state.gliderOffset,
        gliderRollAngle: action.payload.roll !== undefined ? action.payload.roll : state.gliderRollAngle,
        isGliderActive: action.payload.active !== undefined ? action.payload.active : state.isGliderActive,
      };

    case 'SET_ACTIVE_DRAGON':
      return { ...state, activeDragon: action.payload };

    case 'SET_DRAGON_SURGE':
      return { ...state, dragonSurgeFactor: action.payload };

    case 'TRIGGER_METEORS':
      return { ...state, meteorCascadeCount: state.meteorCascadeCount + 1 };

    case 'TRIGGER_BLACK_HOLE':
      return { ...state, blackHoleTrigger: state.blackHoleTrigger + 1, blackHoleActive: true };

    case 'SET_BLACK_HOLE_ACTIVE':
      return { ...state, blackHoleActive: action.payload };

    case 'TOGGLE_ARCADE_MODE': {
      const nextEnabled = action.payload !== undefined ? action.payload : !state.arcadeModeEnabled;
      return {
        ...state,
        arcadeModeEnabled: nextEnabled,
        arcadeGameState: nextEnabled ? createInitialArcadeState() : state.arcadeGameState,
      };
    }

    case 'UPDATE_ARCADE_STATE':
      return { ...state, arcadeGameState: action.payload };

    case 'SET_HOVERED_SATELLITE':
      return { ...state, hoveredSatellite: action.payload };

    case 'SUMMON_CONSTELLATION':
      return { ...state, activeConstellation: action.payload };

    case 'SET_MODAL': {
      const { modal, open } = action.payload;
      switch (modal) {
        case 'gifStudio':
          return { ...state, isGifStudioOpen: open };
        case 'atmosphere':
          return { ...state, isAtmosphereModalOpen: open };
        case 'observatory':
          return { ...state, isObservatoryOpen: open };
        case 'soundscape':
          return { ...state, isSoundscapeModalOpen: open };
        case 'shortcuts':
          return { ...state, isShortcutsOpen: open };
        case 'settings':
          return { ...state, isSettingsOpen: open };
        case 'chart':
          return { ...state, isConstellationChartOpen: open };
        default:
          return state;
      }
    }

    case 'SET_RECORDING_VIDEO':
      return { ...state, isRecordingVideo: action.payload };

    case 'SET_LANGUAGE':
      saveLanguage(action.payload);
      return { ...state, language: action.payload };

    case 'UPDATE_USER_SETTINGS': {
      const updated = { ...state.userSettings, ...action.payload };
      saveSettings(updated);
      return {
        ...state,
        userSettings: updated,
        crtScanlines: updated.crtScanlines,
        screenShakeIntensity: updated.screenShake,
      };
    }

    case 'RESET_FLIGHT_STATE':
      return {
        ...INITIAL_SIMULATION_STATE,
        userSettings: state.userSettings,
        telemetry: {
          altitudeKm: 140.0,
          machSpeed: 1.16,
          barometricHpa: 0.05,
          temperatureC: -85,
        },
      };

    default:
      return state;
  }
}

const SimulationStateContext = createContext<SimulationState | null>(null);
const SimulationDispatchContext = createContext<React.Dispatch<SimulationAction> | null>(null);

export interface SimulationProviderProps {
  children: ReactNode;
  initialOverride?: Partial<SimulationState>;
}

export const SimulationProvider: React.FC<SimulationProviderProps> = ({ children, initialOverride }) => {
  const [state, dispatch] = useReducer(simulationReducer, {
    ...INITIAL_SIMULATION_STATE,
    ...initialOverride,
  });

  // Load user settings on mount
  useEffect(() => {
    const loaded = loadSettings();
    dispatch({ type: 'UPDATE_USER_SETTINGS', payload: loaded });
  }, []);

  return (
    <SimulationStateContext.Provider value={state}>
      <SimulationDispatchContext.Provider value={dispatch}>
        {children}
      </SimulationDispatchContext.Provider>
    </SimulationStateContext.Provider>
  );
};

export function useSimulationState(): SimulationState {
  const context = useContext(SimulationStateContext);
  if (!context) {
    throw new Error('useSimulationState must be used within a SimulationProvider');
  }
  return context;
}

export function useSimulationDispatch(): React.Dispatch<SimulationAction> {
  const context = useContext(SimulationDispatchContext);
  if (!context) {
    throw new Error('useSimulationDispatch must be used within a SimulationProvider');
  }
  return context;
}

export function useSimulationTranslation(): {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: keyof TranslationDictionary) => string;
} {
  const state = useSimulationState();
  const dispatch = useSimulationDispatch();

  return {
    language: state.language,
    setLanguage: (lang: SupportedLanguage) => dispatch({ type: 'SET_LANGUAGE', payload: lang }),
    t: (key: keyof TranslationDictionary) => t(key, state.language),
  };
}
