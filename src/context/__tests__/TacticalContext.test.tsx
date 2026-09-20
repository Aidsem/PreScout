import { renderHook, act } from '@testing-library/react-native';
import { TacticalProvider, useTactical } from '../TacticalContext';

describe('dispatchIncident', () => {
  it('assigns an available drone and rover and marks them ON MISSION', () => {
    const { result } = renderHook(() => useTactical(), { wrapper: TacticalProvider });

    let dispatchResult: ReturnType<typeof result.current.dispatchIncident>;
    act(() => {
      dispatchResult = result.current.dispatchIncident({
        title: 'Test Incident',
        type: 'flood',
        priority: 'critical',
        location: 'Test Zone',
        coordinates: { lat: 18.52, lng: 73.85 },
        assignedAsset: '',
        status: 'ACTIVE',
        description: 'Test',
      });
    });

    expect(dispatchResult!.drone).toBeDefined();
    expect(dispatchResult!.rover).toBeDefined();
    expect(dispatchResult!.incident.id).toMatch(/^inc-/);

    const assignedDrone = result.current.assets.find((a) => a.id === dispatchResult!.drone?.id);
    expect(assignedDrone?.status).toBe('ON MISSION');
    expect(assignedDrone?.assignedIncidentId).toBe(dispatchResult!.incident.id);
  });

  it('adds the new incident to the front of the incidents list', () => {
    const { result } = renderHook(() => useTactical(), { wrapper: TacticalProvider });
    const initialCount = result.current.incidents.length;

    act(() => {
      result.current.dispatchIncident({
        title: 'Second Incident',
        type: 'medical',
        priority: 'high',
        location: 'Zone B',
        coordinates: { lat: 18.51, lng: 73.86 },
        assignedAsset: '',
        status: 'ACTIVE',
        description: 'Test',
      });
    });

    expect(result.current.incidents.length).toBe(initialCount + 1);
    expect(result.current.incidents[0].title).toBe('Second Incident');
  });
});
