import { nextId } from '../id';

describe('nextId', () => {
  it('produces unique ids even when called many times in a tight loop', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => nextId('log')));
    expect(ids.size).toBe(1000);
  });

  it('prefixes the id with the given prefix', () => {
    expect(nextId('inc')).toMatch(/^inc-\d+-\d+$/);
  });
});
