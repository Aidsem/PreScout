import { Incident, DetectionAlert, SystemLog, MissionHistoryItem, FleetAsset } from '../types';

/** Bump when the persisted shape changes; add a migration branch in `migrate`. */
export const SCHEMA_VERSION = 1;
/** Logs are append-only and unbounded in memory; cap what we write to disk. */
export const MAX_PERSISTED_LOGS = 500;

export type AssetAssignment = Pick<FleetAsset, 'status' | 'assignedIncidentId' | 'eta'>;

export interface TacticalSnapshot {
  incidents: Incident[];
  alerts: DetectionAlert[];
  logs: SystemLog[];
  missionHistory: MissionHistoryItem[];
  /** Only ON MISSION assets — the roster itself is rebuilt fresh each launch. */
  assetAssignments: Record<string, AssetAssignment>;
}

interface Envelope {
  version: number;
  savedAt: string;
  data: TacticalSnapshot;
}

export type ParseResult =
  | { kind: 'empty' }
  | { kind: 'ok'; snapshot: TacticalSnapshot; savedAt: string }
  | { kind: 'corrupt'; reason: string };

const COLLECTIONS: (keyof TacticalSnapshot)[] = ['incidents', 'alerts', 'logs', 'missionHistory'];

export function serializeSnapshot(snapshot: TacticalSnapshot, savedAt: Date = new Date()): string {
  const envelope: Envelope = {
    version: SCHEMA_VERSION,
    savedAt: savedAt.toISOString(),
    data: { ...snapshot, logs: snapshot.logs.slice(0, MAX_PERSISTED_LOGS) },
  };
  return JSON.stringify(envelope);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Version-specific upgrades go here. Unknown versions are refused, not guessed. */
function migrate(envelope: Record<string, unknown>): Envelope | string {
  if (envelope.version !== SCHEMA_VERSION) {
    return `Unsupported schema version ${String(envelope.version)} (expected ${SCHEMA_VERSION}).`;
  }
  if (!isRecord(envelope.data)) return 'Envelope has no data object.';
  for (const key of COLLECTIONS) {
    if (!Array.isArray(envelope.data[key])) return `Collection "${key}" is missing or not an array.`;
  }
  if (!isRecord(envelope.data.assetAssignments)) return 'Collection "assetAssignments" is missing.';
  return {
    version: SCHEMA_VERSION,
    savedAt: typeof envelope.savedAt === 'string' ? envelope.savedAt : '',
    data: envelope.data as unknown as TacticalSnapshot,
  };
}

export function parseSnapshot(raw: string | null | undefined): ParseResult {
  if (!raw) return { kind: 'empty' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return { kind: 'corrupt', reason: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}` };
  }
  if (!isRecord(parsed)) return { kind: 'corrupt', reason: 'Envelope is not an object.' };
  const migrated = migrate(parsed);
  if (typeof migrated === 'string') return { kind: 'corrupt', reason: migrated };
  return { kind: 'ok', snapshot: migrated.data, savedAt: migrated.savedAt };
}

export function extractAssignments(assets: FleetAsset[]): Record<string, AssetAssignment> {
  const out: Record<string, AssetAssignment> = {};
  for (const asset of assets) {
    if (asset.status === 'ON MISSION') {
      out[asset.id] = { status: asset.status, assignedIncidentId: asset.assignedIncidentId, eta: asset.eta };
    }
  }
  return out;
}

export function applyAssignments(
  assets: FleetAsset[],
  assignments: Record<string, AssetAssignment>
): FleetAsset[] {
  return assets.map((asset) => (assignments[asset.id] ? { ...asset, ...assignments[asset.id] } : asset));
}
