import { PEOPLE_RANGES, placeScanPeople, resolvePeopleCount, revealedCount } from '../scanPlan';

describe('resolvePeopleCount', () => {
  it('uses the reported number when the reporter gave one', () => {
    expect(resolvePeopleCount('medical', 4, () => 0.99)).toBe(4);
  });

  it('clamps a reported number into a sane range', () => {
    expect(resolvePeopleCount('flood', 0, () => 0)).toBe(1);
    expect(resolvePeopleCount('flood', 500, () => 0)).toBe(20);
  });

  it('falls back to the incident type range when nothing was reported', () => {
    for (const type of Object.keys(PEOPLE_RANGES) as (keyof typeof PEOPLE_RANGES)[]) {
      const [min, max] = PEOPLE_RANGES[type];
      expect(resolvePeopleCount(type, undefined, () => 0)).toBe(min);
      expect(resolvePeopleCount(type, undefined, () => 0.999)).toBe(max);
    }
  });

  it('a missing-person report defaults to one person', () => {
    expect(resolvePeopleCount('missing', undefined, () => 0.5)).toBe(1);
  });
});

describe('placeScanPeople', () => {
  const center = { latitude: 18.52, longitude: 73.85 };
  const side = 0.003;

  it('returns exactly the requested number of people with sequential ids', () => {
    const people = placeScanPeople(center, side, 5, 'inc-1');
    expect(people.map((p) => p.id)).toEqual(['PERSON-1', 'PERSON-2', 'PERSON-3', 'PERSON-4', 'PERSON-5']);
  });

  it('keeps every person inside the scan square', () => {
    for (const person of placeScanPeople(center, side, 12, 'inc-2')) {
      expect(Math.abs(person.latitude - center.latitude)).toBeLessThan(side);
      expect(Math.abs(person.longitude - center.longitude)).toBeLessThan(side);
    }
  });

  it('is deterministic for the same incident and differs between incidents', () => {
    const a = placeScanPeople(center, side, 3, 'inc-3');
    expect(placeScanPeople(center, side, 3, 'inc-3')).toEqual(a);
    expect(placeScanPeople(center, side, 3, 'inc-4')).not.toEqual(a);
  });
});

describe('revealedCount', () => {
  it('reveals nobody before the sweep gets going and everybody near the end', () => {
    expect(revealedCount(5, 0)).toBe(0);
    expect(revealedCount(5, 0.1)).toBe(0);
    expect(revealedCount(5, 0.9)).toBe(5);
    expect(revealedCount(5, 1)).toBe(5);
  });

  it('never decreases as progress increases and reaches the total', () => {
    for (const total of [1, 2, 3, 7]) {
      let last = 0;
      for (let progress = 0; progress <= 1.0001; progress += 0.01) {
        const now = revealedCount(total, progress);
        expect(now).toBeGreaterThanOrEqual(last);
        expect(now).toBeLessThanOrEqual(total);
        last = now;
      }
      expect(last).toBe(total);
    }
  });

  it('handles a single person', () => {
    expect(revealedCount(1, 0.5)).toBe(1);
  });
});
