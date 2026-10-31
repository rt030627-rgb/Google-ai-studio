import test from 'node:test';
import assert from 'node:assert/strict';
import { SimulationErrorBoundary } from './SimulationErrorBoundary.js';

test('SimulationErrorBoundary Logic', async (t) => {
  await t.test('getDerivedStateFromError captures error message correctly', () => {
    const error = new Error('Canvas 2D context creation failure');
    const state = SimulationErrorBoundary.getDerivedStateFromError(error);

    assert.equal(state.hasError, true);
    assert.equal(state.errorMessage, 'Canvas 2D context creation failure');
  });

  await t.test('getDerivedStateFromError provides safe fallback when error has no message', () => {
    const emptyError = new Error('');
    const state = SimulationErrorBoundary.getDerivedStateFromError(emptyError);

    assert.equal(state.hasError, true);
    assert.equal(typeof state.errorMessage, 'string');
    assert.ok(state.errorMessage.length > 0);
  });
});
