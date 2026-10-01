import type { EnemyType } from './types';

export interface EnemyDifficulty {
  hpMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
  bossAttackInterval: number;
  bossProjectileSpeed: number;
  bossVolleyCount: number;
}

/** Scales enemy combat power with the player's level without changing rewards. */
export function getEnemyDifficulty(type: EnemyType, playerLevel: number): EnemyDifficulty {
  const level = Number.isFinite(playerLevel) ? Math.max(1, Math.floor(playerLevel)) : 1;
  const levelsAboveStart = level - 1;

  if (type !== 'boss_goliath') {
    return {
      hpMultiplier: 1 + levelsAboveStart * 0.07,
      damageMultiplier: 1 + levelsAboveStart * 0.035,
      speedMultiplier: 1 + Math.min(0.2, levelsAboveStart * 0.0125),
      bossAttackInterval: 0,
      bossProjectileSpeed: 0,
      bossVolleyCount: 0,
    };
  }

  return {
    hpMultiplier: 1 + levelsAboveStart * 0.15,
    damageMultiplier: 1 + levelsAboveStart * 0.06,
    speedMultiplier: 1 + Math.min(0.3, levelsAboveStart * 0.02),
    bossAttackInterval: Math.max(1.5, 4.2 - levelsAboveStart * 0.18),
    bossProjectileSpeed: 190 + Math.min(70, levelsAboveStart * 5),
    bossVolleyCount: level >= 10 ? 3 : level >= 5 ? 2 : 1,
  };
}
