/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherType } from './descentEngine';

export interface SystemTimeThemeConfig {
  /** Whether the detected local system time is within night hours (8:00 PM ~ 6:00 AM) */
  isNight: boolean;
  /** Current local hour (0-23) */
  systemHours: number;
  /** Current local minute (0-59) */
  systemMinutes: number;
  /** Formatted time string (e.g., "21:30" or "03:15") */
  formattedTime: string;
  /** Suggested theme mode */
  themeMode: 'dark' | 'light';
  /** Target diurnal phase ID for night or day */
  targetPhaseId: 'midnight' | 'golden';
  /** Diurnal phase index: 3 for Midnight (Cosmic Night), 1 for Golden Hour */
  targetPhaseIndex: number;
  /** Target cycleProgress value for descentEngine (0.77 places flight right into Midnight) */
  targetCycleProgress: number;
  /** Suggested weather mode matching the phase */
  targetWeather: WeatherType;
  /** Human-readable description of the resolved system time state */
  description: string;
}

/**
 * Determines whether a given Date represents nighttime.
 * Night hours: 8:00 PM (20:00) to 6:00 AM (06:00).
 * Specifically: hours >= 20 || hours < 6.
 */
export function isNightTime(date: Date = new Date()): boolean {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    date = new Date();
  }
  const hours = date.getHours();
  return hours >= 20 || hours < 6;
}

/**
 * Returns comprehensive auto-theme and environmental weather configuration
 * derived from the user's local system time.
 */
export function getSystemTimeAutoThemeConfig(date: Date = new Date()): SystemTimeThemeConfig {
  const validDate = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const hours = validDate.getHours();
  const minutes = validDate.getMinutes();
  const isNight = hours >= 20 || hours < 6;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedTime = `${pad(hours)}:${pad(minutes)}`;

  if (isNight) {
    return {
      isNight: true,
      systemHours: hours,
      systemMinutes: minutes,
      formattedTime,
      themeMode: 'dark',
      targetPhaseId: 'midnight',
      targetPhaseIndex: 3,
      targetCycleProgress: 0.77,
      targetWeather: 'snow',
      description: `야간 시간대 (${formattedTime}, 오후 8시~오전 6시): 다크 모드 및 심우주 미드나잇(설운)이 활성화되었습니다.`,
    };
  }

  return {
    isNight: false,
    systemHours: hours,
    systemMinutes: minutes,
    formattedTime,
    themeMode: 'light',
    targetPhaseId: 'golden',
    targetPhaseIndex: 1,
    targetCycleProgress: 0.50,
    targetWeather: 'clear',
    description: `주간 시간대 (${formattedTime}): 표준 주간 모드 및 골든 아워가 활성화되었습니다.`,
  };
}

/**
 * Applies the resolved theme mode ('dark' | 'light') to the DOM document element
 * and updates mobile theme-color meta tag if present.
 */
export function applyThemeToDocument(theme: 'dark' | 'light'): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Update mobile status bar theme-color
  try {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#02040a' : '#0b112c');
    }
  } catch {
    // Graceful fallback for headless or restricted DOM environments
  }
}
