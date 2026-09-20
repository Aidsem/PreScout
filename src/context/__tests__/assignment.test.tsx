import { renderHook, act } from '@testing-library/react-native';
import { TacticalProvider, useTactical } from '../TacticalContext';

function setup() {
  return renderHook(() => useTactical(), { wrapper: TacticalProvider });
}

describe('assignAsset', () => {
  it('assigns an available asset to an active incident and updates both records', () => {
    const { result } = setup();
    const asset = result.current.assets.find((a) => a.status === 'AVAILABLE')!;
    const incident = result.current.incidents.find((i) => i.status !== 'RESOLVED')!;

    let outcome: ReturnType<typeof result.current.assignAsset>;
    act(() => {
      outcome = result.current.assignAsset(asset.id, incident.id);
    });

    expect(outcome!).toEqual({ ok: true });
    const updatedAsset = result.current.assets.find((a) => a.id === asset.id)!;
    expect(updatedAsset.status).toBe('ON MISSION');
    expect(updatedAsset.assignedIncidentId).toBe(incident.id);
    const updatedIncident = result.current.incidents.find((i) => i.id === incident.id)!;
    expect(updatedIncident.assignedAsset).toContain(asset.name);
    expect(result.current.logs[0].message).toContain(asset.name);
  });

  it('rejects an asset that is not available', () => {
    const { result } = setup();
    const busy = result.current.assets.find((a) => a.status === 'ON MISSION')!;
    const incident = result.current.incidents[0];

    let outcome: ReturnType<typeof result.current.assignAsset>;
    act(() => {
      outcome = result.current.assignAsset(busy.id, incident.id);
    });

    expect(outcome!.ok).toBe(false);
    expect(result.current.assets.find((a) => a.id === busy.id)!.assignedIncidentId).toBe(
      busy.assignedIncidentId,
    );
  });

  it('rejects an unknown or resolved incident instead of defaulting to inc-01', () => {
    const { result } = setup();
    const asset = result.current.assets.find((a) => a.status === 'AVAILABLE')!;

    let outcome: ReturnType<typeof result.current.assignAsset>;
    act(() => {
      outcome = result.current.assignAsset(asset.id, 'does-not-exist');
    });

    expect(outcome!.ok).toBe(false);
    expect(result.current.assets.find((a) => a.id === asset.id)!.status).toBe('AVAILABLE');
    expect(result.current.assets.find((a) => a.id === asset.id)!.assignedIncidentId).toBeUndefined();
  });
});

describe('unassignAsset', () => {
  it('returns the asset to the pool and refreshes the incident label', () => {
    const { result } = setup();
    const asset = result.current.assets.find((a) => a.status === 'AVAILABLE')!;
    const incident = result.current.incidents.find((i) => i.status !== 'RESOLVED')!;

    act(() => {
      result.current.assignAsset(asset.id, incident.id);
    });
    act(() => {
      result.current.unassignAsset(asset.id);
    });

    const updatedAsset = result.current.assets.find((a) => a.id === asset.id)!;
    expect(updatedAsset.status).toBe('AVAILABLE');
    expect(updatedAsset.assignedIncidentId).toBeUndefined();
    expect(result.current.incidents.find((i) => i.id === incident.id)!.assignedAsset).not.toContain(
      asset.name,
    );
  });
});
