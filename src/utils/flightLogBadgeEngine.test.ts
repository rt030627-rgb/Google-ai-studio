import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FLIGHT_LOG_BADGES,
  evaluateMilestoneBadges,
  unlockBadge,
  type BadgeMilestoneContext,
  type UnlockedBadgeRecord,
} from './flightLogBadgeEngine';

test('Flight Log Badge Engine Suite', async (t) => {
  await t.test('FLIGHT_LOG_BADGES has valid list containing Cloud Piercer milestone', () => {
    assert.ok(FLIGHT_LOG_BADGES.length >= 8);
    const cloudPiercer = FLIGHT_LOG_BADGES.find((b) => b.id === 'cloud_piercer');
    assert.ok(cloudPiercer, 'cloud_piercer must be defined');
    assert.equal(cloudPiercer.name, 'Cloud Piercer');
    assert.equal(cloudPiercer.category, 'weather');
    assert.ok(cloudPiercer.koreanName.length > 0);
  });

  await t.test('evaluates Cloud Piercer when piercing through storm layer (rain <= 48 km)', () => {
    const context: BadgeMilestoneContext = {
      altitudeKm: 32,
      weather: 'rain',
      speedMode: 'normal',
      isDragonActive: false,
      ringsCollected: 0,
      isBlackHoleActive: false,
      orbitalZoomActive: false,
      cycleProgress: 0.5,
      gliderEnabled: false,
    };
    const unlocked: Record<string, UnlockedBadgeRecord> = {};

    const eligible = evaluateMilestoneBadges(context, unlocked);
    assert.ok(eligible.some((b) => b.id === 'cloud_piercer'), 'Cloud Piercer should be eligible during rain at 32 km');
  });

  await t.test('does not evaluate Cloud Piercer when altitude is too high in storm (> 48 km)', () => {
    const context: BadgeMilestoneContext = {
      altitudeKm: 120,
      weather: 'rain',
      speedMode: 'normal',
      isDragonActive: false,
      ringsCollected: 0,
      isBlackHoleActive: false,
      orbitalZoomActive: false,
      cycleProgress: 0.1,
      gliderEnabled: false,
    };
    const unlocked: Record<string, UnlockedBadgeRecord> = {};

    const eligible = evaluateMilestoneBadges(context, unlocked);
    assert.equal(eligible.some((b) => b.id === 'cloud_piercer'), false, 'Cloud Piercer should not trigger at 120 km');
  });

  await t.test('evaluates Orbital Ingress, Dragon, and Stardust milestones accurately', () => {
    const context: BadgeMilestoneContext = {
      altitudeKm: 12,
      weather: 'clear',
      speedMode: 'mach',
      isDragonActive: true,
      ringsCollected: 12,
      isBlackHoleActive: false,
      orbitalZoomActive: true,
      orbitalZoomPhase: 'settled',
      cycleProgress: 0.5,
      gliderEnabled: false,
    };
    const unlocked: Record<string, UnlockedBadgeRecord> = {};

    const eligible = evaluateMilestoneBadges(context, unlocked);
    const ids = eligible.map((b) => b.id);
    assert.ok(ids.includes('orbital_ingress'));
    assert.ok(ids.includes('dragon_whisperer'));
    assert.ok(ids.includes('stardust_ace'));
    assert.ok(ids.includes('supersonic_mach'));
  });

  await t.test('ignores badges that are already unlocked', () => {
    const context: BadgeMilestoneContext = {
      altitudeKm: 25,
      weather: 'rain',
      speedMode: 'normal',
      isDragonActive: false,
      ringsCollected: 0,
      isBlackHoleActive: false,
      orbitalZoomActive: false,
      cycleProgress: 0.5,
      gliderEnabled: false,
    };
    const unlocked: Record<string, UnlockedBadgeRecord> = {
      cloud_piercer: { id: 'cloud_piercer', unlockedAt: 123456789 },
    };

    const eligible = evaluateMilestoneBadges(context, unlocked);
    assert.equal(eligible.some((b) => b.id === 'cloud_piercer'), false, 'Already unlocked badge must be ignored');
  });

  await t.test('unlockBadge creates new record and idempotently ignores re-unlocking', () => {
    const initial: Record<string, UnlockedBadgeRecord> = {};
    const result1 = unlockBadge('cloud_piercer', initial);
    assert.ok(result1.unlockedBadge);
    assert.equal(result1.unlockedBadge.id, 'cloud_piercer');
    assert.ok(result1.nextUnlocked.cloud_piercer);

    const result2 = unlockBadge('cloud_piercer', result1.nextUnlocked);
    assert.equal(result2.unlockedBadge, null);
    assert.equal(result2.nextUnlocked, result1.nextUnlocked);
  });
});
