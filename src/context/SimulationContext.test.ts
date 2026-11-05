import test from 'node:test';
import assert from 'node:assert/strict';
import {
  simulationReducer,
  INITIAL_SIMULATION_STATE,
  type SimulationState,
} from './SimulationContext.js';

test('Simulation Reducer State Machine', async (t) => {
  await t.test('SET_VIEW_MODE and TOGGLE_ZEN_MODE manage synchronized zen state', () => {
    const s1 = simulationReducer(INITIAL_SIMULATION_STATE, { type: 'SET_VIEW_MODE', payload: 'zen' });
    assert.equal(s1.viewMode, 'zen');
    assert.equal(s1.isZenMode, true);

    const s2 = simulationReducer(s1, { type: 'TOGGLE_ZEN_MODE', payload: false });
    assert.equal(s2.isZenMode, false);
    assert.equal(s2.viewMode, 'standard');

    const s3 = simulationReducer(s2, { type: 'TOGGLE_ZEN_MODE' });
    assert.equal(s3.isZenMode, true);
    assert.equal(s3.viewMode, 'zen');
  });

  await t.test('SET_DIURNAL_PHASE and SET_WEATHER_PRESET update environment state', () => {
    const s1 = simulationReducer(INITIAL_SIMULATION_STATE, { type: 'SET_DIURNAL_PHASE', payload: 'dawn' });
    assert.equal(s1.diurnalPhase, 'dawn');

    const s2 = simulationReducer(s1, { type: 'SET_WEATHER_PRESET', payload: 'aurora' });
    assert.equal(s2.weatherPreset, 'aurora');

    const s3 = simulationReducer(s2, { type: 'SET_SPEED_MODE', payload: 'mach' });
    assert.equal(s3.speedMode, 'mach');
  });

  await t.test('SET_CLOUD_DENSITY, SET_WIND_SPEED, and SET_SCREEN_SHAKE clamp values within safe bounds', () => {
    const s1 = simulationReducer(INITIAL_SIMULATION_STATE, { type: 'SET_CLOUD_DENSITY', payload: 99 });
    assert.equal(s1.cloudDensity, 2.5);

    const s2 = simulationReducer(s1, { type: 'SET_CLOUD_DENSITY', payload: -10 });
    assert.equal(s2.cloudDensity, 0.2);

    const s3 = simulationReducer(s2, { type: 'SET_WIND_SPEED', payload: 10 });
    assert.equal(s3.windSpeed, 3.0);

    const s4 = simulationReducer(s3, { type: 'SET_SCREEN_SHAKE', payload: 5 });
    assert.equal(s4.screenShakeIntensity, 1.0);
  });

  await t.test('TRIGGER_BLACK_HOLE and TOGGLE_ARCADE_MODE handle entity triggers', () => {
    const s1 = simulationReducer(INITIAL_SIMULATION_STATE, { type: 'TRIGGER_BLACK_HOLE' });
    assert.equal(s1.blackHoleActive, true);
    assert.equal(s1.blackHoleTrigger, 1);

    const s2 = simulationReducer(s1, { type: 'TOGGLE_ARCADE_MODE', payload: true });
    assert.equal(s2.arcadeModeEnabled, true);
    assert.equal(s2.arcadeGameState.score, 0);

    const s3 = simulationReducer(s2, {
      type: 'UPDATE_ARCADE_STATE',
      payload: { ...s2.arcadeGameState, score: 500, combo: 4 },
    });
    assert.equal(s3.arcadeGameState.score, 500);
    assert.equal(s3.arcadeGameState.combo, 4);
  });

  await t.test('UPDATE_GLIDER updates directional coordinates and banking roll angle', () => {
    const s1 = simulationReducer(INITIAL_SIMULATION_STATE, {
      type: 'UPDATE_GLIDER',
      payload: { offset: { x: 35, y: -20 }, roll: 12.5, active: true },
    });
    assert.deepEqual(s1.gliderOffset, { x: 35, y: -20 });
    assert.equal(s1.gliderRollAngle, 12.5);
    assert.equal(s1.isGliderActive, true);
  });

  await t.test('RESET_FLIGHT_STATE resets telemetry and entities while preserving userSettings', () => {
    const modified: SimulationState = {
      ...INITIAL_SIMULATION_STATE,
      telemetry: { altitudeKm: 12, machSpeed: 0.8, barometricHpa: 800, temperatureC: 15 },
      blackHoleActive: true,
      arcadeModeEnabled: true,
      userSettings: {
        ...INITIAL_SIMULATION_STATE.userSettings,
        masterVolume: 0.1,
      },
    };

    const reset = simulationReducer(modified, { type: 'RESET_FLIGHT_STATE' });
    assert.equal(reset.telemetry.altitudeKm, 140.0);
    assert.equal(reset.blackHoleActive, false);
    assert.equal(reset.arcadeModeEnabled, false);
    assert.equal(reset.userSettings.masterVolume, 0.1);
  });

  await t.test('SET_LANGUAGE switches language between en and ko safely', () => {
    const s1 = simulationReducer(INITIAL_SIMULATION_STATE, { type: 'SET_LANGUAGE', payload: 'ko' });
    assert.equal(s1.language, 'ko');

    const s2 = simulationReducer(s1, { type: 'SET_LANGUAGE', payload: 'en' });
    assert.equal(s2.language, 'en');
  });
});
