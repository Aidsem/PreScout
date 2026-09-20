import { scaleDuration, Durations, StaggerMs } from '../motion';

describe('motion tokens', () => {
  it('exposes the spec durations', () => {
    expect(Durations).toEqual({ fast: 150, base: 250, slow: 400 });
    expect(StaggerMs).toBe(40);
  });
  it('zeroes durations when reduced motion is on', () => {
    expect(scaleDuration(250, true)).toBe(0);
    expect(scaleDuration(250, false)).toBe(250);
  });
});
