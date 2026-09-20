import { resolveDestination } from '../resolveDestination';

const override = { latitude: 1, longitude: 1 };
const active = { latitude: 2, longitude: 2 };
const markerDefaults = {
  drone: { latitude: 10, longitude: 10 },
  hazard: { latitude: 11, longitude: 11 },
  person: { latitude: 12, longitude: 12 },
  rover: { latitude: 13, longitude: 13 },
} as const;

describe('resolveDestination', () => {
  it('prefers an explicit override', () => {
    expect(resolveDestination('person', override, active, markerDefaults)).toEqual(override);
  });

  it('uses the active incident when there is no override', () => {
    expect(resolveDestination('person', undefined, active, markerDefaults)).toEqual(active);
    expect(resolveDestination('hazard', undefined, active, markerDefaults)).toEqual(active);
  });

  it('falls back to the demo marker only when nothing has been reported', () => {
    expect(resolveDestination('hazard', undefined, undefined, markerDefaults)).toEqual(
      markerDefaults.hazard,
    );
  });
});
