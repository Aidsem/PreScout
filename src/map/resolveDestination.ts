import type { MarkerType } from './mapModel';
import type { RouteCoordinate } from '../services/openRouteService';

// Where a route should go: an explicit request wins, then whatever incident is
// currently active on the map, and only then the demo marker for that type.
export function resolveDestination(
  marker: MarkerType,
  override: RouteCoordinate | undefined,
  activeIncident: RouteCoordinate | undefined,
  markerDefaults: Record<MarkerType, RouteCoordinate>,
): RouteCoordinate {
  return override ?? activeIncident ?? markerDefaults[marker];
}
