import { svgToGrid, gridToSvg, buildAirGrid, GRID_COLS, GRID_ROWS, MAP_W, MAP_H } from '../mapModel';

describe('gridToSvg / svgToGrid', () => {
  it('round-trips a grid cell through its svg center point', () => {
    const svgPoint = gridToSvg(10, 5);
    expect(svgToGrid(svgPoint.x, svgPoint.y)).toEqual([10, 5]);
  });

  it('clamps out-of-range svg coordinates to the nearest valid grid cell', () => {
    expect(svgToGrid(-50, -50)).toEqual([0, 0]);
    expect(svgToGrid(MAP_W + 1000, MAP_H + 1000)).toEqual([GRID_ROWS - 1, GRID_COLS - 1]);
  });
});

describe('buildAirGrid', () => {
  it('produces an all-open grid of the configured dimensions', () => {
    const grid = buildAirGrid();
    expect(grid.length).toBe(GRID_ROWS);
    expect(grid[0].length).toBe(GRID_COLS);
    expect(grid.every((row) => row.every((cell) => cell === false))).toBe(true);
  });
});
