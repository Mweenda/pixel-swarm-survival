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
