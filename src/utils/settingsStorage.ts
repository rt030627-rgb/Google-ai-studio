/**
 * Persistent User Settings and Preferences Storage Engine
 * Manages audio levels, graphics performance budgets, and accessibility flags
 * with resilient schema validation and zero-crash fallback recovery.
 */

export type ParticleBudget = 'low' | 'balanced' | 'ultra';
export type FpsTarget = 30 | 60 | 0;

export interface UserSettingsProfile {
  // Audio Mixer Levels
  masterVolume: number;
  windVolume: number;
  radioVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  muteOnBlur: boolean;

  // Graphics & Rendering Performance
  particleBudget: ParticleBudget;
  screenShake: number; // 0.0 to 1.0 multiplier
  crtScanlines: boolean;
  bloomGlow: boolean;
  fpsLimit: FpsTarget;

  // Accessibility & UX
  reduceMotion: boolean;
  autoHideHud: boolean;
}

export const SETTINGS_STORAGE_KEY = 'gemini_descent_user_settings_v1';

export const DEFAULT_USER_SETTINGS: Readonly<UserSettingsProfile> = {
  masterVolume: 0.7,
  windVolume: 0.6,
  radioVolume: 0.6,
  sfxVolume: 0.8,
  isMuted: false,
  muteOnBlur: true,
  particleBudget: 'balanced',
  screenShake: 0.8,
  crtScanlines: true,
  bloomGlow: true,
  fpsLimit: 60,
  reduceMotion: false,
  autoHideHud: true,
};

/**
 * Clamps a numeric value safely between a min and max bound.
 */
export function clamp(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
    return fallback;
  }
  return Math.min(Math.max(val, min), max);
}

/**
 * Validates and sanitizes raw preferences against schema constraints.
 * Recovers safely from corrupted or missing properties.
 */
export function sanitizeSettings(raw: unknown): UserSettingsProfile {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_USER_SETTINGS };
  }

  const data = raw as Partial<Record<keyof UserSettingsProfile, unknown>>;

  const validBudgets: ParticleBudget[] = ['low', 'balanced', 'ultra'];
  const particleBudget: ParticleBudget =
    typeof data.particleBudget === 'string' && validBudgets.includes(data.particleBudget as ParticleBudget)
      ? (data.particleBudget as ParticleBudget)
      : DEFAULT_USER_SETTINGS.particleBudget;

  const validFps: FpsTarget[] = [30, 60, 0];
  const fpsLimit: FpsTarget =
    typeof data.fpsLimit === 'number' && validFps.includes(data.fpsLimit as FpsTarget)
      ? (data.fpsLimit as FpsTarget)
      : DEFAULT_USER_SETTINGS.fpsLimit;

  return {
    masterVolume: clamp(data.masterVolume, 0, 1, DEFAULT_USER_SETTINGS.masterVolume),
    windVolume: clamp(data.windVolume, 0, 1, DEFAULT_USER_SETTINGS.windVolume),
    radioVolume: clamp(data.radioVolume, 0, 1, DEFAULT_USER_SETTINGS.radioVolume),
    sfxVolume: clamp(data.sfxVolume, 0, 1, DEFAULT_USER_SETTINGS.sfxVolume),
    isMuted: typeof data.isMuted === 'boolean' ? data.isMuted : DEFAULT_USER_SETTINGS.isMuted,
    muteOnBlur: typeof data.muteOnBlur === 'boolean' ? data.muteOnBlur : DEFAULT_USER_SETTINGS.muteOnBlur,
    particleBudget,
    screenShake: clamp(data.screenShake, 0, 1, DEFAULT_USER_SETTINGS.screenShake),
    crtScanlines: typeof data.crtScanlines === 'boolean' ? data.crtScanlines : DEFAULT_USER_SETTINGS.crtScanlines,
    bloomGlow: typeof data.bloomGlow === 'boolean' ? data.bloomGlow : DEFAULT_USER_SETTINGS.bloomGlow,
    fpsLimit,
    reduceMotion: typeof data.reduceMotion === 'boolean' ? data.reduceMotion : DEFAULT_USER_SETTINGS.reduceMotion,
    autoHideHud: typeof data.autoHideHud === 'boolean' ? data.autoHideHud : DEFAULT_USER_SETTINGS.autoHideHud,
  };
}

/**
 * Loads user settings safely from localStorage.
 */
export function loadSettings(): UserSettingsProfile {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_USER_SETTINGS };
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_USER_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    return sanitizeSettings(parsed);
  } catch (error) {
    console.warn('[SettingsStorage] Failed to read from localStorage, using defaults:', error);
    return { ...DEFAULT_USER_SETTINGS };
  }
}

/**
 * Saves user settings persistently to localStorage.
 */
export function saveSettings(settings: UserSettingsProfile): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const sanitized = sanitizeSettings(settings);
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitized));
    return true;
  } catch (error) {
    console.warn('[SettingsStorage] Failed to write to localStorage:', error);
    return false;
  }
}

/**
 * Resets user settings to factory defaults in storage.
 */
export function resetSettings(): UserSettingsProfile {
  const defaults = { ...DEFAULT_USER_SETTINGS };
  saveSettings(defaults);
  return defaults;
}

/**
 * Maps particle budget setting to absolute max particle capacity.
 */
export function getMaxParticleCount(budget: ParticleBudget): number {
  switch (budget) {
    case 'low':
      return 18;
    case 'balanced':
      return 45;
    case 'ultra':
      return 95;
    default:
      return 45;
  }
}
