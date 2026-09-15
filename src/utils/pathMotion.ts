import { MapPoint } from '../map/mapModel';

export function pathLength(points: MapPoint[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

export function pointAlongPath(points: MapPoint[], t: number): MapPoint {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1 || t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  const total = pathLength(points);
  if (total === 0) return points[0];

  let remaining = t * total;
  for (let i = 1; i < points.length; i++) {
    const seg = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (remaining <= seg) {
      const u = seg === 0 ? 0 : remaining / seg;
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * u,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * u,
      };
    }
    remaining -= seg;
  }
  return points[points.length - 1];
}

export function ensurePath(computed: MapPoint[], start: MapPoint, end: MapPoint): MapPoint[] {
  if (computed.length >= 2) {
    return [{ x: start.x, y: start.y }, ...computed.slice(1)];
  }
  return [start, end];
}
