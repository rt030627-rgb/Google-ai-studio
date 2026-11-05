import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendTelemetrySample,
  summarizeTelemetrySeries,
  generateSeedTelemetryHistory,
  MAX_TELEMETRY_HISTORY_POINTS,
  TELEMETRY_REFRESH_INTERVAL_MS,
  type TelemetryDataPoint,
} from './telemetryChartEngine';

test('Telemetry Chart Engine Suite', async (t) => {
  await t.test('TELEMETRY_REFRESH_INTERVAL_MS is exactly 600ms', () => {
    assert.equal(TELEMETRY_REFRESH_INTERVAL_MS, 600);
  });
  await t.test('appendTelemetrySample adds new samples and bounds to maxPoints', () => {
    let history: TelemetryDataPoint[] = [];

    for (let i = 0; i < 75; i++) {
      history = appendTelemetrySample(history, {
        altitudeKm: 140 - i,
        speedKmh: 1400 + i * 5,
        machNumber: 1.15 + i * 0.01,
        layerName: 'STRATO',
        color: '#34d399',
        timestamp: 1000000 + i * 1000,
      });
    }

    assert.equal(history.length, MAX_TELEMETRY_HISTORY_POINTS);
    assert.ok(history[history.length - 1].elapsedSeconds > 0);
    assert.ok(history[history.length - 1].descentRateKmh >= 0);
  });

  await t.test('summarizeTelemetrySeries calculates valid stats over a slice', () => {
    const seed = generateSeedTelemetryHistory(20, 50, 1.2);
    assert.equal(seed.length, 20);

    const summary = summarizeTelemetrySeries(seed);
    assert.ok(summary.maxAltitudeKm >= summary.minAltitudeKm);
    assert.ok(summary.maxSpeedKmh > 0);
    assert.ok(summary.durationSeconds > 0);
    assert.equal(summary.totalPoints, 20);
  });

  await t.test('summarizeTelemetrySeries returns safe defaults for empty history', () => {
    const summary = summarizeTelemetrySeries([]);
    assert.equal(summary.totalPoints, 0);
    assert.equal(summary.currentAltitudeKm, 140);
  });
});
