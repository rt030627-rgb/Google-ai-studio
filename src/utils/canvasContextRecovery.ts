/**
 * Canvas Context Loss & GPU Recovery Engine
 * Listens for hardware context destruction (sleep/wake, driver reset, mobile backgrounding)
 * prevents default buffer disposal, freezes simulation physics, and restores rendering
 * without requiring full page refresh or user intervention.
 */

export interface ContextRecoveryCallbacks {
  onContextLost?: (event: Event) => void;
  onContextRestored?: (ctx: CanvasRenderingContext2D) => void;
}

export interface ContextRecoveryStatus {
  isContextLost: boolean;
  totalLossCount: number;
  lastLostTimestamp: number | null;
  lastRestoredTimestamp: number | null;
}

export class CanvasContextRecoveryManager {
  private isContextLost = false;
  private totalLossCount = 0;
  private lastLostTimestamp: number | null = null;
  private lastRestoredTimestamp: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private callbacks: ContextRecoveryCallbacks = {};

  private boundHandleContextLost: (e: Event) => void;
  private boundHandleContextRestored: (e: Event) => void;

  constructor() {
    this.boundHandleContextLost = this.handleContextLost.bind(this);
    this.boundHandleContextRestored = this.handleContextRestored.bind(this);
  }

  /**
   * Attach context loss and restore event listeners to target canvas.
   */
  public attach(canvas: HTMLCanvasElement, callbacks: ContextRecoveryCallbacks): void {
    this.detach();
    this.canvas = canvas;
    this.callbacks = callbacks;

    canvas.addEventListener('contextlost', this.boundHandleContextLost as EventListener);
    canvas.addEventListener('contextrestored', this.boundHandleContextRestored as EventListener);
  }

  /**
   * Detach event listeners safely.
   */
  public detach(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('contextlost', this.boundHandleContextLost as EventListener);
      this.canvas.removeEventListener('contextrestored', this.boundHandleContextRestored as EventListener);
      this.canvas = null;
    }
  }

  /**
   * Handles GPU context loss event.
   * Crucial: Calling e.preventDefault() informs the browser we intend to restore
   * and prevents permanent disposal of canvas backing store.
   */
  public handleContextLost(e: Event): void {
    if (typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    this.isContextLost = true;
    this.totalLossCount++;
    this.lastLostTimestamp = Date.now();

    if (this.callbacks.onContextLost) {
      this.callbacks.onContextLost(e);
    }
  }

  /**
   * Handles GPU context restoration event.
   * Re-acquires 2D context and notifies listeners.
   */
  public handleContextRestored(e: Event): void {
    this.isContextLost = false;
    this.lastRestoredTimestamp = Date.now();

    if (this.canvas) {
      const newCtx = this.canvas.getContext('2d');
      if (newCtx && this.callbacks.onContextRestored) {
        this.callbacks.onContextRestored(newCtx);
      }
    }
  }

  public getStatus(): ContextRecoveryStatus {
    return {
      isContextLost: this.isContextLost,
      totalLossCount: this.totalLossCount,
      lastLostTimestamp: this.lastLostTimestamp,
      lastRestoredTimestamp: this.lastRestoredTimestamp,
    };
  }

  /**
   * Synthetic trigger for testing recovery lifecycle deterministically.
   */
  public triggerSyntheticLoss(): void {
    const fakeEvent = {
      preventDefault: () => {},
    } as unknown as Event;

    this.handleContextLost(fakeEvent);
  }

  public triggerSyntheticRestoration(ctx: CanvasRenderingContext2D): void {
    this.isContextLost = false;
    this.lastRestoredTimestamp = Date.now();
    if (this.callbacks.onContextRestored) {
      this.callbacks.onContextRestored(ctx);
    }
  }
}
