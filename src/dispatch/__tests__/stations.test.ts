import { distanceBetween } from '../stations';

describe('distanceBetween', () => {
  it('returns 0 for identical coordinates', () => {
    expect(distanceBetween({ lat: 18.52, lng: 73.85 }, { lat: 18.52, lng: 73.85 })).toBe(0);
  });

  it('computes straight-line distance between two points', () => {
    expect(distanceBetween({ lat: 0, lng: 0 }, { lat: 3, lng: 4 })).toBeCloseTo(5);
  });
});
