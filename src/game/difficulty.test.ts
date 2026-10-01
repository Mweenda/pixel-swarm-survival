import test from 'node:test';
import assert from 'node:assert/strict';
import { getEnemyDifficulty } from './difficulty';

test('level one enemies retain their baseline stats', () => {
  assert.deepEqual(getEnemyDifficulty('swarmer', 1), {
    hpMultiplier: 1,
    damageMultiplier: 1,
    speedMultiplier: 1,
    bossAttackInterval: 0,
    bossProjectileSpeed: 0,
    bossVolleyCount: 0,
  });
  assert.deepEqual(getEnemyDifficulty('boss_goliath', 1), {
    hpMultiplier: 1,
    damageMultiplier: 1,
    speedMultiplier: 1,
    bossAttackInterval: 4.2,
    bossProjectileSpeed: 190,
    bossVolleyCount: 1,
  });
});

test('regular enemies become tougher each level while speed stays bounded', () => {
  const levelFive = getEnemyDifficulty('charger', 5);
  const levelTen = getEnemyDifficulty('charger', 10);

  assert.ok(levelFive.hpMultiplier > 1);
  assert.ok(levelTen.hpMultiplier > levelFive.hpMultiplier);
  assert.ok(levelTen.damageMultiplier > levelFive.damageMultiplier);
  assert.ok(levelTen.speedMultiplier > levelFive.speedMultiplier);
  assert.ok(levelTen.speedMultiplier <= 1.2);
});

test('level ten bosses hit harder than level five bosses and gain a wider volley', () => {
  const levelFive = getEnemyDifficulty('boss_goliath', 5);
  const levelTen = getEnemyDifficulty('boss_goliath', 10);

  assert.ok(levelTen.hpMultiplier > levelFive.hpMultiplier);
  assert.ok(levelTen.damageMultiplier > levelFive.damageMultiplier);
  assert.ok(levelTen.speedMultiplier > levelFive.speedMultiplier);
  assert.ok(levelTen.bossAttackInterval < levelFive.bossAttackInterval);
  assert.ok(levelTen.bossProjectileSpeed > levelFive.bossProjectileSpeed);
  assert.equal(levelFive.bossVolleyCount, 2);
  assert.equal(levelTen.bossVolleyCount, 3);
});

test('invalid and fractional levels are normalized safely', () => {
  assert.deepEqual(getEnemyDifficulty('boss_goliath', Number.NaN), getEnemyDifficulty('boss_goliath', 1));
  assert.deepEqual(getEnemyDifficulty('swarmer', 4.9), getEnemyDifficulty('swarmer', 4));
  assert.deepEqual(getEnemyDifficulty('charger', 0), getEnemyDifficulty('charger', 1));
});

test('later planets raise enemy and apex-boss pressure further', () => {
  const marsBoss = getEnemyDifficulty('boss_goliath', 1, 0);
  const plutoBoss = getEnemyDifficulty('boss_goliath', 1, 8);
  const marsSwarm = getEnemyDifficulty('swarmer', 1, 0);
  const plutoSwarm = getEnemyDifficulty('swarmer', 1, 8);

  assert.ok(plutoBoss.hpMultiplier > marsBoss.hpMultiplier);
  assert.ok(plutoBoss.damageMultiplier > marsBoss.damageMultiplier);
  assert.ok(plutoBoss.bossAttackInterval < marsBoss.bossAttackInterval);
  assert.ok(plutoBoss.bossVolleyCount > marsBoss.bossVolleyCount);
  assert.ok(plutoSwarm.hpMultiplier > marsSwarm.hpMultiplier);
});

test('each later swarm raises boss pressure and swarm six is notably more dangerous', () => {
  const first = getEnemyDifficulty('boss_goliath', 1, 0, 1);
  const fifth = getEnemyDifficulty('boss_goliath', 1, 0, 5);
  const epic = getEnemyDifficulty('boss_goliath', 1, 0, 6);

  assert.ok(fifth.hpMultiplier > first.hpMultiplier);
  assert.ok(epic.hpMultiplier > fifth.hpMultiplier);
  assert.ok(epic.damageMultiplier > fifth.damageMultiplier);
  assert.ok(epic.bossAttackInterval < fifth.bossAttackInterval);
  assert.ok(epic.bossVolleyCount >= fifth.bossVolleyCount);
});
