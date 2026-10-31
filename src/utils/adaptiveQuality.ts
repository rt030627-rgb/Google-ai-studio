/**
 * Adaptive Performance Engine & Dynamic Quality Guard
 * Tracks rolling frame times (FPS) and jitter to automatically throttle
 * particle budgets and visual post-processing effects under heavy loads.
 */

export type QualityTier = 'ultra' | 'balanced' | 'low';

export interface PerformanceSnapshot {
  currentFps: number;
  averageFps: number;
  frameTimeVarianceMs: number;
  qualityTier: QualityTier;
  isThrottled: boolean;
  lowFpsDurationFrames: number;
  highFpsDurationFrames: number;
}

export class AdaptivePerformanceGuard {
  private frameDeltas: number[] = [];
  private readonly maxSamples: number;
  private qualityTier: QualityTier;
  private isAutoThrottleEnabled: boolean;
  private lowFpsCounter = 0;
  private highFpsCounter = 0;
  private isThrottled = false;

  constructor(
    initialTier: QualityTier = 'ultra',
    isAutoThrottleEnabled = true,
    maxSamples = 60
  ) {
    this.qualityTier = initialTier;
    this.isAutoThrottleEnabled = isAutoThrottleEnabled;
    this.maxSamples = Math.max(10, maxSamples);
  }

  /**
   * Register a new frame delta time in milliseconds.
   */
  public recordFrame(deltaMs: number): PerformanceSnapshot {
    const clampedDelta = Math.max(1, Math.min(deltaMs, 250)); // Clamp against sleep/background tab anomalies
    this.frameDeltas.push(clampedDelta);
    if (this.frameDeltas.length > this.maxSamples) {
      this.frameDeltas.shift();
    }

    const currentFps = Math.round(1000 / clampedDelta);
    const avgDelta = this.frameDeltas.reduce((acc, v) => acc + v, 0) / this.frameDeltas.length;
    const averageFps = Math.round(1000 / avgDelta);

    // Compute variance / jitter
    const variance = this.frameDeltas.reduce((acc, v) => acc + Math.pow(v - avgDelta, 2), 0) / this.frameDeltas.length;
    const frameTimeVarianceMs = Math.round(Math.sqrt(variance) * 10) / 10;

    if (this.isAutoThrottleEnabled) {
      this.evaluateQualityScaling(averageFps);
    }

    return {
      currentFps,
      averageFps,
      frameTimeVarianceMs,
      qualityTier: this.qualityTier,
      isThrottled: this.isThrottled,
      lowFpsDurationFrames: this.lowFpsCounter,
      highFpsDurationFrames: this.highFpsCounter
    };
  }

  /**
   * Evaluates dynamic downgrades/upgrades.
   */
  private evaluateQualityScaling(avgFps: number): void {
    // Under 42 FPS: low performance threshold
    if (avgFps < 42) {
      this.lowFpsCounter++;
      this.highFpsCounter = 0;

      // After 40 frames of sustained lag (~1s at 40fps), downgrade tier
      if (this.lowFpsCounter >= 40) {
        if (this.qualityTier === 'ultra') {
          this.qualityTier = 'balanced';
          this.isThrottled = true;
          this.lowFpsCounter = 0;
        } else if (this.qualityTier === 'balanced') {
          this.qualityTier = 'low';
          this.isThrottled = true;
          this.lowFpsCounter = 0;
        }
      }
    } else if (avgFps >= 55) {
      this.highFpsCounter++;
      this.lowFpsCounter = 0;

      // After 90 frames of sustained smooth performance (~1.5s at 60fps), restore
      if (this.highFpsCounter >= 90 && this.isThrottled) {
        if (this.qualityTier === 'low') {
          this.qualityTier = 'balanced';
          this.highFpsCounter = 0;
        } else if (this.qualityTier === 'balanced') {
          this.qualityTier = 'ultra';
          this.isThrottled = false;
          this.highFpsCounter = 0;
        }
      }
    } else {
      this.lowFpsCounter = Math.max(0, this.lowFpsCounter - 1);
      this.highFpsCounter = Math.max(0, this.highFpsCounter - 1);
    }
  }

  public setQualityTier(tier: QualityTier): void {
    this.qualityTier = tier;
    this.isThrottled = false;
    this.lowFpsCounter = 0;
    this.highFpsCounter = 0;
  }

  public setAutoThrottle(enabled: boolean): void {
    this.isAutoThrottleEnabled = enabled;
  }

  public getQualityTier(): QualityTier {
    return this.qualityTier;
  }

  public getIsThrottled(): boolean {
    return this.isThrottled;
  }

  public reset(): void {
    this.frameDeltas = [];
    this.lowFpsCounter = 0;
    this.highFpsCounter = 0;
  }
}
