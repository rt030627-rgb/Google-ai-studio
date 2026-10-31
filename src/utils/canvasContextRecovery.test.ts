import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CanvasContextRecoveryManager } from './canvasContextRecovery.js';

describe('Canvas Context Loss & GPU Recovery Engine', () => {
  it('should initialize with no context loss and zero loss count', () => {
    const mgr = new CanvasContextRecoveryManager();
    const status = mgr.getStatus();
    assert.equal(status.isContextLost, false);
    assert.equal(status.totalLossCount, 0);
    assert.equal(status.lastLostTimestamp, null);
  });

  it('handleContextLost calls preventDefault to protect canvas and triggers onContextLost callback', () => {
    const mgr = new CanvasContextRecoveryManager();
    let callbackFired = false;
    let prevented = false;

    mgr.attach(
      {
        addEventListener: () => {},
        removeEventListener: () => {},
        getContext: () => null,
      } as unknown as HTMLCanvasElement,
      {
        onContextLost: () => {
          callbackFired = true;
        },
      }
    );

    const mockEvent = {
      preventDefault: () => {
        prevented = true;
      },
    } as unknown as Event;

    mgr.handleContextLost(mockEvent);

    assert.equal(prevented, true, 'e.preventDefault() MUST be called on contextlost');
    assert.equal(callbackFired, true);
    assert.equal(mgr.getStatus().isContextLost, true);
    assert.equal(mgr.getStatus().totalLossCount, 1);
  });

  it('handleContextRestored resets isContextLost and triggers onContextRestored with new context', () => {
    const mgr = new CanvasContextRecoveryManager();
    let restoredFired = false;
    const mockCtx = { imageSmoothingEnabled: false } as unknown as CanvasRenderingContext2D;

    mgr.attach(
      {
        addEventListener: () => {},
        removeEventListener: () => {},
        getContext: () => mockCtx,
      } as unknown as HTMLCanvasElement,
      {
        onContextRestored: (ctx) => {
          restoredFired = true;
          assert.equal(ctx, mockCtx);
        },
      }
    );

    mgr.triggerSyntheticLoss();
    assert.equal(mgr.getStatus().isContextLost, true);

    mgr.handleContextRestored({} as Event);
    assert.equal(mgr.getStatus().isContextLost, false);
    assert.equal(restoredFired, true);
  });

  it('detach removes listeners and clears canvas reference', () => {
    const mgr = new CanvasContextRecoveryManager();
    let detachedCount = 0;

    const mockCanvas = {
      addEventListener: () => {},
      removeEventListener: () => {
        detachedCount++;
      },
      getContext: () => null,
    } as unknown as HTMLCanvasElement;

    mgr.attach(mockCanvas, {});
    mgr.detach();

    assert.equal(detachedCount, 2, 'Should detach both contextlost and contextrestored');
  });
});
