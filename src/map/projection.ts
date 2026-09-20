import { MAP_H, MAP_W, MapPoint } from './mapModel';
import type { RouteCoordinate } from '../services/openRouteService';

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapProjection {
  bounds: GeoBounds;
  toPoint(coordinate: RouteCoordinate): MapPoint;
  toCoordinate(point: MapPoint): RouteCoordinate;
  contains(coordinate: RouteCoordinate): boolean;
}

// The original hard-coded demo window over Pune; used only when the map has
// nothing specific to show.
export const DEFAULT_BOUNDS: GeoBounds = { north: 18.56, south: 18.44, east: 73.93, west: 73.79 };

// Roughly 2 km at Pune's latitude — keeps single-point / coincident inputs from
// collapsing the canvas to zero width or height.
const MIN_SPAN_DEGREES = 0.02;

export function projectionFromBounds(bounds: GeoBounds): MapProjection {
  const latSpan = bounds.north - bounds.south;
  const lngSpan = bounds.east - bounds.west;
  return {
    bounds,
    toPoint: (coordinate) => ({
      x: ((coordinate.longitude - bounds.west) / lngSpan) * MAP_W,
      y: ((bounds.north - coordinate.latitude) / latSpan) * MAP_H,
    }),
    toCoordinate: (point) => ({
      latitude: bounds.north - (point.y / MAP_H) * latSpan,
      longitude: bounds.west + (point.x / MAP_W) * lngSpan,
    }),
    contains: (coordinate) =>
      coordinate.latitude <= bounds.north &&
      coordinate.latitude >= bounds.south &&
      coordinate.longitude <= bounds.east &&
      coordinate.longitude >= bounds.west,
  };
}

export function createProjection(points: RouteCoordinate[], padding = 0.2): MapProjection {
  const valid = points.filter(
    (point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude),
  );
  if (valid.length === 0) return projectionFromBounds(DEFAULT_BOUNDS);

  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;
  for (const point of valid) {
    north = Math.max(north, point.latitude);
    south = Math.min(south, point.latitude);
    east = Math.max(east, point.longitude);
    west = Math.min(west, point.longitude);
  }

  const latSpan = Math.max(north - south, MIN_SPAN_DEGREES);
  const lngSpan = Math.max(east - west, MIN_SPAN_DEGREES);
  const latCenter = (north + south) / 2;
  const lngCenter = (east + west) / 2;
  const halfLat = (latSpan * (1 + padding * 2)) / 2;
  const halfLng = (lngSpan * (1 + padding * 2)) / 2;

  return projectionFromBounds({
    north: latCenter + halfLat,
    south: latCenter - halfLat,
    east: lngCenter + halfLng,
    west: lngCenter - halfLng,
  });
}
