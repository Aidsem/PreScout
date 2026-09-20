import { findPath, nearestWalkable } from '../pathfinding';

describe('findPath', () => {
  it('finds a path across an open grid from start to end', () => {
    const grid = Array.from({ length: 5 }, () => Array(5).fill(false));
    const path = findPath(grid, [0, 0], [0, 4]);
    expect(path[0]).toEqual([0, 0]);
    expect(path[path.length - 1]).toEqual([0, 4]);
  });

  it('routes around a blocked wall instead of crossing it', () => {
    const grid = Array.from({ length: 5 }, () => Array(5).fill(false));
    grid[1][0] = grid[1][1] = grid[1][2] = grid[1][3] = true;
    const path = findPath(grid, [0, 0], [2, 0]);
    expect(path.length).toBeGreaterThan(0);
    expect(path.every(([r, c]) => !grid[r][c])).toBe(true);
  });

  it('returns an empty path when the target is fully enclosed by blocked cells', () => {
    const grid = [
      [false, true, false],
      [true, true, true],
      [false, true, false],
    ];
    expect(findPath(grid, [0, 0], [2, 2])).toEqual([]);
  });
});

describe('nearestWalkable', () => {
  it('returns the cell itself when already walkable', () => {
    const grid = [[false, false], [false, false]];
    expect(nearestWalkable(grid, [0, 0])).toEqual([0, 0]);
  });

  it('returns the nearest open cell when the target cell is blocked', () => {
    const grid = [
      [true, false],
      [true, true],
    ];
    expect(nearestWalkable(grid, [0, 0])).toEqual([0, 1]);
  });
});
