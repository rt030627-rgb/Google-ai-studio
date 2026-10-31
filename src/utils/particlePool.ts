/**
 * High-Performance Zero-Allocation Particle Object Pool
 * Eliminates garbage collector (GC) pauses and micro-stutters during heavy
 * atmospheric descent rendering by reusing pre-allocated particle buffers.
 */

export interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  theme?: string;
  angle?: number;
  spin?: number;
  radius?: number;
  radiusSpeed?: number;
  baseX?: number;
  baseY?: number;
  char?: string;
  shape?: string;
  wavePhase?: number;
  waveAmp?: number;
}

export interface ParticleSpawnParams {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size?: number;
  color: string;
  alpha?: number;
  life?: number;
  maxLife: number;
  theme?: string;
  angle?: number;
  spin?: number;
  radius?: number;
  radiusSpeed?: number;
  baseX?: number;
  baseY?: number;
  char?: string;
  shape?: string;
  wavePhase?: number;
  waveAmp?: number;
}

export class ParticlePool {
  private readonly pool: PooledParticle[];
  private activeCount: number = 0;
  public readonly capacity: number;

  constructor(capacity = 1200) {
    this.capacity = Math.max(1, capacity);
    this.pool = new Array(this.capacity);

    // Pre-allocate all objects in memory immediately to prevent GC churn in hot render loops
    for (let i = 0; i < this.capacity; i++) {
      this.pool[i] = {
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 1,
        color: '#ffffff',
        alpha: 1.0,
        life: 0,
        maxLife: 60,
      };
    }
  }

  /**
   * Acquire and initialize a particle from the pre-allocated pool in O(1) time.
   * Returns false if the pool capacity budget is exhausted.
   */
  public spawn(params: ParticleSpawnParams): boolean {
    if (this.activeCount >= this.capacity) {
      return false; // Hard budget cap reached, safely drops particle to protect FPS
    }

    const p = this.pool[this.activeCount];
    p.active = true;
    p.x = params.x;
    p.y = params.y;
    p.vx = params.vx;
    p.vy = params.vy;
    p.size = params.size ?? 1;
    p.color = params.color;
    p.alpha = params.alpha ?? 1.0;
    p.life = params.life ?? 0;
    p.maxLife = Math.max(1, params.maxLife);
    p.theme = params.theme;
    p.angle = params.angle;
    p.spin = params.spin;
    p.radius = params.radius;
    p.radiusSpeed = params.radiusSpeed;
    p.baseX = params.baseX;
    p.baseY = params.baseY;
    p.char = params.char;
    p.shape = params.shape;
    p.wavePhase = params.wavePhase;
    p.waveAmp = params.waveAmp;

    this.activeCount++;
    return true;
  }

  /**
   * Update active particles in-place using O(1) swap-and-pop removal.
   * Zero array slicing, zero memory allocation, zero GC garbage generation.
   */
  public update(updateFn: (p: PooledParticle) => boolean): void {
    let i = 0;
    while (i < this.activeCount) {
      const p = this.pool[i];
      const isAlive = updateFn(p);

      if (isAlive) {
        i++;
      } else {
        // Fast swap with the last active element to maintain contiguous array
        p.active = false;
        this.activeCount--;
        if (i < this.activeCount) {
          const last = this.pool[this.activeCount];
          this.pool[this.activeCount] = p;
          this.pool[i] = last;
        }
      }
    }
  }

  /**
   * Iterate and render all currently active particles.
   */
  public render(renderFn: (p: PooledParticle) => void): void {
    for (let i = 0; i < this.activeCount; i++) {
      renderFn(this.pool[i]);
    }
  }

  /**
   * Instantly recycle all particles without deallocating objects.
   */
  public clear(): void {
    for (let i = 0; i < this.activeCount; i++) {
      this.pool[i].active = false;
    }
    this.activeCount = 0;
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public getAvailableCount(): number {
    return this.capacity - this.activeCount;
  }

  /**
   * Read-only view of active slice for telemetry or diagnostics.
   */
  public getActiveParticles(): readonly PooledParticle[] {
    return this.pool.slice(0, this.activeCount);
  }
}
