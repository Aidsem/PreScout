import { resolveViewTarget } from '../mapView';

const focus = { latitude: 1, longitude: 1 };
const incident = { latitude: 2, longitude: 2 };
const fallback = { latitude: 3, longitude: 3 };

describe('resolveViewTarget', () => {
  it('centres on a focused detection first, zoomed in', () => {
    expect(resolveViewTarget(focus, incident, fallback)).toEqual({ center: [1, 1], zoom: 16 });
  });

  it('otherwise centres on the active incident at a working zoom', () => {
    expect(resolveViewTarget(undefined, incident, fallback)).toEqual({ center: [2, 2], zoom: 13 });
  });

  it('falls back to the projection window when nothing is active', () => {
    expect(resolveViewTarget(undefined, undefined, fallback)).toEqual({ center: [3, 3], zoom: 11 });
  });

  it('yields an identical target for the same inputs so the page can skip re-centring', () => {
    const a = resolveViewTarget(undefined, incident, fallback);
    const b = resolveViewTarget(undefined, { ...incident }, { ...fallback });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
