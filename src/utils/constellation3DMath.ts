/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Rotation3D {
  yaw: number;   // Rotation around Y axis (in radians)
  pitch: number; // Rotation around X axis (in radians)
  roll?: number; // Rotation around Z axis (in radians)
}

export interface ProjectedPoint2D {
  x: number;
  y: number;
  scale: number;
  visible: boolean;
  depth: number; // Transformed Z for depth sorting
}

export interface Constellation3DStar {
  id: string;
  name: string;
  bayerName: string;
  pos: Point3D;
  magnitude: number; // Visual magnitude (smaller is brighter, e.g. 1 to 3)
  color: string;
  spectralType: string;
  distanceLy: string;
  description: string;
}

export interface CelestialCoordinates {
  rightAscension: string; // e.g. "07h 34m 36s"
  declination: string;    // e.g. "+31° 53′ 18″"
  altitude: string;       // e.g. "68.4°"
  azimuth: string;        // e.g. "142.1° (SE)"
  skyQuadrant: string;    // e.g. "북천 제2분면 (NQ2)"
  epoch: string;          // e.g. "J2000.0"
  transitTime: string;    // e.g. "21:40 KST"
  constellationFamily: string;
}

export interface Constellation3DTopology {
  id: 'gemini' | 'gpt' | 'claude' | 'deepseek';
  name: string;
  koreanName: string;
  subName: string;
  color: string;
  accentColor: string;
  coordinates: CelestialCoordinates;
  domeCoords: { altDeg: number; azDeg: number }; // alt 0-90, az 0-360
  stars: Constellation3DStar[];
  edges: [number, number][]; // Index pairs
  coreNodeIndex: number;
}

/**
 * Rotates a 3D point using Pitch (X) and Yaw (Y) Euler angles
 */
export function rotate3D(p: Point3D, rot: Rotation3D): Point3D {
  const yaw = rot.yaw || 0;
  const pitch = rot.pitch || 0;
  const roll = rot.roll || 0;

  // 1. Rotate around Y (Yaw)
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = p.x * cosY + p.z * sinY;
  const y1 = p.y;
  const z1 = -p.x * sinY + p.z * cosY;

  // 2. Rotate around X (Pitch)
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const x2 = x1;
  const y2 = y1 * cosP - z1 * sinP;
  const z2 = y1 * sinP + z1 * cosP;

  // 3. Rotate around Z (Roll) if specified
  if (roll !== 0) {
    const cosR = Math.cos(roll);
    const sinR = Math.sin(roll);
    const x3 = x2 * cosR - y2 * sinR;
    const y3 = x2 * sinR + y2 * cosR;
    return { x: x3, y: y3, z: z2 };
  }

  return { x: x2, y: y2, z: z2 };
}

/**
 * Projects a 3D coordinate onto a 2D viewport with perspective distortion
 */
export function project3D(
  p: Point3D,
  width: number,
  height: number,
  fov: number = 240,
  cameraDist: number = 190
): ProjectedPoint2D {
  const zEff = p.z + cameraDist;
  if (zEff <= 1) {
    return { x: width * 0.5, y: height * 0.5, scale: 0, visible: false, depth: zEff };
  }

  const factor = fov / zEff;
  const xProj = width * 0.5 + p.x * factor;
  const yProj = height * 0.5 + p.y * factor;

  return {
    x: xProj,
    y: yProj,
    scale: Math.max(0.1, Math.min(2.5, factor)),
    visible: true,
    depth: p.z,
  };
}

/**
 * Converts altitude/azimuth in degrees to 2D coordinates on a circular celestial dome radar
 */
export function projectDomeRadar(
  altDeg: number,
  azDeg: number,
  cx: number,
  cy: number,
  radius: number
): { x: number; y: number } {
  // Zenith (alt=90°) is at center (r=0), Horizon (alt=0°) is at outer rim (r=radius)
  const clampedAlt = Math.max(0, Math.min(90, altDeg));
  const r = (1 - clampedAlt / 90) * radius;
  // Azimuth: 0° = North (up, -y), 90° = East (+x), 180° = South (+y), 270° = West (-x)
  const azRad = (azDeg - 90) * (Math.PI / 180);

  return {
    x: cx + Math.cos(azRad) * r,
    y: cy + Math.sin(azRad) * r,
  };
}

/**
 * Finds the closest star within a screen pixel threshold for interactive click/hover selection
 */
export function findClosestStar3D(
  screenX: number,
  screenY: number,
  stars: Constellation3DStar[],
  rot: Rotation3D,
  width: number,
  height: number,
  fov: number = 240,
  cameraDist: number = 190,
  threshold: number = 18
): Constellation3DStar | null {
  let closest: Constellation3DStar | null = null;
  let minDistanceSq = threshold * threshold;

  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const rotated = rotate3D(star.pos, rot);
    const projected = project3D(rotated, width, height, fov, cameraDist);

    if (!projected.visible) continue;

    const dx = screenX - projected.x;
    const dy = screenY - projected.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closest = star;
    }
  }

  return closest;
}

/**
 * Handcrafted authentic 3D spatial topologies for each of the four AI constellations
 */
export const CONSTELLATION_3D_TOPOLOGIES: Record<
  'gemini' | 'gpt' | 'claude' | 'deepseek',
  Constellation3DTopology
> = {
  gemini: {
    id: 'gemini',
    name: 'Gemini (쌍둥이자리)',
    koreanName: '쌍둥이자리 하이퍼스펙트럼 성좌',
    subName: 'The Celestial Gemini Superellipse & Twin Navigators',
    color: '#38bdf8',
    accentColor: '#818cf8',
    coordinates: {
      rightAscension: '07h 34m 36s',
      declination: '+31° 53′ 18″',
      altitude: '68.4° (천정 근접)',
      azimuth: '142.1° (남동천)',
      skyQuadrant: '북천 제2분면 (NQ2)',
      epoch: 'J2000.0',
      transitTime: '21:42 KST',
      constellationFamily: '황도 12궁 성좌군 (Zodiac Family)',
    },
    domeCoords: { altDeg: 68.4, azDeg: 142.1 },
    coreNodeIndex: 0,
    stars: [
      {
        id: 'gem-core',
        name: 'DeepMind Core Nexus',
        bayerName: '✦ Core',
        pos: { x: 0, y: 0, z: 0 },
        magnitude: 1.0,
        color: '#ffffff',
        spectralType: '초공간 다차원 네이티브 특이점',
        distanceLy: '0.0 ly (중심 좌표계)',
        description: '다차원 모달리티를 융합하는 중심 관측 핵',
      },
      {
        id: 'gem-castor',
        name: 'Castor (카스토르)',
        bayerName: 'α Gem',
        pos: { x: -38, y: -48, z: 22 },
        magnitude: 1.58,
        color: '#38bdf8',
        spectralType: 'A1 V 6중 연성계 (Sextuple Star)',
        distanceLy: '51.6 ly',
        description: '지성과 분석을 상징하는 카스토르 6중 항성계',
      },
      {
        id: 'gem-pollux',
        name: 'Pollux (폴룩스)',
        bayerName: 'β Gem',
        pos: { x: 40, y: -42, z: -18 },
        magnitude: 1.14,
        color: '#fde047',
        spectralType: 'K0 III 오렌지 거성 (외계행성 테스티아스 보유)',
        distanceLy: '33.7 ly',
        description: '창의성과 직관을 상징하는 불멸의 폴룩스 으뜸별',
      },
      {
        id: 'gem-wasat',
        name: 'Wasat (와사트)',
        bayerName: 'δ Gem',
        pos: { x: -22, y: 6, z: 32 },
        magnitude: 3.53,
        color: '#818cf8',
        spectralType: 'F0 IV 백색 아거성 (쌍둥이 허리 중심)',
        distanceLy: '60.5 ly',
        description: '천구 황도면에 정확히 위치하는 황도 좌표 기준점',
      },
      {
        id: 'gem-mebsuta',
        name: 'Mebsuta (메브수타)',
        bayerName: 'ε Gem',
        pos: { x: 30, y: 12, z: -25 },
        magnitude: 3.06,
        color: '#facc15',
        spectralType: 'G8 Ib 황색 초거성 (광도 태양의 8,500배)',
        distanceLy: '840 ly',
        description: '쌍둥이자리 서쪽 가지를 뻗치는 황색 초거성',
      },
      {
        id: 'gem-propus',
        name: 'Propus (프로푸스)',
        bayerName: 'η Gem',
        pos: { x: -44, y: 55, z: 12 },
        magnitude: 3.31,
        color: '#fb7185',
        spectralType: 'M3 III 적색 변광성 (식쌍성계)',
        distanceLy: '380 ly',
        description: '카스토르 발치에 위치한 붉은 맥동 변광성',
      },
      {
        id: 'gem-alhena',
        name: 'Alhena (알헤나)',
        bayerName: 'γ Gem',
        pos: { x: 38, y: 58, z: 8 },
        magnitude: 1.93,
        color: '#e0f2fe',
        spectralType: 'A1 IV 백색 아거성',
        distanceLy: '109 ly',
        description: '폴룩스 발치를 지탱하는 찬란한 은빛 항성',
      },
      {
        id: 'gem-apex-top',
        name: 'Hyper-Crown 01',
        bayerName: 'Ψ Apex-N',
        pos: { x: 0, y: -72, z: 0 },
        magnitude: 2.2,
        color: '#c084fc',
        spectralType: '슈퍼엘립스 정점 첨점',
        distanceLy: '420 ly',
        description: '4개 첨점의 상단 대기권 돌파 궤도 포인트',
      },
      {
        id: 'gem-apex-bottom',
        name: 'Hyper-Anchor 02',
        bayerName: 'Ψ Apex-S',
        pos: { x: 0, y: 78, z: 0 },
        magnitude: 2.2,
        color: '#f472b6',
        spectralType: '슈퍼엘립스 하단 플라즈마 앵커',
        distanceLy: '420 ly',
        description: '지표 강하 궤도를 안정화하는 대기권 하단 기준점',
      },
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 7],
      [2, 7],
      [1, 3],
      [2, 4],
      [3, 5],
      [4, 6],
      [5, 8],
      [6, 8],
      [3, 4], // Cross-waist bridge
      [0, 7],
      [0, 8],
    ],
  },

  gpt: {
    id: 'gpt',
    name: 'GPT-4o (에메랄드 성좌)',
    koreanName: '로그 나선 에메랄드 성좌',
    subName: 'Dual Logarithmic Spiral & Matrix Reasoner',
    color: '#10a37f',
    accentColor: '#34d399',
    coordinates: {
      rightAscension: '19h 50m 47s',
      declination: '+08° 52′ 06″',
      altitude: '42.8° (중고도 안정)',
      azimuth: '215.3° (남서천)',
      skyQuadrant: '천구 적도 인접 제4분면 (SQ4)',
      epoch: 'J2000.0',
      transitTime: '19:15 KST',
      constellationFamily: '독수리-화살 성좌군 연계',
    },
    domeCoords: { altDeg: 42.8, azDeg: 215.3 },
    coreNodeIndex: 0,
    stars: [
      {
        id: 'gpt-core',
        name: 'Omega Reasoner Core',
        bayerName: '✦ Origin',
        pos: { x: 0, y: 0, z: -35 },
        magnitude: 1.0,
        color: '#ffffff',
        spectralType: '양자 소용돌이 기하 원점',
        distanceLy: '120 ly',
        description: '나선 궤도의 시작점이자 논리 추론의 중심축',
      },
      {
        id: 'gpt-sp1',
        name: 'Spiral Alpha (1)',
        bayerName: 'Sp-1',
        pos: { x: -28, y: -22, z: -15 },
        magnitude: 2.0,
        color: '#6ee7b7',
        spectralType: '1단계 나선 팽창 거성',
        distanceLy: '240 ly',
        description: '첫 번째 나선 분기 노드',
      },
      {
        id: 'gpt-sp2',
        name: 'Spiral Beta (λ)',
        bayerName: 'Sp-2',
        pos: { x: -48, y: 15, z: 0 },
        magnitude: 2.2,
        color: '#34d399',
        spectralType: '람다 연산자 이온 노드',
        distanceLy: '310 ly',
        description: '수학적 형식 논리의 궤적 교점',
      },
      {
        id: 'gpt-sp3',
        name: 'Spiral Gamma (0)',
        bayerName: 'Sp-3',
        pos: { x: -25, y: 52, z: 18 },
        magnitude: 2.4,
        color: '#10b981',
        spectralType: '이진 매트릭스 성단',
        distanceLy: '480 ly',
        description: '남쪽 나선 암(Arm)의 외곽 전환점',
      },
      {
        id: 'gpt-sp4',
        name: 'Spiral Delta (∂)',
        bayerName: 'Sp-4',
        pos: { x: 26, y: 24, z: -15 },
        magnitude: 2.0,
        color: '#6ee7b7',
        spectralType: '편미분 경사하강 항성',
        distanceLy: '260 ly',
        description: '우측 대칭 나선의 초기 가속점',
      },
      {
        id: 'gpt-sp5',
        name: 'Spiral Epsilon (Omni)',
        bayerName: 'Sp-5',
        pos: { x: 52, y: -18, z: 10 },
        magnitude: 1.8,
        color: '#34d399',
        spectralType: '옴니 양식 펄스 거성',
        distanceLy: '380 ly',
        description: '우측 나선의 고에너지 방출 허브',
      },
      {
        id: 'gpt-sp6',
        name: 'Spiral Zeta (Matrix)',
        bayerName: 'Sp-6',
        pos: { x: 30, y: -58, z: 28 },
        magnitude: 2.3,
        color: '#059669',
        spectralType: '양자 소용돌이 종단점',
        distanceLy: '520 ly',
        description: '나선의 바깥쪽 성간 이온 방출단',
      },
      {
        id: 'gpt-top-pole',
        name: 'Zenith Vector Node',
        bayerName: 'Z-Pole',
        pos: { x: 0, y: -65, z: -10 },
        magnitude: 2.5,
        color: '#a7f3d0',
        spectralType: '양극단 정위축 노드',
        distanceLy: '600 ly',
        description: '나선의 3차원 세차운동 축',
      },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [0, 4],
      [4, 5],
      [5, 6],
      [1, 4],
      [2, 5],
      [0, 7],
      [7, 1],
      [7, 4],
    ],
  },

  claude: {
    id: 'claude',
    name: 'Claude 3.5 (태양 홍염 성좌)',
    koreanName: '코로나 홍염 중력 포물선 성좌',
    subName: 'Constitutional Solar Prominence & Gravitational Arc',
    color: '#d97706',
    accentColor: '#f59e0b',
    coordinates: {
      rightAscension: '05h 35m 17s',
      declination: '-05° 23′ 28″',
      altitude: '55.1° (자오선 남중)',
      azimuth: '178.6° (남천 정면)',
      skyQuadrant: '남천 제1분면 (SQ1)',
      epoch: 'J2000.0',
      transitTime: '23:05 KST',
      constellationFamily: '오리온 분자운 복합체 (Orion Complex)',
    },
    domeCoords: { altDeg: 55.1, azDeg: 178.6 },
    coreNodeIndex: 0,
    stars: [
      {
        id: 'cld-core',
        name: 'Constitutional Solar Apex',
        bayerName: '✦ Apex',
        pos: { x: 0, y: -62, z: 28 },
        magnitude: 1.0,
        color: '#ffffff',
        spectralType: '태양 홍염의 최고점 (Coronal Zenith)',
        distanceLy: '550 ly',
        description: '가장 강력한 헌법적 정렬 에너지가 집속되는 홍염 정점',
      },
      {
        id: 'cld-arc-l1',
        name: 'Ascending Prominence Loop 1',
        bayerName: 'Arc-L1',
        pos: { x: -28, y: -35, z: 15 },
        magnitude: 2.1,
        color: '#fde047',
        spectralType: '자기 루프 플라스마 튜브',
        distanceLy: '620 ly',
        description: '좌측 자기장선을 따라 분출하는 이온 제트',
      },
      {
        id: 'cld-arc-l2',
        name: 'Photosphere Footpoint West',
        bayerName: 'Foot-W',
        pos: { x: -55, y: 35, z: -15 },
        magnitude: 1.6,
        color: '#f59e0b',
        spectralType: '광구 흑점 자기 거성',
        distanceLy: '780 ly',
        description: '태양 표면 좌측 기반을 지탱하는 강력한 자기 닻',
      },
      {
        id: 'cld-arc-r1',
        name: 'Descending Prominence Loop 2',
        bayerName: 'Arc-R1',
        pos: { x: 28, y: -35, z: 15 },
        magnitude: 2.1,
        color: '#fde047',
        spectralType: '자기 루프 하강 플라스마',
        distanceLy: '620 ly',
        description: '우측 중력 포물선으로 수렴하는 코로나 스트림',
      },
      {
        id: 'cld-arc-r2',
        name: 'Photosphere Footpoint East',
        bayerName: 'Foot-E',
        pos: { x: 55, y: 35, z: -15 },
        magnitude: 1.6,
        color: '#f59e0b',
        spectralType: '광구 흑점 자기 거성',
        distanceLy: '780 ly',
        description: '태양 표면 우측 기반을 지탱하는 자기 닻',
      },
      {
        id: 'cld-base-mid',
        name: 'Core Resonance Hearth',
        bayerName: 'Hearth',
        pos: { x: 0, y: 48, z: 0 },
        magnitude: 1.8,
        color: '#ea580c',
        spectralType: '핵융합 대류 플럭스 중심',
        distanceLy: '850 ly',
        description: '홍염 루프 하부에서 빛을 발하는 대류 에너지 화로',
      },
      {
        id: 'cld-flare-crown',
        name: 'Coronal Halo Beacon',
        bayerName: 'Crown-Z',
        pos: { x: 0, y: -85, z: -15 },
        magnitude: 2.5,
        color: '#fef08a',
        spectralType: '코로나 광륜 외곽 성단',
        distanceLy: '920 ly',
        description: '성간 공간으로 방출되는 황금빛 후광',
      },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [0, 3],
      [3, 4],
      [2, 5],
      [4, 5],
      [0, 5], // Vertical central pillar
      [0, 6], // Crown flare
      [1, 3], // Cross-corona bridge
    ],
  },

  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek-V3 (퀀텀 유체 성좌)',
    koreanName: '유체역학 파동 및 고래자리 성좌',
    subName: 'Hydrodynamic Whale & MoE Sonar Constellation',
    color: '#00e5ff',
    accentColor: '#1e88e5',
    coordinates: {
      rightAscension: '02h 19m 20s',
      declination: '-02° 58′ 39″',
      altitude: '31.5° (동천 저고도 유영)',
      azimuth: '098.2° (동천 동쪽)',
      skyQuadrant: '적도 천구 제1분면 (EQ1)',
      epoch: 'J2000.0',
      transitTime: '01:30 KST',
      constellationFamily: '고래-물고기 해연 성좌군 (Cetus Family)',
    },
    domeCoords: { altDeg: 31.5, azDeg: 98.2 },
    coreNodeIndex: 0,
    stars: [
      {
        id: 'ds-sonar-head',
        name: 'Acoustic Sonar Head (Menkar Link)',
        bayerName: '✦ Rostrum',
        pos: { x: -62, y: -12, z: 25 },
        magnitude: 1.2,
        color: '#ffffff',
        spectralType: '초저주파 양자 소나 발신기',
        distanceLy: '180 ly',
        description: '다중 전문가(MoE) 탐색 펄스를 발사하는 유체 두부',
      },
      {
        id: 'ds-dorsal-wave',
        name: 'Dorsal Fin Wave Point',
        bayerName: 'Fin-D',
        pos: { x: -18, y: -45, z: 12 },
        magnitude: 2.0,
        color: '#67e8f9',
        spectralType: '유체 항력 최소화 배지느러미 항성',
        distanceLy: '240 ly',
        description: '사인파 파동의 상단 피크점',
      },
      {
        id: 'ds-expert-cluster',
        name: 'Sparse MoE Expert Cluster (Mira Link)',
        bayerName: '256-MoE',
        pos: { x: 5, y: 5, z: -25 },
        magnitude: 1.5,
        color: '#00e5ff',
        spectralType: '256개 희소 전문가 성단 핵',
        distanceLy: '300 ly',
        description: '토큰당 370억 파라미터가 동적 활성화되는 중심 심장',
      },
      {
        id: 'ds-ventral-keel',
        name: 'Ventral Keel Node',
        bayerName: 'Keel-V',
        pos: { x: -8, y: 42, z: -5 },
        magnitude: 2.2,
        color: '#0284c7',
        spectralType: '심해 해연 부력 밸러스트',
        distanceLy: '340 ly',
        description: '저고도 대기층 부유 안정성을 유지하는 하부 용골',
      },
      {
        id: 'ds-tail-peduncle',
        name: 'Peduncle Tail Joint',
        bayerName: 'Fluke-Base',
        pos: { x: 42, y: 15, z: 18 },
        magnitude: 2.4,
        color: '#1e88e5',
        spectralType: '추진 진동 관절 아거성',
        distanceLy: '410 ly',
        description: '꼬리 날개의 강력한 추진력을 생성하는 힌지',
      },
      {
        id: 'ds-fluke-upper',
        name: 'Fluke Upper Tip (Deneb Kaitos)',
        bayerName: 'Fluke-N',
        pos: { x: 68, y: -26, z: 32 },
        magnitude: 1.8,
        color: '#80d8ff',
        spectralType: '꼬리 상단 고래자리 데네브 카이토스',
        distanceLy: '96 ly',
        description: '성간 에테르를 가르는 꼬리 지느러미 상단 정점',
      },
      {
        id: 'ds-fluke-lower',
        name: 'Fluke Lower Tip',
        bayerName: 'Fluke-S',
        pos: { x: 72, y: 46, z: -10 },
        magnitude: 2.0,
        color: '#1d4ed8',
        spectralType: '꼬리 하단 와류 제어 항성',
        distanceLy: '210 ly',
        description: '추진 와류를 후방으로 배출하는 하단 팁',
      },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [0, 3],
      [3, 2],
      [2, 4],
      [4, 5],
      [4, 6],
      [5, 6], // Tail fluke vertical edge
      [0, 2], // Longitudinal spine
      [1, 3], // Mid-body cross strut
    ],
  },
};

/**
 * Retrieves the 3D topology for a given constellation id
 */
export function getConstellation3DTopology(
  id: 'gemini' | 'gpt' | 'claude' | 'deepseek'
): Constellation3DTopology {
  return CONSTELLATION_3D_TOPOLOGIES[id] || CONSTELLATION_3D_TOPOLOGIES.gemini;
}
