/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isNightTime,
  getSystemTimeAutoThemeConfig,
  applyThemeToDocument,
} from './systemTimeAutoTheme';

describe('System Time Night Mode Auto-Detection & Midnight Theme Engine', () => {
  it('correctly detects nighttime between 20:00 (8 PM) and 05:59 (6 AM)', () => {
    // 20:00 (8:00 PM) - exact boundary start
    const date20 = new Date('2026-11-02T20:00:00');
    assert.equal(isNightTime(date20), true);

    // 23:45 (11:45 PM) - late night
    const date23 = new Date('2026-11-02T23:45:00');
    assert.equal(isNightTime(date23), true);

    // 00:00 (Midnight)
    const date00 = new Date('2026-11-02T00:00:00');
    assert.equal(isNightTime(date00), true);

    // 02:30 (2:30 AM)
    const date02 = new Date('2026-11-02T02:30:00');
    assert.equal(isNightTime(date02), true);

    // 05:59 (5:59 AM) - right before morning transition
    const date0559 = new Date('2026-11-02T05:59:59');
    assert.equal(isNightTime(date0559), true);
  });

  it('correctly detects daytime between 06:00 (6 AM) and 19:59 (7:59 PM)', () => {
    // 06:00 (6:00 AM) - morning boundary
    const date06 = new Date('2026-11-02T06:00:00');
    assert.equal(isNightTime(date06), false);

    // 12:00 (Noon)
    const date12 = new Date('2026-11-02T12:00:00');
    assert.equal(isNightTime(date12), false);

    // 17:30 (5:30 PM)
    const date17 = new Date('2026-11-02T17:30:00');
    assert.equal(isNightTime(date17), false);

    // 19:59 (7:59 PM) - right before evening night transition
    const date1959 = new Date('2026-11-02T19:59:59');
    assert.equal(isNightTime(date1959), false);
  });

  it('handles invalid dates safely by falling back to current system time', () => {
    const invalidDate = new Date('invalid');
    const result = isNightTime(invalidDate);
    assert.equal(typeof result, 'boolean');
  });

  it('resolves dark theme and Midnight snow weather during night hours', () => {
    const nightDate = new Date('2026-11-02T22:15:00');
    const config = getSystemTimeAutoThemeConfig(nightDate);

    assert.equal(config.isNight, true);
    assert.equal(config.systemHours, 22);
    assert.equal(config.systemMinutes, 15);
    assert.equal(config.formattedTime, '22:15');
    assert.equal(config.themeMode, 'dark');
    assert.equal(config.targetPhaseId, 'midnight');
    assert.equal(config.targetPhaseIndex, 3);
    assert.equal(config.targetCycleProgress, 0.77);
    assert.equal(config.targetWeather, 'snow');
    assert.match(config.description, /야간 시간대/);
  });

  it('resolves daylight theme configuration during daytime hours', () => {
    const dayDate = new Date('2026-11-02T14:30:00');
    const config = getSystemTimeAutoThemeConfig(dayDate);

    assert.equal(config.isNight, false);
    assert.equal(config.systemHours, 14);
    assert.equal(config.systemMinutes, 30);
    assert.equal(config.formattedTime, '14:30');
    assert.equal(config.themeMode, 'light');
    assert.equal(config.targetPhaseId, 'golden');
    assert.equal(config.targetPhaseIndex, 1);
    assert.equal(config.targetCycleProgress, 0.50);
    assert.equal(config.targetWeather, 'clear');
    assert.match(config.description, /주간 시간대/);
  });

  it('safely executes applyThemeToDocument in non-browser/mock environment without throwing', () => {
    assert.doesNotThrow(() => {
      applyThemeToDocument('dark');
      applyThemeToDocument('light');
    });
  });
});
