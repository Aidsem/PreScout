import {
  SCHEMA_VERSION,
  MAX_PERSISTED_LOGS,
  serializeSnapshot,
  parseSnapshot,
  extractAssignments,
  applyAssignments,
  TacticalSnapshot,
} from '../tacticalSnapshot';
import { memoryStorage } from '../tacticalStorage';
import { FleetAsset, SystemLog } from '../../types';

const baseAsset: FleetAsset = {
  id: 'drone-01',
  name: 'DRONE-01',
  type: 'drone',
  subType: 'Recon Drone',
  status: 'AVAILABLE',
  battery: 90,
  signal: 'Strong',
  payload: 'RGB',
  stationId: 'st-1',
  stationName: 'Station 1',
  homeCoordinates: { lat: 0, lng: 0 },
};

const snapshot: TacticalSnapshot = {
  incidents: [],
  alerts: [],
  logs: [{ id: 'log-1', time: '00:00', category: 'SYS', message: 'hi', level: 'info' }],
  missionHistory: [],
  assetAssignments: { 'drone-01': { status: 'ON MISSION', assignedIncidentId: 'inc-9', eta: '4m' } },
};

describe('serializeSnapshot / parseSnapshot', () => {
  it('round-trips a snapshot inside a versioned envelope', () => {
    const raw = serializeSnapshot(snapshot, new Date('2026-09-20T10:00:00Z'));
    expect(JSON.parse(raw).version).toBe(SCHEMA_VERSION);
    const result = parseSnapshot(raw);
    expect(result).toEqual({ kind: 'ok', snapshot, savedAt: '2026-09-20T10:00:00.000Z' });
  });

  it('reports empty for null/undefined/blank input', () => {
    expect(parseSnapshot(null)).toEqual({ kind: 'empty' });
    expect(parseSnapshot(undefined)).toEqual({ kind: 'empty' });
    expect(parseSnapshot('')).toEqual({ kind: 'empty' });
  });

  it('reports corrupt for invalid JSON', () => {
    expect(parseSnapshot('{not json')).toMatchObject({ kind: 'corrupt' });
  });

  it('reports corrupt for an unknown schema version', () => {
    const raw = JSON.stringify({ version: SCHEMA_VERSION + 1, savedAt: 'x', data: snapshot });
    expect(parseSnapshot(raw)).toMatchObject({ kind: 'corrupt', reason: expect.stringContaining('version') });
  });

  it('reports corrupt when a required collection is missing or not an array', () => {
    const raw = JSON.stringify({ version: SCHEMA_VERSION, savedAt: 'x', data: { ...snapshot, incidents: 'nope' } });
    expect(parseSnapshot(raw)).toMatchObject({ kind: 'corrupt', reason: expect.stringContaining('incidents') });
  });

  it('caps persisted logs at MAX_PERSISTED_LOGS, keeping the newest (front) entries', () => {
    const logs: SystemLog[] = Array.from({ length: MAX_PERSISTED_LOGS + 10 }, (_, i) => ({
      id: `log-${i}`, time: '00:00', category: 'SYS', message: `m${i}`, level: 'info',
    }));
    const result = parseSnapshot(serializeSnapshot({ ...snapshot, logs }));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.snapshot.logs).toHaveLength(MAX_PERSISTED_LOGS);
      expect(result.snapshot.logs[0].id).toBe('log-0');
    }
  });
});

describe('extractAssignments / applyAssignments', () => {
  it('extracts only ON MISSION assets', () => {
    const assets: FleetAsset[] = [
      { ...baseAsset, id: 'a', status: 'ON MISSION', assignedIncidentId: 'inc-1', eta: '2m' },
      { ...baseAsset, id: 'b', status: 'AVAILABLE' },
      { ...baseAsset, id: 'c', status: 'CHARGING', eta: 'Charging' },
    ];
    expect(extractAssignments(assets)).toEqual({
      a: { status: 'ON MISSION', assignedIncidentId: 'inc-1', eta: '2m' },
    });
  });

  it('overlays assignments onto a fresh roster and ignores unknown asset ids', () => {
    const roster: FleetAsset[] = [{ ...baseAsset, id: 'a' }, { ...baseAsset, id: 'b' }];
    const result = applyAssignments(roster, {
      a: { status: 'ON MISSION', assignedIncidentId: 'inc-1', eta: '2m' },
      ghost: { status: 'ON MISSION', assignedIncidentId: 'inc-2', eta: '1m' },
    });
    expect(result.find((x) => x.id === 'a')).toMatchObject({ status: 'ON MISSION', assignedIncidentId: 'inc-1' });
    expect(result.find((x) => x.id === 'b')!.status).toBe('AVAILABLE');
    expect(result).toHaveLength(2);
  });
});

describe('memoryStorage', () => {
  it('stores and returns values, exposing a dump for assertions', async () => {
    const storage = memoryStorage({ seeded: '1' });
    expect(await storage.getItem('seeded')).toBe('1');
    expect(await storage.getItem('missing')).toBeNull();
    await storage.setItem('k', 'v');
    expect(storage.dump()).toEqual({ seeded: '1', k: 'v' });
  });
});
