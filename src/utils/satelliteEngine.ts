/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SatelliteType = 'iss' | 'hubble' | 'voyager' | 'starlink';

export interface OrbitalSatellite {
  id: string;
  type: SatelliteType;
  name: string;
  designation: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  altitudeKm: number;
  orbitSpeedKmS: number;
  inclinationDeg: number;
  width: number;
  height: number;
  lore: string;
  accentColor: string;
  solarGlintPhase: number;
  life: number;
  maxLife: number;
}

export const SATELLITE_CONFIGS: Record<
  SatelliteType,
  {
    name: string;
    designation: string;
    altitudeKm: number;
    orbitSpeedKmS: number;
    inclinationDeg: number;
    width: number;
    height: number;
    lore: string;
    accentColor: string;
  }
> = {
  iss: {
    name: 'International Space Station (ISS)',
    designation: 'NORAD 25544 // ZARYA',
    altitudeKm: 120,
    orbitSpeedKmS: 7.66,
    inclinationDeg: 51.6,
    width: 38,
    height: 22,
    lore: 'Humanity’s orbital laboratory traversing the ionosphere boundary with massive photovoltaic wings.',
    accentColor: '#38bdf8',
  },
  hubble: {
    name: 'Hubble Space Telescope',
    designation: 'NORAD 20580 // HST',
    altitudeKm: 135,
    orbitSpeedKmS: 7.59,
    inclinationDeg: 28.5,
    width: 28,
    height: 16,
    lore: 'Legendary deep-field optical observatory scanning distant cosmic nebulae and early galactic light.',
    accentColor: '#fbbf24',
  },
  voyager: {
    name: 'Voyager 1 Interstellar Probe',
    designation: 'NASA JPL-1977-084A',
    altitudeKm: 140,
    orbitSpeedKmS: 17.0,
    inclinationDeg: 35.0,
    width: 26,
    height: 20,
    lore: 'Carrying the Golden Record across the heliopause into the uncharted interstellar medium.',
    accentColor: '#ec4899',
  },
  starlink: {
    name: 'Starlink Orbital Array',
    designation: 'STARLINK-G7-12',
    altitudeKm: 110,
    orbitSpeedKmS: 7.61,
    inclinationDeg: 53.0,
    width: 24,
    height: 12,
    lore: 'Next-generation low-earth satellite constellation forging global optical inter-satellite laser links.',
    accentColor: '#a78bfa',
  },
};

export function createOrbitalSatellite(
  type: SatelliteType,
  canvasWidth: number,
  canvasHeight: number,
  direction: 'left-to-right' | 'right-to-left' = 'left-to-right'
): OrbitalSatellite {
  const cfg = SATELLITE_CONFIGS[type];
  const isL2R = direction === 'left-to-right';
  const vx = isL2R ? 0.75 + Math.random() * 0.4 : -(0.75 + Math.random() * 0.4);

  return {
    id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    name: cfg.name,
    designation: cfg.designation,
    x: isL2R ? -50 : canvasWidth + 50,
    y: Math.random() * (canvasHeight * 0.28) + 18,
    vx,
    vy: (Math.random() - 0.5) * 0.15,
    altitudeKm: cfg.altitudeKm,
    orbitSpeedKmS: cfg.orbitSpeedKmS,
    inclinationDeg: cfg.inclinationDeg,
    width: cfg.width,
    height: cfg.height,
    lore: cfg.lore,
    accentColor: cfg.accentColor,
    solarGlintPhase: Math.random() * Math.PI * 2,
    life: 0,
    maxLife: 1500,
  };
}

export function updateOrbitalSatellites(
  satellites: OrbitalSatellite[],
  speedMult: number = 1.0,
  canvasWidth: number = 480
): void {
  for (let i = satellites.length - 1; i >= 0; i--) {
    const sat = satellites[i];
    sat.life++;
    sat.x += sat.vx * speedMult;
    sat.y += sat.vy * speedMult;
    sat.solarGlintPhase += 0.05 * speedMult;

    const isOffscreen = (sat.vx > 0 && sat.x > canvasWidth + 80) || (sat.vx < 0 && sat.x < -80);
    if (isOffscreen || sat.life > sat.maxLife) {
      satellites.splice(i, 1);
    }
  }
}

export function findHoveredSatellite(
  satellites: OrbitalSatellite[],
  cursorX: number,
  cursorY: number
): OrbitalSatellite | null {
  for (let i = satellites.length - 1; i >= 0; i--) {
    const sat = satellites[i];
    const dx = Math.abs(sat.x - cursorX);
    const dy = Math.abs(sat.y - cursorY);
    if (dx <= sat.width * 0.8 && dy <= sat.height * 0.8) {
      return sat;
    }
  }
  return null;
}

export function renderOrbitalSatellites(
  ctx: CanvasRenderingContext2D,
  satellites: OrbitalSatellite[],
  tick: number,
  hoveredSatId: string | null = null
) {
  for (const sat of satellites) {
    ctx.save();
    ctx.translate(Math.floor(sat.x), Math.floor(sat.y));

    const isHovered = sat.id === hoveredSatId;
    const glint = Math.sin(sat.solarGlintPhase);

    if (sat.type === 'iss') {
      // 1. ISS Pixel Art: Central pressurized truss + Golden Solar Arrays
      // Truss spine
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-15, -1, 30, 2);

      // Central habitation modules (Destiny, Columbus, Kibo)
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.fillStyle = '#38bdf8'; // Cupola observation window
      ctx.fillRect(-1, 2, 2, 2);

      // Left Solar Panel Array (Cyan/Gold photovoltaic cell blocks)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-18, -9, 6, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-18, -5, 6, 2);
      ctx.fillRect(-18, 3, 6, 2);

      // Right Solar Panel Array
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(12, -9, 6, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(12, -5, 6, 2);
      ctx.fillRect(12, 3, 6, 2);
    } else if (sat.type === 'hubble') {
      // 2. Hubble Space Telescope: Cylindrical body + twin solar wings
      // Optical cylinder
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-7, -4, 14, 8);
      ctx.fillStyle = '#1e293b'; // Aperture door
      ctx.fillRect(5, -3, 2, 6);

      // Solar arrays (twin wings)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-5, -11, 4, 6);
      ctx.fillRect(-5, 5, 4, 6);
      ctx.fillStyle = '#fbbf24'; // Gold thermal foil rim
      ctx.fillRect(-7, -4, 2, 8);
    } else if (sat.type === 'voyager') {
      // 3. Voyager 1: High-Gain Parabolic Dish + Science Boom
      // White parabolic dish antenna
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-3, 0, 7, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-1, -1, 2, 2); // Subreflector feed

      // Science boom & RTG generator
      ctx.fillStyle = '#475569';
      ctx.fillRect(4, -1, 9, 2);
      ctx.fillStyle = '#ec4899'; // RTG thermal power unit
      ctx.fillRect(12, -2, 3, 4);
    } else {
      // 4. Starlink: Compact rectangular chassis + single articulated solar wing
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-5, -2, 10, 4);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(5, -6, 4, 12);
      ctx.fillStyle = '#a78bfa';
      ctx.fillRect(-6, -1, 2, 2); // Phased array antenna
    }

    // Solar glint reflection flare on solar panels
    if (glint > 0.8) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = (glint - 0.8) * 5;
      ctx.fillRect(-1, -1, 3, 3);
      ctx.fillRect(-3, 0, 7, 1);
      ctx.fillRect(0, -3, 1, 7);
    }

    // Target tracking brackets & telemetry tag if hovered
    if (isHovered) {
      ctx.strokeStyle = sat.accentColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.9;
      const bSize = Math.max(sat.width, sat.height) * 0.75;
      ctx.strokeRect(-bSize, -bSize, bSize * 2, bSize * 2);

      ctx.font = '8px monospace';
      ctx.fillStyle = sat.accentColor;
      ctx.textAlign = 'center';
      ctx.fillText(sat.name, 0, -bSize - 5);
      ctx.fillText(`${sat.altitudeKm} km // ${sat.orbitSpeedKmS} km/s`, 0, bSize + 11);
    }

    ctx.restore();
  }
}
