import { pathLength, pointAlongPath, ensurePath } from '../pathMotion';
import type { MapPoint } from '../../map/mapModel';

describe('pathLength', () => {
  it('sums the euclidean distance between consecutive points', () => {
    const points: MapPoint[] = [{ x: 0, y: 0 }, { x: 3, y: 4 }, { x: 3, y: 8 }];
    expect(pathLength(points)).toBeCloseTo(9);
  });

  it('returns 0 for a single point', () => {
    expect(pathLength([{ x: 5, y: 5 }])).toBe(0);
  });
});

describe('pointAlongPath', () => {
  const points: MapPoint[] = [{ x: 0, y: 0 }, { x: 10, y: 0 }];

  it('returns the start point at t=0', () => {
    expect(pointAlongPath(points, 0)).toEqual({ x: 0, y: 0 });
  });

  it('returns the end point at t=1', () => {
    expect(pointAlongPath(points, 1)).toEqual({ x: 10, y: 0 });
  });

  it('returns the midpoint at t=0.5', () => {
    const mid = pointAlongPath(points, 0.5);
    expect(mid.x).toBeCloseTo(5);
    expect(mid.y).toBeCloseTo(0);
  });
});

describe('ensurePath', () => {
  it('keeps the computed path but forces its first point to match start', () => {
    const computed: MapPoint[] = [{ x: 99, y: 99 }, { x: 1, y: 1 }, { x: 2, y: 2 }];
    const result = ensurePath(computed, { x: 0, y: 0 }, { x: 2, y: 2 });
    expect(result[0]).toEqual({ x: 0, y: 0 });
    expect(result.slice(1)).toEqual([{ x: 1, y: 1 }, { x: 2, y: 2 }]);
  });

  it('falls back to a direct line when the computed path has fewer than 2 points', () => {
    expect(ensurePath([], { x: 0, y: 0 }, { x: 5, y: 5 })).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ]);
  });
});
