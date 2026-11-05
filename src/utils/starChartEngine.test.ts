/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CELESTIAL_ASTERISMS,
  findHoveredAsterism,
  findAsterismById,
  renderStarChart,
} from './starChartEngine.ts';

test('CELESTIAL_ASTERISMS contains valid asterisms with stars and connected line indices', () => {
  assert.ok(CELESTIAL_ASTERISMS.length >= 5);

  for (const ast of CELESTIAL_ASTERISMS) {
    assert.ok(ast.name.length > 0);
    assert.ok(ast.koreanName.length > 0);
    assert.ok(ast.stars.length >= 4);
    assert.ok(ast.lines.length >= 3);
    assert.ok(ast.centerPoint.x > 0 && ast.centerPoint.x < 480);
    assert.ok(ast.centerPoint.y > 0 && ast.centerPoint.y < 300);

    // Verify all line index pairs point to valid stars
    for (const [i1, i2] of ast.lines) {
      assert.ok(i1 >= 0 && i1 < ast.stars.length);
      assert.ok(i2 >= 0 && i2 < ast.stars.length);
    }

    // Verify rich mythological lore and astronomical significance
    assert.ok(ast.mythologicalLore.origin.length > 0);
    assert.ok(ast.mythologicalLore.story.length > 20);
    assert.ok(ast.mythologicalLore.symbolism.length > 5);
    assert.ok(ast.astronomicalSignificance.constellationFamily.length > 0);
    assert.ok(ast.astronomicalSignificance.distanceLy.length > 0);
    assert.ok(ast.astronomicalSignificance.notableObjects.length >= 2);
    assert.ok(ast.astronomicalSignificance.navigationalRole.length > 10);
  }
});

test('findHoveredAsterism detects proximity to asterism centers and individual stars', () => {
  const firstAst = CELESTIAL_ASTERISMS[0];
  const hovered = findHoveredAsterism(firstAst.centerPoint.x, firstAst.centerPoint.y, CELESTIAL_ASTERISMS, 40);
  assert.equal(hovered?.id, firstAst.id);

  // Far away coordinates should return null
  const farAway = findHoveredAsterism(20, 280, CELESTIAL_ASTERISMS, 15);
  assert.equal(farAway, null);
});

test('findAsterismById retrieves exact asterism or returns undefined', () => {
  const ursa = findAsterismById('ursa-major');
  assert.ok(ursa !== undefined);
  assert.equal(ursa?.koreanName, '큰곰자리 (북두칠성)');

  const nonExistent = findAsterismById('unknown-star-99');
  assert.equal(nonExistent, undefined);
});

test('renderStarChart executes safely without throwing and renders selected highlight reticle', () => {
  const drawCalls: string[] = [];
  const mockCtx = {
    save: () => drawCalls.push('save'),
    restore: () => drawCalls.push('restore'),
    fillRect: (x: number, y: number, w: number, h: number) => drawCalls.push(`rect:${x},${y}`),
    fillText: (text: string, x: number, y: number) => drawCalls.push(`text:${text}`),
    beginPath: () => drawCalls.push('beginPath'),
    moveTo: () => drawCalls.push('moveTo'),
    lineTo: () => drawCalls.push('lineTo'),
    stroke: () => drawCalls.push('stroke'),
    arc: (x: number, y: number, r: number) => drawCalls.push(`arc:${Math.round(x)},${Math.round(y)},${Math.round(r)}`),
    setLineDash: () => drawCalls.push('setLineDash'),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    textAlign: '',
    font: '',
  } as unknown as CanvasRenderingContext2D;

  // Zero alpha early return
  renderStarChart(mockCtx, CELESTIAL_ASTERISMS, 0.0, 0);
  assert.equal(drawCalls.length, 0);

  // Active rendering with selected asterism
  renderStarChart(mockCtx, CELESTIAL_ASTERISMS, 1.0, 10, 'ursa-major', 'ursa-major');
  assert.ok(drawCalls.includes('save'));
  assert.ok(drawCalls.includes('restore'));
  assert.ok(drawCalls.some((c) => c.startsWith('text:✦ URSA MAJOR')));
  // Should draw selected circular reticle
  assert.ok(drawCalls.some((c) => c.startsWith('arc:98,62')));
});

test('computeAsterismBounds correctly calculates AABB for stars and all built-in asterisms have bounds', () => {
  for (const ast of CELESTIAL_ASTERISMS) {
    assert.ok(ast.bounds !== undefined);
    assert.ok(ast.bounds.minX <= ast.bounds.maxX);
    assert.ok(ast.bounds.minY <= ast.bounds.maxY);

    // Verify all stars fall inside bounds
    for (const star of ast.stars) {
      assert.ok(star.x >= ast.bounds.minX);
      assert.ok(star.x <= ast.bounds.maxX);
      assert.ok(star.y >= ast.bounds.minY);
      assert.ok(star.y <= ast.bounds.maxY);
    }
  }
});

test('isAsterismSelected accurately matches single string, array, and Set collections', async () => {
  const { isAsterismSelected } = await import('./starChartEngine.ts');

  // Single string
  assert.equal(isAsterismSelected('ursa-major', 'ursa-major'), true);
  assert.equal(isAsterismSelected('orion', 'ursa-major'), false);
  assert.equal(isAsterismSelected('ursa-major', null), false);
  assert.equal(isAsterismSelected('ursa-major', undefined), false);

  // Array of active constellations
  assert.equal(isAsterismSelected('ursa-major', ['ursa-major', 'orion', 'cygnus']), true);
  assert.equal(isAsterismSelected('cassiopeia', ['ursa-major', 'orion']), false);

  // Set collection
  const activeSet = new Set(['cassiopeia', 'gemini-twins']);
  assert.equal(isAsterismSelected('cassiopeia', activeSet), true);
  assert.equal(isAsterismSelected('ursa-major', activeSet), false);
});

test('renderStarChart batches line segments efficiently into minimal stroke calls', () => {
  const strokes: string[] = [];
  let pathMoveCalls = 0;
  let pathLineCalls = 0;

  const mockCtx = {
    save: () => {},
    restore: () => {},
    fillRect: () => {},
    fillText: () => {},
    beginPath: () => {},
    moveTo: () => { pathMoveCalls++; },
    lineTo: () => { pathLineCalls++; },
    stroke: () => { strokes.push('stroke'); },
    arc: () => {},
    setLineDash: () => {},
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    textAlign: '',
    font: '',
  } as unknown as CanvasRenderingContext2D;

  const totalLinesInAllAsterisms = CELESTIAL_ASTERISMS.reduce((acc, a) => acc + a.lines.length, 0);
  assert.ok(totalLinesInAllAsterisms >= 25, `Expected at least 25 lines, got ${totalLinesInAllAsterisms}`);

  // Render all asterisms without selection
  renderStarChart(mockCtx, CELESTIAL_ASTERISMS, 1.0, 0);

  // Batching verification: lineTo calls match total line segments, but stroke calls are 1 per asterism
  assert.equal(pathLineCalls, totalLinesInAllAsterisms);
  assert.equal(strokes.length, CELESTIAL_ASTERISMS.length, 'Stroke calls must equal number of asterisms, NOT line count');
  assert.ok(strokes.length < totalLinesInAllAsterisms / 4, 'Stroke calls should be significantly batched');
});

test('renderStarChart handles multiple simultaneous active constellations with unified line batches and reticles', () => {
  const arcs: string[] = [];
  const reticleCrosshairs: string[] = [];

  const mockCtx = {
    save: () => {},
    restore: () => {},
    fillRect: () => {},
    fillText: () => {},
    beginPath: () => {},
    moveTo: (x: number, y: number) => { reticleCrosshairs.push(`moveTo:${Math.round(x)},${Math.round(y)}`); },
    lineTo: (x: number, y: number) => { reticleCrosshairs.push(`lineTo:${Math.round(x)},${Math.round(y)}`); },
    stroke: () => {},
    arc: (x: number, y: number, r: number) => { arcs.push(`arc:${Math.round(x)},${Math.round(y)}`); },
    setLineDash: () => {},
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    textAlign: '',
    font: '',
  } as unknown as CanvasRenderingContext2D;

  // Select 3 constellations simultaneously
  const multipleSelected = ['ursa-major', 'orion', 'cygnus'];
  renderStarChart(mockCtx, CELESTIAL_ASTERISMS, 1.0, 10, null, multipleSelected);

  // Should have drawn reticle arcs for all 3 selected constellations
  assert.equal(arcs.length, 3);
  assert.ok(arcs.includes('arc:98,62'));   // Ursa Major center
  assert.ok(arcs.includes('arc:85,145'));  // Orion center
  assert.ok(arcs.includes('arc:390,135')); // Cygnus center
});

test('renderStarChart respects viewport culling and skips offscreen asterisms', () => {
  const renderedHeaders: string[] = [];

  const mockCtx = {
    save: () => {},
    restore: () => {},
    fillRect: () => {},
    fillText: (text: string) => {
      if (text.startsWith('✦')) renderedHeaders.push(text);
    },
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    arc: () => {},
    setLineDash: () => {},
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    textAlign: '',
    font: '',
  } as unknown as CanvasRenderingContext2D;

  // Viewport restricted to top-left quadrant [0, 0] to [160, 100] (contains only Ursa Major)
  renderStarChart(mockCtx, CELESTIAL_ASTERISMS, 1.0, 0, null, null, {
    cullOffscreen: true,
    viewport: { minX: 0, minY: 0, maxX: 160, maxY: 100 },
  });

  // Only Ursa Major should be rendered
  assert.equal(renderedHeaders.length, 1);
  assert.equal(renderedHeaders[0], '✦ URSA MAJOR ✦');
});

