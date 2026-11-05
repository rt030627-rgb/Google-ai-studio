/**
 * Flight Log Blackbox & Profile Data Backup / Restore Engine
 * Captures career flight metrics, re-entry cycles, score milestones,
 * and provides 1-click JSON export & safe imported schema validation.
 */

import { UserSettingsProfile, sanitizeSettings, SETTINGS_STORAGE_KEY } from './settingsStorage.js';
import { CinematicViewpoint, STORAGE_VIEWPOINTS_KEY } from './viewpointEngine.js';
import { SupportedLanguage, STORAGE_LANG_KEY } from './i18n.js';

export const STORAGE_BLACKBOX_KEY = 'pixel_descent_blackbox_v1';

export interface FlightStatistics {
  totalDescentCycles: number;
  totalKmTraveled: number;
  ringsCollected: number;
  ringsPerfectCount: number;
  highestScore: number;
  lightningWitnessed: number;
  satellitesTracked: number;
  blackHoleFlybys: number;
  flightTimeSeconds: number;
  lastFlightTimestamp: number;
}

export interface ExportableUserProfile {
  format: 'pixel-descent-backup';
  version: '1.0';
  exportedAt: string;
  statistics: FlightStatistics;
  settings: UserSettingsProfile;
  customViewpoints: CinematicViewpoint[];
  language: SupportedLanguage;
}

export const DEFAULT_FLIGHT_STATISTICS: FlightStatistics = {
  totalDescentCycles: 0,
  totalKmTraveled: 0,
  ringsCollected: 0,
  ringsPerfectCount: 0,
  highestScore: 0,
  lightningWitnessed: 0,
  satellitesTracked: 0,
  blackHoleFlybys: 0,
  flightTimeSeconds: 0,
  lastFlightTimestamp: Date.now()
};

/**
 * Clamp helper for positive statistical numbers.
 */
function sanitizeStat(val: unknown, fallback = 0, max = 1_000_000_000): number {
  if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
    return fallback;
  }
  return Math.max(0, Math.min(val, max));
}

/**
 * Validates and sanitizes a raw statistics object.
 */
export function sanitizeFlightStatistics(raw: unknown): FlightStatistics {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_FLIGHT_STATISTICS };
  }
  const r = raw as Record<string, unknown>;
  return {
    totalDescentCycles: sanitizeStat(r.totalDescentCycles),
    totalKmTraveled: sanitizeStat(r.totalKmTraveled),
    ringsCollected: sanitizeStat(r.ringsCollected),
    ringsPerfectCount: sanitizeStat(r.ringsPerfectCount),
    highestScore: sanitizeStat(r.highestScore),
    lightningWitnessed: sanitizeStat(r.lightningWitnessed),
    satellitesTracked: sanitizeStat(r.satellitesTracked),
    blackHoleFlybys: sanitizeStat(r.blackHoleFlybys),
    flightTimeSeconds: sanitizeStat(r.flightTimeSeconds),
    lastFlightTimestamp: sanitizeStat(r.lastFlightTimestamp, Date.now())
  };
}

/**
 * Load flight statistics from persistent storage.
 */
export function loadFlightStatistics(): FlightStatistics {
  try {
    const raw = localStorage.getItem(STORAGE_BLACKBOX_KEY);
    if (!raw) return { ...DEFAULT_FLIGHT_STATISTICS };
    const parsed = JSON.parse(raw);
    return sanitizeFlightStatistics(parsed);
  } catch {
    return { ...DEFAULT_FLIGHT_STATISTICS };
  }
}

/**
 * Save flight statistics to persistent storage.
 */
export function saveFlightStatistics(stats: FlightStatistics): void {
  try {
    localStorage.setItem(STORAGE_BLACKBOX_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage write failure
  }
}

/**
 * Record an incremental flight telemetry event safely.
 */
export function recordFlightMetrics(delta: Partial<FlightStatistics>): FlightStatistics {
  const current = loadFlightStatistics();
  const updated: FlightStatistics = {
    totalDescentCycles: current.totalDescentCycles + (delta.totalDescentCycles || 0),
    totalKmTraveled: current.totalKmTraveled + (delta.totalKmTraveled || 0),
    ringsCollected: current.ringsCollected + (delta.ringsCollected || 0),
    ringsPerfectCount: current.ringsPerfectCount + (delta.ringsPerfectCount || 0),
    highestScore: Math.max(current.highestScore, delta.highestScore || 0),
    lightningWitnessed: current.lightningWitnessed + (delta.lightningWitnessed || 0),
    satellitesTracked: current.satellitesTracked + (delta.satellitesTracked || 0),
    blackHoleFlybys: current.blackHoleFlybys + (delta.blackHoleFlybys || 0),
    flightTimeSeconds: current.flightTimeSeconds + (delta.flightTimeSeconds || 0),
    lastFlightTimestamp: Date.now()
  };
  saveFlightStatistics(updated);
  return updated;
}

/**
 * Export complete user flight profile as a validated JSON string.
 */
export function createProfileBackupJson(): string {
  const stats = loadFlightStatistics();

  let settings: UserSettingsProfile;
  try {
    const rawSet = localStorage.getItem(SETTINGS_STORAGE_KEY);
    settings = rawSet ? sanitizeSettings(JSON.parse(rawSet)) : sanitizeSettings({});
  } catch {
    settings = sanitizeSettings({});
  }

  let customViewpoints: CinematicViewpoint[] = [];
  try {
    const rawVp = localStorage.getItem(STORAGE_VIEWPOINTS_KEY);
    customViewpoints = rawVp ? JSON.parse(rawVp) : [];
  } catch {
    customViewpoints = [];
  }

  let language: SupportedLanguage = 'en';
  try {
    const rawLang = localStorage.getItem(STORAGE_LANG_KEY);
    if (rawLang === 'ko' || rawLang === 'en') language = rawLang;
  } catch {
    language = 'en';
  }

  const profile: ExportableUserProfile = {
    format: 'pixel-descent-backup',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    statistics: stats,
    settings,
    customViewpoints,
    language
  };

  return JSON.stringify(profile, null, 2);
}

/**
 * Trigger browser file download of backup.
 */
export function downloadBackupFile(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const jsonStr = createProfileBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `pixel-descent-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Import and validate backup JSON string, restoring into local storage.
 */
export function restoreProfileFromJson(jsonStr: string): { success: boolean; error?: string } {
  try {
    if (!jsonStr || typeof jsonStr !== 'string') {
      return { success: false, error: 'Empty payload' };
    }
    const data = JSON.parse(jsonStr);

    if (data.format !== 'pixel-descent-backup') {
      return { success: false, error: 'Unsupported format descriptor' };
    }

    const sanitizedStats = sanitizeFlightStatistics(data.statistics);
    const sanitizedSettings = sanitizeSettings(data.settings);
    const validViewpoints = Array.isArray(data.customViewpoints)
      ? (data.customViewpoints as CinematicViewpoint[])
      : [];
    const validLang: SupportedLanguage = data.language === 'ko' ? 'ko' : 'en';

    saveFlightStatistics(sanitizedStats);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizedSettings));
    localStorage.setItem(STORAGE_VIEWPOINTS_KEY, JSON.stringify(validViewpoints));
    localStorage.setItem(STORAGE_LANG_KEY, validLang);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown parsing error'
    };
  }
}
