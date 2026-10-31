/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherType, CustomAtmosphereSettings, DEFAULT_ATMOSPHERE_SETTINGS } from './descentEngine.js';

export interface SavedFlightSession {
  // Flight telemetry & altitude progression
  cycleProgress: number; // 0.0 to 1.0 (altitude/cycle time)
  isAutoCycle: boolean;
  speedMode: 'cinematic' | 'normal' | 'mach';

  // Weather & Atmosphere
  weatherMode: 'auto' | WeatherType;
  atmosphereSettings: CustomAtmosphereSettings;

  // Viewport layout & Display toggles
  viewLayout: 'standard' | 'split-radar' | 'cinematic';
  showScanlines: boolean;
  showStarTrails: boolean;
  showTrajectoryLine: boolean;

  // Flight operational modes
  gliderFlightEnabled: boolean;
  starChartEnabled: boolean;
  arcadeModeEnabled: boolean;
  activeViewpointId: string | null;

  // Metadata
  savedAt: number; // timestamp
  version: number;
}

export const FLIGHT_SESSION_STORAGE_KEY = 'pixel_descent_saved_flight_session_v1';
export const CURRENT_SESSION_VERSION = 1;

export const DEFAULT_FLIGHT_SESSION: Readonly<SavedFlightSession> = {
  cycleProgress: 0.5,
  isAutoCycle: true,
  speedMode: 'normal',
  weatherMode: 'auto',
  atmosphereSettings: { ...DEFAULT_ATMOSPHERE_SETTINGS },
  viewLayout: 'standard',
  showScanlines: false,
  showStarTrails: true,
  showTrajectoryLine: true,
  gliderFlightEnabled: false,
  starChartEnabled: false,
  arcadeModeEnabled: false,
  activeViewpointId: null,
  savedAt: 0,
  version: CURRENT_SESSION_VERSION,
};

function clampNumber(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
    return fallback;
  }
  return Math.min(Math.max(val, min), max);
}

function sanitizeBoolean(val: unknown, fallback: boolean): boolean {
  return typeof val === 'boolean' ? val : fallback;
}

/**
 * Validates and sanitizes a raw flight session object, guaranteeing safe,
 * in-bounds types and resilient fallback on corrupted/out-of-range data.
 */
export function sanitizeFlightSession(raw: unknown): SavedFlightSession {
  if (!raw || typeof raw !== 'object') {
    return {
      ...DEFAULT_FLIGHT_SESSION,
      atmosphereSettings: { ...DEFAULT_ATMOSPHERE_SETTINGS },
      savedAt: Date.now(),
    };
  }

  const data = raw as Partial<Record<keyof SavedFlightSession, unknown>>;

  // Cycle progress: clamp 0.0 to 1.0
  const cycleProgress = clampNumber(data.cycleProgress, 0.0, 1.0, DEFAULT_FLIGHT_SESSION.cycleProgress);
  const isAutoCycle = sanitizeBoolean(data.isAutoCycle, DEFAULT_FLIGHT_SESSION.isAutoCycle);

  // Speed mode
  const validSpeedModes: SavedFlightSession['speedMode'][] = ['cinematic', 'normal', 'mach'];
  const speedMode =
    typeof data.speedMode === 'string' && validSpeedModes.includes(data.speedMode as SavedFlightSession['speedMode'])
      ? (data.speedMode as SavedFlightSession['speedMode'])
      : DEFAULT_FLIGHT_SESSION.speedMode;

  // Weather mode
  const validWeatherModes: SavedFlightSession['weatherMode'][] = ['auto', 'clear', 'rain', 'snow', 'mist', 'aurora'];
  const weatherMode =
    typeof data.weatherMode === 'string' && validWeatherModes.includes(data.weatherMode as SavedFlightSession['weatherMode'])
      ? (data.weatherMode as SavedFlightSession['weatherMode'])
      : DEFAULT_FLIGHT_SESSION.weatherMode;

  // View Layout
  const validLayouts: SavedFlightSession['viewLayout'][] = ['standard', 'split-radar', 'cinematic'];
  const viewLayout =
    typeof data.viewLayout === 'string' && validLayouts.includes(data.viewLayout as SavedFlightSession['viewLayout'])
      ? (data.viewLayout as SavedFlightSession['viewLayout'])
      : DEFAULT_FLIGHT_SESSION.viewLayout;

  // Display and Mode booleans
  const showScanlines = sanitizeBoolean(data.showScanlines, DEFAULT_FLIGHT_SESSION.showScanlines);
  const showStarTrails = sanitizeBoolean(data.showStarTrails, DEFAULT_FLIGHT_SESSION.showStarTrails);
  const showTrajectoryLine = sanitizeBoolean(data.showTrajectoryLine, DEFAULT_FLIGHT_SESSION.showTrajectoryLine);
  const gliderFlightEnabled = sanitizeBoolean(data.gliderFlightEnabled, DEFAULT_FLIGHT_SESSION.gliderFlightEnabled);
  const starChartEnabled = sanitizeBoolean(data.starChartEnabled, DEFAULT_FLIGHT_SESSION.starChartEnabled);
  const arcadeModeEnabled = sanitizeBoolean(data.arcadeModeEnabled, DEFAULT_FLIGHT_SESSION.arcadeModeEnabled);

  // Active viewpoint id
  const activeViewpointId = typeof data.activeViewpointId === 'string' ? data.activeViewpointId : null;

  // Atmosphere Settings sanitization
  const rawAtmo = data.atmosphereSettings as Partial<CustomAtmosphereSettings> | undefined;
  const atmosphereSettings: CustomAtmosphereSettings = {
    cloudDensityScale: clampNumber(rawAtmo?.cloudDensityScale, 0.5, 2.0, DEFAULT_ATMOSPHERE_SETTINGS.cloudDensityScale),
    windSpeedScale: clampNumber(rawAtmo?.windSpeedScale, 0.2, 3.0, DEFAULT_ATMOSPHERE_SETTINGS.windSpeedScale),
    shakeIntensityScale: clampNumber(rawAtmo?.shakeIntensityScale, 0.0, 2.0, DEFAULT_ATMOSPHERE_SETTINGS.shakeIntensityScale),
    auroraVibrancyScale: clampNumber(rawAtmo?.auroraVibrancyScale, 0.5, 2.0, DEFAULT_ATMOSPHERE_SETTINGS.auroraVibrancyScale),
    starTwinkleSpeed: clampNumber(rawAtmo?.starTwinkleSpeed, 0.5, 2.0, DEFAULT_ATMOSPHERE_SETTINGS.starTwinkleSpeed),
    crtScanlineIntensity: clampNumber(rawAtmo?.crtScanlineIntensity, 0.0, 0.8, DEFAULT_ATMOSPHERE_SETTINGS.crtScanlineIntensity),
    showPixelGrid: sanitizeBoolean(rawAtmo?.showPixelGrid, DEFAULT_ATMOSPHERE_SETTINGS.showPixelGrid),
    cinemaBars: sanitizeBoolean(rawAtmo?.cinemaBars, DEFAULT_ATMOSPHERE_SETTINGS.cinemaBars),
  };

  const savedAt = typeof data.savedAt === 'number' && Number.isFinite(data.savedAt) ? data.savedAt : Date.now();

  return {
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
    savedAt,
    version: CURRENT_SESSION_VERSION,
  };
}

/**
 * Loads and sanitizes the saved flight session from localStorage.
 * Returns null if no session has been saved or if localStorage is unavailable.
 */
export function loadSavedFlightSession(): SavedFlightSession | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(FLIGHT_SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return sanitizeFlightSession(parsed);
  } catch (err) {
    console.warn('[FlightSession] Failed to load flight session from storage:', err);
    return null;
  }
}

/**
 * Persists the current flight session to localStorage.
 */
export function saveFlightSession(session: SavedFlightSession): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const sanitized = sanitizeFlightSession(session);
    sanitized.savedAt = Date.now();
    window.localStorage.setItem(FLIGHT_SESSION_STORAGE_KEY, JSON.stringify(sanitized));
    return true;
  } catch (err) {
    console.warn('[FlightSession] Failed to save flight session to storage:', err);
    return false;
  }
}

/**
 * Clears the saved flight session from localStorage.
 */
export function clearSavedFlightSession(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    window.localStorage.removeItem(FLIGHT_SESSION_STORAGE_KEY);
    return true;
  } catch (err) {
    console.warn('[FlightSession] Failed to clear flight session from storage:', err);
    return false;
  }
}

/**
 * Checks whether a valid flight session exists in localStorage.
 */
export function hasSavedFlightSession(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    return !!window.localStorage.getItem(FLIGHT_SESSION_STORAGE_KEY);
  } catch {
    return false;
  }
}
