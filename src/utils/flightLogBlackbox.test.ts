import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_FLIGHT_STATISTICS,
  sanitizeFlightStatistics,
  recordFlightMetrics,
  createProfileBackupJson,
  restoreProfileFromJson,
  loadFlightStatistics,
  saveFlightStatistics,
  FlightStatistics
} from './flightLogBlackbox.js';

describe('Flight Log Blackbox & Profile Backup Engine', () => {
  // Mock localStorage for Node test runner
  const storageMap = new Map<string, string>();
  // @ts-expect-error Mocking global localStorage
  global.localStorage = {
    getItem: (key: string) => storageMap.get(key) || null,
    setItem: (key: string, value: string) => storageMap.set(key, value),
    removeItem: (key: string) => storageMap.delete(key),
    clear: () => storageMap.clear()
  };

  beforeEach(() => {
    storageMap.clear();
  });

  it('sanitizeFlightStatistics returns default values for empty or null payloads', () => {
    const res = sanitizeFlightStatistics(null);
    assert.equal(res.totalDescentCycles, 0);
    assert.equal(res.totalKmTraveled, 0);
    assert.equal(res.ringsCollected, 0);
  });

  it('sanitizeFlightStatistics guards against NaN and negative values', () => {
    const raw = {
      totalDescentCycles: -10,
      totalKmTraveled: NaN,
      ringsCollected: 45,
      highestScore: 'invalid'
    };
    const res = sanitizeFlightStatistics(raw);
    assert.equal(res.totalDescentCycles, 0);
    assert.equal(res.totalKmTraveled, 0);
    assert.equal(res.ringsCollected, 45);
    assert.equal(res.highestScore, 0);
  });

  it('recordFlightMetrics accumulates values incrementally', () => {
    recordFlightMetrics({ totalKmTraveled: 100, ringsCollected: 5, highestScore: 1200 });
    const afterFirst = loadFlightStatistics();
    assert.equal(afterFirst.totalKmTraveled, 100);
    assert.equal(afterFirst.ringsCollected, 5);
    assert.equal(afterFirst.highestScore, 1200);

    recordFlightMetrics({ totalKmTraveled: 50, ringsCollected: 2, highestScore: 900 });
    const afterSecond = loadFlightStatistics();
    assert.equal(afterSecond.totalKmTraveled, 150);
    assert.equal(afterSecond.ringsCollected, 7);
    assert.equal(afterSecond.highestScore, 1200); // Preserves higher score
  });

  it('createProfileBackupJson produces a valid export and restoreProfileFromJson restores cleanly', () => {
    saveFlightStatistics({
      ...DEFAULT_FLIGHT_STATISTICS,
      totalDescentCycles: 12,
      totalKmTraveled: 1560,
      ringsCollected: 48,
      highestScore: 5400
    });

    const backupJson = createProfileBackupJson();
    assert.ok(typeof backupJson === 'string');
    assert.ok(backupJson.includes('pixel-descent-backup'));

    // Clear and restore
    storageMap.clear();
    const result = restoreProfileFromJson(backupJson);
    assert.equal(result.success, true);

    const restored = loadFlightStatistics();
    assert.equal(restored.totalDescentCycles, 12);
    assert.equal(restored.totalKmTraveled, 1560);
    assert.equal(restored.ringsCollected, 48);
    assert.equal(restored.highestScore, 5400);
  });

  it('restoreProfileFromJson rejects corrupted or unrecognized files', () => {
    const badResult = restoreProfileFromJson('{ "bad": true }');
    assert.equal(badResult.success, false);
    assert.equal(badResult.error, 'Unsupported format descriptor');

    const invalidJsonResult = restoreProfileFromJson('not json');
    assert.equal(invalidJsonResult.success, false);
  });
});
