/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CustomAtmosphereSettings,
  DEFAULT_ATMOSPHERE_SETTINGS,
  WeatherType,
} from './descentEngine';

export interface CinematicViewpoint {
  id: string;
  name: string;
  description: string;
  tag: string;
  cycleProgress: number; // 0.0 ~ 1.0
  weatherMode: 'auto' | WeatherType;
  speedMode: 'cinematic' | 'normal' | 'mach';
  atmosphereSettings: CustomAtmosphereSettings;
  showScanlines: boolean;
  showStarTrails: boolean;
  showTrajectoryLine: boolean;
  viewLayout: 'standard' | 'split-radar' | 'cinematic';
  isPreset: boolean;
  accentColor: string;
  iconType: 'aurora' | 'meteor' | 'fog' | 'sun' | 'rain' | 'custom' | 'bookmark';
  createdAt: number;
}

export const STORAGE_VIEWPOINTS_KEY = 'gemini_descent_saved_viewpoints';

/**
 * Predefined iconic cinematic viewpoints showcasing peak atmospheric moments
 */
export const DEFAULT_CINEMATIC_VIEWPOINTS: CinematicViewpoint[] = [
  {
    id: 'preset-twilight-aurora',
    name: '트와일라잇 오로라 하강',
    description: '황혼의 자줏빛 대기 속을 일렁이는 몽환적인 코스믹 오로라 커튼',
    tag: '트와일라잇',
    cycleProgress: 0.58,
    weatherMode: 'aurora',
    speedMode: 'cinematic',
    atmosphereSettings: {
      ...DEFAULT_ATMOSPHERE_SETTINGS,
      cloudDensityScale: 1.15,
      windSpeedScale: 0.7,
      auroraVibrancyScale: 1.85,
      starTwinkleSpeed: 1.3,
      crtScanlineIntensity: 0.12,
      cinemaBars: true,
      shakeIntensityScale: 0.8,
    },
    showScanlines: false,
    showStarTrails: true,
    showTrajectoryLine: true,
    viewLayout: 'standard',
    isPreset: true,
    accentColor: '#34d399',
    iconType: 'aurora',
    createdAt: 1700000000001,
  },
  {
    id: 'preset-midnight-meteor',
    name: '심야 픽셀 유성우 쇼',
    description: '깊은 밤 성좌 사이로 긴 꼬리를 남기며 쏟아지는 찬란한 픽셀 유성우',
    tag: '미드나잇',
    cycleProgress: 0.82,
    weatherMode: 'clear',
    speedMode: 'normal',
    atmosphereSettings: {
      ...DEFAULT_ATMOSPHERE_SETTINGS,
      cloudDensityScale: 0.65,
      windSpeedScale: 0.85,
      auroraVibrancyScale: 1.1,
      starTwinkleSpeed: 1.8,
      crtScanlineIntensity: 0.18,
      cinemaBars: false,
      shakeIntensityScale: 1.0,
    },
    showScanlines: false,
    showStarTrails: true,
    showTrajectoryLine: true,
    viewLayout: 'standard',
    isPreset: true,
    accentColor: '#38bdf8',
    iconType: 'meteor',
    createdAt: 1700000000002,
  },
  {
    id: 'preset-dawn-mist',
    name: '새벽 고요한 운무림',
    description: '동틀 녘 지평선에 짙게 깔린 해무와 은은하게 차오르는 여명광',
    tag: '새벽',
    cycleProgress: 0.08,
    weatherMode: 'mist',
    speedMode: 'cinematic',
    atmosphereSettings: {
      ...DEFAULT_ATMOSPHERE_SETTINGS,
      cloudDensityScale: 1.6,
      windSpeedScale: 0.65,
      auroraVibrancyScale: 0.7,
      starTwinkleSpeed: 0.9,
      crtScanlineIntensity: 0.1,
      cinemaBars: true,
      shakeIntensityScale: 0.6,
    },
    showScanlines: false,
    showStarTrails: false,
    showTrajectoryLine: true,
    viewLayout: 'standard',
    isPreset: true,
    accentColor: '#a78bfa',
    iconType: 'fog',
    createdAt: 1700000000003,
  },
  {
    id: 'preset-golden-supernova',
    name: '골든아워 초신성 쾌청',
    description: '황금빛 햇살이 부서지는 푸른 창공 속 초고속 마하 강하 비행',
    tag: '골든아워',
    cycleProgress: 0.32,
    weatherMode: 'clear',
    speedMode: 'mach',
    atmosphereSettings: {
      ...DEFAULT_ATMOSPHERE_SETTINGS,
      cloudDensityScale: 0.8,
      windSpeedScale: 1.5,
      auroraVibrancyScale: 1.0,
      starTwinkleSpeed: 1.1,
      crtScanlineIntensity: 0.0,
      cinemaBars: false,
      shakeIntensityScale: 1.4,
    },
    showScanlines: false,
    showStarTrails: true,
    showTrajectoryLine: true,
    viewLayout: 'standard',
    isPreset: true,
    accentColor: '#fbbf24',
    iconType: 'sun',
    createdAt: 1700000000004,
  },
  {
    id: 'preset-cyber-tempest',
    name: '심야 폭풍우 네온 스캔라인',
    description: '먹구름 폭풍우 속에서 펼쳐지는 레트로 CRT 브라운관 사이버펑크 감상',
    tag: '사이버펑크',
    cycleProgress: 0.74,
    weatherMode: 'rain',
    speedMode: 'normal',
    atmosphereSettings: {
      ...DEFAULT_ATMOSPHERE_SETTINGS,
      cloudDensityScale: 1.85,
      windSpeedScale: 2.3,
      auroraVibrancyScale: 1.25,
      starTwinkleSpeed: 1.3,
      crtScanlineIntensity: 0.45,
      showPixelGrid: true,
      cinemaBars: false,
      shakeIntensityScale: 1.6,
    },
    showScanlines: true,
    showStarTrails: true,
    showTrajectoryLine: true,
    viewLayout: 'standard',
    isPreset: true,
    accentColor: '#60a5fa',
    iconType: 'rain',
    createdAt: 1700000000005,
  },
];

/**
 * Safely reads custom viewpoints from localStorage
 */
export function loadCustomViewpointsFromStorage(): CinematicViewpoint[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_VIEWPOINTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.cycleProgress === 'number'
    );
  } catch {
    return [];
  }
}

/**
 * Saves custom viewpoints array to localStorage
 */
export function saveCustomViewpointsToStorage(viewpoints: CinematicViewpoint[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const customOnly = viewpoints.filter((vp) => !vp.isPreset);
    window.localStorage.setItem(STORAGE_VIEWPOINTS_KEY, JSON.stringify(customOnly));
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads all active viewpoints: combines default presets and custom user viewpoints
 */
export function loadAllViewpoints(): CinematicViewpoint[] {
  const custom = loadCustomViewpointsFromStorage();
  return [...DEFAULT_CINEMATIC_VIEWPOINTS, ...custom];
}

export interface CreateViewpointParams {
  name: string;
  description?: string;
  cycleProgress: number;
  weatherMode: 'auto' | WeatherType;
  speedMode: 'cinematic' | 'normal' | 'mach';
  atmosphereSettings: CustomAtmosphereSettings;
  showScanlines: boolean;
  showStarTrails: boolean;
  showTrajectoryLine: boolean;
  viewLayout?: 'standard' | 'split-radar' | 'cinematic';
  accentColor?: string;
  iconType?: 'aurora' | 'meteor' | 'fog' | 'sun' | 'rain' | 'custom' | 'bookmark';
}

/**
 * Helper to determine a suggested tag based on cycle progress
 */
export function getPhaseTagFromProgress(progress: number): string {
  const norm = ((progress % 1.0) + 1.0) % 1.0;
  if (norm < 0.25) return '새벽';
  if (norm < 0.50) return '골든아워';
  if (norm < 0.75) return '트와일라잇';
  return '미드나잇';
}

/**
 * Creates and saves a new custom viewpoint
 */
export function createCustomViewpoint(params: CreateViewpointParams): CinematicViewpoint {
  const tag = getPhaseTagFromProgress(params.cycleProgress);
  const id = `custom-vp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newViewpoint: CinematicViewpoint = {
    id,
    name: params.name.trim() || `시네마틱 뷰 ${tag}`,
    description:
      params.description?.trim() ||
      `${tag} 대기 · ${params.weatherMode === 'auto' ? '시간연동 날씨' : params.weatherMode} 모드`,
    tag,
    cycleProgress: Math.max(0, Math.min(1, params.cycleProgress)),
    weatherMode: params.weatherMode,
    speedMode: params.speedMode,
    atmosphereSettings: { ...params.atmosphereSettings },
    showScanlines: params.showScanlines,
    showStarTrails: params.showStarTrails,
    showTrajectoryLine: params.showTrajectoryLine,
    viewLayout: params.viewLayout || 'standard',
    isPreset: false,
    accentColor: params.accentColor || '#38bdf8',
    iconType: params.iconType || 'bookmark',
    createdAt: Date.now(),
  };

  const existing = loadCustomViewpointsFromStorage();
  const updated = [newViewpoint, ...existing];
  saveCustomViewpointsToStorage(updated);

  return newViewpoint;
}

/**
 * Deletes a custom viewpoint by ID (presets cannot be deleted)
 */
export function deleteCustomViewpoint(id: string): boolean {
  if (DEFAULT_CINEMATIC_VIEWPOINTS.some((p) => p.id === id)) {
    return false; // Cannot delete built-in presets
  }
  const existing = loadCustomViewpointsFromStorage();
  const filtered = existing.filter((p) => p.id !== id);
  if (filtered.length === existing.length) return false;
  return saveCustomViewpointsToStorage(filtered);
}

/**
 * Clears all custom viewpoints from storage
 */
export function resetCustomViewpoints(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_VIEWPOINTS_KEY);
  }
}

/**
 * Returns human-readable summary badges of a viewpoint's configuration
 */
export function getViewpointBadgeSummary(vp: CinematicViewpoint): {
  phaseLabel: string;
  weatherLabel: string;
  speedLabel: string;
  hasCrt: boolean;
  hasCinemaBars: boolean;
} {
  const weatherMap: Record<string, string> = {
    auto: '시간연동',
    clear: '쾌청',
    rain: '소나기',
    snow: '눈 내리기',
    mist: '안개',
    aurora: '오로라',
  };

  const speedMap: Record<string, string> = {
    cinematic: '느리게',
    normal: '표준 속도',
    mach: '마하 가속',
  };

  return {
    phaseLabel: vp.tag || getPhaseTagFromProgress(vp.cycleProgress),
    weatherLabel: weatherMap[vp.weatherMode] || vp.weatherMode,
    speedLabel: speedMap[vp.speedMode] || vp.speedMode,
    hasCrt: vp.showScanlines || vp.atmosphereSettings.crtScanlineIntensity > 0.25,
    hasCinemaBars: Boolean(vp.atmosphereSettings.cinemaBars),
  };
}
