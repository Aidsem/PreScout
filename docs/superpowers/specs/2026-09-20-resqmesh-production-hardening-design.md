# RESQMESH Production Hardening — Design

## Context

RESQMESH is a client-only React Native/Expo app (~9,100 lines across 29
files) built as a tactical disaster-response demo. All operational data
(incidents, fleet, telemetry, alerts) is simulated in memory; there is no
backend, no real drone/telemetry integration, and no auth.

The goal of this effort is **not** to add real backend infrastructure. The
app stays a self-contained simulated demo. The goal is to remove
prototype-grade shortcuts so the app is robust, tested, and maintainable —
suitable for a hackathon submission, portfolio piece, or investor demo,
where crashes, data loss on restart, and untested "tactical decision" logic
would undermine the pitch.

This was scoped down from an initial code review that surfaced 10 findings
across state architecture, testing, tooling, code organization,
persistence, accessibility, and error handling. Real-backend and
app-store-release concerns (signing, store listings, real auth, real drone
telemetry) are explicitly out of scope.

## Sub-projects and order

Ordered so safety nets (tooling, tests) land before the two riskiest
refactors (state split, screen decomposition), and polish (accessibility)
lands last:

1. Correctness cleanup
2. Lint/format/CI tooling
3. Testing infrastructure (locks in current dispatch/pathfinding behavior
   before later refactors touch it)
4. Crash resilience (error boundary)
5. State architecture split
6. Local persistence
7. Screen decomposition
8. Accessibility baseline

Each sub-project below is scoped so it can be implemented and verified
independently; later sub-projects assume earlier ones are done (e.g. state
split's tests build on the Jest setup from #3).

---

## 1. Correctness cleanup

- Remove the dead effect at `TacticalContext.tsx:270-276` (resets `assets`
  to `initialAssets` if drone/rover count drops below 20 — no code path
  ever shrinks the array, so this never fires and only confuses readers).
- Replace `Date.now()`-based ID generation (incident IDs, log IDs — 5
  call sites in `TacticalContext.tsx`) with a small `src/utils/id.ts`
  helper exporting `nextId(prefix: string)` that combines a timestamp with
  a module-scoped incrementing counter, so two dispatches/logs in the same
  millisecond can't collide. No new dependency needed.
- Replace the 12 `any`-typed occurrences (all are `navigation: any` /
  `route?: any` screen props — every screen component plus
  `src/navigation/openScreen.ts`) with real types: a `RootStackParamList`
  / `MainTabParamList` pair in a new `src/types/navigation.ts`, applied to
  each screen via React Navigation's typed screen-prop helpers.
- No `console.*` changes needed: all 4 existing calls (in
  `LiveMapScreen.tsx`, `MissionHistoryScreen.tsx`,
  `CreateIncidentScreen.tsx` x2) are inside `catch` blocks paired with a
  user-facing `Alert`/error-state update — intentional diagnostics, not
  debug leftovers. Confirmed during plan-writing; dropped from scope.

## 2. Lint/format/CI tooling

- Add ESLint (`eslint-config-expo` + `eslint-plugin-react-hooks`) and
  Prettier with a shared `.prettierrc`.
- Add `npm run lint` and `npm run format` scripts.
- Add `.github/workflows/ci.yml` running on push/PR: `npm ci`,
  `tsc --noEmit`, `npm run lint`, `npm test` (test script added in #3).
- This is infrastructure only — no source files are rewritten to satisfy
  new lint rules beyond what's needed to pass cleanly at introduction
  time (existing style stays as-is; the gate is for future changes).

## 3. Testing infrastructure

- Add `jest`, the `jest-expo` preset, and `@testing-library/react-native`.
- Add `npm test` script (referenced by the CI workflow above).
- Write unit tests for the app's actual decision-making logic, which is
  currently completely untested:
  - `dispatchIncident` and `distanceBetween` (`TacticalContext.tsx`,
    `dispatch/stations.ts`) — asset-matching correctness.
  - `src/utils/pathfinding.ts` and `src/utils/pathMotion.ts` — pure
    coordinate/grid math.
  - `src/map/mapModel.ts` — pure data transforms.
- Full screen-level snapshot or integration tests are explicitly out of
  scope for this pass (low value for a simulated-data UI relative to
  effort); the priority is locking in the pure logic that later
  refactors (state split, screen decomposition) will move around.

## 4. Crash resilience

- Add `src/components/ErrorBoundary.tsx`, a class component implementing
  `getDerivedStateFromError`/`componentDidCatch`, rendering a themed
  fallback screen (using existing `src/theme` tokens) with a "Reset"
  action that clears the boundary's error state.
- Wrap the navigation root in `App.tsx` with this boundary, so an
  unexpected render error in any one screen no longer crashes to a blank/
  red screen with no recovery path.

## 5. State architecture split

- Split the single `TacticalContext` (currently: incidents, assets,
  alerts, telemetry, logs, mission history, mission params, all in one
  provider whose value is rebuilt every 4s by the telemetry simulation
  tick) into five focused contexts, each with its own hook:
  - `TelemetryContext` / `useTelemetry` — `telemetry`, `toggleCameraMode`,
    `flightSimToken`, `startFlightSimulation`.
  - `IncidentContext` / `useIncidents` — `incidents`, `dispatchIncident`,
    `addIncident`, `latestDispatch`, `missionHistory`, `missionParams`,
    `updateMissionParams`, `activeMissionCount`.
  - `FleetContext` / `useFleet` — `assets`, `assignAsset`,
    `onlineAssetCount`.
  - `AlertContext` / `useAlerts` — `alerts`, `resolveAlert`,
    `activeAlertCount`.
  - `LogContext` / `useLogs` — `logs`, `appendLog`.
- A single `TacticalProvider` composes all five providers so app-root
  usage (`App.tsx`) doesn't change.
- Each screen/component currently calling `useTactical()` is updated to
  call only the specific hook(s) it actually reads, so a telemetry tick
  no longer re-renders screens that only care about incidents or fleet
  state (e.g. `MissionHistoryScreen`, `ProfileScreen`).
- Verified via the tests added in #3 (behavior should be identical,
  confirmed by the dispatch/logic unit tests still passing) plus a manual
  pass confirming no screen regresses.

## 6. Local persistence

- Add `@react-native-async-storage/async-storage`.
- Persist the durable operational record — `incidents`, `missionHistory`,
  and `logs` — to AsyncStorage on change (debounced), and hydrate on app
  start before the app renders its main navigator (gated behind the
  existing `SplashScreen`).
- `telemetry` (live simulated per-tick data) and `assets` (fleet roster)
  are explicitly **not** persisted — each app launch starts from a fresh
  simulated fleet/telemetry baseline, consistent with "starting a new
  session," while the incident/mission/log history a user has actually
  generated survives a restart.

## 7. Screen decomposition

- `LiveMapScreen.tsx` (1,303 lines): extract the map overlay panels
  (telemetry drawer, asset list panel, legend) into `src/components/`,
  and the route-simulation state machine into a `useLiveMapSimulation`
  hook, leaving the screen file as composition + layout.
- `CreateIncidentScreen.tsx` (793 lines): extract each form step (hazard
  type picker, GPS capture, photo evidence, review/submit) into
  subcomponents under `src/components/incident-form/`, and the form
  state into a `useIncidentForm` hook.
- Target: no screen file over ~400 lines after this pass.
- No behavior changes — this is a pure extraction, verified by existing
  tests continuing to pass plus manual smoke-testing of both screens.

## 8. Accessibility baseline

- Add `accessibilityLabel` and `accessibilityRole="button"` (or the
  appropriate role) to primary interactive elements: incident
  dispatch/report submit, camera mode toggle, asset assign toggle, the
  create-incident entry point, and bottom tab bar items if not already
  labeled by React Navigation defaults.
- Scoped to primary actions only, not a full WCAG audit — consistent with
  YAGNI given this is a demo app, not a shipping accessibility-audited
  product.

## Non-goals

- No real backend, API, or auth integration.
- No real drone/telemetry hardware integration.
- No app store signing/release configuration.
- No full accessibility audit beyond primary-action labeling.
- No screen-level integration/snapshot test suite.

## Amendment (2026-09-20, later the same day)

The "no real backend" scoping above was reversed: see
`2026-09-20-resqmesh-backend-design.md`. Consequences for this spec:

- Section 6 (local persistence via AsyncStorage) is superseded by the
  SQLite mirror + sync engine in the forthcoming app data-layer spec.
- Section 5 (state architecture split) is absorbed into that same
  data-layer work — the new hooks (`useIncidents`, `useFleet`, …) are
  built on the local database rather than on split React contexts.
- Sections 1–4 (batch 1) proceed as planned and merge first; sections
  7–8 (screen decomposition, accessibility) fold into the UI redesign.
