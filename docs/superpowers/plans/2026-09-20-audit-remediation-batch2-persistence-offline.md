# Audit Remediation Batch 2: Persistence, Offline UX, Claims — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Execution workflow requested by the user:**
> 1. Tests first — every task starts with a failing test (superpowers:test-driven-development; `mattpocock-skills:tdd` governs strictness: the test must encode the *spec sentence* it verifies, and implementation must not exceed what the test demands).
> 2. File edits are performed by a **Lich subagent**: before each spawn, run `lich-skills:subagent-brief` and compress the task to a ≤200-word brief (task number, files, the test code, the exact command that must go green). Subagent type: `general-purpose`.
> 3. After every task the orchestrator runs `npx tsc --noEmit && npm test` itself (superpowers:verification-before-completion) before moving on. No task is "done" on the subagent's word alone.
> 4. On first execution, copy this file to `docs/superpowers/plans/2026-09-20-audit-remediation-batch2-persistence-offline.md` so the plan travels with the repo.

**Goal:** Close the remaining open findings of `AUDIT_BUG_REPORT.md` (B08 persistence, B09 offline claims/UX) and record the disposition of every finding, leaving `tsc` and the Jest suite green.

**Architecture:** A pure, unit-tested snapshot codec (`src/storage/tacticalSnapshot.ts`) serialises the durable operational record into a versioned envelope with corrupt-data recovery. `TacticalProvider` gains an injectable `storage` adapter (defaults to AsyncStorage), hydrates once on mount and writes debounced on change; `SplashScreen` waits for hydration before handing off. A `useNetworkStatus` hook + `OfflineNotice` component surface loss of connectivity on the two screens that need the network (map, place search), and the README is corrected to state what actually works offline.

**Tech Stack:** Expo SDK 57, React Native 0.86.3, React 19.2.3, TypeScript 6 strict, Jest 29 via `jest-expo`, `@testing-library/react-native`. Adds `@react-native-async-storage/async-storage@2.2.0` and `@react-native-community/netinfo@12.0.1` (both Expo-57-bundled; install via `npx expo install`).

**Spec:** `AUDIT_BUG_REPORT.md` (this plan argues from it). Related: `docs/superpowers/specs/2026-09-20-resqmesh-production-hardening-design.md` §6 (persistence; note its amendment defers SQLite — this plan lands the AsyncStorage layer behind an adapter so the SQLite mirror can replace it without touching `TacticalProvider`).

## Context

`AUDIT_BUG_REPORT.md` lists eleven findings. Verified against the working tree on 2026-09-20 (`npx tsc --noEmit` exit 0; `npm test` 14 suites / 56 tests passing):

| Finding | State | Evidence |
|---|---|---|
| B01 `navigation.params` crash | **already fixed** | `DetectionDetailsScreen.tsx:39` reads `route.params ?? {}` with typed `RootStackScreenProps` |
| B02 native map `showCenters` | **already fixed** | `OpenRouteMap.native.tsx:29` |
| B03 iframe `pointerEvents` | **already fixed** | `OpenRouteMap.web.tsx:78` in `style` |
| B04 `'error'` log level | **already fixed** | `DetectionDetailsScreen.tsx:74` logs `'warning'` (spec's second option) |
| B05 no test runner | **already fixed** | `jest.config.js`, `"test": "jest"`, CI workflow |
| B06 static mission history | **already fixed** | `recordMission` + `missionHistory.test.tsx`; `LiveMapScreen.tsx:166` calls it |
| B07 asset → `inc-01` | **already fixed** | incident selector in `AssetSelectionScreen.tsx:20-41`; validated `assignAsset` + `assignment.test.tsx` |
| B11 splash timeout | **already fixed** | `SplashScreen.tsx` stores/clears `handoff` |
| **B08** state lost on restart | **open** | no storage lib, no hydration anywhere in `src/` |
| **B09** offline claims | **open** | README lines 71, 178, 200-206 claim offline map/persistence |
| B10 no backend | **deferred by user decision** | separate `2026-09-20-resqmesh-backend-design.md`; out of scope |

User decisions (2026-09-20): B08 → AsyncStorage now, behind an adapter. B09 → revise claims **and** add an offline banner. B10 → out of scope.

## Global Constraints

- `npx tsc --noEmit` must stay clean under `"strict": true` — no new `any`.
- Match existing style: 2-space indent, single quotes, `React.FC<Props>` components, `Colors` from `src/theme/colors.ts`, IDs via `nextId()` from `src/utils/id.ts`.
- Per `AGENTS.md`: consult https://docs.expo.dev/versions/v57.0.0/ (specifically the `async-storage` and `netinfo` pages) before writing native-module code. Install with `npx expo install <pkg>`, never `npm install <pkg>`.
- Existing behaviour must not change except where a task says so. Existing 56 tests must keep passing untouched, except the `waitFor(hydrated)` addition described in Task 3.
- `telemetry`, `missionParams`, `latestDispatch`, `flightSimToken` are **not** persisted (live/simulated per-session state — hardening spec §6).
- Commit after every task with a conventional-commit message ending in `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## File Structure

| File | Responsibility |
|---|---|
| `src/storage/tacticalSnapshot.ts` (new) | Pure codec: envelope type, `SCHEMA_VERSION`, `serializeSnapshot`, `parseSnapshot`, `extractAssignments`, `applyAssignments`. No React, no I/O. |
| `src/storage/tacticalStorage.ts` (new) | `TacticalStorage` adapter interface, `asyncStorageAdapter` (wraps AsyncStorage), `memoryStorage()` for tests, `STORAGE_KEY`, `BACKUP_KEY`. |
| `src/storage/__tests__/tacticalSnapshot.test.ts` (new) | Codec tests incl. corrupt/version-mismatch recovery. |
| `src/context/TacticalContext.tsx` (modify) | Accept `storage` prop, hydrate on mount, debounced persist, expose `hydrated`. |
| `src/context/__tests__/persistence.test.tsx` (new) | Provider hydrates from storage, writes on change, recovers from corrupt data. |
| `src/screens/SplashScreen.tsx` (modify) | Wait for `hydrated` before `navigation.replace`. |
| `src/hooks/useNetworkStatus.ts` (new) | `isOfflineState()` pure helper + `useNetworkStatus()` hook over NetInfo. |
| `src/hooks/__tests__/useNetworkStatus.test.ts` (new) | Pure helper tests. |
| `src/components/OfflineNotice.tsx` (new) | Banner rendered only when offline. |
| `src/components/__tests__/OfflineNotice.test.tsx` (new) | Renders / hides by mocked hook. |
| `src/screens/LiveMapScreen.tsx`, `src/screens/CreateIncidentScreen.tsx` (modify) | Mount `OfflineNotice`; skip Photon fetch when offline. |
| `jest.config.js`, `jest.setup.js` (new) | Register the two libraries' official Jest mocks. |
| `README.md`, `AUDIT_BUG_REPORT.md` (modify) | Accurate offline claims; remediation-status appendix. |

---

### Task 0: Baseline, commit pre-existing working-tree changes, save plan

**Files:**
- Modify (already dirty): `package.json`, `package-lock.json`, `src/screens/LiveMapScreen.tsx` (trailing newline only)
- Create: `docs/superpowers/plans/2026-09-20-audit-remediation-batch2-persistence-offline.md`

- [ ] **Step 1: Confirm baseline is green**

Run: `npx tsc --noEmit && npm test -- --ci 2>&1 | tail -6`
Expected: tsc exit 0; `Tests: 56 passed, 56 total`.

- [ ] **Step 2: Copy this plan into the repo**

```bash
cp ~/.claude/plans/open-audit-bug-report-md-and-modify-mellow-wigderson.md \
   docs/superpowers/plans/2026-09-20-audit-remediation-batch2-persistence-offline.md
```

- [ ] **Step 3: Commit the pre-existing dependency bumps and the plan**

The dirty files are Expo patch bumps (`expo-image-picker`/`expo-location` ~57.0.19, `eslint-config-expo` ~57.0.2) that were already made before this plan. `npm ci` in CI requires the lockfile to match, so they ship first.

```bash
git add package.json package-lock.json src/screens/LiveMapScreen.tsx docs/superpowers/plans/2026-09-20-audit-remediation-batch2-persistence-offline.md
git commit -m "chore: bump expo patch deps and add audit batch-2 plan

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 1: Install storage/network libraries and wire their Jest mocks

**Files:**
- Modify: `package.json`, `package-lock.json`, `jest.config.js`
- Create: `jest.setup.js`

**Interfaces:**
- Produces: `@react-native-async-storage/async-storage` and `@react-native-community/netinfo` importable in app and test code, with in-memory mocks active under Jest.

- [ ] **Step 1: Write the failing test** — a smoke test proving the mocks are wired.

Create `src/storage/__tests__/mocks.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

describe('test-environment mocks', () => {
  it('AsyncStorage round-trips a value in memory', async () => {
    await AsyncStorage.setItem('k', 'v');
    expect(await AsyncStorage.getItem('k')).toBe('v');
  });

  it('NetInfo.fetch resolves a connected state', async () => {
    const state = await NetInfo.fetch();
    expect(state.isConnected).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest src/storage/__tests__/mocks.test.ts`
Expected: FAIL — `Cannot find module '@react-native-async-storage/async-storage'`.

- [ ] **Step 3: Install the Expo-pinned versions**

```bash
npx expo install @react-native-async-storage/async-storage @react-native-community/netinfo
```

Expected: `package.json` gains `"@react-native-async-storage/async-storage": "2.2.0"` and `"@react-native-community/netinfo": "12.0.1"` (values from `node_modules/expo/bundledNativeModules.json`).

- [ ] **Step 4: Register the official mocks**

Create `jest.setup.js`:

```js
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);
```

Modify `jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.claude/', '/server/', '/shared/'],
};
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest src/storage/__tests__/mocks.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Full verification and commit**

Run: `npx tsc --noEmit && npm test -- --ci 2>&1 | tail -6`
Expected: tsc clean; `Tests: 58 passed`.

```bash
git add package.json package-lock.json jest.config.js jest.setup.js src/storage/__tests__/mocks.test.ts
git commit -m "chore: add async-storage and netinfo with jest mocks

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Pure snapshot codec with versioning and corrupt-data recovery (B08)

**Files:**
- Create: `src/storage/tacticalSnapshot.ts`
- Create: `src/storage/tacticalStorage.ts`
- Test: `src/storage/__tests__/tacticalSnapshot.test.ts`

**Interfaces:**
- Produces (consumed by Task 3):

```ts
export const SCHEMA_VERSION = 1;
export type AssetAssignment = Pick<FleetAsset, 'status' | 'assignedIncidentId' | 'eta'>;
export interface TacticalSnapshot {
  incidents: Incident[];
  alerts: DetectionAlert[];
  logs: SystemLog[];
  missionHistory: MissionHistoryItem[];
  assetAssignments: Record<string, AssetAssignment>;
}
export type ParseResult =
  | { kind: 'empty' }
  | { kind: 'ok'; snapshot: TacticalSnapshot; savedAt: string }
  | { kind: 'corrupt'; reason: string };
export function serializeSnapshot(snapshot: TacticalSnapshot, savedAt?: Date): string;
export function parseSnapshot(raw: string | null | undefined): ParseResult;
export function extractAssignments(assets: FleetAsset[]): Record<string, AssetAssignment>;
export function applyAssignments(assets: FleetAsset[], assignments: Record<string, AssetAssignment>): FleetAsset[];
export const MAX_PERSISTED_LOGS = 500;

// tacticalStorage.ts
export interface TacticalStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export const STORAGE_KEY = 'resqmesh.tactical';
export const BACKUP_KEY = 'resqmesh.tactical.corrupt';
export const asyncStorageAdapter: TacticalStorage;
export function memoryStorage(seed?: Record<string, string>): TacticalStorage & { dump(): Record<string, string> };
```

- [ ] **Step 1: Write the failing tests**

Create `src/storage/__tests__/tacticalSnapshot.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/storage/__tests__/tacticalSnapshot.test.ts`
Expected: FAIL — `Cannot find module '../tacticalSnapshot'`.

- [ ] **Step 3: Implement the codec**

Create `src/storage/tacticalSnapshot.ts`:

```ts
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
```

Create `src/storage/tacticalStorage.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Minimal key/value contract so the provider can be tested without native storage
 *  and so the SQLite mirror (hardening spec amendment) can replace AsyncStorage later. */
export interface TacticalStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const STORAGE_KEY = 'resqmesh.tactical';
/** Where an unreadable snapshot is parked so it is not lost and not re-read. */
export const BACKUP_KEY = 'resqmesh.tactical.corrupt';

export const asyncStorageAdapter: TacticalStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
};

export function memoryStorage(seed: Record<string, string> = {}): TacticalStorage & { dump(): Record<string, string> } {
  const store: Record<string, string> = { ...seed };
  return {
    async getItem(key) {
      return key in store ? store[key] : null;
    },
    async setItem(key, value) {
      store[key] = value;
    },
    dump: () => ({ ...store }),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/storage`
Expected: PASS — all tests in `tacticalSnapshot.test.ts` and `mocks.test.ts`.

- [ ] **Step 5: Full verification and commit**

Run: `npx tsc --noEmit && npm test -- --ci 2>&1 | tail -6`
Expected: tsc clean, all suites pass.

```bash
git add src/storage
git commit -m "feat(storage): versioned tactical snapshot codec with corrupt-data recovery

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Hydrate and persist `TacticalProvider` (B08)

**Files:**
- Modify: `src/context/TacticalContext.tsx` (lines 1-13 imports, 24-47 context type, 261-267 provider state, 495-524 provider value)
- Test: `src/context/__tests__/persistence.test.tsx`
- Modify (test hygiene only): `src/context/__tests__/assignment.test.tsx`, `missionHistory.test.tsx`, `TacticalContext.test.tsx`

**Interfaces:**
- Consumes: everything in Task 2's interface block.
- Produces: `TacticalProvider` accepts `storage?: TacticalStorage` (default `asyncStorageAdapter`) and `persistDelayMs?: number` (default 500). Context value gains `hydrated: boolean`. Consumed by Task 4 (`SplashScreen`).

- [ ] **Step 1: Write the failing tests**

Create `src/context/__tests__/persistence.test.tsx`:

```tsx
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

    await waitFor(() => expect(storage.dump()[STORAGE_KEY]).toBeDefined());
    const parsed = parseSnapshot(storage.dump()[STORAGE_KEY]);
    expect(parsed.kind).toBe('ok');
    if (parsed.kind === 'ok') {
      expect(parsed.snapshot.incidents[0].title).toBe('Persist me');
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/context/__tests__/persistence.test.tsx`
Expected: FAIL — TypeScript/prop errors: `storage` is not a prop of `TacticalProvider`; `hydrated` does not exist on the context value.

- [ ] **Step 3: Implement hydration + persistence in the provider**

In `src/context/TacticalContext.tsx`:

(a) Imports — replace line 1 and add after line 13:

```ts
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
// ...existing type imports unchanged...
import { RESPONSE_STATIONS, distanceBetween } from '../dispatch/stations';
import { nextId } from '../utils/id';
import {
  parseSnapshot,
  serializeSnapshot,
  extractAssignments,
  applyAssignments,
} from '../storage/tacticalSnapshot';
import { TacticalStorage, asyncStorageAdapter, STORAGE_KEY, BACKUP_KEY } from '../storage/tacticalStorage';
```

(b) Add to `TacticalContextType` (after `missionHistory`):

```ts
  /** False until the persisted operational record has been read (or found empty/corrupt). */
  hydrated: boolean;
```

(c) Add a props interface above the provider and change its signature:

```ts
interface TacticalProviderProps {
  children: React.ReactNode;
  /** Injectable for tests and for the future SQLite mirror. */
  storage?: TacticalStorage;
  /** Debounce for writes; 0 in tests. */
  persistDelayMs?: number;
}

export const TacticalProvider: React.FC<TacticalProviderProps> = ({
  children,
  storage = asyncStorageAdapter,
  persistDelayMs = 500,
}) => {
```

(d) After the existing `useState` block (after `missionParams` state, ~line 292) add:

```ts
  const [hydrated, setHydrated] = useState(false);
  const storageRef = useRef(storage);
  storageRef.current = storage;

  // Hydrate once. An empty store leaves the demo baseline untouched; a corrupt
  // store is parked under BACKUP_KEY so it is neither lost nor re-read.
  useEffect(() => {
    let cancelled = false;
    const restoreWarning = (detail: string): SystemLog => ({
      id: nextId('log'),
      time: new Date().toISOString().substring(11, 16),
      category: 'SYS',
      message: `Saved operational record could not be restored (${detail}). Starting from baseline.`,
      level: 'warning',
    });

    (async () => {
      let raw: string | null = null;
      try {
        raw = await storageRef.current.getItem(STORAGE_KEY);
      } catch (error) {
        if (!cancelled) setLogs((prev) => [restoreWarning(error instanceof Error ? error.message : String(error)), ...prev]);
        if (!cancelled) setHydrated(true);
        return;
      }
      if (cancelled) return;

      const result = parseSnapshot(raw);
      if (result.kind === 'ok') {
        setIncidents(result.snapshot.incidents);
        setAlerts(result.snapshot.alerts);
        setLogs(result.snapshot.logs);
        setMissionHistory(result.snapshot.missionHistory);
        setAssets((prev) => applyAssignments(prev, result.snapshot.assetAssignments));
      } else if (result.kind === 'corrupt') {
        try {
          await storageRef.current.setItem(BACKUP_KEY, raw ?? '');
        } catch {
          // Backup is best-effort; the warning log below still records the loss.
        }
        if (!cancelled) setLogs((prev) => [restoreWarning(result.reason), ...prev]);
      }
      if (!cancelled) setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist the durable record (debounced) once hydrated. Telemetry, mission
  // params and dispatch previews are per-session and intentionally excluded.
  useEffect(() => {
    if (!hydrated) return;
    const payload = serializeSnapshot({
      incidents,
      alerts,
      logs,
      missionHistory,
      assetAssignments: extractAssignments(assets),
    });
    const timer = setTimeout(() => {
      storageRef.current.setItem(STORAGE_KEY, payload).catch((error: unknown) => {
        console.warn('Failed to persist tactical state.', error);
      });
    }, persistDelayMs);
    return () => clearTimeout(timer);
  }, [hydrated, incidents, alerts, logs, missionHistory, assets, persistDelayMs]);
```

(e) Add `hydrated,` to the provider `value={{ ... }}` object (after `missionHistory,`).

- [ ] **Step 4: Run the new tests to verify they pass**

Run: `npx jest src/context/__tests__/persistence.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Keep the existing context tests act-clean**

Run: `npx jest src/context 2>&1 | grep -c "not wrapped in act"`
If the count is > 0, the async hydration is resolving after those tests finish. In each of `assignment.test.tsx`, `missionHistory.test.tsx`, `TacticalContext.test.tsx`, make the test bodies `async` and add, right after `renderHook`/`setup()`:

```ts
await waitFor(() => expect(result.current.hydrated).toBe(true));
```

(import `waitFor` from `@testing-library/react-native`). Behaviour assertions stay unchanged. Re-run until the grep count is 0.

- [ ] **Step 6: Full verification and commit**

Run: `npx tsc --noEmit && npm test -- --ci 2>&1 | tail -6`
Expected: tsc clean, all suites pass, no act warnings.

```bash
git add src/context
git commit -m "feat(context): hydrate and persist operational record via injectable storage (B08)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Gate splash hand-off on hydration (B08)

**Files:**
- Modify: `src/screens/SplashScreen.tsx:13-63`
- Test: `src/screens/__tests__/SplashScreen.test.tsx` (new)

**Interfaces:**
- Consumes: `useTactical().hydrated` from Task 3.

- [ ] **Step 1: Write the failing test**

Create `src/screens/__tests__/SplashScreen.test.tsx`:

```tsx
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { SplashScreen } from '../SplashScreen';

const mockUseTactical = jest.fn();
jest.mock('../../context/TacticalContext', () => ({
  useTactical: () => mockUseTactical(),
}));

function renderSplash(hydrated: boolean) {
  const replace = jest.fn();
  mockUseTactical.mockReturnValue({ hydrated });
  const navigation = { replace } as unknown as React.ComponentProps<typeof SplashScreen>['navigation'];
  const route = { key: 'Splash', name: 'Splash' as const, params: undefined };
  render(<SplashScreen navigation={navigation} route={route} />);
  return replace;
}

describe('SplashScreen hand-off', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.99); // progress reaches 100 in a bounded number of ticks
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('navigates to Onboarding after the progress bar completes when state is hydrated', () => {
    const replace = renderSplash(true);
    act(() => {
      jest.advanceTimersByTime(120 * 12 + 600);
    });
    expect(replace).toHaveBeenCalledWith('Onboarding');
  });

  it('does not navigate until hydration completes', () => {
    const replace = renderSplash(false);
    act(() => {
      jest.advanceTimersByTime(120 * 12 + 600);
    });
    expect(replace).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/screens/__tests__/SplashScreen.test.tsx`
Expected: the second test FAILS (`replace` was called even though `hydrated` is false).

- [ ] **Step 3: Restructure the effect**

In `src/screens/SplashScreen.tsx`, add the import and a `ready` state, and split the hand-off into its own effect:

```tsx
import { useTactical } from '../context/TacticalContext';

export const SplashScreen: React.FC<RootStackScreenProps<'Splash'>> = ({ navigation }) => {
  const { hydrated } = useTactical();
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('ESTABLISHING SECURE UPLINK...');
  const progressAnim = useRef(new Animated.Value(0));

  useEffect(() => {
    const messages = [ /* unchanged */ ];

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + Math.floor(Math.random() * 8) + 4, 100);
        // ...status message branches unchanged...
        Animated.timing(progressAnim.current, { toValue: next, duration: 100, useNativeDriver: false }).start();
        if (next >= 100) {
          clearInterval(interval);
          setReady(true);
        }
        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  // Hand off only once both the animation has finished and the persisted
  // operational record has been read, so screens never render pre-hydration state.
  useEffect(() => {
    if (!ready) return;
    if (!hydrated) {
      setStatusMessage('RESTORING OPERATIONAL RECORD...');
      return;
    }
    const handoff = setTimeout(() => navigation.replace('Onboarding'), 600);
    return () => clearTimeout(handoff);
  }, [ready, hydrated, navigation]);
```

Remove the old `let handoff` variable and the `if (handoff) clearTimeout(handoff)` cleanup from the first effect (they move to the second effect).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/screens/__tests__/SplashScreen.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Full verification and commit**

Run: `npx tsc --noEmit && npm test -- --ci 2>&1 | tail -6`

```bash
git add src/screens/SplashScreen.tsx src/screens/__tests__/SplashScreen.test.tsx
git commit -m "feat(splash): wait for persisted state hydration before hand-off

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Network status hook and `OfflineNotice` component (B09)

**Files:**
- Create: `src/hooks/useNetworkStatus.ts`, `src/components/OfflineNotice.tsx`
- Test: `src/hooks/__tests__/useNetworkStatus.test.ts`, `src/components/__tests__/OfflineNotice.test.tsx`

**Interfaces:**
- Produces:

```ts
// useNetworkStatus.ts
export interface ConnectivityState { isConnected: boolean | null; isInternetReachable: boolean | null }
export function isOfflineState(state: ConnectivityState): boolean; // pure
export function useNetworkStatus(): { isOffline: boolean };
// OfflineNotice.tsx
export const OfflineNotice: React.FC<{ message: string }>; // renders null when online; testID="offline-notice"
```

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/__tests__/useNetworkStatus.test.ts`:

```ts
import { isOfflineState } from '../useNetworkStatus';

describe('isOfflineState', () => {
  it('is offline when the device reports no connection', () => {
    expect(isOfflineState({ isConnected: false, isInternetReachable: null })).toBe(true);
  });
  it('is offline when connected but internet is confirmed unreachable', () => {
    expect(isOfflineState({ isConnected: true, isInternetReachable: false })).toBe(true);
  });
  it('is online when connected and reachability is unknown (null) — do not alarm on startup', () => {
    expect(isOfflineState({ isConnected: true, isInternetReachable: null })).toBe(false);
  });
  it('is online when both are unknown', () => {
    expect(isOfflineState({ isConnected: null, isInternetReachable: null })).toBe(false);
  });
});
```

Create `src/components/__tests__/OfflineNotice.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { OfflineNotice } from '../OfflineNotice';

const mockUseNetworkStatus = jest.fn();
jest.mock('../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

describe('OfflineNotice', () => {
  it('renders the message when offline', () => {
    mockUseNetworkStatus.mockReturnValue({ isOffline: true });
    render(<OfflineNotice message="Map tiles unavailable" />);
    expect(screen.getByTestId('offline-notice')).toBeTruthy();
    expect(screen.getByText(/OFFLINE/)).toBeTruthy();
    expect(screen.getByText('Map tiles unavailable')).toBeTruthy();
  });

  it('renders nothing when online', () => {
    mockUseNetworkStatus.mockReturnValue({ isOffline: false });
    render(<OfflineNotice message="Map tiles unavailable" />);
    expect(screen.queryByTestId('offline-notice')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/hooks/__tests__/useNetworkStatus.test.ts src/components/__tests__/OfflineNotice.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement hook and component**

Create `src/hooks/useNetworkStatus.ts`:

```ts
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface ConnectivityState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

/** Only report offline on a definite negative; `null` means "not yet known"
 *  and must not flash a warning on cold start. */
export function isOfflineState(state: ConnectivityState): boolean {
  return state.isConnected === false || state.isInternetReachable === false;
}

export function useNetworkStatus(): { isOffline: boolean } {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(isOfflineState(state));
    });
    return unsubscribe;
  }, []);

  return { isOffline };
}
```

Create `src/components/OfflineNotice.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface OfflineNoticeProps {
  /** What specifically will not work on this screen without a connection. */
  message: string;
}

export const OfflineNotice: React.FC<OfflineNoticeProps> = ({ message }) => {
  const { isOffline } = useNetworkStatus();
  if (!isOffline) return null;

  return (
    <View style={styles.container} testID="offline-notice" accessibilityRole="alert">
      <MaterialCommunityIcons name="wifi-off" size={16} color={Colors.error} />
      <View style={styles.textBlock}>
        <Text style={styles.title}>OFFLINE</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceContainer,
    borderBottomWidth: 1,
    borderBottomColor: Colors.error,
  },
  textBlock: { flex: 1 },
  title: { color: Colors.error, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  message: { color: Colors.white, fontSize: 12 },
});
```

(Confirm `Colors.error`, `Colors.surfaceContainer`, `Colors.white` exist in `src/theme/colors.ts` — they are used by `App.tsx` so they do.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/hooks src/components/__tests__/OfflineNotice.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Full verification and commit**

Run: `npx tsc --noEmit && npm test -- --ci 2>&1 | tail -6`

```bash
git add src/hooks/useNetworkStatus.ts src/hooks/__tests__ src/components/OfflineNotice.tsx src/components/__tests__/OfflineNotice.test.tsx
git commit -m "feat: network status hook and OfflineNotice banner

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Surface offline state on the map and place-search screens (B09)

**Files:**
- Modify: `src/screens/LiveMapScreen.tsx:768-775` (after `TacticalHeader`, before `mapCanvas`)
- Modify: `src/screens/CreateIncidentScreen.tsx:60-62, 85-130` (search effect)
- Test: `src/screens/__tests__/CreateIncidentSearch.test.ts` (new; pure helper)

**Interfaces:**
- Consumes: `OfflineNotice`, `useNetworkStatus` from Task 5.
- Produces: `shouldSearchPlaces(query: string, isOffline: boolean): boolean` exported from `src/screens/createIncidentSearch.ts` (new, pure) so the skip rule is unit-tested without rendering the 800-line screen.

- [ ] **Step 1: Write the failing test**

Create `src/screens/__tests__/createIncidentSearch.test.ts`:

```ts
import { shouldSearchPlaces, OFFLINE_SEARCH_MESSAGE } from '../createIncidentSearch';

describe('shouldSearchPlaces', () => {
  it('searches a non-trivial query when online', () => {
    expect(shouldSearchPlaces('Pune', false)).toBe(true);
  });
  it('never searches when offline', () => {
    expect(shouldSearchPlaces('Pune', true)).toBe(false);
  });
  it('never searches queries shorter than 3 characters', () => {
    expect(shouldSearchPlaces('Pu', false)).toBe(false);
    expect(shouldSearchPlaces('  P  ', false)).toBe(false);
  });
  it('exposes a user-facing offline message', () => {
    expect(OFFLINE_SEARCH_MESSAGE).toMatch(/offline/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/screens/__tests__/createIncidentSearch.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helper and wire both screens**

Create `src/screens/createIncidentSearch.ts`:

```ts
export const MIN_SEARCH_LENGTH = 3;
export const OFFLINE_SEARCH_MESSAGE =
  'Offline — place search unavailable. Use GPS capture or enter coordinates manually.';

/** Photon is a public HTTP service; never call it offline or for trivial input. */
export function shouldSearchPlaces(query: string, isOffline: boolean): boolean {
  return !isOffline && query.trim().length >= MIN_SEARCH_LENGTH;
}
```

In `src/screens/CreateIncidentScreen.tsx`:
1. Add imports: `import { OfflineNotice } from '../components/OfflineNotice';`, `import { useNetworkStatus } from '../hooks/useNetworkStatus';`, `import { shouldSearchPlaces, OFFLINE_SEARCH_MESSAGE } from './createIncidentSearch';`
2. Inside the component, next to `searchError` state (line 62): `const { isOffline } = useNetworkStatus();`
3. In the search `useEffect` (around line 85): the existing early-return guard for short queries becomes

```ts
    if (!shouldSearchPlaces(searchQuery, isOffline)) {
      setSuggestions([]);
      setSearchingPlaces(false);
      setSearchError(isOffline && searchQuery.trim().length >= 3 ? OFFLINE_SEARCH_MESSAGE : '');
      return;
    }
```

   and add `isOffline` to that effect's dependency array. Read the existing guard first — keep whatever minimum-length rule it already uses if it differs from 3, and make `MIN_SEARCH_LENGTH` match it.
4. Render `<OfflineNotice message="Place search needs a connection. GPS capture and manual coordinates still work." />` immediately above the search `TextInput` block (around line 410).

In `src/screens/LiveMapScreen.tsx`, after the `<TacticalHeader ... />` element (line 768-772) and before `<View style={styles.mapCanvas} ...>`, insert:

```tsx
      <OfflineNotice message="Map tiles and live routing unavailable. Unit positions and simulated routes still update." />
```

with `import { OfflineNotice } from '../components/OfflineNotice';` added to the imports (this file uses double quotes — match it: `from "../components/OfflineNotice"`).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/screens/__tests__/createIncidentSearch.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm test -- --ci 2>&1 | tail -6`
Expected: all clean.

```bash
git add src/screens
git commit -m "feat(offline): show offline notice on map and incident screens; skip place search offline (B09)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Correct README offline claims and record audit disposition (B09, report)

**Files:**
- Modify: `README.md:71, 178, 200-206`
- Modify: `AUDIT_BUG_REPORT.md` (append section)

- [ ] **Step 1: Rewrite the three README claims**

Line 71: `RoutingService[🗺️ OpenRouteService / Offline OSRM]` → `RoutingService[🗺️ OpenRouteService / public OSRM (network required)]`

Line 178 note → 
```
> **Note**: If no API key is provided (or the routing services are unreachable), the app falls back to deterministic simulated tactical routes. Map tiles and place search still require a network connection — see [Offline behaviour](#-offline-behaviour).
```

Replace the whole `## 📡 Offline & Zero-Network Resilience` section (heading through item 3) with:

```markdown
## 📡 Offline behaviour

RESQMESH is a connected-first field client. This is what actually happens when the network drops:

| Capability | Offline | Notes |
| --- | --- | --- |
| Incidents, assignments, alert resolutions, logs, mission history | ✅ Kept | Persisted locally in a versioned snapshot (`src/storage/`) and restored on launch. A corrupt snapshot is backed up, not silently discarded. |
| Route calculation | ✅ Degraded | If OpenRouteService/OSRM are unreachable the engine draws direct geodesic paths and simulated flight legs. |
| Map tiles | ❌ | Leaflet/OpenStreetMap tiles are fetched from public CDNs. An **OFFLINE** banner is shown on the map screen. |
| Place search | ❌ | Photon geocoding is a public HTTP service. Search is disabled offline; GPS capture and manual coordinates still work. |
| Multi-operator sync, telemetry ingest, evidence storage | ❌ | No backend exists yet — see `docs/superpowers/specs/2026-09-20-resqmesh-backend-design.md`. |

Offline map tiles and cached geocoding are not implemented; treat this build as connected-only for anything beyond local record-keeping.
```

Update the table-of-contents link on line 17: `[Offline Protocol](#-offline--zero-network-resilience)` → `[Offline behaviour](#-offline-behaviour)`.

- [ ] **Step 2: Append a remediation-status section to the audit report**

Append to `AUDIT_BUG_REPORT.md`:

```markdown
## Remediation status (2026-09-20)

| Finding | Status | Where |
| --- | --- | --- |
| B01 | Fixed | `src/screens/DetectionDetailsScreen.tsx` reads `route.params` with typed `RootStackScreenProps` |
| B02 | Fixed | `src/components/OpenRouteMap.native.tsx` declares `showCenters` |
| B03 | Fixed | `src/components/OpenRouteMap.web.tsx` moves `pointerEvents` into `style` |
| B04 | Fixed | clipboard failure logged at `warning` level |
| B05 | Fixed | `jest-expo` runner, `npm test`, CI workflow `.github/workflows/ci.yml` |
| B06 | Fixed | `recordMission` in `TacticalContext`; covered by `missionHistory.test.tsx` |
| B07 | Fixed | incident selector + validated `assignAsset`/`unassignAsset`; covered by `assignment.test.tsx` |
| B08 | Fixed | versioned AsyncStorage snapshot with corrupt-data backup; `src/storage/`, `persistence.test.tsx`, splash gated on hydration |
| B09 | Mitigated | README claims corrected; `OfflineNotice` on map and incident screens; place search disabled offline. Offline tiles/geocoding intentionally not shipped. |
| B10 | Deferred | tracked by `docs/superpowers/specs/2026-09-20-resqmesh-backend-design.md` |
| B11 | Fixed | splash hand-off timeout cleared on unmount |
```

- [ ] **Step 3: Verify and commit**

Run: `npx tsc --noEmit && npm test -- --ci 2>&1 | tail -6` (docs-only change; confirms nothing regressed).

```bash
git add README.md AUDIT_BUG_REPORT.md
git commit -m "docs: state real offline behaviour and record audit remediation status

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Verification (end-to-end)

1. `npx tsc --noEmit` → exit 0.
2. `npm run lint` → exit 0.
3. `npm test -- --ci` → all suites pass; expect ≈ 14 + 6 new suites (`mocks`, `tacticalSnapshot`, `persistence`, `SplashScreen`, `useNetworkStatus`, `OfflineNotice`, `createIncidentSearch`) with no `not wrapped in act` warnings.
4. Manual (device/emulator, per audit §"Suggested remediation order" item 4 — not automatable here):
   - Create an incident → force-quit → relaunch → the incident, its dispatched units (ON MISSION) and the dispatch log line are still present.
   - Toggle airplane mode on Live Map → OFFLINE banner appears; disable → it disappears. On Create Incident, typing a place while offline shows the offline search message and makes no request.
   - Optional corrupt-data check: with Expo dev tools, `AsyncStorage.setItem('resqmesh.tactical', '{bad')` then relaunch → app boots to the demo baseline and the first log entry is the "could not be restored" warning.

## Out of scope (by user decision)

- B10 backend implementation — see backend design spec.
- Offline tile caching / offline geocoder — README now says so explicitly.
- Migrating storage to the SQLite mirror — the `TacticalStorage` adapter is the seam for that later work.
