import type { RouteCoordinate } from '../services/openRouteService';

export interface ViewTarget {
  center: [number, number];
  zoom: number;
}

// What the map should be looking at. Deliberately ignores routes, detections and
// unit positions so those updates never yank the view away from the operator.
export function resolveViewTarget(
  focus: RouteCoordinate | undefined,
  incident: RouteCoordinate | undefined,
  fallback: RouteCoordinate,
): ViewTarget {
  if (focus) return { center: [focus.latitude, focus.longitude], zoom: 16 };
  if (incident) return { center: [incident.latitude, incident.longitude], zoom: 13 };
  return { center: [fallback.latitude, fallback.longitude], zoom: 11 };
}
