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
export function getEnemyDifficulty(type: EnemyType, playerLevel: number, planetIndex = 0): EnemyDifficulty {
  const level = Number.isFinite(playerLevel) ? Math.max(1, Math.floor(playerLevel)) : 1;
  const planetTier = Number.isFinite(planetIndex) ? Math.max(0, Math.floor(planetIndex)) : 0;
  const levelsAboveStart = level - 1;

  if (type !== 'boss_goliath') {
    return {
      hpMultiplier: (1 + levelsAboveStart * 0.07) * (1 + planetTier * 0.1),
      damageMultiplier: (1 + levelsAboveStart * 0.035) * (1 + planetTier * 0.055),
      speedMultiplier: 1 + Math.min(0.28, levelsAboveStart * 0.0125 + planetTier * 0.025),
      bossAttackInterval: 0,
      bossProjectileSpeed: 0,
      bossVolleyCount: 0,
    };
  }

  return {
    hpMultiplier: (1 + levelsAboveStart * 0.15) * (1 + planetTier * 0.28),
    damageMultiplier: (1 + levelsAboveStart * 0.06) * (1 + planetTier * 0.11),
    speedMultiplier: 1 + Math.min(0.45, levelsAboveStart * 0.02 + planetTier * 0.035),
    bossAttackInterval: Math.max(1.2, 4.2 - levelsAboveStart * 0.18 - planetTier * 0.12),
    bossProjectileSpeed: 190 + Math.min(110, levelsAboveStart * 5 + planetTier * 10),
    bossVolleyCount: Math.min(3, 1 + Math.floor(level / 5) + Math.floor(planetTier / 3)),
  };
}
