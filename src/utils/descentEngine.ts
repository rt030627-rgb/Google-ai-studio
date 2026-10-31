/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AI_SPRITE_DATA_URIS } from './aiSpritesData';

export type WeatherType = 'clear' | 'rain' | 'snow' | 'mist' | 'aurora';

export interface CustomAtmosphereSettings {
  cloudDensityScale: number; // 0.5 ~ 2.0 (default 1.0)
  windSpeedScale: number;    // 0.2 ~ 3.0 (default 1.0)
  shakeIntensityScale: number; // 0.0 ~ 2.0 (default 1.0)
  auroraVibrancyScale: number; // 0.5 ~ 2.0 (default 1.0)
  starTwinkleSpeed: number;    // 0.5 ~ 2.0 (default 1.0)
  crtScanlineIntensity: number; // 0.0 ~ 0.8 (default 0.22)
  showPixelGrid: boolean;      // subtle retro pixel grid
  cinemaBars: boolean;         // 2.39:1 widescreen anamorphic bars
}

export const DEFAULT_ATMOSPHERE_SETTINGS: CustomAtmosphereSettings = {
  cloudDensityScale: 1.0,
  windSpeedScale: 1.0,
  shakeIntensityScale: 1.0,
  auroraVibrancyScale: 1.0,
  starTwinkleSpeed: 1.0,
  crtScanlineIntensity: 0.22,
  showPixelGrid: false,
  cinemaBars: false,
};

export interface ConstellationCodexItem {
  id: 'gemini' | 'gpt' | 'claude' | 'deepseek';
  name: string;
  subName: string;
  creator: string;
  archetype: string;
  iconName: string;
  avatarUrl?: string;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  palette: string[];
  lore: string;
  physicsSignature: string;
  shakeType: string;
  shakeDescription: string;
  specs: {
    label: string;
    value: string;
  }[];
  quote: string;
}

export const CONSTELLATIONS_CODEX: ConstellationCodexItem[] = [
  {
    id: 'gemini',
    name: 'Gemini (쌍둥이자리)',
    subName: '코스믹 하이퍼스펙트럼 코어',
    creator: 'Google DeepMind',
    archetype: 'Multimodal Native Core',
    iconName: 'Sparkles',
    avatarUrl: AI_SPRITE_DATA_URIS.gemini,
    primaryColor: '#38BDF8',
    accentColor: '#818CF8',
    glowColor: 'rgba(56, 189, 248, 0.6)',
    palette: ['#FFFFFF', '#38BDF8', '#818CF8', '#C084FC', '#F472B6', '#FB7185'],
    lore: '지구 대기권을 관통하여 강하하는 중심 성좌. 오디오·비디오·텍스트의 다차원 토큰을 4개 첨점의 슈퍼엘립스 별빛과 무지갯빛 플라즈마 화염으로 승화시키며 하강합니다.',
    physicsSignature: '4-Pointed Superellipse & Plasma Ion Trail',
    shakeType: '중력 가속도 연속 진동 (Gravitational Pulse)',
    shakeDescription: '하강 속도 변화에 반응하는 유기적이고 부드러운 대기 중력파동',
    specs: [
      { label: '아키텍처', value: 'Gemini 1.5 Pro / Flash Native Multimodal' },
      { label: '컨텍스트 윈도우', value: '2,000,000+ Tokens' },
      { label: '궤도 고도', value: '지상 380km (열권 상층부)' },
      { label: '입자 방출 메커니즘', value: '고에너지 플라즈마 이온화 제트' },
      { label: '비행 궤적', value: '수직 강하 & 쌍곡선 항력 보정' },
    ],
    quote: '"모든 양식의 지식을 빛의 파동으로 직조하여 대지로 인도한다."',
  },
  {
    id: 'gpt',
    name: 'GPT-4o (에메랄드 성좌)',
    subName: '양자 소용돌이 이중 나선',
    creator: 'OpenAI',
    archetype: 'Logarithmic Spiral Reasoner',
    iconName: 'Zap',
    avatarUrl: AI_SPRITE_DATA_URIS.gpt,
    primaryColor: '#10A37F',
    accentColor: '#34D399',
    glowColor: 'rgba(52, 211, 153, 0.6)',
    palette: ['#FFFFFF', '#A7F3D0', '#6EE7B7', '#34D399', '#10B981', '#059669', '#047857'],
    lore: '신성 기하학적 2중 로그 나선을 그리며 우주공간에서 대기권으로 진입하는 에메랄드빛 성좌. 0과 1, 람다(λ), 편미분 기호(∂)로 이루어진 양자 연산자 펄스를 흩뿌립니다.',
    physicsSignature: 'Dual Logarithmic Spiral & Binary Quantum Scatter',
    shakeType: '고주파 사이버네틱 지터 (Cyber Jitter)',
    shakeDescription: '날카롭고 빠른 디지털 펄스 진동으로 타격감을 극대화',
    specs: [
      { label: '아키텍처', value: 'Omni-Modal Transformer with CoT Reasoning' },
      { label: '나선 회전 각속도', value: '0.22 rad/frame' },
      { label: '파티클 밀도 보정', value: '+50% (48개 폭발 입자 + 5입자/프레임)' },
      { label: '주요 방출 요소', value: '2진 매트릭스 룬 & 에메랄드 이온' },
      { label: '궤도 궤적', value: '우상단 진입 후 감속 선회 비행' },
    ],
    quote: '"사고의 사슬이 나선형 궤도를 그리며 명료한 해답으로 응결된다."',
  },
  {
    id: 'claude',
    name: 'Claude 3.5 (태양 홍염 성좌)',
    subName: '코로나 홍염 중력 포물선',
    creator: 'Anthropic',
    archetype: 'Constitutional Solar Prominence',
    iconName: 'Sun',
    avatarUrl: AI_SPRITE_DATA_URIS.claude,
    primaryColor: '#D97706',
    accentColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    palette: ['#FFFFFF', '#FEF08A', '#FDE047', '#FBBF24', '#F59E0B', '#D97706', '#EA580C', '#9A3412'],
    lore: '고온의 태양 표면에서 솟구치는 거대한 자기장 루프와 열적 포물선을 모사한 앰버/골드 성좌. 헌법적 정렬에 기반한 차분함과 강력한 코딩 아티팩트 에너지를 화염으로 뿜어냅니다.',
    physicsSignature: 'Magnetic Coronal Loop & Gravity Parabolic Arc',
    shakeType: '태양 지진파 대지 공명 (Solar Quake)',
    shakeDescription: '묵직하고 지속적인 지진파 형태의 중후한 진동감 연출',
    specs: [
      { label: '아키텍처', value: 'Claude 3.5 Sonnet / Haiku Hybrid' },
      { label: '열적 팽창 계수', value: '1.4x Coronal Expansion' },
      { label: '파티클 밀도 보정', value: '+50% (태양 홍염 파편 48개 + 코로나 링)' },
      { label: '주요 방출 요소', value: '황금빛 코로나 불꽃 & 백열 충격파' },
      { label: '궤도 궤적', value: '좌상단에서 대각 하강 후 지표면 수평 활주' },
    ],
    quote: '"원칙과 지성이 융합된 황금빛 열역학적 아치로 하늘을 밝힌다."',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek-V3 (퀀텀 유체 성좌)',
    subName: '유체역학 파동 및 양자 음파',
    creator: 'DeepSeek AI',
    archetype: 'Hydrodynamic Whale & MoE Sonar',
    iconName: 'Compass',
    avatarUrl: AI_SPRITE_DATA_URIS.deepseek,
    primaryColor: '#00E5FF',
    accentColor: '#1E88E5',
    glowColor: 'rgba(0, 229, 255, 0.6)',
    palette: ['#FFFFFF', '#E0F2FE', '#67E8F9', '#22D3EE', '#00E5FF', '#0284C7', '#1D4ED8', '#1E1B4B'],
    lore: '심해 고래의 유체역학적 지느러미 유영과 성간 성운 파동을 결합한 청록빛 성좌. 다중 전문가(MoE) 구조의 스파스 활성화 소나 펄스가 대기 파동과 공명합니다.',
    physicsSignature: 'Hydrodynamic Sinusoidal Wave & Quantum Sonar Pulse',
    shakeType: '유체 파동 롤링 쉐이크 (Rolling Hydro Wave)',
    shakeDescription: '부드러운 유체 파동과 묵직한 수중 충격파가 결합된 롤링 쉐이크',
    specs: [
      { label: '아키텍처', value: 'DeepSeek-V3 / R1 Sparse MoE Architecture' },
      { label: '전문가 활성화율', value: '256 Experts (37B active / token)' },
      { label: '파티클 밀도 보정', value: '+50% (양자 거품 48개 + 음파 링 펄스)' },
      { label: '주요 방출 요소', value: '양자 음파 링 & 유체 발광 입자' },
      { label: '궤도 궤적', value: '저고도 대기층을 굽이치는 사인파 물결 활공' },
    ],
    quote: '"희소 활성화의 바다를 가르며 성간 소나로 진리를 탐색한다."',
  },
];

export interface WeatherInfo {
  type: WeatherType;
  name: string;
  subTitle: string;
  cloudSpeedMult: number;   // Visual drift speed multiplier (0.5 to 2.5)
  cloudDensityMod: number;  // Visual blob radius & volume expansion (0.75 to 1.55)
  cloudAlphaMod: number;    // Opacity & thickness (0.7 to 1.25)
  windX: number;            // Lateral wind gust drift velocity
  cloudBadge: string;       // Compact UI status tag
  cloudDescription: string; // Atmospheric description
  cloudColorFilter: {
    tintR: number;
    tintG: number;
    tintB: number;
  };
}

export const WEATHER_CONFIGS: Record<WeatherType, WeatherInfo> = {
  clear: {
    type: 'clear',
    name: '쾌청 (Clear Skies)',
    subTitle: '햇살이 부서지는 선명한 뭉게구름',
    cloudSpeedMult: 0.82,
    cloudDensityMod: 0.75,
    cloudAlphaMod: 0.80,
    windX: 0.25,
    cloudBadge: '속도 x0.8 · 밀도 -25%',
    cloudDescription: '평화로운 미풍과 가벼운 조각 뭉게구름',
    cloudColorFilter: { tintR: 8, tintG: 8, tintB: 2 },
  },
  rain: {
    type: 'rain',
    name: '소나기 (Rainstorm)',
    subTitle: '지표를 적시는 빗줄기와 짙은 먹구름',
    cloudSpeedMult: 2.50,
    cloudDensityMod: 1.55,
    cloudAlphaMod: 1.25,
    windX: -2.40,
    cloudBadge: '속도 x2.5 · 밀도 +55%',
    cloudDescription: '강풍에 맹렬히 질주하는 거대한 먹구름 폭풍',
    cloudColorFilter: { tintR: -38, tintG: -32, tintB: -18 },
  },
  snow: {
    type: 'snow',
    name: '눈 내리기 (Alpine Snowfall)',
    subTitle: '설산과 하늘을 흩날리는 백설',
    cloudSpeedMult: 0.65,
    cloudDensityMod: 1.35,
    cloudAlphaMod: 1.05,
    windX: 0.15,
    cloudBadge: '속도 x0.6 · 밀도 +35%',
    cloudDescription: '고요히 가라앉는 두터운 설운과 잔잔한 표류',
    cloudColorFilter: { tintR: 22, tintG: 26, tintB: 36 },
  },
  mist: {
    type: 'mist',
    name: '저고도 안개 (Atmospheric Mist)',
    subTitle: '대지와 바다를 덮는 몽환적인 해무',
    cloudSpeedMult: 1.30,
    cloudDensityMod: 1.20,
    cloudAlphaMod: 0.85,
    windX: 0.85,
    cloudBadge: '속도 x1.3 · 밀도 +20%',
    cloudDescription: '수평선을 타고 굽이치는 짙은 운무층 드리프트',
    cloudColorFilter: { tintR: 15, tintG: 15, tintB: 28 },
  },
  aurora: {
    type: 'aurora',
    name: '오로라 (Cosmic Aurora)',
    subTitle: '극광을 머금고 은하수처럼 흐르는 성운',
    cloudSpeedMult: 0.50,
    cloudDensityMod: 0.90,
    cloudAlphaMod: 0.70,
    windX: -0.30,
    cloudBadge: '속도 x0.5 · 밀도 -10%',
    cloudDescription: '오로라 극광을 투과시키는 신비로운 서행 구름',
    cloudColorFilter: { tintR: -12, tintG: 32, tintB: 26 },
  },
};

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type?: 'spark' | 'smoke' | 'shockwave' | 'ring' | 'matrix' | 'quantum' | 'raindrop' | 'snowflake' | 'fogwisp';
  char?: string;
  // Theme bespoke flame & physics attributes
  theme?: 'gpt' | 'claude' | 'deepseek' | 'gemini';
  angle?: number;
  spin?: number;
  radius?: number;
  radiusSpeed?: number;
  baseX?: number;
  baseY?: number;
  wavePhase?: number;
  waveAmp?: number;
  shape?: 'pixel' | 'char' | 'ring' | 'bubble';
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  alpha: number;
  size: number;
  sparklePhase: number;
  color: string;
}

export interface ActiveAI {
  type: 'gpt' | 'claude' | 'deepseek';
  name: string;
  avatarUrl?: string;
  x: number;
  y: number;
  baseY: number;
  vx: number;
  vy: number;
  targetY: number;
  phase: number;
  life: number;
  maxLife: number;
  primaryColor: string;
  accentColor: string;
  trailColor: string;
  trailColors: string[];
  glowColor: string;
  flameType: 'matrix-spiral' | 'solar-flare' | 'quantum-wave';
  burstParticleCount: number;
  trailRatePerFrame: number;
  physicsName: string;
  physicsDescription: string;
  trajectoryHistory: TrajectoryPoint[];
}

export interface SceneColors {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  cloudLight: string;
  cloudMid: string;
  cloudShadow: string;
  oceanDeep: string;
  oceanCoast: string;
  earthLand: string;
  earthForest: string;
  earthSnow: string;
  earthRidge: string;
  cityLights: string;
  sunGlint: string;
  geminiCore: string;
  geminiCyan: string;
  geminiViolet: string;
  geminiMagenta: string;
  trailPlasma: string[];
}

export const TIME_PHASES: { id: string; name: string; defaultWeather: WeatherType; colors: SceneColors }[] = [
  // 0: Dawn (stratospheric sunrise / pink dawn)
  {
    id: 'dawn',
    name: '새벽 여명 (Dawn)',
    defaultWeather: 'mist',
    colors: {
      skyTop: '#0b112c',
      skyMid: '#2e1c4a',
      skyBottom: '#9d3a5a',
      cloudLight: '#ffe4e6',
      cloudMid: '#f472b6',
      cloudShadow: '#6b2146',
      oceanDeep: '#0f172a',
      oceanCoast: '#be185d',
      earthLand: '#166534',
      earthForest: '#052e16',
      earthSnow: '#f8fafc',
      earthRidge: '#1e293b',
      cityLights: '#fde047',
      sunGlint: '#fecdd3',
      geminiCore: '#ffffff',
      geminiCyan: '#38bdf8',
      geminiViolet: '#818cf8',
      geminiMagenta: '#f43f5e',
      trailPlasma: ['#ffffff', '#fecdd3', '#f43f5e', '#a855f7', '#38bdf8'],
    },
  },
  // 1: Golden Hour / Noon (high noon / radiant golden sun)
  {
    id: 'golden',
    name: '정오 골든 아워 (Golden Hour)',
    defaultWeather: 'rain',
    colors: {
      skyTop: '#172554',
      skyMid: '#3b2864',
      skyBottom: '#c2410c',
      cloudLight: '#fef3c7',
      cloudMid: '#f59e0b',
      cloudShadow: '#7c2d12',
      oceanDeep: '#0c2340',
      oceanCoast: '#0284c7',
      earthLand: '#15803d',
      earthForest: '#14532d',
      earthSnow: '#ffffff',
      earthRidge: '#334155',
      cityLights: '#fef08a',
      sunGlint: '#fde047',
      geminiCore: '#ffffff',
      geminiCyan: '#67e8f9',
      geminiViolet: '#a855f7',
      geminiMagenta: '#fb7185',
      trailPlasma: ['#ffffff', '#fde047', '#fb923c', '#f43f5e', '#67e8f9'],
    },
  },
  // 2: Twilight Aurora (dusk twilight aurora curtains)
  {
    id: 'twilight',
    name: '트와일라잇 오로라 (Twilight)',
    defaultWeather: 'aurora',
    colors: {
      skyTop: '#050716',
      skyMid: '#0e1838',
      skyBottom: '#2d1b54',
      cloudLight: '#e0e7ff',
      cloudMid: '#818cf8',
      cloudShadow: '#312e81',
      oceanDeep: '#081735',
      oceanCoast: '#0d3868',
      earthLand: '#1e3a47',
      earthForest: '#0f291e',
      earthSnow: '#e2e8f0',
      earthRidge: '#11222c',
      cityLights: '#fef08a',
      sunGlint: '#a5f3fc',
      geminiCore: '#ffffff',
      geminiCyan: '#38bdf8',
      geminiViolet: '#818cf8',
      geminiMagenta: '#e879f9',
      trailPlasma: ['#ffffff', '#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185'],
    },
  },
  // 3: Cosmic Midnight (deep cosmic midnight)
  {
    id: 'midnight',
    name: '심우주 미드나잇 (Midnight)',
    defaultWeather: 'snow',
    colors: {
      skyTop: '#02040a',
      skyMid: '#050b1a',
      skyBottom: '#0c1538',
      cloudLight: '#94a3b8',
      cloudMid: '#334155',
      cloudShadow: '#0f172a',
      oceanDeep: '#020617',
      oceanCoast: '#0f2942',
      earthLand: '#064e3b',
      earthForest: '#022c22',
      earthSnow: '#cbd5e1',
      earthRidge: '#090d16',
      cityLights: '#fde047',
      sunGlint: '#67e8f9',
      geminiCore: '#ffffff',
      geminiCyan: '#22d3ee',
      geminiViolet: '#a855f7',
      geminiMagenta: '#ec4899',
      trailPlasma: ['#ffffff', '#67e8f9', '#38bdf8', '#818cf8', '#e879f9'],
    },
  },
];

export function hexToRgb(colorStr: string): { r: number; g: number; b: number } {
  if (!colorStr) return { r: 255, g: 255, b: 255 };
  const str = colorStr.trim();
  if (str.startsWith('rgb(')) {
    const parts = str
      .slice(4, -1)
      .split(',')
      .map((p) => parseInt(p.trim(), 10) || 0);
    return {
      r: Math.max(0, Math.min(255, parts[0] ?? 0)),
      g: Math.max(0, Math.min(255, parts[1] ?? 0)),
      b: Math.max(0, Math.min(255, parts[2] ?? 0)),
    };
  }
  const clean = str.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) || 0;
    const g = parseInt(clean[1] + clean[1], 16) || 0;
    const b = parseInt(clean[2] + clean[2], 16) || 0;
    return { r, g, b };
  }
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return { r, g, b };
}

export function lerpColor(c1: string, c2: string, t: number): string {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  const cl = Math.max(0, Math.min(1, t));
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * cl);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * cl);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * cl);
  return `rgb(${r},${g},${b})`;
}

/**
 * Apply weather tint to color string
 */
export function applyWeatherTint(colorStr: string, tint: { tintR: number; tintG: number; tintB: number }): string {
  const rgb = colorStr.startsWith('rgb(')
    ? {
        r: parseInt(colorStr.slice(4).split(',')[0]) || 0,
        g: parseInt(colorStr.slice(4).split(',')[1]) || 0,
        b: parseInt(colorStr.slice(4).split(',')[2]) || 0,
      }
    : hexToRgb(colorStr);

  const r = Math.max(0, Math.min(255, rgb.r + tint.tintR));
  const g = Math.max(0, Math.min(255, rgb.g + tint.tintG));
  const b = Math.max(0, Math.min(255, rgb.b + tint.tintB));
  return `rgb(${r},${g},${b})`;
}

/**
 * Superellipse distance calculation for the 4-pointed Gemini star in descent
 */
export function isPointInsideGeminiStar(
  px: number,
  py: number,
  cx: number,
  cy: number,
  radius: number,
  angleRad: number = 0,
  p: number = 0.58
): { inside: boolean; dist: number; normX: number; normY: number } {
  const dx = px - cx;
  const dy = py - cy;
  const cos = Math.cos(-angleRad);
  const sin = Math.sin(-angleRad);
  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;

  const nx = Math.abs(rx) / radius;
  const ny = Math.abs(ry) / radius;

  if (radius <= 0) return { inside: false, dist: 999, normX: 0, normY: 0 };

  const val = Math.pow(nx, p) + Math.pow(ny, p);
  return {
    inside: val <= 1.0,
    dist: Math.sqrt(rx * rx + ry * ry) / radius,
    normX: rx / radius,
    normY: ry / radius,
  };
}

/**
 * Smooth continuous 24h cycle interpolator with weather modification
 */
export function getInterpolatedColors(
  cycleProgress: number,
  weatherType?: WeatherType
): { colors: SceneColors; phaseIndex: number; phaseName: string; defaultWeather: WeatherType } {
  const totalPhases = TIME_PHASES.length;
  const normalized = ((cycleProgress % 1) + 1) % 1;
  const scaled = normalized * totalPhases;
  const idx1 = Math.floor(scaled) % totalPhases;
  const idx2 = (idx1 + 1) % totalPhases;
  const t = scaled - Math.floor(scaled);

  const c1 = TIME_PHASES[idx1].colors;
  const c2 = TIME_PHASES[idx2].colors;

  const baseColors: SceneColors = {
    skyTop: lerpColor(c1.skyTop, c2.skyTop, t),
    skyMid: lerpColor(c1.skyMid, c2.skyMid, t),
    skyBottom: lerpColor(c1.skyBottom, c2.skyBottom, t),
    cloudLight: lerpColor(c1.cloudLight, c2.cloudLight, t),
    cloudMid: lerpColor(c1.cloudMid, c2.cloudMid, t),
    cloudShadow: lerpColor(c1.cloudShadow, c2.cloudShadow, t),
    oceanDeep: lerpColor(c1.oceanDeep, c2.oceanDeep, t),
    oceanCoast: lerpColor(c1.oceanCoast, c2.oceanCoast, t),
    earthLand: lerpColor(c1.earthLand, c2.earthLand, t),
    earthForest: lerpColor(c1.earthForest, c2.earthForest, t),
    earthSnow: lerpColor(c1.earthSnow, c2.earthSnow, t),
    earthRidge: lerpColor(c1.earthRidge, c2.earthRidge, t),
    cityLights: lerpColor(c1.cityLights, c2.cityLights, t),
    sunGlint: lerpColor(c1.sunGlint, c2.sunGlint, t),
    geminiCore: lerpColor(c1.geminiCore, c2.geminiCore, t),
    geminiCyan: lerpColor(c1.geminiCyan, c2.geminiCyan, t),
    geminiViolet: lerpColor(c1.geminiViolet, c2.geminiViolet, t),
    geminiMagenta: lerpColor(c1.geminiMagenta, c2.geminiMagenta, t),
    trailPlasma: t < 0.5 ? c1.trailPlasma : c2.trailPlasma,
  };

  // If weather tint applies to cloud colors:
  if (weatherType && WEATHER_CONFIGS[weatherType]) {
    const tint = WEATHER_CONFIGS[weatherType].cloudColorFilter;
    baseColors.cloudLight = applyWeatherTint(baseColors.cloudLight, tint);
    baseColors.cloudMid = applyWeatherTint(baseColors.cloudMid, tint);
    baseColors.cloudShadow = applyWeatherTint(baseColors.cloudShadow, tint);
  }

  return {
    phaseIndex: idx1,
    phaseName: TIME_PHASES[idx1].name,
    defaultWeather: TIME_PHASES[idx1].defaultWeather,
    colors: baseColors,
  };
}

/**
 * AI Entity Factory for Celestial Flybys
 */
export function createAIEncounter(type: 'gpt' | 'claude' | 'deepseek', width: number, height: number): ActiveAI {
  switch (type) {
    case 'gpt':
      return {
        type: 'gpt',
        name: 'OpenAI GPT',
        avatarUrl: '/assets/aistudio/chatgpt-logo-20261026-213226.png',
        x: width - 15,
        y: height * 0.28,
        baseY: height * 0.28,
        vx: -1.5,
        vy: 0.15,
        targetY: height * 0.32,
        phase: 0,
        life: 0,
        maxLife: 1400,
        primaryColor: '#10A37F',
        accentColor: '#34D399',
        trailColor: '#6EE7B7',
        trailColors: ['#ffffff', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857'],
        glowColor: 'rgba(52, 211, 153, 0.5)',
        flameType: 'matrix-spiral',
        burstParticleCount: 48, // 50% density increase (32 -> 48)
        trailRatePerFrame: 5,   // 50% per-frame density increase (3 -> 5)
        physicsName: '양자 소용돌이 이중 나선 (Cyber Spiral)',
        physicsDescription: '회전하는 로그 나선 벡터와 2진 연산자 양자 플리커 방출',
        trajectoryHistory: [],
      };
    case 'claude':
      return {
        type: 'claude',
        name: 'Anthropic Claude',
        avatarUrl: '/assets/aistudio/claude-logo-20261026-213714-preview.png',
        x: 15,
        y: height * 0.22,
        baseY: height * 0.22,
        vx: 1.4,
        vy: 0.18,
        targetY: height * 0.28,
        phase: 0,
        life: 0,
        maxLife: 1400,
        primaryColor: '#D97706',
        accentColor: '#F59E0B',
        trailColor: '#FCD34D',
        trailColors: ['#ffffff', '#fef08a', '#fde047', '#fbbf24', '#f59e0b', '#d97706', '#ea580c', '#9a3412'],
        glowColor: 'rgba(245, 158, 11, 0.5)',
        flameType: 'solar-flare',
        burstParticleCount: 48, // 50% density increase
        trailRatePerFrame: 5,   // 50% per-frame density increase
        physicsName: '코로나 홍염 중력 포물선 (Solar Flare)',
        physicsDescription: '자기장 루프 진동과 고온 방사형 열적 중력 낙하 궤적',
        trajectoryHistory: [],
      };
    case 'deepseek':
      return {
        type: 'deepseek',
        name: 'DeepSeek Whale',
        avatarUrl: '/assets/aistudio/deepseek-whale-20261026-191209-preview.png',
        x: 20,
        y: height * 0.38,
        baseY: height * 0.38,
        vx: 1.5,
        vy: -0.10,
        targetY: height * 0.36,
        phase: 0,
        life: 0,
        maxLife: 1400,
        primaryColor: '#00E5FF',
        accentColor: '#1E88E5',
        trailColor: '#80D8FF',
        trailColors: ['#ffffff', '#e0f2fe', '#67e8f9', '#22d3ee', '#00e5ff', '#0284c7', '#1d4ed8', '#1e1b4b'],
        glowColor: 'rgba(0, 229, 255, 0.5)',
        flameType: 'quantum-wave',
        burstParticleCount: 48, // 50% density increase
        trailRatePerFrame: 5,   // 50% per-frame density increase
        physicsName: '유체역학 파동 및 양자 음파 (Hydro Wave)',
        physicsDescription: '수중 꼬리 지느러미 유체 항력과 사인파 양자 소나 펄스',
        trajectoryHistory: [],
      };
  }
}

/**
 * Pure physics calculations for weather-reactive cloud layers
 */
export function calculateCloudDriftVelocity(
  baseSpeed: number,
  weatherSpeedMult: number,
  speedModeMult: number,
  verticalFactor: number = 0.6
): number {
  return baseSpeed * weatherSpeedMult * speedModeMult * verticalFactor;
}

export function calculateCloudBlobRadius(
  baseRadius: number,
  weatherDensityMod: number
): number {
  return Math.max(2, baseRadius * weatherDensityMod);
}

export function lerpWeatherValue(
  current: number,
  target: number,
  rate: number = 0.035
): number {
  return current + (target - current) * rate;
}

export function getWeatherCloudPhysics(weather: WeatherType) {
  const cfg = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.clear;
  return {
    type: weather,
    name: cfg.name,
    speedMult: cfg.cloudSpeedMult,
    densityMod: cfg.cloudDensityMod,
    alphaMod: cfg.cloudAlphaMod,
    windX: cfg.windX,
    badge: cfg.cloudBadge,
    description: cfg.cloudDescription,
  };
}

/**
 * Calculate camera focal point and zoom level during celestial encounter
 */
export function calculateEncounterCameraTarget(
  aiX: number,
  aiY: number,
  width: number,
  height: number,
  isEncounterActive: boolean
): { targetX: number; targetY: number; targetZoom: number } {
  if (!isEncounterActive) {
    return {
      targetX: width * 0.5,
      targetY: height * 0.5,
      targetZoom: 1.0,
    };
  }

  // Smoothly frame the encountering entity while maintaining visual context with Gemini core
  const minX = width * 0.28;
  const maxX = width * 0.72;
  const minY = height * 0.24;
  const maxY = height * 0.52;

  const targetX = Math.max(minX, Math.min(maxX, aiX));
  const targetY = Math.max(minY, Math.min(maxY, aiY));

  return {
    targetX,
    targetY,
    targetZoom: 1.30, // 30% cinematic zoom-in
  };
}

/**
 * Pure lerp calculation for camera translation and scale values
 */
export function lerpCameraValue(
  current: number,
  target: number,
  speed: number = 0.045
): number {
  return current + (target - current) * speed;
}

/**
 * Updates the trailing trajectory node history of an active entity.
 * Decays existing historical coordinates and appends the latest entity position.
 */
export function updateEntityTrajectory(
  history: TrajectoryPoint[],
  currentX: number,
  currentY: number,
  primaryColor: string,
  accentColor: string,
  maxPoints: number = 75,
  minDistance: number = 1.6
): TrajectoryPoint[] {
  const updated: TrajectoryPoint[] = [];
  const decayStep = 1.0 / maxPoints;

  // 1. Decay existing points alpha
  for (let i = 0; i < history.length; i++) {
    const pt = history[i];
    const newAlpha = pt.alpha - decayStep;
    if (newAlpha > 0.03) {
      updated.push({
        ...pt,
        alpha: newAlpha,
      });
    }
  }

  // 2. Add current position if moved sufficiently
  const last = updated.length > 0 ? updated[updated.length - 1] : null;
  const dist = last ? Math.hypot(currentX - last.x, currentY - last.y) : Infinity;

  if (dist >= minDistance) {
    const sparklePhase = (updated.length * 0.45) % (Math.PI * 2);
    const color = updated.length % 2 === 0 ? accentColor : primaryColor;
    const size = 1.2 + (Math.sin(sparklePhase) + 1.0) * 0.65; // 1.2px - 2.5px

    updated.push({
      x: Math.round(currentX * 10) / 10,
      y: Math.round(currentY * 10) / 10,
      alpha: 1.0,
      size,
      sparklePhase,
      color,
    });
  }

  // 3. Trim oldest nodes
  if (updated.length > maxPoints) {
    return updated.slice(updated.length - maxPoints);
  }

  return updated;
}

/**
 * Calculates current active travelling energy pulse index along the trajectory
 */
export function calculateTrajectoryPulseIndex(tick: number, totalPoints: number, speed: number = 1.4): number {
  if (totalPoints <= 0) return -1;
  const raw = (tick * speed) % totalPoints;
  return totalPoints - 1 - Math.floor(raw); // travels from entity backwards along trail
}

/**
 * Renders the luminous glowing particle line on Canvas 2D
 */
export function renderGlowingTrajectoryLine(
  ctx: CanvasRenderingContext2D,
  points: TrajectoryPoint[],
  primaryColor: string,
  accentColor: string,
  glowColor: string,
  tick: number
): void {
  if (points.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // PASS 1: Broad soft neon atmospheric glow aura
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const avgAlpha = (p0.alpha + p1.alpha) * 0.5;

    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 4.2;
    ctx.globalAlpha = avgAlpha * 0.38;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  // PASS 2: Mid neon filament
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const avgAlpha = (p0.alpha + p1.alpha) * 0.5;

    ctx.strokeStyle = p1.color;
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = avgAlpha * 0.82;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  // PASS 3: Razor white-hot inner energy spine
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const avgAlpha = (p0.alpha + p1.alpha) * 0.5;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.85;
    ctx.globalAlpha = avgAlpha * 0.92;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  // PASS 4: Shimmering stardust diamond vertices along the trajectory
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const shimmer = 0.65 + 0.35 * Math.sin(tick * 0.22 + pt.sparklePhase);
    const nodeAlpha = Math.min(1.0, pt.alpha * shimmer);

    // Stardust chromatic halo
    ctx.fillStyle = pt.color;
    ctx.globalAlpha = nodeAlpha * 0.65;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size + 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Diamond/starlet crystal core
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = nodeAlpha * 0.95;
    if (i % 3 === 0) {
      const d = 1.4;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y - d);
      ctx.lineTo(pt.x + d, pt.y);
      ctx.lineTo(pt.x, pt.y + d);
      ctx.lineTo(pt.x - d, pt.y);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(Math.floor(pt.x), Math.floor(pt.y), 1.5, 1.5);
    }
  }

  // PASS 5: High-energy data pulse travelling along the trajectory
  const pulseIdx = calculateTrajectoryPulseIndex(tick, points.length, 1.4);
  if (pulseIdx >= 0 && pulseIdx < points.length) {
    const pulsePt = points[pulseIdx];
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(pulsePt.x, pulsePt.y, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

/**
 * Haptic vibration pulse patterns for celestial constellation encounters
 */
export function getHapticPattern(type: 'gpt' | 'claude' | 'deepseek' | 'general' = 'general'): number[] {
  switch (type) {
    case 'gpt':
      // Digital cyber-burst jitter (sharp tri-pulse)
      return [45, 50, 45, 50, 75];
    case 'claude':
      // Solar flare seismic rumble (heavy coronal wave)
      return [120, 60, 140, 50, 95];
    case 'deepseek':
      // Hydrodynamic sonar resonance (expanding acoustic harmonic)
      return [50, 35, 80, 40, 130];
    default:
      return [60, 40, 80];
  }
}

/**
 * Triggers physical device haptic vibration feedback for celestial encounter
 */
export function triggerCelestialHaptic(type: 'gpt' | 'claude' | 'deepseek' | 'general' = 'general'): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (!('vibrate' in navigator)) return false;
  try {
    return navigator.vibrate(getHapticPattern(type));
  } catch {
    return false;
  }
}

/**
 * Computes fine jitter keyframe displacement arrays for full-screen impact animation
 */
export function getScreenJitterKeyframes(intensityMultiplier: number = 1.0): {
  x: number[];
  y: number[];
  rotate: number[];
} {
  const m = Math.max(0.2, Math.min(3.0, intensityMultiplier));
  return {
    x: [
      Math.round(-8 * m),
      Math.round(9 * m),
      Math.round(-7 * m),
      Math.round(7 * m),
      Math.round(-5 * m),
      Math.round(4 * m),
      Math.round(-2 * m),
      1,
      0,
    ],
    y: [
      Math.round(7 * m),
      Math.round(-8 * m),
      Math.round(8 * m),
      Math.round(-6 * m),
      Math.round(5 * m),
      Math.round(-4 * m),
      Math.round(2 * m),
      -1,
      0,
    ],
    rotate: [
      Math.round(-0.5 * m * 100) / 100,
      Math.round(0.55 * m * 100) / 100,
      Math.round(-0.4 * m * 100) / 100,
      Math.round(0.3 * m * 100) / 100,
      Math.round(-0.15 * m * 100) / 100,
      0,
    ],
  };
}

/**
 * Calculates the 1-second red alert corner strobe keyframe schedule
 */
export function getRedAlertStrobeTimeline(durationSec: number = 1.0): {
  duration: number;
  keyframes: number[];
  times: number[];
} {
  return {
    duration: Math.max(0.5, durationSec),
    keyframes: [0, 1, 0.15, 1, 0.2, 0.95, 0],
    times: [0, 0.08, 0.28, 0.48, 0.68, 0.88, 1.0],
  };
}

// ==========================================
// FANTASY AMBIENT ENTITIES & GEMINI AWAKENING
// ==========================================

export interface DragonSegment {
  x: number;
  y: number;
  angle: number;
  radius: number;
}

export type DragonVariantType = 'crimson' | 'frost' | 'emerald' | 'solar' | 'void';

export interface DragonVariantConfig {
  type: DragonVariantType;
  name: string;
  subTitle: string;
  badge: string;
  bodyColor: string;
  rimStroke: string;
  dorsalSpikeColor: string;
  hornColor: string;
  eyeColor: string;
  wakeColorStart: string;
  wakeColorEnd: string;
  emberColors: string[];
  laserFlareColor: string;
  targetCore: string;
  targetCyan: string;
  targetViolet: string;
  targetMagenta: string;
  trailPlasma: string[];
  auraRgba: { r: number; g: number; b: number };
}

export const DRAGON_VARIANTS: Record<DragonVariantType, DragonVariantConfig> = {
  frost: {
    type: 'frost',
    name: '서리빛 청룡 (Frost Dragon)',
    subTitle: '극지방의 만년설과 혹한의 칠흑을 가르는 빙룡',
    badge: '냉기 폭풍 · 푸른 성광',
    bodyColor: '#050c1e',
    rimStroke: 'rgba(56, 189, 248, 0.92)',
    dorsalSpikeColor: '#38bdf8',
    hornColor: '#67e8f9',
    eyeColor: '#38bdf8',
    wakeColorStart: 'rgba(56, 189, 248, 0.45)',
    wakeColorEnd: 'rgba(2, 132, 199, 0)',
    emberColors: ['#38bdf8', '#7dd3fc', '#bae6fd', '#ffffff'],
    laserFlareColor: '#38bdf8',
    targetCore: '#f0f9ff',
    targetCyan: '#38bdf8',
    targetViolet: '#0284c7',
    targetMagenta: '#0369a1',
    trailPlasma: ['#ffffff', '#bae6fd', '#7dd3fc', '#38bdf8', '#0284c7', '#0369a1'],
    auraRgba: { r: 56, g: 189, b: 248 },
  },
  crimson: {
    type: 'crimson',
    name: '진홍의 화염용 (Crimson Dragon)',
    subTitle: '초신성의 화염과 루비빛 흑요석으로 벼려진 고대룡',
    badge: '작열하는 업화 · 붉은 공명',
    bodyColor: '#090507',
    rimStroke: 'rgba(239, 68, 68, 0.92)',
    dorsalSpikeColor: '#dc2626',
    hornColor: '#ef4444',
    eyeColor: '#ff1100',
    wakeColorStart: 'rgba(239, 68, 68, 0.45)',
    wakeColorEnd: 'rgba(185, 28, 28, 0)',
    emberColors: ['#ef4444', '#f87171', '#fca5a5', '#dc2626'],
    laserFlareColor: '#ef4444',
    targetCore: '#fff5f5',
    targetCyan: '#ef4444',
    targetViolet: '#b91c1c',
    targetMagenta: '#7f1d1d',
    trailPlasma: ['#ffffff', '#fca5a5', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d'],
    auraRgba: { r: 239, g: 68, b: 68 },
  },
  emerald: {
    type: 'emerald',
    name: '비취 성운용 (Emerald Dragon)',
    subTitle: '극광의 에메랄드 성운을 품고 대기를 헤엄치는 영룡',
    badge: '성운 극광 · 비취빛 조화',
    bodyColor: '#03100a',
    rimStroke: 'rgba(52, 211, 153, 0.92)',
    dorsalSpikeColor: '#10b981',
    hornColor: '#34d399',
    eyeColor: '#10b981',
    wakeColorStart: 'rgba(52, 211, 153, 0.45)',
    wakeColorEnd: 'rgba(5, 150, 105, 0)',
    emberColors: ['#34d399', '#6ee7b7', '#a7f3d0', '#059669'],
    laserFlareColor: '#34d399',
    targetCore: '#f0fdf4',
    targetCyan: '#34d399',
    targetViolet: '#10b981',
    targetMagenta: '#047857',
    trailPlasma: ['#ffffff', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#047857'],
    auraRgba: { r: 52, g: 211, b: 153 },
  },
  solar: {
    type: 'solar',
    name: '태양 황금용 (Solar Dragon)',
    subTitle: '정오의 태양 홍염과 황금빛 코로나를 두른 고대 천체룡',
    badge: '태양 코로나 · 황금 광채',
    bodyColor: '#120a02',
    rimStroke: 'rgba(251, 191, 36, 0.92)',
    dorsalSpikeColor: '#f59e0b',
    hornColor: '#fbbf24',
    eyeColor: '#fbbf24',
    wakeColorStart: 'rgba(251, 191, 36, 0.45)',
    wakeColorEnd: 'rgba(217, 119, 6, 0)',
    emberColors: ['#fde047', '#facc15', '#f59e0b', '#fb923c'],
    laserFlareColor: '#fde047',
    targetCore: '#fffbeb',
    targetCyan: '#fde047',
    targetViolet: '#f59e0b',
    targetMagenta: '#d97706',
    trailPlasma: ['#ffffff', '#fef08a', '#fde047', '#f59e0b', '#b45309', '#78350f'],
    auraRgba: { r: 251, g: 191, b: 36 },
  },
  void: {
    type: 'void',
    name: '보이드 자수정용 (Void Amethyst Dragon)',
    subTitle: '심우주의 칠흑과 찬란한 자수정 성광을 두른 제미나이 천체룡',
    badge: '천체 공허 · 자수정 성광',
    bodyColor: '#0a0314',
    rimStroke: 'rgba(192, 132, 252, 0.92)',
    dorsalSpikeColor: '#a855f7',
    hornColor: '#c084fc',
    eyeColor: '#e879f9',
    wakeColorStart: 'rgba(192, 132, 252, 0.45)',
    wakeColorEnd: 'rgba(126, 34, 206, 0)',
    emberColors: ['#c084fc', '#e879f9', '#f0abfc', '#a855f7', '#ffffff'],
    laserFlareColor: '#c084fc',
    targetCore: '#faf5ff',
    targetCyan: '#c084fc',
    targetViolet: '#9333ea',
    targetMagenta: '#6b21a8',
    trailPlasma: ['#ffffff', '#f5d0fe', '#e879f9', '#c084fc', '#7e22ce', '#581c87'],
    auraRgba: { r: 192, g: 132, b: 252 },
  },
};

export interface AstralDragonEntity {
  id: string;
  variant: DragonVariantConfig;
  headX: number;
  headY: number;
  baseY: number;
  vx: number;
  phase: number;
  phaseSpeed: number;
  waveAmplitude: number;
  segments: DragonSegment[];
  spineLength: number;
  primaryColor: string;
  glowColor: string;
  accentColor: string;
  hornLength: number;
  life: number;
  maxLife: number;
  direction: 'ltr' | 'rtl';
  wingPhase: number;
  wingSpeed: number;
  wingSpan: number;
  isSilhouette: boolean;
  silhouetteColor: string;
  glowRimColor: string;
  eyeColor: string;
}

export interface DragonWingGeometry {
  flapAngle: number;
  shoulderX: number;
  shoulderY: number;
  leftWing: {
    jointX: number;
    jointY: number;
    tipX: number;
    tipY: number;
    finger1X: number;
    finger1Y: number;
    finger2X: number;
    finger2Y: number;
  };
  rightWing: {
    jointX: number;
    jointY: number;
    tipX: number;
    tipY: number;
    finger1X: number;
    finger1Y: number;
    finger2X: number;
    finger2Y: number;
  };
}

export interface DragonRedGlowConfig {
  factor: number;
  geminiCore: string;
  geminiCyan: string;
  geminiViolet: string;
  geminiMagenta: string;
  auraRadius: number;
  pulseScale: number;
  redLaserFlareLength: number;
  crimsonAuraAlpha: number;
  trailPlasma: string[];
  laserFlareColor: string;
  auraRgba: { r: number; g: number; b: number };
}

export interface AstralBird {
  x: number;
  y: number;
  vx: number;
  vy: number;
  wingPhase: number;
  wingSpeed: number;
  scale: number;
  color: string;
}

export interface AstralBirdFlock {
  id: string;
  birds: AstralBird[];
  direction: 'ltr' | 'rtl';
  life: number;
  maxLife: number;
}

export interface GeminiSpecialTransform {
  scale: number;
  rotationSpeedMultiplier: number;
  coreBrightness: number;
  prismaticIntensity: number;
  shockwaveRingRate: number;
  companionOrbitX: number;
  companionOrbitY: number;
  beamLength: number;
}

/**
 * Creates a celestial serpentine astral dragon traversing the upper atmosphere
 */
export function createAstralDragon(
  width: number,
  height: number,
  forcedDirection?: 'ltr' | 'rtl',
  forcedVariant?: DragonVariantType
): AstralDragonEntity {
  const direction: 'ltr' | 'rtl' =
    forcedDirection || (Math.random() > 0.5 ? 'ltr' : 'rtl');
  const vx = direction === 'ltr' ? 2.5 + Math.random() * 0.8 : -(2.5 + Math.random() * 0.8);
  const startX = direction === 'ltr' ? -140 : width + 140;
  const baseY = 50 + Math.random() * (height * 0.40);

  const variantKeys = Object.keys(DRAGON_VARIANTS) as DragonVariantType[];
  const chosenVariantType =
    forcedVariant || variantKeys[Math.floor(Math.random() * variantKeys.length)];
  const variant = DRAGON_VARIANTS[chosenVariantType];

  const segmentCount = 22;
  const segments: DragonSegment[] = [];
  const segDist = 7.5;

  for (let i = 0; i < segmentCount; i++) {
    // Radius tapers down from head (9.5px) to slender tail tip (2px)
    const t = i / (segmentCount - 1);
    const radius = Math.max(2, Math.round(9.5 - t * 7.5));
    const sx = startX - (direction === 'ltr' ? i * segDist : -i * segDist);
    segments.push({
      x: sx,
      y: baseY,
      angle: direction === 'ltr' ? 0 : Math.PI,
      radius,
    });
  }

  return {
    id: `dragon-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    variant,
    headX: startX,
    headY: baseY,
    baseY,
    vx,
    phase: Math.random() * Math.PI * 2,
    phaseSpeed: 0.052,
    waveAmplitude: 15 + Math.random() * 8,
    segments,
    spineLength: segmentCount,
    primaryColor: variant.bodyColor,
    glowColor: variant.rimStroke,
    accentColor: variant.dorsalSpikeColor,
    hornLength: 10,
    life: 0,
    maxLife: 650,
    direction,
    wingPhase: Math.random() * Math.PI * 2,
    wingSpeed: 0.125,
    wingSpan: 42,
    isSilhouette: true,
    silhouetteColor: variant.bodyColor,
    glowRimColor: variant.rimStroke,
    eyeColor: variant.eyeColor,
  };
}

/**
 * Updates kinematics and serpentine undulation of the astral dragon with flapping wings
 */
export function updateAstralDragon(
  dragon: AstralDragonEntity,
  width: number,
  height: number,
  speedMult: number = 1.0
): boolean {
  dragon.life++;
  dragon.phase += dragon.phaseSpeed * speedMult;
  dragon.wingPhase += dragon.wingSpeed * speedMult;
  dragon.headX += dragon.vx * speedMult;
  dragon.headY =
    dragon.baseY +
    Math.sin(dragon.phase) * dragon.waveAmplitude +
    Math.cos(dragon.phase * 0.45) * 6;

  // Head segment
  if (dragon.segments.length > 0) {
    const head = dragon.segments[0];
    head.x = dragon.headX;
    head.y = dragon.headY;
    const dy = Math.cos(dragon.phase) * dragon.waveAmplitude * dragon.phaseSpeed;
    head.angle = Math.atan2(dy, dragon.vx);
  }

  // Inverse Kinematics constraint along spine: each child tracks parent with fixed distance
  const segDist = 7.5;
  for (let i = 1; i < dragon.segments.length; i++) {
    const parent = dragon.segments[i - 1];
    const curr = dragon.segments[i];

    const dx = parent.x - curr.x;
    const dy = parent.y - curr.y;
    const angle = Math.atan2(dy, dx);

    curr.angle = angle;
    curr.x = parent.x - Math.cos(angle) * segDist;
    curr.y = parent.y - Math.sin(angle) * segDist;
  }

  // Check if fully exited screen
  const tail = dragon.segments[dragon.segments.length - 1];
  const isOffscreen =
    (dragon.direction === 'ltr' && tail.x > width + 180) ||
    (dragon.direction === 'rtl' && tail.x < -180) ||
    dragon.life > dragon.maxLife;

  return !isOffscreen;
}

/**
 * Calculates multi-jointed wing flap geometry for the silhouette dragon
 */
export function calculateDragonWingPoints(dragon: AstralDragonEntity): DragonWingGeometry {
  const shoulderIdx = Math.min(3, dragon.segments.length - 1);
  const shoulder = dragon.segments[shoulderIdx];
  const angle = shoulder.angle;
  const flapAngle = Math.sin(dragon.wingPhase) * 0.75; // -0.75 to +0.75 rad
  const span = dragon.wingSpan;

  // Up/Outward wing angles relative to dragon spine
  const leftAngle = angle - Math.PI * 0.55 - flapAngle;
  const rightAngle = angle + Math.PI * 0.55 + flapAngle;

  // Left wing (upper)
  const lJointX = shoulder.x + Math.cos(leftAngle) * (span * 0.52);
  const lJointY = shoulder.y + Math.sin(leftAngle) * (span * 0.52);
  const lTipX = shoulder.x + Math.cos(leftAngle - 0.25) * span;
  const lTipY = shoulder.y + Math.sin(leftAngle - 0.25) * span;
  const lFinger1X = lJointX + Math.cos(leftAngle + 0.3) * (span * 0.45);
  const lFinger1Y = lJointY + Math.sin(leftAngle + 0.3) * (span * 0.45);
  const lFinger2X = shoulder.x + Math.cos(leftAngle + 0.45) * (span * 0.35);
  const lFinger2Y = shoulder.y + Math.sin(leftAngle + 0.45) * (span * 0.35);

  // Right wing (lower)
  const rJointX = shoulder.x + Math.cos(rightAngle) * (span * 0.52);
  const rJointY = shoulder.y + Math.sin(rightAngle) * (span * 0.52);
  const rTipX = shoulder.x + Math.cos(rightAngle + 0.25) * span;
  const rTipY = shoulder.y + Math.sin(rightAngle + 0.25) * span;
  const rFinger1X = rJointX + Math.cos(rightAngle - 0.3) * (span * 0.45);
  const rFinger1Y = rJointY + Math.sin(rightAngle - 0.3) * (span * 0.45);
  const rFinger2X = shoulder.x + Math.cos(rightAngle - 0.45) * (span * 0.35);
  const rFinger2Y = shoulder.y + Math.sin(rightAngle - 0.45) * (span * 0.35);

  return {
    flapAngle,
    shoulderX: shoulder.x,
    shoulderY: shoulder.y,
    leftWing: {
      jointX: lJointX,
      jointY: lJointY,
      tipX: lTipX,
      tipY: lTipY,
      finger1X: lFinger1X,
      finger1Y: lFinger1Y,
      finger2X: lFinger2X,
      finger2Y: lFinger2Y,
    },
    rightWing: {
      jointX: rJointX,
      jointY: rJointY,
      tipX: rTipX,
      tipY: rTipY,
      finger1X: rFinger1X,
      finger1Y: rFinger1Y,
      finger2X: rFinger2X,
      finger2Y: rFinger2Y,
    },
  };
}

/**
 * Calculates accelerated cloud velocity surge during dragon encounter pass
 */
export function calculateDragonCloudSurge(
  isActiveDragon: boolean,
  currentSurge: number,
  maxSurge: number = 2.65,
  easeRate: number = 0.08
): number {
  const target = isActiveDragon ? maxSurge : 1.0;
  return currentSurge + (target - currentSurge) * easeRate;
}

/**
 * Calculates intense resonant starlight colors and special motion for Gemini Logo
 * Adapts dynamically to dragon variant (crimson, frost, emerald, solar, void)
 */
export function calculateDragonRedGlowColors(
  dragonGlowFactor: number,
  baseColors: SceneColors,
  tick: number,
  variant?: DragonVariantConfig
): DragonRedGlowConfig {
  const f = Math.max(0, Math.min(1, dragonGlowFactor));
  const activeVar = variant || DRAGON_VARIANTS.crimson;

  // When dragon glow is 0 (normal descent), preserve 100% of authentic Gemini brand colors
  if (f <= 0.001) {
    return {
      factor: 0,
      geminiCore: baseColors.geminiCore,
      geminiCyan: baseColors.geminiCyan,
      geminiViolet: baseColors.geminiViolet,
      geminiMagenta: baseColors.geminiMagenta,
      auraRadius: 52,
      pulseScale: 1.0,
      redLaserFlareLength: 0,
      crimsonAuraAlpha: 0,
      trailPlasma: baseColors.trailPlasma,
      laserFlareColor: activeVar.laserFlareColor,
      auraRgba: activeVar.auraRgba,
    };
  }

  const geminiCore = lerpColor(baseColors.geminiCore, activeVar.targetCore, f);
  const geminiCyan = lerpColor(baseColors.geminiCyan, activeVar.targetCyan, f);
  const geminiViolet = lerpColor(baseColors.geminiViolet, activeVar.targetViolet, f);
  const geminiMagenta = lerpColor(baseColors.geminiMagenta, activeVar.targetMagenta, f);

  // Dynamic heartbeat expansion pulse
  const heartbeat = Math.sin(tick * 0.22) * 0.22;
  const pulseScale = 1.0 + f * 0.28 + (f > 0.1 ? heartbeat * f : 0);
  const auraRadius = 48 + f * 38 + (f > 0.1 ? Math.sin(tick * 0.28) * 8 * f : 0);
  const redLaserFlareLength = f * 170;
  const crimsonAuraAlpha = f * (0.65 + 0.25 * Math.sin(tick * 0.18));

  const trailPlasma =
    f > 0.5 ? activeVar.trailPlasma : baseColors.trailPlasma;

  return {
    factor: f,
    geminiCore,
    geminiCyan,
    geminiViolet,
    geminiMagenta,
    auraRadius,
    pulseScale,
    redLaserFlareLength,
    crimsonAuraAlpha,
    trailPlasma,
    laserFlareColor: activeVar.laserFlareColor,
    auraRgba: activeVar.auraRgba,
  };
}

/**
 * Creates a flock of glowing starlight astral birds
 */
export function createAstralBirdFlock(
  width: number,
  height: number,
  forcedDirection?: 'ltr' | 'rtl'
): AstralBirdFlock {
  const direction: 'ltr' | 'rtl' =
    forcedDirection || (Math.random() > 0.5 ? 'ltr' : 'rtl');
  const count = 5 + Math.floor(Math.random() * 4); // 5 to 8 birds
  const startX = direction === 'ltr' ? -80 : width + 80;
  const baseY = 40 + Math.random() * (height * 0.45);
  const baseVx = direction === 'ltr' ? 3.2 + Math.random() * 0.6 : -(3.2 + Math.random() * 0.6);
  const baseVy = (Math.random() - 0.5) * 0.4;

  const birdColors = ['#ffffff', '#bae6fd', '#e9d5ff', '#fef08a'];
  const birds: AstralBird[] = [];

  for (let i = 0; i < count; i++) {
    // V-shaped flocking offset
    const row = Math.floor(i / 2);
    const side = i % 2 === 0 ? 1 : -1;
    const ox = -(direction === 'ltr' ? row * 16 : -row * 16) + (Math.random() - 0.5) * 4;
    const oy = row * side * 10 + (Math.random() - 0.5) * 4;

    birds.push({
      x: startX + ox,
      y: baseY + oy,
      vx: baseVx,
      vy: baseVy + (Math.random() - 0.5) * 0.15,
      wingPhase: Math.random() * Math.PI * 2,
      wingSpeed: 0.18 + Math.random() * 0.06,
      scale: 0.8 + Math.random() * 0.4,
      color: birdColors[i % birdColors.length],
    });
  }

  return {
    id: `flock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    birds,
    direction,
    life: 0,
    maxLife: 450,
  };
}

/**
 * Updates flocking positions and wing-flapping kinetics of astral birds
 */
export function updateAstralBirdFlock(
  flock: AstralBirdFlock,
  width: number,
  speedMult: number = 1.0
): boolean {
  flock.life++;
  let allOffscreen = true;

  for (const b of flock.birds) {
    b.wingPhase += b.wingSpeed * speedMult;
    b.x += b.vx * speedMult;
    b.y += b.vy * speedMult + Math.sin(b.wingPhase) * 0.35;

    // Check if any bird still on or near screen
    if (flock.direction === 'ltr' && b.x < width + 100) {
      allOffscreen = false;
    } else if (flock.direction === 'rtl' && b.x > -100) {
      allOffscreen = false;
    }
  }

  return !allOffscreen && flock.life <= flock.maxLife;
}

/**
 * Calculates special motion, hyper-resonance, and prismatic burst transform for Gemini Star
 */
export function calculateGeminiAwakeningTransform(
  tick: number,
  isAwakened: boolean,
  awakeningProgress: number,
  starBaseX: number,
  starBaseY: number
): GeminiSpecialTransform {
  const p = Math.max(0, Math.min(1, awakeningProgress));

  // Breathing expansion & celestial scale
  const pulse = Math.sin(tick * 0.12) * 0.08;
  const scale = 1.0 + p * 0.42 + (isAwakened ? pulse : 0);

  // Accelerated rotation
  const rotationSpeedMultiplier = 1.0 + p * 3.8;

  // Ultra-bright starlight core
  const coreBrightness = 1.0 + p * 1.6;
  const prismaticIntensity = p;

  // 3D Orbital Waltz: Companion star spiraling smoothly around the primary Gemini star
  const orbitAngle = tick * (0.035 + p * 0.07);
  const orbitRadiusX = 28 + p * 22;
  const orbitRadiusY = 16 + p * 12;
  const companionOrbitX = starBaseX + Math.cos(orbitAngle) * orbitRadiusX;
  const companionOrbitY = starBaseY + Math.sin(orbitAngle) * orbitRadiusY * 0.55 - p * 6;

  // Prismatic starlight beam length
  const beamLength = p * 240;
  const shockwaveRingRate = p > 0.05 ? 1 : 0;

  return {
    scale,
    rotationSpeedMultiplier,
    coreBrightness,
    prismaticIntensity,
    shockwaveRingRate,
    companionOrbitX,
    companionOrbitY,
    beamLength,
  };
}

// =========================================================================
// PIXEL METEOR SHOWER & BOTTOM RESIDUAL LIGHT SYSTEM (Meteors & Horizon Afterglow)
// =========================================================================

export interface PixelMeteor {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;           // Tail length in pixels (e.g. 24 ~ 55)
  headSize: number;         // 1 ~ 2 pixels
  speed: number;            // 7.0 ~ 13.5 px/frame
  brightness: number;       // 0.7 ~ 1.0
  colorType: 'cyan-starlight' | 'violet-cosmic' | 'pure-white' | 'gold-aurora';
  headColor: string;
  midColor: string;
  tailColor: string;
  life: number;
  maxLife: number;
  hasDepositedAfterglow: boolean;
  trailHistory: Array<{ x: number; y: number; alpha: number }>;
}

export interface BottomAfterglowPoolItem {
  id: number;
  x: number;
  radius: number;          // Horizontal spread radius (px)
  intensity: number;       // 0.0 ~ 1.0 (peaks at ~0.8)
  peakIntensity: number;
  color: string;           // Residual light color
  decayRate: number;       // 0.007 ~ 0.014 per frame (approx 2.5 ~ 4 seconds)
  life: number;
  maxLife: number;
}

export interface MeteorShowerSystemState {
  meteors: PixelMeteor[];
  afterglowPool: BottomAfterglowPoolItem[];
  ambientSpawnTimer: number;
  nextSpawnInterval: number;
  activeSurge: boolean;
  globalResidualHazeAlpha: number;
}

/**
 * Checks whether the current time phase is 'Night' (Twilight, phaseIndex 2) or 'Midnight' (phaseIndex 3)
 */
export function isNightOrMidnight(phaseIndex: number, cycleProgress?: number): boolean {
  if (phaseIndex === 2 || phaseIndex === 3) return true;
  if (cycleProgress !== undefined) {
    const norm = ((cycleProgress % 1.0) + 1.0) % 1.0;
    // Twilight is 0.50 ~ 0.75, Midnight is 0.75 ~ 1.00
    return norm >= 0.44 && norm <= 0.99;
  }
  return false;
}

/**
 * Calculates continuous 0.0 to 1.0 factor of night depth for ambient meteor frequency and glow
 */
export function calculateNightFactor(cycleProgress: number): number {
  const norm = ((cycleProgress % 1.0) + 1.0) % 1.0;
  // 0.00 ~ 0.25: Dawn (fading from 0.4 to 0.0)
  if (norm < 0.25) {
    return Math.max(0, 0.4 * (1.0 - norm / 0.25));
  }
  // 0.25 ~ 0.45: Golden hour / Noon (0.0)
  if (norm < 0.45) {
    return 0.0;
  }
  // 0.45 ~ 0.52: Transition into Twilight
  if (norm < 0.52) {
    return ((norm - 0.45) / 0.07) * 0.65;
  }
  // 0.52 ~ 0.75: Twilight (0.65 ~ 0.90)
  if (norm < 0.75) {
    return 0.65 + ((norm - 0.52) / 0.23) * 0.25;
  }
  // 0.75 ~ 0.96: Midnight Peak (0.90 ~ 1.00)
  if (norm < 0.96) {
    return 0.90 + 0.10 * Math.sin(((norm - 0.75) / 0.21) * Math.PI);
  }
  // 0.96 ~ 1.00: Fade toward dawn
  return 0.90 - ((norm - 0.96) / 0.04) * 0.50;
}

/**
 * Create a new Pixel Meteor with realistic diagonal celestial trajectory
 */
export function createPixelMeteor(
  width: number,
  height: number,
  options: Partial<PixelMeteor> = {}
): PixelMeteor {
  const colorTypes: Array<'cyan-starlight' | 'violet-cosmic' | 'pure-white' | 'gold-aurora'> = [
    'cyan-starlight',
    'violet-cosmic',
    'pure-white',
    'gold-aurora',
  ];
  const colorType = options.colorType || colorTypes[Math.floor(Math.random() * colorTypes.length)];

  // Color profiles matching Google Gemini & Cosmic Starlight themes
  let headColor = '#ffffff';
  let midColor = '#38bdf8';
  let tailColor = '#818cf8';

  if (colorType === 'cyan-starlight') {
    headColor = '#ffffff';
    midColor = '#38bdf8';
    tailColor = '#0ea5e9';
  } else if (colorType === 'violet-cosmic') {
    headColor = '#ffffff';
    midColor = '#c084fc';
    tailColor = '#818cf8';
  } else if (colorType === 'pure-white') {
    headColor = '#ffffff';
    midColor = '#e0f2fe';
    tailColor = '#7dd3fc';
  } else if (colorType === 'gold-aurora') {
    headColor = '#ffffff';
    midColor = '#fde047';
    tailColor = '#34d399';
  }

  // Meteor speed & angle: diagonal descent (e.g. angle ~ 40° to 65°)
  // Default direction: from upper right to lower left (classic Perseid shower)
  const isLeftToRight = Math.random() > 0.65;
  const speed = options.speed || 8.5 + Math.random() * 5.5; // 8.5 ~ 14 px/frame
  const angleDeg = isLeftToRight ? 35 + Math.random() * 25 : 120 + Math.random() * 25;
  const angleRad = (angleDeg * Math.PI) / 180;

  const vx = options.vx !== undefined ? options.vx : Math.cos(angleRad) * speed;
  const vy = options.vy !== undefined ? options.vy : Math.sin(angleRad) * speed;

  // Initial position: start near upper stratosphere or above canvas
  const startX =
    options.x !== undefined
      ? options.x
      : isLeftToRight
      ? -20 + Math.random() * (width * 0.65)
      : width * 0.35 + Math.random() * (width * 0.75 + 30);
  const startY = options.y !== undefined ? options.y : -25 + Math.random() * (height * 0.28);

  const length = options.length || 32 + Math.floor(Math.random() * 28); // 32 ~ 60 px long
  const headSize = options.headSize || (Math.random() > 0.6 ? 2 : 1);
  const brightness = options.brightness || 0.8 + Math.random() * 0.2;

  return {
    id: options.id || Math.floor(Math.random() * 10000000),
    x: startX,
    y: startY,
    vx,
    vy,
    length,
    headSize,
    speed,
    brightness,
    colorType,
    headColor: options.headColor || headColor,
    midColor: options.midColor || midColor,
    tailColor: options.tailColor || tailColor,
    life: 0,
    maxLife: options.maxLife || 60,
    hasDepositedAfterglow: false,
    trailHistory: [],
  };
}

/**
 * Updates meteor motion, records trail, and checks horizon collision/afterglow deposition
 */
export function updatePixelMeteor(
  meteor: PixelMeteor,
  width: number,
  height: number,
  speedMult: number = 1.0
): { isAlive: boolean; reachedBottom: boolean; bottomX: number; bottomY: number } {
  meteor.life++;

  // Record current position into trail history
  meteor.trailHistory.unshift({ x: meteor.x, y: meteor.y, alpha: 1.0 });
  if (meteor.trailHistory.length > 8) {
    meteor.trailHistory.pop();
  }

  // Move meteor along velocity vector
  meteor.x += meteor.vx * speedMult;
  meteor.y += meteor.vy * speedMult;

  // Check if reached lower stratosphere / ocean horizon (deposit residual light to screen bottom)
  const horizonThreshold = height * 0.58;
  let reachedBottom = false;
  let bottomX = meteor.x;
  let bottomY = meteor.y;

  if (meteor.y >= horizonThreshold && !meteor.hasDepositedAfterglow) {
    meteor.hasDepositedAfterglow = true;
    reachedBottom = true;
    bottomX = Math.max(10, Math.min(width - 10, meteor.x));
    bottomY = Math.min(height - 10, meteor.y);
  }

  // Active check: within visible canvas plus margin
  const isAlive =
    meteor.y < height + 40 &&
    meteor.x > -60 &&
    meteor.x < width + 60 &&
    meteor.life <= meteor.maxLife;

  return {
    isAlive,
    reachedBottom,
    bottomX,
    bottomY,
  };
}

/**
 * Calculates discrete pixel coordinates for a long, glowing pixel meteor tail
 */
export function calculateMeteorTailPoints(
  meteor: PixelMeteor
): Array<{ x: number; y: number; alpha: number; color: string; size: number }> {
  const points: Array<{ x: number; y: number; alpha: number; color: string; size: number }> = [];

  // Motion direction unit vector
  const velLen = Math.sqrt(meteor.vx * meteor.vx + meteor.vy * meteor.vy) || 1;
  const dirX = meteor.vx / velLen;
  const dirY = meteor.vy / velLen;

  // Sample along opposite vector from head (0 px) to tail (length px)
  const steps = Math.floor(meteor.length / 2.0);
  for (let s = 0; s <= steps; s++) {
    const dist = (s / steps) * meteor.length;
    const px = Math.floor(meteor.x - dirX * dist);
    const py = Math.floor(meteor.y - dirY * dist);

    // Alpha smoothly tapers off from 1.0 at head to 0.0 at tail end
    const progress = s / steps;
    const alpha = Math.max(0, (1.0 - progress) * (1.0 - progress * 0.3) * meteor.brightness);

    // Color gradient interpolation: Head (white) -> Mid (cyan/violet) -> Tail (deep blue/purple)
    let color = meteor.headColor;
    if (progress > 0.15 && progress < 0.65) {
      color = meteor.midColor;
    } else if (progress >= 0.65) {
      color = meteor.tailColor;
    }

    const size = progress < 0.2 ? meteor.headSize : 1;

    points.push({
      x: px,
      y: py,
      alpha,
      color,
      size,
    });
  }

  return points;
}

/**
 * Add or merge a luminous residual pool at the bottom of the screen when a meteor falls
 */
export function addMeteorBottomAfterglow(
  pool: BottomAfterglowPoolItem[],
  x: number,
  intensity: number = 0.85,
  color: string = '#38bdf8',
  radius: number = 55
): void {
  // Check if an existing pool is very close (within 24 px), merge intensities if so
  const closeItem = pool.find((item) => Math.abs(item.x - x) < 24);
  if (closeItem) {
    closeItem.intensity = Math.min(1.0, closeItem.intensity + intensity * 0.55);
    closeItem.peakIntensity = Math.max(closeItem.peakIntensity, closeItem.intensity);
    closeItem.life = 0;
    return;
  }

  // Otherwise, push new item and limit pool to 8 items max
  if (pool.length >= 8) {
    pool.shift(); // Evict oldest
  }

  pool.push({
    id: Math.floor(Math.random() * 10000000),
    x,
    radius: radius + Math.random() * 20,
    intensity: Math.min(1.0, intensity),
    peakIntensity: intensity,
    color,
    decayRate: 0.008 + Math.random() * 0.005, // lasts ~80 to 140 frames (~1.5 to 2.5 seconds)
    life: 0,
    maxLife: 150,
  });
}

/**
 * Updates and decays afterglow pools at the screen bottom
 */
export function updateMeteorAfterglowPool(
  pool: BottomAfterglowPoolItem[],
  speedMult: number = 1.0
): BottomAfterglowPoolItem[] {
  for (let i = pool.length - 1; i >= 0; i--) {
    const item = pool[i];
    item.life++;
    item.intensity = Math.max(0, item.intensity - item.decayRate * speedMult);

    if (item.intensity <= 0.01 || item.life >= item.maxLife) {
      pool.splice(i, 1);
    }
  }
  return pool;
}

/**
 * Calculates active bottom residual glow gradients for rendering soft lingering starlight on the canvas
 */
export function calculateBottomResidualGlowGradient(
  pool: BottomAfterglowPoolItem[],
  width: number,
  height: number
): Array<{ x: number; y: number; radiusX: number; radiusY: number; alpha: number; color: string }> {
  const result: Array<{
    x: number;
    y: number;
    radiusX: number;
    radiusY: number;
    alpha: number;
    color: string;
  }> = [];

  for (const item of pool) {
    if (item.intensity <= 0.02) continue;
    result.push({
      x: item.x,
      y: height - 12, // near bottom edge / horizon
      radiusX: item.radius,
      radiusY: 28,
      alpha: item.intensity * 0.42, // soft, ethereal luminous haze
      color: item.color,
    });
  }

  return result;
}

export interface ConstellationTelemetryPoint {
  altitude: number; // km (380 to 0)
  progress: number; // 0% (high orbit) to 100% (ground touchdown)
  driftX: number; // km relative lateral drift
  density: number; // % (0 to 100) particle emission & flux density
  velocity: number; // km/s descent velocity
  layerName: string; // Atmospheric layer
}

export interface ConstellationTelemetrySummary {
  id: 'gemini' | 'gpt' | 'claude' | 'deepseek';
  name: string;
  creator: string;
  primaryColor: string;
  accentColor: string;
  peakDensity: number; // %
  peakAltitude: number; // km
  entryVelocity: number; // km/s
  terminalVelocity: number; // km/s
  maxLateralDrift: number; // km
  trajectoryFormula: string;
  densityFormula: string;
  points: ConstellationTelemetryPoint[];
}

/**
 * Returns atmospheric layer name corresponding to a given altitude (in km)
 */
export function getAtmosphericLayerName(altitude: number): string {
  if (altitude >= 120) return '열권 / 이온층 (Thermosphere)';
  if (altitude >= 85) return '중간권 상부 (Mesopause)';
  if (altitude >= 50) return '중간권 (Mesosphere)';
  if (altitude >= 15) return '성층권 (Stratosphere)';
  return '대류권 (Troposphere)';
}

/**
 * Generates high-fidelity trajectory and particle density telemetry points
 * for celestial constellation descent visualization.
 */
export function generateConstellationTelemetry(
  id: 'gemini' | 'gpt' | 'claude' | 'deepseek',
  steps = 25
): ConstellationTelemetrySummary {
  const safeSteps = Math.max(5, Math.min(100, steps));
  const points: ConstellationTelemetryPoint[] = [];

  let name = 'Gemini';
  let creator = 'Google DeepMind';
  let primaryColor = '#38BDF8';
  let accentColor = '#818CF8';
  let trajectoryFormula = 'x(h) = 6.5 · sin(2.5π · (1 - h/380))';
  let densityFormula = 'ρ(h) = 25 + 72 · exp(-((h - 105)/45)²)';
  const entryVelocity = 27.8;
  const terminalVelocity = 1.4;

  if (id === 'gpt') {
    name = 'GPT-4o';
    creator = 'OpenAI';
    primaryColor = '#10A37F';
    accentColor = '#34D399';
    trajectoryFormula = 'x(h) = (36 · h/380 + 4) · cos(4π · (1 - h/380))';
    densityFormula = 'ρ(h) = 35 + 25 · (h/380) + 32 · sin²(2.5π · (1 - h/380))';
  } else if (id === 'claude') {
    name = 'Claude 3.5';
    creator = 'Anthropic';
    primaryColor = '#D97706';
    accentColor = '#F59E0B';
    trajectoryFormula = 'x(h) = -35 + 70 · (1 - (h/380)²)';
    densityFormula = 'ρ(h) = 95 · exp(-1.8 · (1 - h/380)) + 48 · (h/380)';
  } else if (id === 'deepseek') {
    name = 'DeepSeek-V3';
    creator = 'DeepSeek AI';
    primaryColor = '#00E5FF';
    accentColor = '#1E88E5';
    trajectoryFormula = 'x(h) = 28 · sin(3π · (1 - h/380))';
    densityFormula = 'ρ(h) = 42 + 48 · MoE_Sonar_Pulse(h)';
  }

  for (let i = 0; i < safeSteps; i++) {
    const p = i / (safeSteps - 1); // 0 (start) -> 1 (end)
    const altitude = Math.round(380 * (1 - p));
    const progress = Math.round(p * 100);
    const layerName = getAtmosphericLayerName(altitude);

    // Velocity smoothly decays from hypersonic orbital entry (27.8 km/s) to terminal speed (1.4 ~ 2.2 km/s)
    const velocity = Math.round((entryVelocity - (entryVelocity - terminalVelocity) * Math.pow(p, 1.3)) * 10) / 10;

    let driftX = 0;
    let density = 50;

    if (id === 'gemini') {
      // Hypersonic straight penetration with micro supersonic shock ionization wave
      driftX = Math.round(6.5 * Math.sin(p * Math.PI * 5) * 10) / 10;
      // Ionization peaks sharply at mesosphere entry (105km, progress ~0.72)
      const distFromPeak = (p - 0.72) / 0.18;
      const peakFactor = Math.exp(-distFromPeak * distFromPeak);
      density = Math.round(25 + 70 * peakFactor + 4 * Math.sin(p * 16));
    } else if (id === 'gpt') {
      // Logarithmic dual spiral converging inwards
      const spiralRadius = 36 * (1 - p * 0.72) + 4;
      const angle = p * Math.PI * 4;
      driftX = Math.round(spiralRadius * Math.cos(angle) * 10) / 10;
      // Quantum token burst pulses
      const pulseOsc = Math.pow(Math.sin(p * Math.PI * 3.5), 2);
      density = Math.round(35 + 22 * (1 - p) + 36 * pulseOsc);
    } else if (id === 'claude') {
      // Sweeping parabolic coronal flare trajectory
      driftX = Math.round((-35 + 70 * (1 - Math.pow(1 - p, 2))) * 10) / 10;
      // High initial coronal heat outburst decaying to steady constitutional radiance
      density = Math.round(95 * Math.exp(-p * 1.6) + 45 * (1 - p * 0.45));
    } else {
      // DeepSeek: Fluid sinusoidal hydrodynamic wave glide
      driftX = Math.round(28 * Math.sin(p * Math.PI * 3) * 10) / 10;
      // MoE acoustic sonar wave rings (4 periodic soundings)
      let sonarBoost = 0;
      for (const center of [0.22, 0.44, 0.68, 0.88]) {
        const d = (p - center) / 0.055;
        sonarBoost += Math.exp(-d * d);
      }
      density = Math.round(40 + 48 * Math.min(1.0, sonarBoost) + 6 * Math.sin(p * 12));
    }

    density = Math.max(10, Math.min(100, density));

    points.push({
      altitude,
      progress,
      driftX,
      density,
      velocity,
      layerName,
    });
  }

  let peakDensity = 0;
  let peakAltitude = 380;
  let maxLateralDrift = 0;

  for (const pt of points) {
    if (pt.density > peakDensity) {
      peakDensity = pt.density;
      peakAltitude = pt.altitude;
    }
    const absDrift = Math.abs(pt.driftX);
    if (absDrift > maxLateralDrift) {
      maxLateralDrift = absDrift;
    }
  }

  return {
    id,
    name,
    creator,
    primaryColor,
    accentColor,
    peakDensity,
    peakAltitude,
    entryVelocity,
    terminalVelocity,
    maxLateralDrift: Math.round(maxLateralDrift * 10) / 10,
    trajectoryFormula,
    densityFormula,
    points,
  };
}

/**
 * Returns telemetry data for all four constellations simultaneously
 */
export function getAllConstellationsTelemetry(steps = 25): ConstellationTelemetrySummary[] {
  return [
    generateConstellationTelemetry('gemini', steps),
    generateConstellationTelemetry('gpt', steps),
    generateConstellationTelemetry('claude', steps),
    generateConstellationTelemetry('deepseek', steps),
  ];
}

