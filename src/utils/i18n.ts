/**
 * Multi-Language i18n Engine for Pixel Descent
 * Supports English ('en') and Korean ('ko') with complete UI copy,
 * telemetry badges, control instructions, and audio radio titles.
 */

export type SupportedLanguage = 'en' | 'ko';

export const STORAGE_LANG_KEY = 'pixel_descent_lang_v1';

export interface TranslationDictionary {
  // Navigation & Header
  appTitle: string;
  appSubtitle: string;
  altitudeKm: string;
  descentActive: string;
  paused: string;
  settings: string;
  recorder: string;
  viewpoints: string;
  starChart: string;
  blackHole: string;
  rings: string;
  radio: string;
  gliderMode: string;
  flightLog: string;

  // Flight Layers
  layerExosphere: string;
  layerThermosphere: string;
  layerMesosphere: string;
  layerStratosphere: string;
  layerTroposphere: string;
  layerOceanImpact: string;

  // Telemetry HUD
  velocityMach: string;
  surfaceTemp: string;
  atmosphericPressure: string;
  plasmaShield: string;
  descentProgress: string;
  descentRate: string;

  // Rings & Arcade
  ringScore: string;
  ringCombo: string;
  perfectClear: string;
  targetAltitude: string;
  timeRemaining: string;

  // Glider
  gliderControls: string;
  bankAngle: string;
  thrusterBoost: string;
  windDrift: string;

  // Settings Modal
  settingsTitle: string;
  languageSelect: string;
  particleBudget: string;
  budgetUltra: string;
  budgetBalanced: string;
  budgetLow: string;
  adaptiveQuality: string;
  adaptiveQualityDesc: string;
  bloomGlow: string;
  audioMasterVolume: string;
  audioMuted: string;
  retroScanlines: string;
  saveAndClose: string;
  resetDefaults: string;

  // Blackbox Backup & Restore
  blackboxTitle: string;
  totalKmTraveled: string;
  ringsCollectedStat: string;
  highestScoreStat: string;
  flightSessionsCount: string;
  exportBackup: string;
  importBackup: string;
  backupExportSuccess: string;
  backupImportSuccess: string;
  backupImportError: string;

  // Recording
  startRecording: string;
  stopRecording: string;
  recordingInProgress: string;
  fpsLabel: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appTitle: 'GEMINI PIXEL DESCENT',
    appSubtitle: 'Orbital Re-entry Simulation & Atmospheric Flight Engine',
    altitudeKm: 'ALTITUDE',
    descentActive: 'RE-ENTRY IN PROGRESS',
    paused: 'FLIGHT PAUSED',
    settings: 'SETTINGS',
    recorder: 'CAMCORDER',
    viewpoints: 'CINEMATICS',
    starChart: 'CONSTELLATIONS',
    blackHole: 'GARGANTUA',
    rings: 'STARDUST RINGS',
    radio: 'LO-FI SYNTH RADIO',
    gliderMode: 'GLIDER FLIGHT',
    flightLog: 'BLACKBOX LOG',

    layerExosphere: 'Exosphere (100km+) · Deep Void & Orbital Satellites',
    layerThermosphere: 'Thermosphere (85-100km) · Aurora Borealis & Ion Glow',
    layerMesosphere: 'Mesosphere (50-85km) · Re-entry Plasma & Meteor Trails',
    layerStratosphere: 'Stratosphere (12-50km) · Ozone Layer & Supersonic Glide',
    layerTroposphere: 'Troposphere (0-12km) · Cloud Formations & Thunderstorms',
    layerOceanImpact: 'Surface (0km) · Pacific Ocean Splashdown Corridor',

    velocityMach: 'VELOCITY',
    surfaceTemp: 'HEAT SHIELD',
    atmosphericPressure: 'BAROMETRIC',
    plasmaShield: 'ION PLASMA',
    descentProgress: 'CYCLE PROGRESS',
    descentRate: 'DESCENT RATE',

    ringScore: 'SCORE',
    ringCombo: 'COMBO',
    perfectClear: 'PERFECT RING CATCH!',
    targetAltitude: 'TARGET ALTITUDE',
    timeRemaining: 'TIME REMAINING',

    gliderControls: 'STEER [A/D or ←/→] · DIVE/CLIMB [W/S] · BOOST [SPACE]',
    bankAngle: 'BANK ANGLE',
    thrusterBoost: 'THRUSTER INJECTION',
    windDrift: 'CROSSWIND VECTOR',

    settingsTitle: 'MISSION TELEMETRY & SYSTEM CONFIG',
    languageSelect: 'SYSTEM LANGUAGE',
    particleBudget: 'PARTICLE SIMULATION BUDGET',
    budgetUltra: 'Ultra (1,200 Particles · 60 FPS)',
    budgetBalanced: 'Balanced (600 Particles · 60 FPS)',
    budgetLow: 'Eco (250 Particles · Battery Saver)',
    adaptiveQuality: 'ADAPTIVE PERFORMANCE GUARD',
    adaptiveQualityDesc: 'Automatically throttle particle density if framerate drops below 45 FPS.',
    bloomGlow: 'PLASMA BLOOM & CHROMATIC ABERRATION',
    audioMasterVolume: 'MASTER AUDIO SYNTHESIZER',
    audioMuted: 'MUTE ALL SOUNDS',
    retroScanlines: 'CRT SCANLINE RETRO FILTER',
    saveAndClose: 'SAVE & CLOSE',
    resetDefaults: 'RESET TO DEFAULTS',

    blackboxTitle: 'FLIGHT LOG BLACKBOX & TELEMETRY BACKUP',
    totalKmTraveled: 'Total Traveled Distance',
    ringsCollectedStat: 'Stardust Rings Harvested',
    highestScoreStat: 'Career High Score',
    flightSessionsCount: 'Re-entry Cycles Completed',
    exportBackup: 'EXPORT PROFILE BACKUP (JSON)',
    importBackup: 'RESTORE FROM BACKUP (JSON)',
    backupExportSuccess: 'Flight profile exported successfully!',
    backupImportSuccess: 'Profile restored successfully! All telemetry re-synced.',
    backupImportError: 'Invalid backup file format or corrupted payload.',

    startRecording: 'START REC (60FPS WebM)',
    stopRecording: 'STOP & SAVE RECORDING',
    recordingInProgress: 'RECORDING RE-ENTRY FEED',
    fpsLabel: 'TARGET 60 FPS'
  },
  ko: {
    appTitle: '제미나이 픽셀 디센트',
    appSubtitle: '궤도 재진입 시뮬레이션 & 대기권 비행 텔레메트리 엔진',
    altitudeKm: '고도',
    descentActive: '대기권 진입 중',
    paused: '비행 일시정지',
    settings: '설정',
    recorder: '비행 녹화',
    viewpoints: '카메라 뷰포인트',
    starChart: '성도 및 별자리',
    blackHole: '가르간튀아 특이점',
    rings: '스타더스트 링',
    radio: '로파이 신스 라디오',
    gliderMode: '글라이더 조종',
    flightLog: '블랙박스 비행기록',

    layerExosphere: '외기권 (100km+) · 심우주 & 인공위성 궤도선',
    layerThermosphere: '열권 (85-100km) · 오로라 보레알리스 & 이온 발광',
    layerMesosphere: '중간권 (50-85km) · 재진입 플라즈마 & 유성 흔적',
    layerStratosphere: '성층권 (12-50km) · 오존층 & 초음속 활공',
    layerTroposphere: '대류권 (0-12km) · 구름층 & 뇌우 슈퍼셀',
    layerOceanImpact: '해수면 (0km) · 태평양 착수 회랑',

    velocityMach: '속도',
    surfaceTemp: '방열판 온도',
    atmosphericPressure: '기압',
    plasmaShield: '플라즈마 이온화',
    descentProgress: '하강 진행률',
    descentRate: '강하율',

    ringScore: '점수',
    ringCombo: '콤보',
    perfectClear: '퍼펙트 링 통과!',
    targetAltitude: '목표 고도',
    timeRemaining: '남은 시간',

    gliderControls: '조향 [A/D 또는 방향키] · 상승/강하 [W/S] · 부스터 [스페이스]',
    bankAngle: '선회 롤 각도',
    thrusterBoost: '스러스터 분사',
    windDrift: '측풍 벡터',

    settingsTitle: '미션 텔레메트리 & 시스템 설정',
    languageSelect: '시스템 언어',
    particleBudget: '입자 시뮬레이션 밀도',
    budgetUltra: '울트라 (1,200개 입자 · 60 FPS)',
    budgetBalanced: '균형 (600개 입자 · 60 FPS)',
    budgetLow: '에코 (250개 입자 · 배터리 절약)',
    adaptiveQuality: '적응형 성능 가드 (자동 프레임 유지)',
    adaptiveQualityDesc: '프레임이 45 FPS 이하로 저하될 경우 자동으로 입자 밀도를 완화합니다.',
    bloomGlow: '플라즈마 블룸 & 색수차 왜곡 효과',
    audioMasterVolume: '마스터 오디오 신디사이저',
    audioMuted: '모든 사운드 음소거',
    retroScanlines: 'CRT 스캔라인 레트로 필터',
    saveAndClose: '저장 및 닫기',
    resetDefaults: '기본값으로 복원',

    blackboxTitle: '비행 기록 블랙박스 & 백업 복구',
    totalKmTraveled: '총 비행 거리',
    ringsCollectedStat: '수집한 스타더스트 링',
    highestScoreStat: '최고 득점 기록',
    flightSessionsCount: '완료한 재진입 사이클',
    exportBackup: '프로필 백업 내보내기 (JSON)',
    importBackup: '백업 파일 복원하기 (JSON)',
    backupExportSuccess: '비행 프로필이 성공적으로 내보내졌습니다!',
    backupImportSuccess: '프로필 복원 완료! 모든 텔레메트리가 동기화되었습니다.',
    backupImportError: '잘못된 백업 파일 형식 또는 손상된 데이터입니다.',

    startRecording: '녹화 시작 (60FPS WebM)',
    stopRecording: '녹화 중지 및 저장',
    recordingInProgress: '재진입 영상 녹화 중',
    fpsLabel: '목표 60 FPS'
  }
};

/**
 * Detect default system language, defaulting to English unless Korean is preferred.
 */
export function getInitialLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === 'ko' || saved === 'en') {
      return saved;
    }
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ko')) {
      return 'ko';
    }
  } catch {
    // Ignore localStorage access failures in restricted environments
  }
  return 'en';
}

/**
 * Save user language choice to localStorage.
 */
export function saveLanguage(lang: SupportedLanguage): void {
  try {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
  } catch {
    // Ignore localStorage write failures
  }
}

/**
 * Access a translation key safely with fallback to English.
 */
export function t(key: keyof TranslationDictionary, lang: SupportedLanguage = 'en'): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}
