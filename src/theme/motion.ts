import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export const Durations = { fast: 150, base: 250, slow: 400 } as const;
export const StaggerMs = 40;
export const Spring = { damping: 18, stiffness: 180 } as const;

export function scaleDuration(ms: number, reduced: boolean): number {
  return reduced ? 0 : ms;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduced(value); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; sub.remove(); };
  }, []);
  return reduced;
}
