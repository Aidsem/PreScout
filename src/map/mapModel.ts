export const MAP_W = 400;
export const MAP_H = 540;
export const GRID_COLS = 24;
export const GRID_ROWS = 32;

export type MapLayer = 'grid' | 'sat' | 'thermal';
export type MarkerType = 'drone' | 'hazard' | 'person' | 'rover';

export interface MapPoint {
  x: number;
  y: number;
}

export const MAP_THEMES = {
  grid: {
    land: '#202722',
    water: '#17302d',
    park: '#26331f',
    roadMajor: '#465149',
    roadMinor: '#303933',
    building: '#2B3530',
    buildingStroke: '#536057',
  },
  sat: {
    land: '#20291D',
    water: '#15302E',
    park: '#26371E',
    roadMajor: '#56683C',
    roadMinor: '#3A4A2B',
    building: '#2C3924',
    buildingStroke: '#52623F',
  },
  thermal: {
    land: '#17110F',
    water: '#0B1718',
    park: '#1E1B0F',
    roadMajor: '#5B3A22',
    roadMinor: '#3D281B',
    building: '#2A1813',
    buildingStroke: '#6A4330',
  },
} as const;

export const MAP_BG: Record<MapLayer, string> = {
  grid: '#111512',
  sat: '#11170D',
  thermal: '#0D0A09',
};

export const MAP_MARKERS: Record<
  MarkerType,
  { x: number; y: number; label: string; color: string; icon: string }
> = {
  drone: { x: 92, y: 118, label: 'UNIT 01', color: '#B8D86A', icon: 'drone' },
  hazard: { x: 158, y: 292, label: 'SURGE', color: '#D8786D', icon: 'alert-decagram' },
  person: { x: 278, y: 328, label: 'PERSON 94%', color: '#D7A84B', icon: 'account-alert' },
  rover: { x: 78, y: 458, label: 'ROVER 01', color: '#C7CDC3', icon: 'robot-industrial' },
};

const BUILDINGS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 108, y: 56, w: 56, h: 40 },
  { x: 195, y: 80, w: 59, h: 26 },
  { x: 20, y: 59, w: 36, h: 19 },
  { x: 355, y: 110, w: 22, h: 51 },
  { x: 128, y: 257, w: 33, h: 18 },
];

function inBuilding(x: number, y: number): boolean {
  return BUILDINGS.some((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
}

function inWater(x: number, y: number): boolean {
  if (y >= 198 && y <= 236) return true;
  if (x >= 304 && x <= 322 && y <= 168) return true;
  const dx = (x - 172) / 42;
  const dy = (y - 296) / 16;
  return dx * dx + dy * dy <= 1;
}

export function svgToGrid(svgX: number, svgY: number): [number, number] {
  const col = Math.max(0, Math.min(GRID_COLS - 1, Math.floor((svgX / MAP_W) * GRID_COLS)));
  const row = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor((svgY / MAP_H) * GRID_ROWS)));
  return [row, col];
}

export function gridToSvg(row: number, col: number): MapPoint {
  return {
    x: ((col + 0.5) / GRID_COLS) * MAP_W,
    y: ((row + 0.5) / GRID_ROWS) * MAP_H,
  };
}

function cellCenter(row: number, col: number): MapPoint {
  return gridToSvg(row, col);
}

export function buildGroundGrid(): boolean[][] {
  const grid: boolean[][] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    grid[row] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      const { x, y } = cellCenter(row, col);
      grid[row][col] = inBuilding(x, y) || inWater(x, y);
    }
  }
  return grid;
}

export function buildAirGrid(): boolean[][] {
  return Array.from({ length: GRID_ROWS }, () => Array.from({ length: GRID_COLS }, () => false));
}

export function pointsToPath(points: MapPoint[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}
