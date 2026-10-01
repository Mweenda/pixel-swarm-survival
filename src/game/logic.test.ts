import assert from 'node:assert/strict';
import test from 'node:test';
import { XP_PER_LEVEL } from './constants';
import { advanceLevelProgress, circleIntersectsSegment, shuffle, togglePause } from './logic';

test('level progression carries remainder and counts every earned upgrade', () => {
  const first = XP_PER_LEVEL(1);
  const second = XP_PER_LEVEL(2);
  const result = advanceLevelProgress(1, first + second + 7, first);

  assert.deepEqual(result, {
    level: 3,
    xp: 7,
    xpToNext: XP_PER_LEVEL(3),
    levelsGained: 2,
  });
});

test('level progression leaves partial XP untouched', () => {
  assert.deepEqual(advanceLevelProgress(4, 8, 20), {
    level: 4,
    xp: 8,
    xpToNext: 20,
    levelsGained: 0,
  });
});

test('level progression rejects invalid input instead of looping or corrupting state', () => {
  assert.throws(() => advanceLevelProgress(0, 0, 10), RangeError);
  assert.throws(() => advanceLevelProgress(1, 0, 0), RangeError);
  assert.throws(() => advanceLevelProgress(1, -1, 10), RangeError);
});

test('shuffle keeps every element and can be deterministic', () => {
  assert.deepEqual(shuffle([1, 2, 3, 4], () => 0), [2, 3, 4, 1]);
  assert.deepEqual(shuffle(['a', 'b', 'c']).sort(), ['a', 'b', 'c']);
});

test('swept collision catches crossings and rejects nearby misses', () => {
  assert.equal(circleIntersectsSegment(5, 1, 1, 0, 0, 10, 0), true);
  assert.equal(circleIntersectsSegment(5, 2.1, 1, 0, 0, 10, 0), false);
  assert.equal(circleIntersectsSegment(0, 0, 1, 0, 0, 0, 0), true);
});

test('pause toggle only changes active play states', () => {
  assert.equal(togglePause('PLAYING'), 'PAUSED');
  assert.equal(togglePause('PAUSED'), 'PLAYING');
  assert.equal(togglePause('LEVEL_UP'), 'LEVEL_UP');
  assert.equal(togglePause('GAME_OVER'), 'GAME_OVER');
});
