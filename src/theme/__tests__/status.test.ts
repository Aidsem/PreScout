import { statusTone } from '../status';
import { Colors } from '../colors';

describe('statusTone', () => {
  it.each([
    ['ACTIVE', Colors.danger],
    ['EN ROUTE', Colors.accent],
    ['SEARCH ACTIVE', Colors.info],
    ['CONTAINED', Colors.warning],
    ['RESOLVED', Colors.success],
    ['AVAILABLE', Colors.success],
    ['ON MISSION', Colors.accent],
    ['CHARGING', Colors.warning],
    ['MAINTENANCE', Colors.inkMuted],
  ] as const)('maps %s to the spec colour', (status, color) => {
    expect(statusTone(status).color).toBe(color);
    expect(statusTone(status).container).toMatch(/^#[0-9A-F]{6}$/i);
  });
});
