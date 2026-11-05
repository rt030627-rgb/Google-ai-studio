/**
 * Flight Telemetry History & Time-Series Engine
 * Collects, windows, and calculates real-time time-series telemetry points
 * for D3 visualization (altitude vs. elapsed time, descent velocity/mach).
 */

export interface TelemetryDataPoint {
  timestamp: number;        // Milliseconds timestamp
  elapsedSeconds: number;   // Elapsed seconds since stream inception
  altitudeKm: number;       // Altitude in km (0.2 ~ 380.0 km)
  speedKmh: number;         // Velocity in km/h
  machNumber: number;       // Mach number
  descentRateKmh: number;   // Vertical descent velocity (-dAlt/dt converted to km/h)
  layerName: string;        // Atmospheric layer tag
  color: string;            // Layer accent color
}

export interface TelemetrySeriesSummary {
  minAltitudeKm: number;
  maxAltitudeKm: number;
  currentAltitudeKm: number;
  currentSpeedKmh: number;
  currentMach: number;
  maxSpeedKmh: number;
  averageDescentRateKmh: number;
  durationSeconds: number;
  totalPoints: number;
}

export const MAX_TELEMETRY_HISTORY_POINTS = 60;

/**
 * Appends a new sample to the telemetry time series ring-buffer.
 * Caps to maxPoints (default 60 points) to maintain consistent 60fps rendering performance.
 */
export function appendTelemetrySample(
  history: TelemetryDataPoint[],
  sample: {
    altitudeKm: number;
    speedKmh: number;
    machNumber: number;
    layerName: string;
    color: string;
    timestamp?: number;
  },
  maxPoints: number = MAX_TELEMETRY_HISTORY_POINTS
): TelemetryDataPoint[] {
  const now = sample.timestamp ?? Date.now();
  const prevPoint = history[history.length - 1];

  let elapsedSeconds = 0;
  let descentRateKmh = 0;

  if (prevPoint) {
    const dtSeconds = Math.max(0.1, (now - prevPoint.timestamp) / 1000);
    elapsedSeconds = prevPoint.elapsedSeconds + dtSeconds;

    // Vertical descent rate: delta altitude per hour
    // Negative deltaAlt means altitude decreasing (positive descent rate)
    const deltaAltKm = prevPoint.altitudeKm - sample.altitudeKm;
    const instantaneousRate = (deltaAltKm / dtSeconds) * 3600;
    // Lowpass filter to smooth out single-tick delta jitter
    descentRateKmh = Math.max(0, Math.round(instantaneousRate * 0.4 + (prevPoint.descentRateKmh || 0) * 0.6));
  } else {
    elapsedSeconds = 0;
    descentRateKmh = Math.round(sample.speedKmh * 0.65);
  }

  const newPoint: TelemetryDataPoint = {
    timestamp: now,
    elapsedSeconds: Math.round(elapsedSeconds * 10) / 10,
    altitudeKm: Math.max(0.1, Math.round(sample.altitudeKm * 10) / 10),
    speedKmh: Math.max(0, Math.round(sample.speedKmh)),
    machNumber: Math.max(0, Math.round(sample.machNumber * 100) / 100),
    descentRateKmh,
    layerName: sample.layerName,
    color: sample.color,
  };

  const nextHistory = [...history, newPoint];
  if (nextHistory.length > maxPoints) {
    return nextHistory.slice(nextHistory.length - maxPoints);
  }
  return nextHistory;
}

/**
 * Computes statistical summaries from a telemetry slice
 */
export function summarizeTelemetrySeries(history: TelemetryDataPoint[]): TelemetrySeriesSummary {
  if (history.length === 0) {
    return {
      minAltitudeKm: 0,
      maxAltitudeKm: 140,
      currentAltitudeKm: 140,
      currentSpeedKmh: 1420,
      currentMach: 1.16,
      maxSpeedKmh: 1420,
      averageDescentRateKmh: 0,
      durationSeconds: 0,
      totalPoints: 0,
    };
  }

  const latest = history[history.length - 1];
  const first = history[0];
  let minAlt = Infinity;
  let maxAlt = -Infinity;
  let maxSpd = 0;
  let sumDescentRate = 0;

  for (let i = 0; i < history.length; i++) {
    const pt = history[i];
    if (pt.altitudeKm < minAlt) minAlt = pt.altitudeKm;
    if (pt.altitudeKm > maxAlt) maxAlt = pt.altitudeKm;
    if (pt.speedKmh > maxSpd) maxSpd = pt.speedKmh;
    sumDescentRate += pt.descentRateKmh;
  }

  return {
    minAltitudeKm: Math.round(minAlt * 10) / 10,
    maxAltitudeKm: Math.round(maxAlt * 10) / 10,
    currentAltitudeKm: latest.altitudeKm,
    currentSpeedKmh: latest.speedKmh,
    currentMach: latest.machNumber,
    maxSpeedKmh: maxSpd,
    averageDescentRateKmh: Math.round(sumDescentRate / history.length),
    durationSeconds: Math.max(0, Math.round((latest.timestamp - first.timestamp) / 1000)),
    totalPoints: history.length,
  };
}

/**
 * Generates an initial realistic trajectory mock dataset for initial chart population
 */
export function generateSeedTelemetryHistory(
  count: number = 30,
  currentAltKm: number = 65,
  currentMach: number = 1.16
): TelemetryDataPoint[] {
  const points: TelemetryDataPoint[] = [];
  const baseTime = Date.now() - count * 1000;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const alt = Math.max(0.4, (140 - currentAltKm) * (1 - t) + currentAltKm + Math.sin(i * 0.4) * 1.5);
    const speed = (currentMach * 1225) + Math.cos(i * 0.3) * 35;

    points.push({
      timestamp: baseTime + i * 1000,
      elapsedSeconds: i,
      altitudeKm: Math.round(alt * 10) / 10,
      speedKmh: Math.round(speed),
      machNumber: Math.round((speed / 1225) * 100) / 100,
      descentRateKmh: Math.round(1800 + Math.sin(i * 0.25) * 220),
      layerName: alt > 85 ? 'THERMO' : alt > 50 ? 'MESO' : alt > 15 ? 'STRATO' : 'TROPO',
      color: alt > 85 ? '#818cf8' : alt > 50 ? '#38bdf8' : alt > 15 ? '#34d399' : '#fbbf24',
    });
  }

  return points;
}
