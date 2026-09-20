import { createProjection, DEFAULT_BOUNDS } from '../projection';
import { GRID_COLS, GRID_ROWS, MAP_H, MAP_W, svgToGrid } from '../mapModel';

const pune = { latitude: 18.5204, longitude: 73.8567 };
const mumbai = { latitude: 19.076, longitude: 72.8777 };
const bengaluru = { latitude: 12.9716, longitude: 77.5946 };

describe('createProjection', () => {
  it('falls back to the default bounds when given no points', () => {
    expect(createProjection([]).bounds).toEqual(DEFAULT_BOUNDS);
  });

  it('round-trips a coordinate through the canvas', () => {
    const projection = createProjection([pune, mumbai]);
    const back = projection.toCoordinate(projection.toPoint(mumbai));
    expect(back.latitude).toBeCloseTo(mumbai.latitude, 6);
    expect(back.longitude).toBeCloseTo(mumbai.longitude, 6);
  });

  it('keeps every input point inside the canvas so grid lookups do not clamp', () => {
    const projection = createProjection([pune, mumbai, bengaluru]);
    for (const coordinate of [pune, mumbai, bengaluru]) {
      const point = projection.toPoint(coordinate);
      expect(point.x).toBeGreaterThan(0);
      expect(point.x).toBeLessThan(MAP_W);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(MAP_H);
      const [row, col] = svgToGrid(point.x, point.y);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThan(GRID_ROWS);
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThan(GRID_COLS);
    }
  });

  it('gives two distant points distinct grid cells', () => {
    const projection = createProjection([pune, bengaluru]);
    const a = svgToGrid(projection.toPoint(pune).x, projection.toPoint(pune).y);
    const b = svgToGrid(projection.toPoint(bengaluru).x, projection.toPoint(bengaluru).y);
    expect(a).not.toEqual(b);
  });

  it('never produces a degenerate box for a single point or coincident points', () => {
    const projection = createProjection([pune, pune]);
    expect(projection.bounds.north).toBeGreaterThan(projection.bounds.south);
    expect(projection.bounds.east).toBeGreaterThan(projection.bounds.west);
    const point = projection.toPoint(pune);
    expect(Number.isFinite(point.x)).toBe(true);
    expect(Number.isFinite(point.y)).toBe(true);
  });

  it('reports whether a coordinate lies within its bounds', () => {
    const projection = createProjection([pune]);
    expect(projection.contains(pune)).toBe(true);
    expect(projection.contains(bengaluru)).toBe(false);
  });
});
