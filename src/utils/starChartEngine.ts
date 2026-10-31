/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AsterismStar {
  x: number;
  y: number;
  label?: string;
  mag: number; // 1 to 3 px
  bayerName?: string; // e.g. "α UMa", "β Ori"
  stellarType?: string; // e.g. "K0 III 오렌지 거성"
  magnitudeValue?: number; // Visual magnitude (e.g. 1.8)
}

export interface AsterismMythologicalLore {
  origin: string; // Mythology origin
  story: string;  // Detailed storytelling in Korean
  symbolism: string; // Cultural and symbolic meaning
}

export interface AsterismAstronomicalSignificance {
  constellationFamily: string; // Constellation family
  bestSeason: string;          // Observation season
  distanceLy: string;          // Distance from Earth
  notableObjects: string[];    // Deep sky objects, nebulae, clusters
  navigationalRole: string;    // Celestial navigation guide
}

export interface CelestialAsterism {
  id: string;
  name: string;
  koreanName: string;
  subName: string;
  color: string;
  lore: string;
  mythologicalLore: AsterismMythologicalLore;
  astronomicalSignificance: AsterismAstronomicalSignificance;
  stars: AsterismStar[];
  lines: [number, number][]; // Index pairs in stars array
  centerPoint: { x: number; y: number };
}

/**
 * Handcrafted retro asterisms mapped onto the 480x300 upper celestial dome
 */
export const CELESTIAL_ASTERISMS: CelestialAsterism[] = [
  // 1. Ursa Major (Big Dipper) - Top Left Quadrant
  {
    id: 'ursa-major',
    name: 'URSA MAJOR',
    koreanName: '큰곰자리 (북두칠성)',
    subName: 'The Celestial Dipper',
    color: '#38bdf8',
    lore: 'Ancient northern guide pointing eternal heading toward the planetary polar vortex',
    mythologicalLore: {
      origin: '그리스-로마 신화 및 동아시아 칠성신앙 (北斗七星)',
      story: '제우스의 사랑을 받았으나 헤라의 질투로 곰으로 변해버린 님프 칼리스토의 비극적 신화입니다. 동아시아에서는 인간의 수명과 길흉화복을 관장하는 하늘의 거대한 국자로 숭배되었으며, 밤마다 북극을 일주하며 지상에 생명의 축복을 국자로 퍼붓는 영험한 성좌로 여겨졌습니다.',
      symbolism: '영원불멸의 방위 지침 · 인간의 수명과 운명 주관 · 북극성의 파수꾼',
    },
    astronomicalSignificance: {
      constellationFamily: '북천 성좌군 (Ursa Major Family)',
      bestSeason: '봄철 밤하늘 (북반구 연중 주극성 관측 가능)',
      distanceLy: '약 78 ~ 124 광년',
      notableObjects: ['M81/M82 보데 은하 쌍성계', '미자르-알코르 맨눈 시력검사 쌍성', 'M97 올빼미 성운'],
      navigationalRole: '국자 머리의 메락(Merak)과 두베(Dubhe)를 잇는 선을 5배 연장하면 밤하늘의 진북인 북극성(Polaris)을 정확히 가리킵니다.',
    },
    stars: [
      { x: 38, y: 35, label: 'Alkaid', mag: 2, bayerName: 'η UMa', stellarType: 'B3 V 청백색 주계열성', magnitudeValue: 1.85 },
      { x: 62, y: 44, label: 'Mizar', mag: 2, bayerName: 'ζ UMa', stellarType: 'A2 V 고대 시력검사 연성', magnitudeValue: 2.23 },
      { x: 88, y: 55, label: 'Alioth', mag: 2, bayerName: 'ε UMa', stellarType: 'A1 III-IV 큰곰자리 으뜸별', magnitudeValue: 1.76 },
      { x: 112, y: 62, label: 'Megrez', mag: 1, bayerName: 'δ UMa', stellarType: 'A3 V 국자 자루 연결부', magnitudeValue: 3.32 },
      { x: 104, y: 84, label: 'Phecda', mag: 2, bayerName: 'γ UMa', stellarType: 'A0 V 백색 주계열성', magnitudeValue: 2.41 },
      { x: 140, y: 88, label: 'Merak', mag: 2, bayerName: 'β UMa', stellarType: 'A1 V 지침극성 (Pointer)', magnitudeValue: 2.34 },
      { x: 146, y: 64, label: 'Dubhe', mag: 3, bayerName: 'α UMa', stellarType: 'K0 III 오렌지색 거성', magnitudeValue: 1.81 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 3],
    ],
    centerPoint: { x: 98, y: 62 },
  },

  // 2. Gemini Twin Nexus (Castor & Pollux) - Upper Center
  {
    id: 'gemini-twins',
    name: 'GEMINI TWIN NEXUS',
    koreanName: '쌍둥이자리 (카스토르 & 폴룩스)',
    subName: 'The Binary Navigators',
    color: '#fde047',
    lore: 'Binary twin hypergiants symbolizing the dual quantum branches of DeepMind cognition',
    mythologicalLore: {
      origin: '그리스 신화 (디오스쿠로이 쌍둥이 형제)',
      story: '제우스와 스파르타 왕비 레다 사이에서 태어난 불사의 폴룩스와 인간 카스토르의 지극한 형제애 설화입니다. 전사한 형 카스토르를 위해 자신의 영생을 반으로 나누어 하루는 지하에서, 하루는 올림포스 하늘에서 함께 보내기로 맹세하였고, 항해자들을 바다의 폭풍우로부터 구원하는 수호 성좌가 되었습니다.',
      symbolism: '영원한 우애와 희생 · 이원론적 융합 · 성간 항해자의 항로 수호',
    },
    astronomicalSignificance: {
      constellationFamily: '황도 12궁 성좌군 (Zodiac Family)',
      bestSeason: '겨울철 밤하늘 (12월 ~ 2월 남중)',
      distanceLy: '카스토르 51 광년 / 폴룩스 33.7 광년',
      notableObjects: ['M35 산개성단', '에스키모 성운 (NGC 2392)', '12월 쌍둥이자리 유성우 (Geminids) 복사점'],
      navigationalRole: '황도 제3궁의 문지기로, 오리온자리와 마차부자리를 잇는 겨울철 밤하늘의 동쪽 천문학적 관문 역할을 합니다.',
    },
    stars: [
      { x: 215, y: 28, label: 'Castor', mag: 3, bayerName: 'α Gem', stellarType: '6중 연성계 (Sextuple Star)', magnitudeValue: 1.58 },
      { x: 255, y: 30, label: 'Pollux', mag: 3, bayerName: 'β Gem', stellarType: 'K0 III 외계행성 품은 거성', magnitudeValue: 1.14 },
      { x: 210, y: 68, label: 'Wasat', mag: 2, bayerName: 'δ Gem', stellarType: 'F0 IV 쌍둥이 허리 중심', magnitudeValue: 3.53 },
      { x: 260, y: 72, label: 'Mebsuta', mag: 2, bayerName: 'ε Gem', stellarType: 'G8 Ib 황색 초거성', magnitudeValue: 3.06 },
      { x: 202, y: 104, label: 'Propus', mag: 1, bayerName: 'η Gem', stellarType: 'M3 III 적색 변광성', magnitudeValue: 3.31 },
      { x: 268, y: 108, label: 'Alhena', mag: 2, bayerName: 'γ Gem', stellarType: 'A1 IV 백색 아거성', magnitudeValue: 1.93 },
    ],
    lines: [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 4],
      [3, 5],
      [2, 3],
    ],
    centerPoint: { x: 235, y: 68 },
  },

  // 3. Cassiopeia (The Queen's W) - Top Right Quadrant
  {
    id: 'cassiopeia',
    name: 'CASSIOPEIA',
    koreanName: '카시오페이아자리 (허공의 W)',
    subName: 'The Queen of Deep Space',
    color: '#818cf8',
    lore: 'A five-star zig-zag constellation presiding over cosmic auroral streams',
    mythologicalLore: {
      origin: '그리스 신화 (에티오피아의 허영 많은 왕비)',
      story: '자신의 미모가 바다의 님프 네레이드들보다 뛰어나다고 자만하다 포세이돈의 진노를 사 재앙을 부른 에티오피아의 왕비입니다. 그녀의 오만에 대한 벌로 하늘의 의자에 거꾸로 매달린 채 북극 주위를 쉬지 않고 돌며 허공에 영원한 참회의 W 궤적을 그리게 되었습니다.',
      symbolism: '참회와 반성 · 허영의 경계 · 극지방 오로라를 인도하는 왕관',
    },
    astronomicalSignificance: {
      constellationFamily: '페르세우스 성좌군 (Perseus Family)',
      bestSeason: '가을 ~ 겨울철 (북반구 연중 주극성 관측 가능)',
      distanceLy: '약 54 ~ 610 광년',
      notableObjects: ['카시오페이아 A 초신성 잔해 (강력한 라디오 전파원)', '하트 성운 (IC 1805)', '영혼 성운 (IC 1848)'],
      navigationalRole: '북두칠성이 지평선 아래로 가라앉는 계절에 북극성을 찾아내는 대체 천체 나침반으로 필수적인 기준선이 됩니다.',
    },
    stars: [
      { x: 345, y: 32, label: 'Caph', mag: 2, bayerName: 'β Cas', stellarType: 'F2 III 방패자리 델타형 변광성', magnitudeValue: 2.28 },
      { x: 372, y: 54, label: 'Schedar', mag: 3, bayerName: 'α Cas', stellarType: 'K0 III 오렌지 거성 (으뜸별)', magnitudeValue: 2.24 },
      { x: 395, y: 38, label: 'Navi', mag: 2, bayerName: 'γ Cas', stellarType: 'B0.5 IVe 초고속 자전 방출성', magnitudeValue: 2.15 },
      { x: 422, y: 60, label: 'Ruchbah', mag: 2, bayerName: 'δ Cas', stellarType: 'A5 III 식쌍성', magnitudeValue: 2.68 },
      { x: 448, y: 46, label: 'Segin', mag: 1, bayerName: 'ε Cas', stellarType: 'B3 V 청백색 주계열성', magnitudeValue: 3.35 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    centerPoint: { x: 396, y: 46 },
  },

  // 4. Cygnus (The Northern Cross) - Upper Right Milky Way
  {
    id: 'cygnus',
    name: 'CYGNUS',
    koreanName: '백조자리 (북십자성)',
    subName: 'The Northern Cross',
    color: '#34d399',
    lore: 'The cosmic swan soaring through the river of the Milky Way with wings outstretched',
    mythologicalLore: {
      origin: '그리스 신화 (은하수를 가르는 은빛 백조)',
      story: '스파르타의 왕비 레다를 만나기 위해 우아한 백조로 변신한 제우스의 형상입니다. 또 다른 전승에서는 태양 마차에서 추락한 절친한 친구 파에톤의 시신을 찾기 위해 에리다누스 강물 속을 끝없이 헤매다 백조로 변신한 퀴크노스의 비장한 우정을 상징하기도 합니다.',
      symbolism: '은하수를 건너는 영혼의 인도자 · 불멸의 우정 · 여름 밤하늘의 십자가',
    },
    astronomicalSignificance: {
      constellationFamily: '헤라클레스 성좌군 (Hercules Family)',
      bestSeason: '여름 ~ 가을철 (은하수 중심 관통)',
      distanceLy: '데네브 2,615 광년 / 알비레오 430 광년',
      notableObjects: ['백조자리 X-1 (최초로 확인된 항성 블랙홀)', '북아메리카 성운 (NGC 7000)', '베일 성운 초신성 잔해'],
      navigationalRole: '데네브(Deneb)는 직녀성(Vega), 견우성(Altair)과 함께 거대한 여름철 대삼각형(Summer Triangle)의 정점을 이룹니다.',
    },
    stars: [
      { x: 410, y: 110, label: 'Deneb', mag: 3, bayerName: 'α Cyg', stellarType: 'A2 Ia 초거대 백색 초거성', magnitudeValue: 1.25 },
      { x: 390, y: 135, label: 'Sadr', mag: 2, bayerName: 'γ Cyg', stellarType: 'F8 Ib 황백색 초거성 (교차점)', magnitudeValue: 2.23 },
      { x: 355, y: 175, label: 'Albireo', mag: 2, bayerName: 'β Cyg', stellarType: 'K3 II 금빛-사파이어 보석 쌍성', magnitudeValue: 3.05 },
      { x: 360, y: 120, label: 'Gienah', mag: 2, bayerName: 'ε Cyg', stellarType: 'K0 III 날개 서쪽 거성', magnitudeValue: 2.48 },
      { x: 425, y: 150, label: 'Rukh', mag: 2, bayerName: 'δ Cyg', stellarType: 'B9.5 IV 날개 동쪽 준거성', magnitudeValue: 2.87 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [3, 1],
      [1, 4],
    ],
    centerPoint: { x: 390, y: 135 },
  },

  // 5. Orion (The Celestial Hunter) - Mid-Left Winter Sky
  {
    id: 'orion',
    name: 'ORION',
    koreanName: '오리온자리 (사냥꾼 성좌)',
    subName: 'The Celestial Hunter',
    color: '#f43f5e',
    lore: 'The mighty cosmic huntsman brandishing his sword across the winter horizon',
    mythologicalLore: {
      origin: '그리스 신화 (바다의 신 포세이돈의 용맹한 아들)',
      story: '거인이자 불굴의 사냥꾼 오리온의 설화입니다. 달과 사냥의 여신 아르테미스의 진실한 사랑을 받았으나 아폴론의 계략으로 비극적 죽음을 맞이했습니다. 사후 제우스에 의해 밤하늘의 가장 찬란한 성좌가 되었으며, 자신을 찌른 전갈자리와는 결코 마주치지 않고 반대편 하늘에서 떠오릅니다.',
      symbolism: '불굴의 투지와 모험 · 영웅의 서사시 · 겨울 하늘의 절대 지배자',
    },
    astronomicalSignificance: {
      constellationFamily: '오리온 성좌군 (Orion Family)',
      bestSeason: '겨울철 (12월 ~ 2월 남쪽 하늘)',
      distanceLy: '리겔 860 광년 / 베텔게우스 550 광년',
      notableObjects: ['M42 오리온 대성운 (육안 관측 가능)', '말머리 암흑 성운 (Barnard 33)', '바너드 루프 (Barnard Loop)'],
      navigationalRole: '삼태성(Alnitak, Alnilam, Mintaka)의 기울어진 직선은 동남쪽의 시리우스(Sirius)와 서북쪽의 알데바란(Aldebaran)을 가리킵니다.',
    },
    stars: [
      { x: 65, y: 115, label: 'Betelgeuse', mag: 3, bayerName: 'α Ori', stellarType: 'M1-2 Ia-ab 폭발 임박 적색초거성', magnitudeValue: 0.50 },
      { x: 108, y: 120, label: 'Bellatrix', mag: 2, bayerName: 'γ Ori', stellarType: 'B2 III 여전사의 청색 거성', magnitudeValue: 1.64 },
      { x: 76, y: 146, label: 'Alnitak', mag: 2, bayerName: 'ζ Ori', stellarType: 'O9.5 Ib 삼태성 동쪽 별', magnitudeValue: 1.77 },
      { x: 85, y: 144, label: 'Alnilam', mag: 2, bayerName: 'ε Ori', stellarType: 'B0 Ia 삼태성 중앙 청색 초거성', magnitudeValue: 1.69 },
      { x: 94, y: 142, label: 'Mintaka', mag: 2, bayerName: 'δ Ori', stellarType: 'O9.5 II 삼태성 서쪽 다중성', magnitudeValue: 2.23 },
      { x: 70, y: 175, label: 'Saiph', mag: 2, bayerName: 'κ Ori', stellarType: 'B0.5 Ia 남동쪽 초거성', magnitudeValue: 2.07 },
      { x: 105, y: 172, label: 'Rigel', mag: 3, bayerName: 'β Ori', stellarType: 'B8 Ia 청색 초거성 (광도 12만배)', magnitudeValue: 0.13 },
    ],
    lines: [
      [0, 1],
      [0, 2],
      [1, 4],
      [2, 3],
      [3, 4],
      [2, 5],
      [4, 6],
      [5, 6],
    ],
    centerPoint: { x: 85, y: 145 },
  },
];

/**
 * Finds an asterism by its unique identifier
 */
export function findAsterismById(id: string): CelestialAsterism | undefined {
  return CELESTIAL_ASTERISMS.find((a) => a.id === id);
}

/**
 * Finds if pointer coordinates are close to an asterism's center or stars (within radius)
 */
export function findHoveredAsterism(
  x: number,
  y: number,
  asterisms: CelestialAsterism[] = CELESTIAL_ASTERISMS,
  radius: number = 38
): CelestialAsterism | null {
  for (let i = 0; i < asterisms.length; i++) {
    const a = asterisms[i];
    const dx = x - a.centerPoint.x;
    const dy = y - a.centerPoint.y;
    if (Math.sqrt(dx * dx + dy * dy) <= radius) {
      return a;
    }

    // Also check distance to individual stars
    for (let s = 0; s < a.stars.length; s++) {
      const sx = x - a.stars[s].x;
      const sy = y - a.stars[s].y;
      if (Math.sqrt(sx * sx + sy * sy) <= 22) {
        return a;
      }
    }
  }

  return null;
}

/**
 * Renders glowing celestial constellation lines, stars, and retro nameplates
 */
export function renderStarChart(
  ctx: CanvasRenderingContext2D,
  asterisms: CelestialAsterism[],
  globalAlpha: number,
  tick: number,
  hoveredId?: string | null,
  selectedId?: string | null
): void {
  if (globalAlpha <= 0.02) return;

  ctx.save();

  for (let aIdx = 0; aIdx < asterisms.length; aIdx++) {
    const ast = asterisms[aIdx];
    const isHovered = hoveredId === ast.id;
    const isSelected = selectedId === ast.id;
    const baseAlpha = (isSelected ? 1.0 : isHovered ? 0.95 : 0.65) * globalAlpha;

    // 1. Draw dashed connecting lines
    ctx.strokeStyle = isSelected ? '#fde047' : ast.color;
    ctx.lineWidth = isSelected ? 1.5 : 1;
    ctx.globalAlpha = baseAlpha * (isSelected ? 0.95 : 0.75);
    ctx.setLineDash(isSelected ? [5, 2] : [4, 3]);

    for (let l = 0; l < ast.lines.length; l++) {
      const [i1, i2] = ast.lines[l];
      const p1 = ast.stars[i1];
      const p2 = ast.stars[i2];
      if (!p1 || !p2) continue;

      ctx.beginPath();
      ctx.moveTo(Math.floor(p1.x), Math.floor(p1.y));
      ctx.lineTo(Math.floor(p2.x), Math.floor(p2.y));
      ctx.stroke();
    }

    ctx.setLineDash([]); // Reset line dash

    // 2. Draw asterism stars
    for (let sIdx = 0; sIdx < ast.stars.length; sIdx++) {
      const s = ast.stars[sIdx];
      const pulse = 0.8 + 0.2 * Math.sin(tick * 0.08 + s.x * 0.1);

      // Star core
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = baseAlpha * pulse;
      const starMag = isSelected ? s.mag + 1 : s.mag;
      ctx.fillRect(Math.floor(s.x) - Math.floor(starMag / 2), Math.floor(s.y) - Math.floor(starMag / 2), starMag, starMag);

      // Diamond star halo
      ctx.fillStyle = isSelected ? '#fde047' : ast.color;
      ctx.globalAlpha = baseAlpha * (isSelected ? 0.65 : 0.45) * pulse;
      ctx.fillRect(Math.floor(s.x) - starMag, Math.floor(s.y), starMag * 2, 1);
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y) - starMag, 1, starMag * 2);

      // Star label if hovered or selected
      if ((isHovered || isSelected) && s.label) {
        ctx.fillStyle = isSelected ? '#fef08a' : '#cbd5e1';
        ctx.font = '7px monospace';
        ctx.globalAlpha = baseAlpha;
        ctx.fillText(s.label, Math.floor(s.x) + 4, Math.floor(s.y) - 3);
      }
    }

    // 3. Constellation Header Banner Nameplate
    const cp = ast.centerPoint;
    ctx.fillStyle = isSelected ? '#fde047' : ast.color;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.globalAlpha = baseAlpha;
    ctx.fillText(`✦ ${ast.name} ✦`, cp.x, cp.y - 14);

    if (isHovered || isSelected) {
      ctx.fillStyle = isSelected ? '#fef08a' : '#94a3b8';
      ctx.font = '6.5px monospace';
      ctx.fillText(`${ast.koreanName}`, cp.x, cp.y - 5);
    }

    // 4. Highlight reticle if selected
    if (isSelected) {
      const ringRadius = 26 + 3 * Math.sin(tick * 0.1);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(tick * 0.12);
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Corner reticle crosshairs
      ctx.beginPath();
      ctx.moveTo(cp.x - ringRadius - 4, cp.y);
      ctx.lineTo(cp.x - ringRadius + 2, cp.y);
      ctx.moveTo(cp.x + ringRadius - 2, cp.y);
      ctx.lineTo(cp.x + ringRadius + 4, cp.y);
      ctx.moveTo(cp.x, cp.y - ringRadius - 4);
      ctx.lineTo(cp.x, cp.y - ringRadius + 2);
      ctx.moveTo(cp.x, cp.y + ringRadius - 2);
      ctx.lineTo(cp.x, cp.y + ringRadius + 4);
      ctx.stroke();
    }
  }

  ctx.restore();
}
