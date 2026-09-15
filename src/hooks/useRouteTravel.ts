import { useEffect, useState } from 'react';
import { RouteCoordinate } from '../services/openRouteService';

function segmentLength(from: RouteCoordinate, to: RouteCoordinate) {
  const latitudeScale = 111;
  const longitudeScale = 111 * Math.cos((from.latitude * Math.PI) / 180);
  return Math.hypot(
    (to.latitude - from.latitude) * latitudeScale,
    (to.longitude - from.longitude) * longitudeScale
  );
}

function routeLength(route: RouteCoordinate[]) {
  return route.reduce(
    (total, point, index) => index === 0 ? 0 : total + segmentLength(route[index - 1], point),
    0
  );
}

function pointAlongRoute(route: RouteCoordinate[], progress: number): RouteCoordinate {
  if (route.length === 0) return { latitude: 0, longitude: 0 };
  if (route.length === 1 || progress <= 0) return route[0];
  if (progress >= 1) return route[route.length - 1];

  const total = routeLength(route);
  if (total === 0) return route[0];

  let remaining = progress * total;
  for (let index = 1; index < route.length; index += 1) {
    const length = segmentLength(route[index - 1], route[index]);
    if (remaining <= length) {
      const ratio = length === 0 ? 0 : remaining / length;
      return {
        latitude: route[index - 1].latitude + (route[index].latitude - route[index - 1].latitude) * ratio,
        longitude: route[index - 1].longitude + (route[index].longitude - route[index - 1].longitude) * ratio,
      };
    }
    remaining -= length;
  }
  return route[route.length - 1];
}

export function useRouteTravel(
  route: RouteCoordinate[] | undefined,
  home: RouteCoordinate,
  speedKmPerHour: number
) {
  const [position, setPosition] = useState<RouteCoordinate>(home);
  const [progress, setProgress] = useState(0);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (!route || route.length < 2) {
      setPosition(home);
      setProgress(0);
      setArrived(false);
      return;
    }

    const duration = Math.max(4500, Math.min(24000, (routeLength(route) / speedKmPerHour) * 3600000));
    let animationFrame = 0;
    const startedAt = Date.now();
    setPosition(route[0]);
    setProgress(0);
    setArrived(false);

    const tick = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      setPosition(pointAlongRoute(route, progress));
      setProgress(progress);
      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick);
      } else {
        setArrived(true);
      }
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [route, home.latitude, home.longitude, speedKmPerHour]);

  return { position, progress, arrived };
}
