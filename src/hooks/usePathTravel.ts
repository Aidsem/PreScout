import { useEffect, useState } from 'react';
import { MapPoint } from '../map/mapModel';
import { pathLength, pointAlongPath } from '../utils/pathMotion';

export function usePathTravel(
  path: MapPoint[] | undefined,
  home: MapPoint,
  speedPxPerSecond: number
) {
  const [pos, setPos] = useState<MapPoint>(home);
  const [progress, setProgress] = useState(0);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (!path || path.length < 2) {
      setPos(home);
      setProgress(0);
      setArrived(false);
      return;
    }

    const total = Math.max(pathLength(path), 1);
    const duration = Math.max(3200, Math.min(16000, (total / speedPxPerSecond) * 1000));
    let raf = 0;
    const started = Date.now();
    setPos(path[0]);
    setProgress(0);
    setArrived(false);

    const tick = () => {
      const t = Math.min(1, (Date.now() - started) / duration);
      setPos(pointAlongPath(path, t));
      setProgress(t);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setArrived(true);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [path, home.x, home.y, speedPxPerSecond]);

  return { pos, progress, arrived };
}
