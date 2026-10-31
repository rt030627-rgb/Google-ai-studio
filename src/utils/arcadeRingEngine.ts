/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StardustRing {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  glowColor: string;
  pointsValue: number;
  collected: boolean;
  collectAnim: number; // 0 to 1 scaling expansion on collect
  pulsePhase: number;
}

export interface ArcadeGameState {
  isActive: boolean;
  score: number;
  combo: number;
  maxCombo: number;
  ringsCollected: number;
  highScore: number;
  comboTimer: number; // Decrements each frame, drops combo if reaching 0
  recentCollectPopup: { text: string; color: string; timer: number; x: number; y: number } | null;
}

const ARCADE_HIGH_SCORE_STORAGE_KEY = 'gemini_descent_arcade_high_score';

export function loadArcadeHighScore(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const saved = localStorage.getItem(ARCADE_HIGH_SCORE_STORAGE_KEY);
    return saved ? parseInt(saved, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function saveArcadeHighScore(score: number): void {
  if (typeof window === 'undefined') return;
  try {
    const currentHigh = loadArcadeHighScore();
    if (score > currentHigh) {
      localStorage.setItem(ARCADE_HIGH_SCORE_STORAGE_KEY, score.toString());
    }
  } catch {
    // Ignore storage errors
  }
}

export function createInitialArcadeState(): ArcadeGameState {
  return {
    isActive: false,
    score: 0,
    combo: 0,
    maxCombo: 0,
    ringsCollected: 0,
    highScore: loadArcadeHighScore(),
    comboTimer: 0,
    recentCollectPopup: null,
  };
}

export function getComboMultiplier(combo: number): number {
  if (combo >= 10) return 8;
  if (combo >= 6) return 4;
  if (combo >= 3) return 2;
  return 1;
}

export function spawnStardustRing(
  width: number,
  height: number,
  existingRings: StardustRing[]
): StardustRing {
  const colors = [
    { color: '#38bdf8', glow: '#0284c7' }, // Cyan
    { color: '#818cf8', glow: '#4f46e5' }, // Indigo
    { color: '#fbbf24', glow: '#d97706' }, // Gold
    { color: '#ec4899', glow: '#be185d' }, // Neon Pink
  ];
  const chosen = colors[Math.floor(Math.random() * colors.length)];

  return {
    id: Date.now() + Math.random(),
    // Position within flight corridor
    x: Math.random() * (width * 0.6) + width * 0.2,
    y: height + 30, // Start just below bottom viewport
    radius: 18 + Math.floor(Math.random() * 8),
    color: chosen.color,
    glowColor: chosen.glow,
    pointsValue: 100,
    collected: false,
    collectAnim: 0,
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

export function updateArcadeGame(
  state: ArcadeGameState,
  rings: StardustRing[],
  starX: number,
  starY: number,
  width: number,
  height: number,
  speedMult: number = 1.0
): { newlyCollectedCount: number; pointsEarned: number } {
  let newlyCollectedCount = 0;
  let pointsEarned = 0;

  // Combo timer decay
  if (state.comboTimer > 0) {
    state.comboTimer -= 1 * speedMult;
    if (state.comboTimer <= 0) {
      state.combo = 0;
    }
  }

  // Decay collect popup
  if (state.recentCollectPopup) {
    state.recentCollectPopup.timer -= 1 * speedMult;
    state.recentCollectPopup.y -= 0.6 * speedMult;
    if (state.recentCollectPopup.timer <= 0) {
      state.recentCollectPopup = null;
    }
  }

  // Ring kinematics and collision check
  for (let i = rings.length - 1; i >= 0; i--) {
    const ring = rings[i];
    ring.pulsePhase += 0.06;

    if (ring.collected) {
      ring.collectAnim += 0.08 * speedMult;
      if (ring.collectAnim >= 1.0) {
        rings.splice(i, 1);
        continue;
      }
    } else {
      // Float upwards towards player descent
      ring.y -= (2.2 * speedMult);

      // Check collision with Gemini star
      const dist = Math.hypot(ring.x - starX, ring.y - starY);
      const hitRadius = ring.radius + 12;

      if (dist <= hitRadius) {
        ring.collected = true;
        ring.collectAnim = 0.05;
        newlyCollectedCount++;

        state.combo += 1;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        state.comboTimer = 140; // ~2.3 seconds to maintain combo
        state.ringsCollected += 1;

        const mult = getComboMultiplier(state.combo);
        const earned = ring.pointsValue * mult;
        pointsEarned += earned;
        state.score += earned;

        if (state.score > state.highScore) {
          state.highScore = state.score;
          saveArcadeHighScore(state.score);
        }

        state.recentCollectPopup = {
          text: mult > 1 ? `+${earned} (x${mult})` : `+${earned}`,
          color: ring.color,
          timer: 36,
          x: ring.x,
          y: ring.y - 12,
        };
      } else if (ring.y < -40) {
        // Offscreen top: remove missed ring
        rings.splice(i, 1);
        // Break combo if missed
        if (state.combo > 0) {
          state.combo = 0;
        }
      }
    }
  }

  // Automatically spawn rings when active
  if (state.isActive && rings.length < 4 && Math.random() < 0.035 * speedMult) {
    rings.push(spawnStardustRing(width, height, rings));
  }

  return { newlyCollectedCount, pointsEarned };
}

export function renderArcadeRings(
  ctx: CanvasRenderingContext2D,
  rings: StardustRing[],
  tick: number
) {
  for (const ring of rings) {
    ctx.save();
    ctx.translate(ring.x, ring.y);

    const pulseScale = 1.0 + Math.sin(ring.pulsePhase) * 0.08;

    if (ring.collected) {
      // Expanding nova burst ring upon collection
      const burstR = ring.radius * (1.0 + ring.collectAnim * 1.8);
      const alpha = Math.max(0, 1.0 - ring.collectAnim);
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2.5 * (1 - ring.collectAnim * 0.5);
      ctx.beginPath();
      ctx.ellipse(0, 0, burstR * 1.2, burstR * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Sparkle cross flare
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -2, 4, 4);
    } else {
      // Glowing retro 3D ellipse ring
      const rx = ring.radius * pulseScale;
      const ry = ring.radius * 0.42 * pulseScale;

      // Glow halo
      ctx.strokeStyle = ring.glowColor;
      ctx.lineWidth = 3.5;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 2, ry + 1.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Sharp Core Ring
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Cardinal navigation beacons on the ring rim
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.floor(-rx), -1, 2, 2);
      ctx.fillRect(Math.floor(rx) - 2, -1, 2, 2);
      ctx.fillRect(-1, Math.floor(-ry), 2, 2);
      ctx.fillRect(-1, Math.floor(ry) - 2, 2, 2);

      // Central Stardust Core
      ctx.fillStyle = ring.color;
      ctx.globalAlpha = 0.75 + Math.sin(ring.pulsePhase * 2) * 0.25;
      ctx.fillRect(-2, -2, 4, 4);
    }

    ctx.restore();
  }
}
