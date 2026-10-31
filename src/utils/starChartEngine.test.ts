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
