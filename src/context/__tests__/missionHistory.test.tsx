import { renderHook, act } from '@testing-library/react-native';
import { TacticalProvider, useTactical } from '../TacticalContext';

describe('recordMission', () => {
  it('prepends a real operation to mission history and logs it', () => {
    const { result } = renderHook(() => useTactical(), { wrapper: TacticalProvider });
    const before = result.current.missionHistory.length;

    act(() => {
      result.current.recordMission({
        code: 'OP-TEST-01',
        title: 'Test Op',
        type: 'Search & Rescue',
        date: '2026-09-20',
        time: '08:15:00 UTC',
        location: 'Somewhere',
        coordinates: '18.5204°N, 73.8567°E',
        status: 'COMPLETED',
        dronesCount: 1,
        roversCount: 1,
        duration: '00:05:00',
        telemetrySize: '0.2 GB Telemetry',
      });
    });

    expect(result.current.missionHistory.length).toBe(before + 1);
    expect(result.current.missionHistory[0].title).toBe('Test Op');
    expect(result.current.missionHistory[0].id).toMatch(/^hist-/);
    expect(result.current.logs[0].message).toContain('OP-TEST-01');
  });
});
