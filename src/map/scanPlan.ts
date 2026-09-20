import type { IncidentType } from '../types';
import type { RouteCoordinate } from '../services/openRouteService';

export interface ScanPerson extends RouteCoordinate {
  id: string;
}

// Plausible headcounts when the reporter left the field blank.
export const PEOPLE_RANGES: Record<IncidentType, [min: number, max: number]> = {
  medical: [1, 2],
  missing: [1, 1],
  sar: [1, 4],
  fire: [1, 5],
  landslide: [2, 6],
  flood: [2, 8],
};

const MAX_PEOPLE = 20;

export function resolvePeopleCount(
  type: IncidentType,
  reported: number | undefined,
  random: () => number = Math.random,
): number {
  if (reported !== undefined && Number.isFinite(reported)) {
    return Math.min(MAX_PEOPLE, Math.max(1, Math.round(reported)));
  }
  const [min, max] = PEOPLE_RANGES[type];
  return min + Math.floor(random() * (max - min + 1));
}

// Small deterministic PRNG so the same incident always lays out the same way.
function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    state ^= seed.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state = Math.imul(state ^ (state >>> 15), 2246822507);
    state = Math.imul(state ^ (state >>> 13), 3266489909);
    state ^= state >>> 16;
    return (state >>> 0) / 4294967296;
  };
}

export function placeScanPeople(
  center: RouteCoordinate,
  side: number,
  count: number,
  seed: string,
): ScanPerson[] {
  const random = seededRandom(seed);
  // Spread inside 80% of the square so markers never sit on the sweep edge.
  const spread = side * 0.8;
  return Array.from({ length: count }, (_, index) => ({
    id: `PERSON-${index + 1}`,
    latitude: center.latitude + (random() * 2 - 1) * spread,
    longitude: center.longitude + (random() * 2 - 1) * spread,
  }));
}

const REVEAL_START = 0.2;
const REVEAL_END = 0.85;

// Detections surface evenly across the middle of the sweep rather than all at once.
export function revealedCount(total: number, progress: number): number {
  if (total <= 0 || progress < REVEAL_START) return 0;
  if (progress >= REVEAL_END) return total;
  const fraction = (progress - REVEAL_START) / (REVEAL_END - REVEAL_START);
  return Math.min(total, Math.floor(fraction * total) + 1);
}
