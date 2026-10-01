import { XP_PER_LEVEL } from './constants';
import type { GameState } from './types';

export function togglePause(state: GameState): GameState {
  if (state === 'PLAYING') return 'PAUSED';
  if (state === 'PAUSED') return 'PLAYING';
  return state;
}

export interface LevelProgress {
  level: number;
  xp: number;
  xpToNext: number;
  levelsGained: number;
}

/** Applies accumulated XP while preserving one upgrade choice per level gained. */
export function advanceLevelProgress(level: number, xp: number, xpToNext: number): LevelProgress {
  if (!Number.isInteger(level) || level < 1 || !Number.isFinite(xp) || xp < 0 ||
      !Number.isFinite(xpToNext) || xpToNext <= 0) {
    throw new RangeError('Level progress requires a positive integer level, non-negative XP, and a positive XP threshold.');
  }

  let nextLevel = level;
  let remainingXp = xp;
  let requirement = xpToNext;
  let levelsGained = 0;

  while (remainingXp >= requirement) {
    remainingXp -= requirement;
    nextLevel += 1;
    requirement = XP_PER_LEVEL(nextLevel);
    levelsGained += 1;
  }

  return { level: nextLevel, xp: remainingXp, xpToNext: requirement, levelsGained };
}

/** In-place Fisher–Yates shuffle, with an injectable RNG for repeatable tests. */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Exact circle-to-segment hit check, useful for fast projectiles that can tunnel. */
export function circleIntersectsSegment(
  circleX: number,
  circleY: number,
  radius: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): boolean {
  const dx = endX - startX;
  const dy = endY - startY;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((circleX - startX) * dx + (circleY - startY) * dy) / lengthSquared));
  const nearestX = startX + t * dx;
  const nearestY = startY + t * dy;
  const offsetX = circleX - nearestX;
  const offsetY = circleY - nearestY;
  return offsetX * offsetX + offsetY * offsetY <= radius * radius;
}
