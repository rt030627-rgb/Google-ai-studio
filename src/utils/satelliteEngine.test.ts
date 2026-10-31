import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SATELLITE_CONFIGS,
  createOrbitalSatellite,
  updateOrbitalSatellites,
  findHoveredSatellite,
  SatelliteType,
} from './satelliteEngine.ts';

describe('Orbital Satellite Engine', () => {
  it('should define all 4 iconic satellites with technical specs', () => {
    const types: SatelliteType[] = ['iss', 'hubble', 'voyager', 'starlink'];
    for (const t of types) {
      const cfg = SATELLITE_CONFIGS[t];
      assert.ok(cfg.name.length > 0);
      assert.ok(cfg.designation.length > 0);
      assert.ok(cfg.altitudeKm >= 100);
      assert.ok(cfg.orbitSpeedKmS > 5);
      assert.ok(cfg.width > 0);
    }
  });

  it('should create satellite with directional traversal kinematics', () => {
    const l2rSat = createOrbitalSatellite('iss', 480, 300, 'left-to-right');
    assert.ok(l2rSat.vx > 0);
    assert.strictEqual(l2rSat.x, -50);

    const r2lSat = createOrbitalSatellite('hubble', 480, 300, 'right-to-left');
    assert.ok(r2lSat.vx < 0);
    assert.strictEqual(r2lSat.x, 530);
  });

  it('should detect cursor hover on satellite bounding box', () => {
    const sat = createOrbitalSatellite('iss', 480, 300);
    sat.x = 240;
    sat.y = 80;
    const satellites = [sat];

    const hit = findHoveredSatellite(satellites, 245, 82);
    assert.ok(hit !== null);
    assert.strictEqual(hit?.name, sat.name);

    const miss = findHoveredSatellite(satellites, 300, 200);
    assert.strictEqual(miss, null);
  });

  it('should update positions and cull offscreen satellites', () => {
    const sat = createOrbitalSatellite('voyager', 480, 300);
    sat.x = 200;
    const initialX = sat.x;
    const satellites = [sat];

    updateOrbitalSatellites(satellites, 1.0, 480);
    assert.notStrictEqual(sat.x, initialX);

    // Force offscreen beyond 480 + 80
    sat.x = 600;
    sat.vx = 1.0;
    updateOrbitalSatellites(satellites, 1.0, 480);
    assert.strictEqual(satellites.length, 0);
  });
});
