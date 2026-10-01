import assert from 'node:assert/strict';
import test from 'node:test';
import { SpatialGrid } from './spatialGrid';

interface Entity { id: number; x: number; y: number; radius: number; }

const entity = (id: number, x: number, y: number, radius = 4): Entity => ({ id, x, y, radius });

test('queries return exact nearby entities across cell boundaries', () => {
  const grid = new SpatialGrid<Entity>(10);
  const near = entity(1, 9, 0);
  const far = entity(2, 25, 0);
  grid.insert(near);
  grid.insert(far);

  assert.deepEqual(grid.queryRange(0, 0, 6).map(({ id }) => id), [1]);
  assert.equal(grid.findClosest(0, 0, 30)?.id, 1);
});

test('supports negative coordinates and deduplicates multi-cell entities', () => {
  const grid = new SpatialGrid<Entity>(10);
  const large = entity(1, -1, -1, 12);
  grid.insert(large);
  grid.insert(entity(2, -18, -1));

  assert.deepEqual(grid.queryRange(-1, -1, 1).map(({ id }) => id), [1]);
  assert.equal(grid.queryRange(-1, -1, 1).length, 1);
});

test('clearing resets buckets and diagnostics', () => {
  const grid = new SpatialGrid<Entity>(10);
  grid.insert(entity(1, 1, 1));
  grid.queryRange(1, 1, 2);
  assert.ok(grid.checkedPairsThisFrame > 0);
  grid.clear();
  assert.equal(grid.getBucketCount(), 0);
  assert.equal(grid.checkedPairsThisFrame, 0);
});

test('rejects invalid grid sizes, entities, and query radii', () => {
  assert.throws(() => new SpatialGrid(0), RangeError);
  const grid = new SpatialGrid<Entity>(10);
  assert.throws(() => grid.insert(entity(1, 0, 0, -1)), RangeError);
  assert.throws(() => grid.queryRange(0, 0, -1), RangeError);
});
