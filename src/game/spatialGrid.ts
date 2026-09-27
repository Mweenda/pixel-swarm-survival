/**
 * 2D Spatial Hash Grid for high-density crowd simulation.
 * Decreases collision complexity from O(N^2) to O(N).
 * Directly mirrors Godot 4's internal 2D Broadphase collision architecture.
 */

export class SpatialGrid<T extends { x: number; y: number; radius: number; id: number }> {
  private cellSize: number;
  private grid: Map<string, T[]> = new Map();
  public checkedPairsThisFrame: number = 0;

  constructor(cellSize: number = 64) {
    this.cellSize = cellSize;
  }

  public clear() {
    this.grid.clear();
    this.checkedPairsThisFrame = 0;
  }

  public getBucketCount(): number {
    return this.grid.size;
  }

  private getKey(cx: number, cy: number): string {
    return `${cx}:${cy}`;
  }

  public insert(entity: T) {
    const minX = Math.floor((entity.x - entity.radius) / this.cellSize);
    const maxX = Math.floor((entity.x + entity.radius) / this.cellSize);
    const minY = Math.floor((entity.y - entity.radius) / this.cellSize);
    const maxY = Math.floor((entity.y + entity.radius) / this.cellSize);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key = this.getKey(cx, cy);
        let cell = this.grid.get(key);
        if (!cell) {
          cell = [];
          this.grid.set(key, cell);
        }
        cell.push(entity);
      }
    }
  }

  /**
   * Queries nearby entities within radius of (x, y)
   */
  public queryRange(x: number, y: number, radius: number): T[] {
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);

    const candidates = new Set<T>();

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key = this.getKey(cx, cy);
        const cell = this.grid.get(key);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            candidates.add(cell[i]);
            this.checkedPairsThisFrame++;
          }
        }
      }
    }

    // Filter precise distance
    const r2 = radius * radius;
    const results: T[] = [];
    for (const item of candidates) {
      const dx = item.x - x;
      const dy = item.y - y;
      const totalR = radius + item.radius;
      if (dx * dx + dy * dy <= totalR * totalR) {
        results.push(item);
      }
    }

    return results;
  }

  /**
   * Finds the single closest entity to (x, y) within maxRadius
   */
  public findClosest(x: number, y: number, maxRadius: number): T | null {
    const candidates = this.queryRange(x, y, maxRadius);
    if (candidates.length === 0) return null;

    let closest: T | null = null;
    let minDist2 = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      const e = candidates[i];
      const dx = e.x - x;
      const dy = e.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < minDist2) {
        minDist2 = d2;
        closest = e;
      }
    }

    return closest;
  }
}
