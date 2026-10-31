import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAltitudeTelemetry,
  generateWatermarkText,
} from './altitudeTelemetry.js';
import {
  createInitialArcadeState,
  getComboMultiplier,
  spawnStardustRing,
  updateArcadeGame,
  type StardustRing,
} from './arcadeRingEngine.js';
import {
  createBlackHole,
  calculateGravitationalPull,
} from './blackHoleEngine.js';
import {
  generateForkedLightning,
  updateLightningBolts,
  generateStElmoSparks,
  type LightningBolt,
} from './thunderstormEngine.js';
import {
  createOrbitalSatellite,
  updateOrbitalSatellites,
  findHoveredSatellite,
  type SatelliteType,
} from './satelliteEngine.js';
import {
  updateGliderFlight,
  createInitialGliderState,
} from './gliderFlightEngine.js';
import {
  sanitizeSettings,
  DEFAULT_USER_SETTINGS,
} from './settingsStorage.js';
import { ParticlePool } from './particlePool.js';
import { CanvasContextRecoveryManager } from './canvasContextRecovery.js';
import { sanitizeFlightSession, saveFlightSession, loadSavedFlightSession } from './flightSessionStorage.js';

test('Simulation Stress & Boundary Resiliency Suite', async (t) => {
  await t.test('Telemetry engine handles 1,000 rapid descent cycles without NaN or drift', () => {
    for (let i = 0; i < 1000; i++) {
      const progress = (i * 0.001) % 1.0;
      const tele = calculateAltitudeTelemetry(progress, 'mach', i % 2 === 0, i % 3);
      assert.ok(tele.altitudeKm >= 0 && tele.altitudeKm <= 140);
      assert.ok(Number.isFinite(tele.machNumber));
      assert.ok(Number.isFinite(tele.pressureHpa));
      assert.ok(Number.isFinite(tele.temperatureC));
      assert.ok(tele.currentLayer.name.length > 0);
    }
  });

  await t.test('Watermark generator handles extreme inputs cleanly', () => {
    const wm1 = generateWatermarkText(0, 'Dawn', 'Clear');
    assert.ok(wm1.includes('0.0 KM'));

    const wm2 = generateWatermarkText(140.0, 'Midnight', 'Thunderstorm');
    assert.ok(wm2.includes('140 KM'));

    const wm3 = generateWatermarkText(42.5, '', '');
    assert.ok(wm3.includes('42.5 KM'));
  });

  await t.test('Arcade ring engine survives high-velocity collision flood and caps combos safely', () => {
    const state = createInitialArcadeState();
    const rings: StardustRing[] = [];

    // Spawn 50 rings
    for (let i = 0; i < 50; i++) {
      rings.push(spawnStardustRing(480, 300, rings));
    }
    assert.equal(rings.length, 50);

    // Simulate 200 frame updates with star position positioned for collections
    for (let f = 0; f < 200; f++) {
      const result = updateArcadeGame(state, rings, 240, 150, 480, 300, 1.0);
      assert.ok(Number.isFinite(result.pointsEarned));
      assert.ok(result.newlyCollectedCount >= 0);
      assert.ok(Number.isFinite(state.score));
      assert.ok(state.combo >= 0);
      assert.ok(rings.length <= 50);
    }

    assert.equal(getComboMultiplier(0), 1);
    assert.equal(getComboMultiplier(1), 1);
    assert.equal(getComboMultiplier(3), 2);
    assert.equal(getComboMultiplier(6), 4);
    assert.equal(getComboMultiplier(15), 8);
    assert.equal(getComboMultiplier(999), 8); // Max combo cap
  });

  await t.test('Black hole engine maintains finite gravity vector under singularity proximity', () => {
    const bh = createBlackHole(480, 300);
    bh.intensity = 1.0;

    // Test pull right at the singularity center (distance = 0)
    const pullAtCenter = calculateGravitationalPull(bh, bh.x, bh.y);
    assert.ok(Number.isFinite(pullAtCenter.pullX));
    assert.ok(Number.isFinite(pullAtCenter.pullY));
    assert.equal(pullAtCenter.distance, 0);

    // Test pull within event horizon
    const pullClose = calculateGravitationalPull(bh, bh.x + 1, bh.y);
    assert.ok(Number.isFinite(pullClose.pullX));
    assert.ok(Number.isFinite(pullClose.pullY));
    assert.ok(pullClose.distance > 0);

    // Test pull far away (outside 180px radius)
    const pullFar = calculateGravitationalPull(bh, 900, 900);
    assert.equal(pullFar.pullX, 0);
    assert.equal(pullFar.pullY, 0);
  });

  await t.test('Thunderstorm lightning generator and spark emitter survive rapid invocation', () => {
    const bolts: LightningBolt[] = [];

    for (let i = 0; i < 30; i++) {
      const bolt = generateForkedLightning(240, 20, 260, 480);
      assert.ok(bolt.segments.length >= 3);
      bolts.push(bolt);
    }

    // Update bolts through lifecycle
    for (let frame = 0; frame < 100; frame++) {
      const peakIllumination = updateLightningBolts(bolts);
      assert.ok(peakIllumination >= 0 && peakIllumination <= 1);
    }

    // All bolts should safely decay to empty
    assert.equal(bolts.length, 0);

    // Verify sparks generation
    const sparks = generateStElmoSparks(240, 150, 32, 0);
    assert.ok(Array.isArray(sparks));
    for (const spark of sparks) {
      assert.ok(Number.isFinite(spark.x));
      assert.ok(Number.isFinite(spark.y));
      assert.ok(spark.alpha >= 0 && spark.alpha <= 1);
    }
  });

  await t.test('Orbital satellites engine handles multi-craft traversal and boundary culling', () => {
    const types: SatelliteType[] = ['iss', 'hubble', 'voyager', 'starlink'];
    const satellites = types.map((t) => createOrbitalSatellite(t, 480, 300));
    assert.equal(satellites.length, 4);

    // Simulate 300 frames of orbital motion
    for (let f = 0; f < 300; f++) {
      updateOrbitalSatellites(satellites, 480, 1.0);
      assert.ok(satellites.length >= 0 && satellites.length <= 4);
    }

    // Test hover collision search
    const testSat = createOrbitalSatellite('iss', 480, 300);
    testSat.x = 200;
    testSat.y = 80;
    const hit = findHoveredSatellite([testSat], 205, 82);
    assert.ok(hit !== null);
    assert.equal(hit?.name, testSat.name);

    const miss = findHoveredSatellite([testSat], 50, 50);
    assert.equal(miss, null);
  });

  await t.test('Glider flight controls withstand full-range steering and roll angle boundaries', () => {
    let glider = createInitialGliderState();

    // Steer hard left and up
    for (let i = 0; i < 50; i++) {
      glider = updateGliderFlight(glider, { left: true, up: true });
    }
    assert.ok(glider.bankAngle <= -0.15);
    assert.ok(glider.offsetX >= -130);
    assert.ok(glider.offsetY >= -65);

    // Steer hard right and down
    for (let i = 0; i < 100; i++) {
      glider = updateGliderFlight(glider, { right: true, down: true });
    }
    assert.ok(glider.bankAngle >= 0.15);
    assert.ok(glider.offsetX <= 130);
    assert.ok(glider.offsetY <= 75);

    // Release steering to neutral
    for (let i = 0; i < 100; i++) {
      glider = updateGliderFlight(glider, {});
    }
    assert.ok(Math.abs(glider.bankAngle) < 0.05);
  });

  await t.test('Settings storage engine safely normalizes invalid keys and corrupted fields', () => {
    const corruptedInput = {
      masterVolume: 'one hundred percent',
      windVolume: null,
      radioVolume: undefined,
      sfxVolume: -999,
      isMuted: 'yes',
      muteOnBlur: 1,
      particleBudget: 9999,
      screenShake: 'violent',
      crtScanlines: null,
      bloomGlow: undefined,
      fpsLimit: 240,
      reduceMotion: 'disable',
      autoHideHud: 'false',
    };

    const sanitized = sanitizeSettings(corruptedInput);
    assert.equal(sanitized.masterVolume, DEFAULT_USER_SETTINGS.masterVolume);
    assert.equal(sanitized.sfxVolume, 0); // Clamped from -999 to 0
    assert.equal(sanitized.particleBudget, 'balanced');
    assert.equal(sanitized.fpsLimit, 60);
    assert.equal(sanitized.crtScanlines, DEFAULT_USER_SETTINGS.crtScanlines);
    assert.equal(sanitized.screenShake, DEFAULT_USER_SETTINGS.screenShake);
  });

  await t.test('Zero-allocation particle pool withstands 10,000 rapid cycles under heavy concurrency', () => {
    const pool = new ParticlePool(250);

    for (let cycle = 0; cycle < 1000; cycle++) {
      // Spawn 10 particles per cycle
      for (let s = 0; s < 10; s++) {
        pool.spawn({
          x: 240,
          y: 150,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 6,
          color: '#38bdf8',
          maxLife: 15,
        });
      }

      // Update and prune
      pool.update((p) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        return p.life < p.maxLife;
      });

      assert.ok(pool.getActiveCount() <= 250);
    }

    assert.ok(pool.getActiveCount() >= 0);
  });

  await t.test('Canvas context recovery manager safely survives repeated GPU loss and restoration storms', () => {
    const mgr = new CanvasContextRecoveryManager();
    let lostCount = 0;
    let restoredCount = 0;

    mgr.attach(
      {
        addEventListener: () => {},
        removeEventListener: () => {},
        getContext: () => ({ imageSmoothingEnabled: false } as unknown as CanvasRenderingContext2D),
      } as unknown as HTMLCanvasElement,
      {
        onContextLost: () => {
          lostCount++;
        },
        onContextRestored: () => {
          restoredCount++;
        },
      }
    );

    // Simulate 50 back-to-back GPU sleep/wake loss storms
    for (let i = 0; i < 50; i++) {
      mgr.triggerSyntheticLoss();
      assert.equal(mgr.getStatus().isContextLost, true);

      mgr.handleContextRestored({} as Event);
      assert.equal(mgr.getStatus().isContextLost, false);
    }

    assert.equal(lostCount, 50);
    assert.equal(restoredCount, 50);
    assert.equal(mgr.getStatus().totalLossCount, 50);
  });

  await t.test('Flight session storage safely sanitizes 1,000 extreme and randomized payloads', () => {
    const rawInputs = [
      null,
      undefined,
      {},
      { cycleProgress: -999, speedMode: 'invalid', weatherMode: 'garbage' },
      { cycleProgress: 999, atmosphereSettings: { cloudDensityScale: -5, windSpeedScale: 100 } },
      { isAutoCycle: 'not_a_boolean', showScanlines: 12345 },
    ];

    for (let i = 0; i < 1000; i++) {
      const base = rawInputs[i % rawInputs.length];
      const sanitized = sanitizeFlightSession(base);
      assert.ok(sanitized.cycleProgress >= 0.0 && sanitized.cycleProgress <= 1.0);
      assert.ok(['cinematic', 'normal', 'mach'].includes(sanitized.speedMode));
      assert.ok(['auto', 'clear', 'rain', 'snow', 'mist', 'aurora'].includes(sanitized.weatherMode));
      assert.ok(typeof sanitized.showScanlines === 'boolean');
      assert.ok(sanitized.atmosphereSettings.cloudDensityScale >= 0.5 && sanitized.atmosphereSettings.cloudDensityScale <= 2.0);
    }
  });
});
