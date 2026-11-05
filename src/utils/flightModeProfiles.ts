/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  type UserSettingsProfile,
  DEFAULT_USER_SETTINGS,
  sanitizeSettings,
} from './settingsStorage.js';

export interface FlightModeProfile {
  id: string;
  name: string;
  nameKo?: string;
  description: string;
  descriptionKo?: string;
  badge: string;
  tag: 'CINEMATIC' | 'PERFORMANCE' | 'RETRO' | 'ZEN' | 'CUSTOM';
  isBuiltIn: boolean;
  createdAt: number;
  settings: UserSettingsProfile;
}

export const STORAGE_PROFILES_KEY = 'gemini_descent_custom_flight_profiles_v1';

export const BUILT_IN_FLIGHT_PROFILES: ReadonlyArray<FlightModeProfile> = [
  {
    id: 'profile-cinematic',
    name: 'Cinematic Odyssey',
    nameKo: '시네마틱 모드 (Cinematic)',
    description: 'Ultra 1,200 particle density, uncapped V-Sync refresh rate, rich spatial audio, and cinematic bloom flares.',
    descriptionKo: '최대 파티클 렌더링, 무제한 프레임 주사율, 풍성한 오디오 음향과 광채 블룸 효과로 시네마틱 몰입감을 극대화합니다.',
    badge: 'ULTRA · UNCAPPED',
    tag: 'CINEMATIC',
    isBuiltIn: true,
    createdAt: 0,
    settings: {
      masterVolume: 0.9,
      windVolume: 0.8,
      radioVolume: 0.7,
      sfxVolume: 0.9,
      isMuted: false,
      muteOnBlur: true,
      particleBudget: 'ultra',
      screenShake: 0.65,
      encounterShakeIntensity: 7,
      crtScanlines: false,
      bloomGlow: true,
      fpsLimit: 0, // Uncapped
      reduceMotion: false,
      autoHideHud: true,
      hudOpacity: 1.0,
      autoSystemNightTheme: true,
    },
  },
  {
    id: 'profile-performance',
    name: 'Performance & Eco Mode',
    nameKo: '퍼포먼스 절전 모드 (Performance)',
    description: 'Eco 250 particle budget, capped 60 FPS, screen shake disabled, and reduced motion for smooth laptop & mobile battery endurance.',
    descriptionKo: '배터리 절약 및 저사양 환경을 위해 파티클을 최소화하고 화면 흔들림과 블룸을 억제하여 쾌적한 60 FPS를 보장합니다.',
    badge: 'ECO · 60 FPS',
    tag: 'PERFORMANCE',
    isBuiltIn: true,
    createdAt: 0,
    settings: {
      masterVolume: 0.6,
      windVolume: 0.5,
      radioVolume: 0.5,
      sfxVolume: 0.6,
      isMuted: false,
      muteOnBlur: true,
      particleBudget: 'low',
      screenShake: 0.0,
      encounterShakeIntensity: 1,
      crtScanlines: false,
      bloomGlow: false,
      fpsLimit: 60,
      reduceMotion: true,
      autoHideHud: true,
      hudOpacity: 0.9,
      autoSystemNightTheme: true,
    },
  },
  {
    id: 'profile-retro-arcade',
    name: 'Retro CRT Arcade',
    nameKo: '레트로 아케이드 모드 (Retro CRT)',
    description: '1980s analog CRT scanlines, vivid seismic camera turbulence, punchy synth radio audio, and vibrant plasma glow.',
    descriptionKo: '1980년대 오락실 아날로그 CRT 스캔라인, 생동감 넘치는 화면 진동과 강렬한 전자음 사운드스케이프를 선사합니다.',
    badge: 'CRT 1980 · PUNCHY',
    tag: 'RETRO',
    isBuiltIn: true,
    createdAt: 0,
    settings: {
      masterVolume: 0.85,
      windVolume: 0.45,
      radioVolume: 0.85,
      sfxVolume: 0.95,
      isMuted: false,
      muteOnBlur: true,
      particleBudget: 'balanced',
      screenShake: 0.9,
      encounterShakeIntensity: 9,
      crtScanlines: true,
      bloomGlow: true,
      fpsLimit: 60,
      reduceMotion: false,
      autoHideHud: false,
      hudOpacity: 1.0,
      autoSystemNightTheme: true,
    },
  },
  {
    id: 'profile-stealth-zen',
    name: 'Silent Meditation Zen',
    nameKo: '스텔스 무소음 젠 모드 (Silent Zen)',
    description: 'Instantly muted synthesizer audio, gentle balanced graphics, motion dampening, and smart auto-fading telemetry HUD.',
    descriptionKo: '모든 사운드를 즉각 음소거하고 잔잔한 균형 그래픽과 스마트 HUD 자동 숨김으로 고요한 비행 명상 환경을 만듭니다.',
    badge: 'MUTED · MINIMAL',
    tag: 'ZEN',
    isBuiltIn: true,
    createdAt: 0,
    settings: {
      masterVolume: 0.0,
      windVolume: 0.0,
      radioVolume: 0.0,
      sfxVolume: 0.0,
      isMuted: true,
      muteOnBlur: true,
      particleBudget: 'balanced',
      screenShake: 0.2,
      encounterShakeIntensity: 2,
      crtScanlines: false,
      bloomGlow: true,
      fpsLimit: 60,
      reduceMotion: true,
      autoHideHud: true,
      hudOpacity: 0.75,
      autoSystemNightTheme: true,
    },
  },
];

/**
 * Validates and sanitizes a raw flight mode profile object.
 */
export function sanitizeFlightProfile(raw: unknown): FlightModeProfile | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const data = raw as Record<string, unknown>;
  if (typeof data.id !== 'string' || !data.id.trim()) {
    return null;
  }

  const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : 'Custom Flight Profile';
  const nameKo = typeof data.nameKo === 'string' && data.nameKo.trim() ? data.nameKo.trim() : undefined;
  const description = typeof data.description === 'string' ? data.description : '';
  const descriptionKo = typeof data.descriptionKo === 'string' ? data.descriptionKo : undefined;
  const badge = typeof data.badge === 'string' ? data.badge : 'CUSTOM';
  const tag = data.tag === 'CINEMATIC' || data.tag === 'PERFORMANCE' || data.tag === 'RETRO' || data.tag === 'ZEN' ? data.tag : 'CUSTOM';
  const isBuiltIn = Boolean(data.isBuiltIn);
  const createdAt = typeof data.createdAt === 'number' && Number.isFinite(data.createdAt) ? data.createdAt : Date.now();
  const settings = sanitizeSettings(data.settings);

  return {
    id: data.id,
    name,
    nameKo,
    description,
    descriptionKo,
    badge,
    tag,
    isBuiltIn,
    createdAt,
    settings,
  };
}

/**
 * Loads custom flight mode profiles saved by the user in localStorage.
 */
export function loadCustomProfilesFromStorage(): FlightModeProfile[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_PROFILES_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validated: FlightModeProfile[] = [];
    for (const item of parsed) {
      const sanitized = sanitizeFlightProfile(item);
      if (sanitized && !sanitized.isBuiltIn) {
        validated.push(sanitized);
      }
    }
    return validated;
  } catch (err) {
    console.warn('[FlightModeProfiles] Failed to load custom profiles from storage:', err);
    return [];
  }
}

/**
 * Returns all available flight mode profiles, combining built-in presets with saved custom profiles.
 */
export function loadAllFlightModeProfiles(): FlightModeProfile[] {
  const custom = loadCustomProfilesFromStorage();
  return [...BUILT_IN_FLIGHT_PROFILES, ...custom];
}

/**
 * Saves a new custom flight profile or updates an existing one in localStorage.
 */
export function saveCustomFlightProfile(
  name: string,
  settings: UserSettingsProfile,
  description?: string
): FlightModeProfile {
  const custom = loadCustomProfilesFromStorage();
  const id = `custom-profile-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const cleanName = name.trim() || `Custom Flight ${custom.length + 1}`;
  const newProfile: FlightModeProfile = {
    id,
    name: cleanName,
    description: description || `Saved user flight profile with ${settings.particleBudget.toUpperCase()} graphics budget.`,
    badge: `${settings.particleBudget.toUpperCase()} · ${settings.fpsLimit === 0 ? 'UNCAPPED' : `${settings.fpsLimit}FPS`}`,
    tag: 'CUSTOM',
    isBuiltIn: false,
    createdAt: Date.now(),
    settings: sanitizeSettings(settings),
  };

  const updated = [newProfile, ...custom];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[FlightModeProfiles] Failed to write custom profile to storage:', err);
    }
  }

  return newProfile;
}

/**
 * Deletes a custom flight profile by ID from localStorage.
 * Built-in presets are protected from deletion.
 */
export function deleteCustomFlightProfile(id: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  // Refuse deletion of built-in presets
  if (BUILT_IN_FLIGHT_PROFILES.some((p) => p.id === id)) {
    return false;
  }

  try {
    const custom = loadCustomProfilesFromStorage();
    const filtered = custom.filter((p) => p.id !== id);
    if (filtered.length === custom.length) return false;

    window.localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.warn('[FlightModeProfiles] Failed to delete custom profile from storage:', err);
    return false;
  }
}

/**
 * Checks if current active settings match one of the profiles (e.g. built-in preset or custom profile).
 */
export function findMatchingFlightProfile(
  settings: UserSettingsProfile,
  profiles: FlightModeProfile[]
): FlightModeProfile | null {
  for (const profile of profiles) {
    const p = profile.settings;
    if (
      p.particleBudget === settings.particleBudget &&
      p.fpsLimit === settings.fpsLimit &&
      p.bloomGlow === settings.bloomGlow &&
      p.crtScanlines === settings.crtScanlines &&
      p.isMuted === settings.isMuted &&
      p.reduceMotion === settings.reduceMotion &&
      p.autoHideHud === settings.autoHideHud &&
      Math.abs(p.screenShake - settings.screenShake) < 0.1
    ) {
      return profile;
    }
  }
  return null;
}
