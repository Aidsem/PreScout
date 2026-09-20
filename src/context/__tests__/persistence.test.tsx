import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { TacticalProvider, useTactical } from '../TacticalContext';
import { memoryStorage, STORAGE_KEY, BACKUP_KEY } from '../../storage/tacticalStorage';
import { serializeSnapshot, parseSnapshot, SCHEMA_VERSION } from '../../storage/tacticalSnapshot';

function setup(storage = memoryStorage()) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TacticalProvider storage={storage} persistDelayMs={0}>
      {children}
    </TacticalProvider>
  );
  return { storage, ...renderHook(() => useTactical(), { wrapper }) };
}

describe('TacticalProvider persistence', () => {
  it('starts un-hydrated and becomes hydrated with defaults when storage is empty', async () => {
    const { result } = setup();
    expect(result.current.hydrated).toBe(false);
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.incidents.map((i) => i.id)).toEqual(['inc-01', 'inc-02', 'inc-03']);
  });

  it('restores incidents, alerts, logs, history and asset assignments from a saved snapshot', async () => {
    const seeded = memoryStorage({
      [STORAGE_KEY]: serializeSnapshot({
        incidents: [{
          id: 'inc-saved', title: 'Saved', type: 'fire', priority: 'high', location: 'X',
          coordinates: { lat: 1, lng: 2 }, assignedAsset: 'DRONE-05 assigned', status: 'EN ROUTE',
          timestamp: 'earlier', description: 'restored',
        }],
        alerts: [],
        logs: [{ id: 'log-saved', time: '01:00', category: 'SYS', message: 'restored log', level: 'info' }],
        missionHistory: [],
        assetAssignments: { 'drone-05': { status: 'ON MISSION', assignedIncidentId: 'inc-saved', eta: '3m' } },
      }),
    });
    const { result } = setup(seeded);
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.incidents[0].id).toBe('inc-saved');
    expect(result.current.alerts).toEqual([]);
    expect(result.current.logs[0].id).toBe('log-saved');
    expect(result.current.missionHistory).toEqual([]);
    const drone = result.current.assets.find((a) => a.id === 'drone-05')!;
    expect(drone.status).toBe('ON MISSION');
    expect(drone.assignedIncidentId).toBe('inc-saved');
    // roster fields still come from the fresh baseline
    expect(drone.name).toBe('DRONE-05');
  });

  it('writes a snapshot after operational state changes', async () => {
    const { result, storage } = setup();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.dispatchIncident({
        title: 'Persist me', type: 'flood', priority: 'critical', location: 'Zone',
        coordinates: { lat: 18.5, lng: 73.8 }, assignedAsset: '', status: 'ACTIVE', description: 'd',
      });
    });

    await waitFor(() => {
      const parsed = parseSnapshot(storage.dump()[STORAGE_KEY]);
      expect(parsed.kind).toBe('ok');
      if (parsed.kind === 'ok') expect(parsed.snapshot.incidents[0].title).toBe('Persist me');
    });
    const parsed = parseSnapshot(storage.dump()[STORAGE_KEY]);
    if (parsed.kind === 'ok') {
      expect(Object.values(parsed.snapshot.assetAssignments).some((a) => a.assignedIncidentId === parsed.snapshot.incidents[0].id)).toBe(true);
    }
  });

  it('does not write before hydration completes', async () => {
    const storage = memoryStorage();
    const { result } = setup(storage);
    expect(storage.dump()[STORAGE_KEY]).toBeUndefined();
    await waitFor(() => expect(result.current.hydrated).toBe(true));
  });

  it('parks a corrupt snapshot under the backup key, starts from defaults, and logs a warning', async () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: SCHEMA_VERSION + 5, data: {} }) });
    const { result } = setup(storage);
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.incidents[0].id).toBe('inc-01');
    expect(storage.dump()[BACKUP_KEY]).toContain(`"version":${SCHEMA_VERSION + 5}`);
    expect(result.current.logs[0]).toMatchObject({ category: 'SYS', level: 'warning' });
    expect(result.current.logs[0].message).toMatch(/could not be restored/i);
  });

  it('still hydrates (with defaults) when storage throws', async () => {
    const broken = {
      getItem: async () => { throw new Error('disk on fire'); },
      setItem: async () => {},
    };
    const { result } = setup(broken as never);
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.incidents[0].id).toBe('inc-01');
    expect(result.current.logs[0].level).toBe('warning');
  });
});
