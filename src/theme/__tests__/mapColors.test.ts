import { MapColors } from '../colors';

describe('MapColors', () => {
  it('keeps every semantic marker colour distinct', () => {
    const semantic = [
      'drone',
      'rover',
      'fireStation',
      'policeStation',
      'hospital',
      'person',
      'hazard',
      'incident',
    ] as const;

    const values = semantic.map((key) => MapColors[key]);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('pairs each route colour with its vehicle colour', () => {
    expect(MapColors.droneRoute).toBe(MapColors.drone);
    expect(MapColors.roverRoute).toBe(MapColors.rover);
  });
});
