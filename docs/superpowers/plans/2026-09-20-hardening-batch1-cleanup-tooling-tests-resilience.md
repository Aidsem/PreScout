# RESQMESH Hardening Batch 1: Cleanup, Tooling, Testing, Resilience — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the first batch of RESQMESH's production-hardening effort — correctness cleanup, lint/CI tooling, a pure-logic test suite, and crash resilience — without touching the app's simulated-data behavior.

**Architecture:** No architectural change in this batch. This is safety-net and correctness work: fix two small bugs, replace `any`-typed navigation props with real React Navigation types (surfacing and fixing one real crash bug along the way), stand up Jest + ESLint + CI, and add a top-level error boundary. Later batches (state context split, persistence, screen decomposition, accessibility) build on top of this.

**Tech Stack:** Existing stack unchanged (Expo SDK 57, React Native 0.86.3, React 19.2.3, TypeScript 6.0 strict). Adds: `jest`, `jest-expo`, `@testing-library/react-native`, `eslint` (`eslint-config-expo`, `eslint-plugin-react-hooks`), `prettier`.

**Spec:** [docs/superpowers/specs/2026-09-20-resqmesh-production-hardening-design.md](../specs/2026-09-20-resqmesh-production-hardening-design.md) — this plan implements spec sections 1 ("Correctness cleanup"), 2 ("Lint/format/CI tooling"), 3 ("Testing infrastructure"), and 4 ("Crash resilience").

## Global Constraints

- No backend, auth, or real telemetry/drone integration — out of scope for the whole hardening effort.
- Behavior must stay identical except where a task explicitly changes it (the two bugs fixed in Task 2 and Task 3).
- All changes must pass `npx tsc --noEmit` under the existing `"strict": true` tsconfig — no new `any`.
- Match existing code style (2-space indent, single quotes in most files) until Task 5 lands ESLint/Prettier, which then governs.
- Every task ends with the app still building (`npx tsc --noEmit` clean); several tasks additionally require a manual smoke check described in that task.

---

### Task 1: Bootstrap Jest testing infrastructure

**Files:**
- Modify: `package.json` (add devDependencies, `test` script)
- Create: `jest.config.js`

**Interfaces:**
- Produces: an `npm test` command that later tasks (2, 4, 6) rely on.

- [ ] **Step 1: Add test dependencies to `package.json`**

Add to `devDependencies` (alongside the existing `@types/react` and `typescript` entries):

```json
"@testing-library/react-native": "^12.9.0",
"@types/jest": "^29.5.14",
"jest": "^29.7.0",
"jest-expo": "~57.0.0"
```

Add to `scripts`:

```json
"test": "jest"
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: installs cleanly. If npm reports peer-dependency conflicts against Expo SDK 57 / React 19.2.3, re-resolve to the closest compatible version it suggests rather than forcing with `--legacy-peer-deps`.

- [ ] **Step 3: Create `jest.config.js`**

```js
module.exports = {
  preset: 'jest-expo',
};
```

- [ ] **Step 4: Verify the config loads with no test files yet**

Run: `npx jest --passWithNoTests`
Expected: exits 0, reporting no test suites found. This proves the preset resolves correctly before any real test depends on it.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json jest.config.js
git commit -m "test: bootstrap jest-expo testing infrastructure"
```

---

### Task 2: Fix ID collisions and remove dead effect in TacticalContext

**Files:**
- Create: `src/utils/id.ts`
- Test: `src/utils/__tests__/id.test.ts`
- Modify: `src/context/TacticalContext.tsx:270-276` (remove dead effect), `:318`, `:352`, `:389`, `:407`, `:431` (replace `Date.now()`-based IDs)

**Interfaces:**
- Produces: `nextId(prefix: string): string` — used by Task 2's own `TacticalContext.tsx` changes and available to any future code that needs a collision-resistant ID.

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/__tests__/id.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest id.test.ts`
Expected: FAIL with "Cannot find module '../id'"

- [ ] **Step 3: Implement `src/utils/id.ts`**

```ts
let counter = 0;

/**
 * Timestamp + monotonic counter, so IDs generated within the same
 * millisecond (e.g. two dispatches in one render) never collide.
 */
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest id.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Replace the `Date.now()`-based ID call sites in `TacticalContext.tsx`**

Add the import near the top, alongside the existing `dispatch/stations` import:

```ts
import { nextId } from '../utils/id';
```

Replace each of these 5 lines (line numbers as of this plan's writing; search for the exact text if they've shifted):

- `TacticalContext.tsx:318`: `const incidentId = \`inc-${Date.now().toString().slice(-6)}\`;` → `const incidentId = nextId('inc');`
- `TacticalContext.tsx:352` (inside `dispatchIncident`'s log): `id: \`log-${Date.now()}\`,` → `id: nextId('log'),`
- `TacticalContext.tsx:389` (inside `toggleCameraMode`'s log): same replacement
- `TacticalContext.tsx:407` (inside `resolveAlert`'s log): same replacement
- `TacticalContext.tsx:431` (inside `appendLog`'s log): same replacement

- [ ] **Step 6: Remove the dead effect**

Delete this block (`TacticalContext.tsx:270-276`):

```ts
  useEffect(() => {
    const droneCount = assets.filter((asset) => asset.type === 'drone').length;
    const roverCount = assets.filter((asset) => asset.type === 'rover').length;
    if (droneCount < 20 || roverCount < 20) {
      setAssets(initialAssets);
    }
  }, [assets]);
```

It can never fire: no code path changes `assets`' length, only individual entries' `status`/`assignedIncidentId`/`eta`. Leaving it in place misleads future readers into thinking there's a length-guard invariant being enforced.

- [ ] **Step 7: Verify the app still type-checks and the full test suite passes**

Run: `npx tsc --noEmit && npx jest`
Expected: both clean / PASS

- [ ] **Step 8: Commit**

```bash
git add src/utils/id.ts src/utils/__tests__/id.test.ts src/context/TacticalContext.tsx
git commit -m "fix: dedupe generated IDs and remove dead asset-reset effect"
```

---

### Task 3: Type navigation props (and fix a real crash bug found along the way)

While typing every screen's `navigation: any` prop, `DetectionDetailsScreen.tsx:34` reads `const { alertId } = navigation.params;` — but `navigation` objects in React Navigation don't carry `.params`; route params live on the separate `route` prop, which this screen never even declares. `navigation.params` is `undefined`, so `const { alertId } = navigation.params` throws `TypeError: Cannot destructure property 'alertId' of 'undefined'` on every render — this screen currently crashes to a blank/red screen (no error boundary exists yet — that lands in Task 7) whenever it's opened, from both `CommandCenterScreen`'s recent-alerts list and `LiveMonitoringScreen`'s "view detection" action. This task fixes it as part of giving the screen a proper typed `route` prop.

**Files:**
- Create: `src/types/navigation.ts`
- Modify: `src/navigation/openScreen.ts`, `src/navigation/AppNavigator.tsx`, and the `navigation`/`route` prop types in all 11 screens under `src/screens/`

**Interfaces:**
- Produces: `RootStackParamList`, `MainTabParamList`, `RootStackScreenProps<T>`, `MainTabScreenProps<T>`, `FocusDetection`, `MissionAssignment` — the typed contract every screen and `AppNavigator.tsx` uses.

- [ ] **Step 1: Create `src/types/navigation.ts`**

```ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export interface FocusDetection {
  id: string;
  latitude: number;
  longitude: number;
}

export interface MissionAssignment {
  droneUnitId: string;
  roverUnitId: string;
}

export type MainTabParamList = {
  CommandTab: undefined;
  LiveMap: { focusDetection?: FocusDetection; missionAssignment?: MissionAssignment } | undefined;
  MissionsTab: undefined;
  AssetsTab: undefined;
  HistoryTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  CreateIncident: undefined;
  LiveMonitoring: undefined;
  DetectionDetails: { alertId?: string } | undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
```

- [ ] **Step 2: Type `src/navigation/openScreen.ts`'s `navigation` parameter**

`openScreen` walks up through parent navigators at runtime to find whichever navigator owns the target screen name, so it can't take one specific screen's navigation type — give it a minimal structural type instead of `any`:

```ts
export interface NavigationLike {
  navigate: (name: string, params?: object) => void;
  getState?: () => { routeNames?: string[] } | undefined;
  getParent?: () => NavigationLike | undefined;
}

const TAB_SCREENS = new Set(['CommandTab', 'LiveMap', 'MissionsTab', 'AssetsTab', 'HistoryTab']);

export function openScreen(navigation: NavigationLike, name: string, params?: object) {
  let nav: NavigationLike | undefined = navigation;
  while (nav) {
    const names: string[] | undefined = nav.getState?.()?.routeNames;
    if (names?.includes(name)) {
      nav.navigate(name, params);
      return;
    }
    nav = nav.getParent?.();
  }

  if (TAB_SCREENS.has(name)) {
    let stack: NavigationLike | undefined = navigation;
    while (stack) {
      const names: string[] | undefined = stack.getState?.()?.routeNames;
      if (names?.includes('MainTabs')) {
        stack.navigate('MainTabs', { screen: name, params });
        return;
      }
      stack = stack.getParent?.();
    }
  }

  navigation.navigate(name, params);
}
```

(Logic is unchanged — only the `navigation: any` parameter became `navigation: NavigationLike`, and the `let nav = navigation` / `let stack = navigation` locals got the matching `NavigationLike | undefined` type so the `getParent?.()` reassignment still type-checks.)

- [ ] **Step 3: Type the navigators in `AppNavigator.tsx`**

```ts
import type { RootStackParamList, MainTabParamList } from '../types/navigation';
```

```ts
const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
```

(No other changes needed — the existing `<Tab.Screen name="...">` / `<Stack.Screen name="...">` calls already use exactly the route names now encoded in `MainTabParamList`/`RootStackParamList`, so this alone makes them type-checked against the param lists.)

- [ ] **Step 4: Update each stack-level screen's prop type**

For `SplashScreen.tsx`, `OnboardingScreen.tsx`, `CreateIncidentScreen.tsx`, `LiveMonitoringScreen.tsx`, `ProfileScreen.tsx` — add the import and change the signature:

```ts
import type { RootStackScreenProps } from '../types/navigation';
```

```ts
// before: export const SplashScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
export const SplashScreen: React.FC<RootStackScreenProps<'Splash'>> = ({ navigation }) => {
```

Apply the same pattern with each screen's own route name: `RootStackScreenProps<'Onboarding'>`, `RootStackScreenProps<'CreateIncident'>`, `RootStackScreenProps<'LiveMonitoring'>`, `RootStackScreenProps<'Profile'>`. None of these five destructure `route`, so no further change needed in their bodies.

- [ ] **Step 5: Update `DetectionDetailsScreen.tsx` — type it and fix the crash bug**

```ts
import type { RootStackScreenProps } from '../types/navigation';
```

```ts
// before:
// export const DetectionDetailsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
//   const { alerts, resolveAlert, appendLog } = useTactical();
//   const { alertId } = navigation.params;
export const DetectionDetailsScreen: React.FC<RootStackScreenProps<'DetectionDetails'>> = ({
  navigation,
  route,
}) => {
  const { alerts, resolveAlert, appendLog } = useTactical();
  const { alertId } = route.params ?? {};
```

- [ ] **Step 6: Update each tab-level screen's prop type**

For `CommandCenterScreen.tsx`, `MissionPlanningScreen.tsx`, `AssetSelectionScreen.tsx`, `MissionHistoryScreen.tsx` — add the import and change the signature:

```ts
import type { MainTabScreenProps } from '../types/navigation';
```

```ts
// CommandCenterScreen.tsx — before: React.FC<{ navigation: any }>
export const CommandCenterScreen: React.FC<MainTabScreenProps<'CommandTab'>> = ({ navigation }) => {
```

Apply the matching route name for each: `MainTabScreenProps<'MissionsTab'>` (MissionPlanningScreen), `MainTabScreenProps<'AssetsTab'>` (AssetSelectionScreen), `MainTabScreenProps<'HistoryTab'>` (MissionHistoryScreen).

- [ ] **Step 7: Update `LiveMapScreen.tsx`**

```ts
import type { MainTabScreenProps } from '../types/navigation';
```

```ts
// before:
// export const LiveMapScreen: React.FC<{ navigation: any; route?: any }> = ({
//   navigation,
//   route,
// }) => {
export const LiveMapScreen: React.FC<MainTabScreenProps<'LiveMap'>> = ({
  navigation,
  route,
}) => {
```

The existing body already reads `route?.params?.focusDetection` / `route?.params?.missionAssignment` with optional chaining, which still type-checks now that `route` is non-optional and its `params` field is `{ focusDetection?: FocusDetection; missionAssignment?: MissionAssignment } | undefined`.

- [ ] **Step 8: Verify no `any` remains and the app still type-checks**

Run: `grep -rn ": any\|@ts-ignore\|@ts-nocheck" src/`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: clean. If any screen has a residual type error (e.g. a prop passed to a child component now inferred more strictly), fix it at the call site rather than reintroducing `any`.

- [ ] **Step 9: Manually verify the crash fix**

Run: `npm start`, open the app, and navigate to Detection Details two ways: (a) tap a detection in `CommandCenterScreen`'s recent-alerts list with no prior alert selected, (b) tap "view detection" from `LiveMonitoringScreen`. Expected: the screen renders the correct alert in both cases instead of crashing.

- [ ] **Step 10: Commit**

```bash
git add src/types/navigation.ts src/navigation/ src/screens/
git commit -m "fix: replace any-typed navigation props with real types; fix DetectionDetails crash"
```

---

### Task 4: Unit tests for the app's pure logic

**Files:**
- Test: `src/dispatch/__tests__/stations.test.ts`
- Test: `src/context/__tests__/TacticalContext.test.tsx`
- Test: `src/utils/__tests__/pathfinding.test.ts`
- Test: `src/utils/__tests__/pathMotion.test.ts`
- Test: `src/map/__tests__/mapModel.test.ts`

**Interfaces:**
- Consumes: `distanceBetween` (`src/dispatch/stations.ts`), `TacticalProvider`/`useTactical` (`src/context/TacticalContext.tsx`, as fixed in Task 2), `findPath`/`nearestWalkable` (`src/utils/pathfinding.ts`), `pathLength`/`pointAlongPath`/`ensurePath` (`src/utils/pathMotion.ts`), `svgToGrid`/`gridToSvg`/`buildAirGrid`/`GRID_COLS`/`GRID_ROWS`/`MAP_W`/`MAP_H` (`src/map/mapModel.ts`) — all pre-existing, unchanged by this task.

- [ ] **Step 1: Write `distanceBetween` tests**

```ts
// src/dispatch/__tests__/stations.test.ts
import { distanceBetween } from '../stations';

describe('distanceBetween', () => {
  it('returns 0 for identical coordinates', () => {
    expect(distanceBetween({ lat: 18.52, lng: 73.85 }, { lat: 18.52, lng: 73.85 })).toBe(0);
  });

  it('computes straight-line distance between two points', () => {
    expect(distanceBetween({ lat: 0, lng: 0 }, { lat: 3, lng: 4 })).toBeCloseTo(5);
  });
});
```

Run: `npx jest stations.test.ts` — expect PASS (no implementation change needed; this locks in existing behavior).

- [ ] **Step 2: Write `dispatchIncident` behavioral tests**

```tsx
// src/context/__tests__/TacticalContext.test.tsx
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
```

Run: `npx jest TacticalContext.test.tsx` — expect PASS. (The initial fleet has 16+ `AVAILABLE` drones and 19 `AVAILABLE` rovers, so a fresh dispatch reliably finds both.)

- [ ] **Step 3: Write `findPath`/`nearestWalkable` tests**

```ts
// src/utils/__tests__/pathfinding.test.ts
import { findPath, nearestWalkable } from '../pathfinding';

describe('findPath', () => {
  it('finds a path across an open grid from start to end', () => {
    const grid = Array.from({ length: 5 }, () => Array(5).fill(false));
    const path = findPath(grid, [0, 0], [0, 4]);
    expect(path[0]).toEqual([0, 0]);
    expect(path[path.length - 1]).toEqual([0, 4]);
  });

  it('routes around a blocked wall instead of crossing it', () => {
    const grid = Array.from({ length: 5 }, () => Array(5).fill(false));
    grid[1][0] = grid[1][1] = grid[1][2] = grid[1][3] = true;
    const path = findPath(grid, [0, 0], [2, 0]);
    expect(path.length).toBeGreaterThan(0);
    expect(path.every(([r, c]) => !grid[r][c])).toBe(true);
  });

  it('returns an empty path when the target is fully enclosed by blocked cells', () => {
    const grid = [
      [false, true, false],
      [true, true, true],
      [false, true, false],
    ];
    expect(findPath(grid, [0, 0], [2, 2])).toEqual([]);
  });
});

describe('nearestWalkable', () => {
  it('returns the cell itself when already walkable', () => {
    const grid = [[false, false], [false, false]];
    expect(nearestWalkable(grid, [0, 0])).toEqual([0, 0]);
  });

  it('returns the nearest open cell when the target cell is blocked', () => {
    const grid = [
      [true, false],
      [true, true],
    ];
    expect(nearestWalkable(grid, [0, 0])).toEqual([0, 1]);
  });
});
```

Run: `npx jest pathfinding.test.ts` — expect PASS.

- [ ] **Step 4: Write `pathMotion` tests**

```ts
// src/utils/__tests__/pathMotion.test.ts
import { pathLength, pointAlongPath, ensurePath } from '../pathMotion';
import type { MapPoint } from '../../map/mapModel';

describe('pathLength', () => {
  it('sums the euclidean distance between consecutive points', () => {
    const points: MapPoint[] = [{ x: 0, y: 0 }, { x: 3, y: 4 }, { x: 3, y: 8 }];
    expect(pathLength(points)).toBeCloseTo(9);
  });

  it('returns 0 for a single point', () => {
    expect(pathLength([{ x: 5, y: 5 }])).toBe(0);
  });
});

describe('pointAlongPath', () => {
  const points: MapPoint[] = [{ x: 0, y: 0 }, { x: 10, y: 0 }];

  it('returns the start point at t=0', () => {
    expect(pointAlongPath(points, 0)).toEqual({ x: 0, y: 0 });
  });

  it('returns the end point at t=1', () => {
    expect(pointAlongPath(points, 1)).toEqual({ x: 10, y: 0 });
  });

  it('returns the midpoint at t=0.5', () => {
    const mid = pointAlongPath(points, 0.5);
    expect(mid.x).toBeCloseTo(5);
    expect(mid.y).toBeCloseTo(0);
  });
});

describe('ensurePath', () => {
  it('keeps the computed path but forces its first point to match start', () => {
    const computed: MapPoint[] = [{ x: 99, y: 99 }, { x: 1, y: 1 }, { x: 2, y: 2 }];
    const result = ensurePath(computed, { x: 0, y: 0 }, { x: 2, y: 2 });
    expect(result[0]).toEqual({ x: 0, y: 0 });
    expect(result.slice(1)).toEqual([{ x: 1, y: 1 }, { x: 2, y: 2 }]);
  });

  it('falls back to a direct line when the computed path has fewer than 2 points', () => {
    expect(ensurePath([], { x: 0, y: 0 }, { x: 5, y: 5 })).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ]);
  });
});
```

Run: `npx jest pathMotion.test.ts` — expect PASS.

- [ ] **Step 5: Write `mapModel` tests**

```ts
// src/map/__tests__/mapModel.test.ts
import { svgToGrid, gridToSvg, buildAirGrid, GRID_COLS, GRID_ROWS, MAP_W, MAP_H } from '../mapModel';

describe('gridToSvg / svgToGrid', () => {
  it('round-trips a grid cell through its svg center point', () => {
    const svgPoint = gridToSvg(10, 5);
    expect(svgToGrid(svgPoint.x, svgPoint.y)).toEqual([10, 5]);
  });

  it('clamps out-of-range svg coordinates to the nearest valid grid cell', () => {
    expect(svgToGrid(-50, -50)).toEqual([0, 0]);
    expect(svgToGrid(MAP_W + 1000, MAP_H + 1000)).toEqual([GRID_ROWS - 1, GRID_COLS - 1]);
  });
});

describe('buildAirGrid', () => {
  it('produces an all-open grid of the configured dimensions', () => {
    const grid = buildAirGrid();
    expect(grid.length).toBe(GRID_ROWS);
    expect(grid[0].length).toBe(GRID_COLS);
    expect(grid.every((row) => row.every((cell) => cell === false))).toBe(true);
  });
});
```

Run: `npx jest mapModel.test.ts` — expect PASS.

- [ ] **Step 6: Run the full suite**

Run: `npx jest`
Expected: all suites PASS (id.test.ts from Task 2 plus the 5 new files here).

- [ ] **Step 7: Commit**

```bash
git add src/dispatch/__tests__ src/context/__tests__ src/utils/__tests__/pathfinding.test.ts src/utils/__tests__/pathMotion.test.ts src/map/__tests__
git commit -m "test: cover dispatch matching, pathfinding, path motion, and map grid math"
```

---

### Task 5: ESLint + Prettier

**Files:**
- Modify: `package.json` (devDependencies, `lint`/`format` scripts)
- Create: `.eslintrc.js`, `.prettierrc`, `.eslintignore`, `.prettierignore`

**Interfaces:**
- Produces: `npm run lint` and `npm run format`, consumed by the CI workflow in Task 6.

- [ ] **Step 1: Add dependencies**

Add to `devDependencies`:

```json
"eslint": "^8.57.1",
"eslint-config-expo": "~8.0.0",
"eslint-plugin-react-hooks": "^4.6.2",
"prettier": "^3.3.3"
```

- [ ] **Step 2: Add scripts**

```json
"lint": "eslint . --ext .ts,.tsx",
"format": "prettier --write ."
```

- [ ] **Step 3: Create `.eslintrc.js`**

```js
module.exports = {
  extends: ['expo', 'plugin:react-hooks/recommended'],
  ignorePatterns: ['node_modules/', '.expo/', 'dist/'],
};
```

- [ ] **Step 4: Create `.eslintignore`**

```
node_modules/
.expo/
dist/
```

- [ ] **Step 5: Create `.prettierrc`**

```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

- [ ] **Step 6: Create `.prettierignore`**

```
node_modules/
.expo/
dist/
package-lock.json
```

- [ ] **Step 7: Install and run lint**

Run: `npm install && npm run lint`
Expected: exits 0. If pre-existing files trip specific rules, fix only what's needed to reach a clean baseline — do not do a repo-wide reformat here (that's noise unrelated to this task; scope creep into unrelated files makes the diff hard to review).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json .eslintrc.js .eslintignore .prettierrc .prettierignore
git commit -m "chore: add eslint and prettier tooling"
```

(If Step 7 required source fixes to reach a clean lint baseline, commit those separately first with `fix: address eslint findings` before this tooling commit, so the tooling commit stays purely additive.)

---

### Task 6: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `npm run lint` (Task 5), `npm test` (Task 1), both already verified working by this point.

- [ ] **Step 1: Create the workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm test -- --ci
```

- [ ] **Step 2: Verify it runs locally the same way CI will**

Run: `npm ci && npx tsc --noEmit && npm run lint && npm test -- --ci`
Expected: all four steps pass in sequence, matching what the workflow will do.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add typecheck, lint, and test workflow"
```

---

### Task 7: Crash resilience — top-level error boundary

**Files:**
- Create: `src/components/ErrorBoundary.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Produces: `ErrorBoundary` React component (props: `{ children: React.ReactNode }`), wrapping the app root.

- [ ] **Step 1: Implement `ErrorBoundary`**

```tsx
// src/components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme/colors';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled error caught by ErrorBoundary:', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <MaterialCommunityIcons name="alert-octagon-outline" size={48} color={Colors.error} />
          <Text style={styles.title}>SYSTEM FAULT</Text>
          <Text style={styles.message}>
            RESQMESH hit an unexpected error and this screen couldn't render.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.reset}>
            <Text style={styles.buttonText}>RESET</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  title: {
    color: Colors.onBackground,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  message: {
    color: Colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.tertiary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.onTertiary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
```

- [ ] **Step 2: Wrap the app root in `App.tsx`**

```ts
import { ErrorBoundary } from './src/components/ErrorBoundary';
```

Wrap the existing return value's outermost element:

```tsx
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
        <TacticalProvider>
          <NavigationContainer
            theme={{
              ...
            }}
          >
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </TacticalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
```

(Only the outermost wrapper changes — everything inside `GestureHandlerRootView` stays exactly as it is today.)

- [ ] **Step 3: Verify with a deliberate crash**

Temporarily add `throw new Error('test crash');` at the top of `CommandCenterScreen`'s render (right after its `useTactical()` call), run `npm start`, and confirm the app shows the "SYSTEM FAULT" fallback instead of a blank/red screen, and that tapping "RESET" attempts to re-render. Then remove the temporary `throw`.

- [ ] **Step 4: Verify type-check and full test suite**

Run: `npx tsc --noEmit && npm test`
Expected: both clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/ErrorBoundary.tsx App.tsx
git commit -m "feat: add top-level error boundary so unexpected errors don't blank-screen the app"
```

---

## After this batch

All of spec sections 1-4 are done. The next plan (written once this one lands) covers spec sections 5-6 (state architecture split, local persistence) — the two riskiest structural changes, now backed by the test suite and CI this batch adds. A third plan will cover sections 7-8 (screen decomposition, accessibility baseline).
