/**
 * Flight Log Badge & Milestone System
 * Tracks unlockable flight achievements, detects milestone completions in real-time,
 * persists badges to local storage, and provides HUD notification toasts.
 */

export interface FlightLogBadge {
  id: string;
  name: string;
  koreanName: string;
  category: 'altitude' | 'weather' | 'celestial' | 'glider' | 'arcade';
  description: string;
  koreanDescription: string;
  iconName: string;
  accentColor: string;
  glowColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UnlockedBadgeRecord {
  id: string;
  unlockedAt: number;
}

export const STORAGE_BADGES_KEY = 'pixel_descent_badges_v1';

/**
 * All official flight log badges in the simulator
 */
export const FLIGHT_LOG_BADGES: FlightLogBadge[] = [
  {
    id: 'cloud_piercer',
    name: 'Cloud Piercer',
    koreanName: '클라우드 피어서',
    category: 'weather',
    description: 'Broke through a turbulent storm and heavy rain layer into lower altitudes',
    koreanDescription: '폭풍우와 폭우 구름 전선층을 성공적으로 뚫고 저고도로 돌파했습니다',
    iconName: 'Zap',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    rarity: 'rare',
  },
  {
    id: 'orbital_ingress',
    name: 'Orbital Ingress',
    koreanName: '궤도 강하 비행사',
    category: 'altitude',
    description: 'Completed a full 3D orbital descent from high space down into cloud decks',
    koreanDescription: '380km 심우주 열권에서 12km 구름층까지 3D 시네마틱 궤도 강하를 완수했습니다',
    iconName: 'Rocket',
    accentColor: '#818cf8',
    glowColor: 'rgba(129, 140, 248, 0.45)',
    rarity: 'epic',
  },
  {
    id: 'dragon_whisperer',
    name: 'Dragon Whisperer',
    koreanName: '성운룡 조우자',
    category: 'celestial',
    description: 'Close rendezvous with the Mythical Celestial Dragon soaring across the cosmos',
    koreanDescription: '밤하늘을 비행하는 신화적 성운룡과 초근접 조우 및 공명 비행을 경험했습니다',
    iconName: 'Flame',
    accentColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    rarity: 'legendary',
  },
  {
    id: 'stardust_ace',
    name: 'Stardust Ace',
    koreanName: '스타더스트 에이스',
    category: 'arcade',
    description: 'Gathered 10 or more Stardust Rings with an active chain combo',
    koreanDescription: '아케이드 챌린지에서 10개 이상의 스타더스트 링을 연속 콤보로 수집했습니다',
    iconName: 'Trophy',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    rarity: 'rare',
  },
  {
    id: 'aurora_navigator',
    name: 'Aurora Navigator',
    koreanName: '오로라 항법사',
    category: 'weather',
    description: 'Traversed the glowing polar ion curtains under polar aurora lights',
    koreanDescription: '영롱하게 일렁이는 극지방 이온 오로라 기상 전선 속을 항행했습니다',
    iconName: 'Sparkles',
    accentColor: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.45)',
    rarity: 'common',
  },
  {
    id: 'horizon_touchdown',
    name: 'Horizon Touchdown',
    koreanName: '대류권 저고도 안착',
    category: 'altitude',
    description: 'Descended below 10 km into the troposphere near ocean and land horizons',
    koreanDescription: '고도 10km 이하 대류권 지형 및 대양 수평선 상공까지 안전하게 하강했습니다',
    iconName: 'Compass',
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    rarity: 'common',
  },
  {
    id: 'supersonic_mach',
    name: 'Mach Pilot',
    koreanName: '마하 파일럿',
    category: 'glider',
    description: 'Cruised at Mach 2.2+ atmospheric velocity with active supersonic shockwaves',
    koreanDescription: '마하 2.2 이상의 극초음속 가속 모드로 대기 마찰 플라즈마 충격을 돌파했습니다',
    iconName: 'Gauge',
    accentColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    rarity: 'rare',
  },
  {
    id: 'event_horizon',
    name: 'Event Horizon',
    koreanName: '사건의 지평선',
    category: 'celestial',
    description: 'Witnessed the gravitational singularity of Gargantua black hole',
    koreanDescription: '가르간튀아 초대질량 블랙홀의 중력 렌징 사건의 지평선을 관측했습니다',
    iconName: 'CircleDot',
    accentColor: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.45)',
    rarity: 'epic',
  },
];

/**
 * Loads unlocked badge IDs from persistent storage
 */
export function loadUnlockedBadges(): Record<string, UnlockedBadgeRecord> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_BADGES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, UnlockedBadgeRecord>;
  } catch {
    return {};
  }
}

/**
 * Saves unlocked badge IDs to persistent storage
 */
export function saveUnlockedBadges(badges: Record<string, UnlockedBadgeRecord>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_BADGES_KEY, JSON.stringify(badges));
  } catch {
    // Ignore storage write failure
  }
}

/**
 * Resets all unlocked badges from persistent storage
 */
export function resetUnlockedBadges(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_BADGES_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Context input for checking milestone triggers
 */
export interface BadgeMilestoneContext {
  altitudeKm: number;
  weather: string;
  speedMode: 'cinematic' | 'normal' | 'mach';
  isDragonActive: boolean;
  ringsCollected: number;
  isBlackHoleActive: boolean;
  orbitalZoomActive: boolean;
  orbitalZoomPhase?: string;
  cycleProgress: number;
  gliderEnabled: boolean;
}

/**
 * Pure evaluation function that checks if any badge should be unlocked
 * based on current telemetry and conditions.
 * Returns the badge definitions that are newly eligible.
 */
export function evaluateMilestoneBadges(
  context: BadgeMilestoneContext,
  alreadyUnlocked: Record<string, UnlockedBadgeRecord>
): FlightLogBadge[] {
  const eligible: FlightLogBadge[] = [];

  for (const badge of FLIGHT_LOG_BADGES) {
    if (alreadyUnlocked[badge.id]) continue;

    let conditionMet = false;

    switch (badge.id) {
      case 'cloud_piercer':
        // Breaking through a turbulent storm / rain layer into lower altitudes (< 45km)
        // or during rain with low altitude
        if (context.weather === 'rain' && context.altitudeKm <= 48) {
          conditionMet = true;
        }
        break;

      case 'orbital_ingress':
        // Completed orbital zoom down to settled cloud deck or in breakthrough phase
        if (context.orbitalZoomActive && (context.orbitalZoomPhase === 'cloud_breakthrough' || context.orbitalZoomPhase === 'settled')) {
          conditionMet = true;
        }
        break;

      case 'dragon_whisperer':
        // Close encounter with dragon
        if (context.isDragonActive) {
          conditionMet = true;
        }
        break;

      case 'stardust_ace':
        // Collected 10 or more rings
        if (context.ringsCollected >= 10) {
          conditionMet = true;
        }
        break;

      case 'aurora_navigator':
        // Navigating through aurora weather
        if (context.weather === 'aurora') {
          conditionMet = true;
        }
        break;

      case 'horizon_touchdown':
        // Reached troposphere low altitude (< 10 km)
        if (context.altitudeKm <= 10) {
          conditionMet = true;
        }
        break;

      case 'supersonic_mach':
        // Flying in Mach mode
        if (context.speedMode === 'mach') {
          conditionMet = true;
        }
        break;

      case 'event_horizon':
        // Gargantua black hole active
        if (context.isBlackHoleActive) {
          conditionMet = true;
        }
        break;
    }

    if (conditionMet) {
      eligible.push(badge);
    }
  }

  return eligible;
}

/**
 * Attempt to unlock a badge. If newly unlocked, saves to storage and returns the badge.
 */
export function unlockBadge(
  badgeId: string,
  currentUnlocked: Record<string, UnlockedBadgeRecord>
): { unlockedBadge: FlightLogBadge | null; nextUnlocked: Record<string, UnlockedBadgeRecord> } {
  if (currentUnlocked[badgeId]) {
    return { unlockedBadge: null, nextUnlocked: currentUnlocked };
  }

  const badgeDef = FLIGHT_LOG_BADGES.find((b) => b.id === badgeId);
  if (!badgeDef) {
    return { unlockedBadge: null, nextUnlocked: currentUnlocked };
  }

  const nextUnlocked = {
    ...currentUnlocked,
    [badgeId]: {
      id: badgeId,
      unlockedAt: Date.now(),
    },
  };

  saveUnlockedBadges(nextUnlocked);
  return { unlockedBadge: badgeDef, nextUnlocked };
}
