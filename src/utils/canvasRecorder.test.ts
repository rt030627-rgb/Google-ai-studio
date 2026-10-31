/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCamcorderTime,
  getSupportedVideoMimeType,
} from './canvasRecorder.ts';

test('formatCamcorderTime formats elapsed milliseconds into MM:SS:CC camcorder timer', () => {
  assert.equal(formatCamcorderTime(0), '00:00:00');
  assert.equal(formatCamcorderTime(1500), '00:01:50');
  assert.equal(formatCamcorderTime(65230), '01:05:23');
  assert.equal(formatCamcorderTime(120950), '02:00:95');
});

test('getSupportedVideoMimeType falls back gracefully in non-browser Node environments', () => {
  const mime = getSupportedVideoMimeType();
  assert.ok(typeof mime === 'string');
  assert.ok(mime.includes('video/'));
});
