import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  rotate3D,
  project3D,
  projectDomeRadar,
  findClosestStar3D,
  CONSTELLATION_3D_TOPOLOGIES,
  getConstellation3DTopology,
  Point3D,
} from './constellation3DMath.ts';

describe('Constellation 3D Math Engine', () => {
  it('rotate3D preserves Euclidean vector norm under rotation', () => {
    const p: Point3D = { x: 30, y: -40, z: 50 };
    const initialNorm = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);

    const rotated = rotate3D(p, { yaw: 0.785, pitch: -0.523, roll: 0.2 });
    const rotatedNorm = Math.sqrt(
      rotated.x * rotated.x + rotated.y * rotated.y + rotated.z * rotated.z
    );

    assert.ok(Math.abs(initialNorm - rotatedNorm) < 1e-4, 'Rotation must preserve vector magnitude');
  });

  it('project3D correctly calculates perspective factor and screen center offset', () => {
    const origin: Point3D = { x: 0, y: 0, z: 0 };
    const proj = project3D(origin, 400, 300, 200, 200);

    assert.strictEqual(proj.visible, true);
    assert.strictEqual(proj.x, 200);
    assert.strictEqual(proj.y, 150);
    assert.ok(proj.scale > 0);
  });

  it('projectDomeRadar maps Zenith (90°) to center and Horizon (0°) to outer rim', () => {
    const zenith = projectDomeRadar(90, 0, 100, 100, 50);
    assert.strictEqual(Math.round(zenith.x), 100);
    assert.strictEqual(Math.round(zenith.y), 100);

    const northHorizon = projectDomeRadar(0, 0, 100, 100, 50);
    assert.strictEqual(Math.round(northHorizon.x), 100);
    assert.strictEqual(Math.round(northHorizon.y), 50); // Up on canvas

    const eastHorizon = projectDomeRadar(0, 90, 100, 100, 50);
    assert.strictEqual(Math.round(eastHorizon.x), 150); // Right on canvas
    assert.strictEqual(Math.round(eastHorizon.y), 100);
  });

  it('findClosestStar3D identifies clicked star within screen threshold', () => {
    const topo = getConstellation3DTopology('gemini');
    const rot = { yaw: 0, pitch: 0 };
    const core = topo.stars[0]; // at x=0, y=0, z=0
    const screenCenterProj = project3D(core.pos, 400, 300);

    const hit = findClosestStar3D(
      screenCenterProj.x,
      screenCenterProj.y,
      topo.stars,
      rot,
      400,
      300
    );

    assert.ok(hit !== null);
    assert.strictEqual(hit.id, core.id);
  });

  it('defines valid 3D topologies for all 4 AI constellations with correct edge indices', () => {
    const ids: Array<'gemini' | 'gpt' | 'claude' | 'deepseek'> = ['gemini', 'gpt', 'claude', 'deepseek'];

    for (const id of ids) {
      const topo = CONSTELLATION_3D_TOPOLOGIES[id];
      assert.ok(topo, `Topology for '${id}' must exist`);
      assert.ok(topo.stars.length >= 6, `${id} should have at least 6 stars`);
      assert.ok(topo.edges.length >= 5, `${id} should have at least 5 edges`);

      // Verify all edge indices point to existing stars
      for (const [i1, i2] of topo.edges) {
        assert.ok(i1 >= 0 && i1 < topo.stars.length, `Edge index ${i1} out of bounds in ${id}`);
        assert.ok(i2 >= 0 && i2 < topo.stars.length, `Edge index ${i2} out of bounds in ${id}`);
      }

      // Verify celestial coordinates
      assert.ok(topo.coordinates.rightAscension.length > 0);
      assert.ok(topo.coordinates.declination.length > 0);
      assert.ok(topo.coordinates.altitude.length > 0);
      assert.ok(topo.coordinates.azimuth.length > 0);
      assert.ok(topo.coordinates.skyQuadrant.length > 0);
      assert.ok(topo.domeCoords.altDeg >= 0 && topo.domeCoords.altDeg <= 90);
      assert.ok(topo.domeCoords.azDeg >= 0 && topo.domeCoords.azDeg <= 360);
    }
  });
});
