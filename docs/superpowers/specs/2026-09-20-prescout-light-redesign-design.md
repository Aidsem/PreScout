# PreScout Light-Theme Redesign — Design

## Context

The app (formerly ResQMesh) is an Expo SDK 57 / React Native 0.86 / React 19
frontend for tactical disaster response and search-and-rescue swarm
orchestration. It ships eleven screens (~7,700 lines of screen/component code)
built on a single dark "graphite + lime" token set in `src/theme/colors.ts`, a
small shared primitive file (`src/components/TacticalComponents.tsx`), and a
heavy use of `Courier` monospace styling.

The user has renamed the project to **PreScout** (same product, new name) and
wants the whole frontend refined: every existing page redesigned on a **light
theme only**, with rich animation. No new pages.

This spec is decided (2026-09-20) as: same product; no new pages; "clean
ops-console" look; rich/showy motion; safety-orange accent; Approach A
(design-system-first rebuild) with monospace retained for data/labels only.

## Sequencing with the audit remediation plan

`docs/superpowers/plans/2026-09-20-audit-remediation-batch2-persistence-offline.md`
is paused after its Task 3 (context persistence) lands. Its remaining tasks
fold into this redesign as follows:

| Audit task | Disposition |
| --- | --- |
| Task 3 persistence | Finishes first on `audit-batch2-persistence-offline`; this redesign branches from it |
| Task 4 splash hydration gate | Folded into the Splash screen task |
| Task 5 `useNetworkStatus` + `OfflineNotice` | Runs unchanged as a redesign primitive task |
| Task 6 offline notice on Map / Create Incident, search disabled offline | Folded into those two screen tasks |
| Task 7 README + audit report status | Folded into the final cleanup task |

Branch: `redesign-prescout-light`, cut from `audit-batch2-persistence-offline`
after Task 3 is committed.

## 1. Brand and rename

- `app.json`: `name: "PreScout"`, `slug: "prescout"`, `userInterfaceStyle:
  "light"`, permission strings say "PreScout". `package.json` name
  `prescout_app`.
- Every user-visible "RESQMESH" / "ResQMesh" / "resqmesh" string in the eleven
  screens, `ErrorBoundary`, `OpenRouteMap.web`, `README.md` becomes
  "PRESCOUT" / "PreScout" with the same casing pattern. Tagline stays
  "Tactical Disaster Response & SAR".
- Dark mode is not supported. StatusBar is always dark-content on light.

## 2. Theme tokens (`src/theme/`)

`colors.ts` keeps the export name `Colors` (so the app compiles during
migration) but becomes the light palette:

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#FAFAF7` | paper page background |
| `surface` | `#FFFFFF` | cards, sheets, app bar |
| `surfaceMuted` | `#F1F2F0` | inset fields, skeletons |
| `ink` | `#151A1E` | primary text |
| `inkMuted` | `#5C6670` | secondary text, icons |
| `border` | `#E4E7EA` | hairlines |
| `accent` | `#E8590C` | primary actions, EN ROUTE, ON MISSION |
| `accentContainer` | `#FFF0E6` | accent tint backgrounds |
| `success` | `#2F9E44` | RESOLVED, AVAILABLE |
| `warning` | `#E67700` | CONTAINED, CHARGING |
| `danger` | `#C92A2A` | ACTIVE, errors |
| `info` | `#0B7285` | SEARCH ACTIVE, map/route lines |
| `white` / `black` | `#FFFFFF` / `#000000` | overlays |

Legacy token names that screens still reference during migration
(`surfaceContainer`, `tertiary`, `onSurface`, `outlineVariant`, `error`,
`primary`, …) are kept as aliases to the nearest light token and removed in the
final cleanup task once no screen references them.

New files:

- `typography.ts`: `Fonts.mono = 'Courier'` for numbers, IDs, coordinates,
  eyebrow labels; `Fonts.sans = 'System'` for titles and body. Scale
  `xs 11 / sm 12 / md 14 / lg 16 / xl 20 / xxl 28 / display 36`.
- `radii.ts`: `sm 8 / md 12 / lg 16 / pill 999`.
- `shadows.ts`: `elevation1`, `elevation2` (iOS shadow props + Android
  `elevation`).
- `motion.ts`: `Durations.fast 150 / base 250 / slow 400`, `Spring` config
  (damping 18, stiffness 180), `StaggerMs 40`; `useReducedMotion()` reads
  `AccessibilityInfo.isReduceMotionEnabled` and every primitive multiplies
  durations by 0 when true.
- `status.ts`: `statusTone(status)` maps incident and asset statuses to
  `{ color, container }` per the table above. Pure; unit-tested.

## 3. Primitive kit (`src/ui/`)

One file per primitive, props-only API, no context access.

| Primitive | Responsibility |
| --- | --- |
| `Screen` | SafeArea + paper background; optional `scroll` |
| `AppBar` | eyebrow, title, back/profile actions; `collapsible` variant takes a Reanimated shared scroll value and shrinks/parallaxes |
| `Card` | white surface, `radii.lg`, `elevation1`; `pressable` variant scales to 0.98 and lifts to `elevation2` on press |
| `Button` | `primary` (accent), `secondary` (outlined), `ghost`, `danger`; press scale; `loading` shows spinner and blocks `onPress` |
| `StatusPill` | status text with `statusTone()` colors |
| `Metric` | big mono number + sans label; `AnimatedCounter` tweens value changes |
| `ListRow` | leading icon, title, subtitle, trailing slot |
| `SectionHeader` | mono eyebrow + sans title + optional action |
| `PulseDot` | looping opacity/scale pulse for "live" |
| `ProgressBar` | animated width |
| `Skeleton` | shimmer placeholder |
| `BottomSheet` | Reanimated + gesture-handler sheet with snap points |
| `LottieHero` | wraps `lottie-react-native`; falls back to a static `Image` on web/load failure |
| `Stagger` | children wrapped in `Animated.View` with `FadeInDown.delay(index * StaggerMs)` |

Motion rules: native-stack `animation: 'slide_from_right'`; tabs fade; lists
stagger on mount; cards lift on press; counters tween; `PulseDot` on anything
live; Lottie on Splash (radar sweep) and the three Onboarding slides. Lottie
JSON is authored in-repo under `assets/lottie/` (radar sweep, drone, map pin);
no external downloads.

Dependencies (Expo-57 bundled, installed with `npx expo install`):
`react-native-reanimated 4.5.1` (+ babel plugin in `babel.config.js`),
`lottie-react-native ~7.3.8`. Their official Jest mocks are registered in
`jest.setup.js`.

Removed at the end: `src/components/TacticalComponents.tsx` and
`CrosshairReticle`.

## 4. Screens (all eleven; behaviour and `useTactical` calls preserved)

1. **Splash** — `LottieHero` radar sweep, PreScout wordmark, `ProgressBar`,
   mono status eyebrow. Hand-off waits for `hydrated` from `useTactical()` and
   shows "RESTORING OPERATIONAL RECORD..." while waiting.
2. **Onboarding** — three swipeable slides, each `LottieHero` + title + body;
   animated page dots; "Get started" primary `Button`; "Skip" ghost.
3. **Command Center** — greeting `AppBar`; three `Metric` tiles (active
   missions / online units / alerts) in a `Stagger`; latest-dispatch `Card`;
   incidents as `ListRow` + `StatusPill`; accent FAB → Create Incident.
4. **Live Map** — full-bleed map; mission HUD as `BottomSheet` (unit list,
   ETA, arrival state); `OfflineNotice` strip under the `AppBar` with message
   "Map tiles and live routing unavailable. Unit positions and simulated routes
   still update."; simulation controls as floating pill buttons. The
   1,353-line screen is decomposed: `LiveMapScreen.tsx` is composition only;
   HUD panel, unit panel and the simulation state machine
   (`useLiveMapSimulation`) live in `src/screens/live-map/`.
5. **Missions** — parameter form with segmented controls and sliders on
   tokens; unit pickers as selectable `ListRow`s; "Launch simulation" primary
   `Button` with `loading`.
6. **Assets** — incident target selector as horizontal chips; asset grid of
   pressable `Card`s (battery `ProgressBar`, signal, `StatusPill`);
   assign/release with press feedback and an inline confirmation.
7. **History** — timeline grouped by date with `SectionHeader`s; each record a
   `Card`; export button; empty state.
8. **Profile** — operator card, stats row, sign-out placeholder.
9. **Create Incident** — stepper header (Type → Location → Evidence → Review)
   with animated step indicator; each step extracted to
   `src/screens/create-incident/`; `OfflineNotice` above place search with
   "Place search needs a connection. GPS capture and manual coordinates still
   work."; Photon search is skipped while offline via a pure
   `shouldSearchPlaces(query, isOffline)` helper (min length 3, and only in
   `locationMode === 'search'`); GPS capture `Button` with `loading`.
10. **Live Monitoring** — collapsible parallax `AppBar` over the thermal video
    component; telemetry `Metric` strip with `PulseDot`; camera-mode segmented
    toggle; alerts list.
11. **Detection Details** — parallax hero (thermal frame); confidence
    `Metric`; coordinates in mono with copy button; resolve/share as
    primary/secondary `Button`s.

Cross-cutting: `ErrorBoundary` fallback restyled on tokens; map marker colors
in `OpenRouteMap.native` / `.web` mapped to tokens; bottom tab bar white with
accent active tint.

## 5. Testing and gates

- Every primitive: an RNTL render test at its props seam (e.g. `StatusPill`
  tone per status; `Button` blocks `onPress` when `loading`; `Stagger` renders
  all children).
- Pure helpers (`statusTone`, `shouldSearchPlaces`, `useLiveMapSimulation`
  reducer, Create Incident step validation): unit tests.
- Every rebuilt screen: one smoke test rendering inside `TacticalProvider`
  with mocked navigation, asserting its key elements.
- Reanimated and Lottie use their official Jest mocks.
- Per task: `npx tsc --noEmit`, `npm run lint`, `npm test -- --ci`; screen
  tasks also run `npx expo export --platform web` to catch web-incompatible
  animation usage.
- Manual checkpoints (user eyeballs `npx expo start --web` and Expo Go on
  Android): after Splash/Onboarding, and after the final task.

## Non-goals

- Dark mode; new pages; backend; shared-element transitions (experimental in
  Reanimated 4 with native-stack); custom font loading (System + Courier
  only); changing any context/business logic.

## Amendment 1 (2026-09-20, during execution)

User feedback while running the light build added two requirements:

- **In-app dialogs.** Native `Alert.alert` popups ("Incident dispatched",
  "Location acquired", assignment errors, …) look foreign next to the new UI.
  A `Dialog` primitive (card-style modal on a scrim: icon disc by tone,
  sans title, body, up to two `Button`s) is provided through a
  `DialogProvider` + `useDialog()` hook whose `show({ title, message, tone,
  actions })` mirrors the `Alert.alert` signature. Every `Alert.alert` in
  `src/screens` is replaced. Short confirmations ("Saved", "Shared",
  "Location acquired") use the same primitive in `toast` mode (auto-dismiss
  2.5 s, bottom slide-in). `DialogProvider` is the one UI context allowed in
  `src/ui`.
- **Realistic drone sweep.** The drone must fly a boustrophedon (lawnmower)
  sweep *inside* the scan square, not around its perimeter, and a person is
  detected only when the drone's current position passes within a detection
  radius of that person — not on a fixed fraction of elapsed progress.
  `src/map/scanPlan.ts` gains `buildSweepRoute(center, side, lanes)` and
  `detectAlongRoute(position, people, radiusDeg)`; `revealedCount` is
  removed. The scan polygon outline still renders as the search-grid overlay.

## Amendment 2 (2026-09-20, during execution)

- **Thermal human signatures.** Detected people must look like real thermal
  imagery, not dots. A `ThermalFigure` SVG primitive renders a human silhouette
  with a radial heat gradient (white-hot core → yellow → orange → red → dark
  halo) and a subtle breathing/shimmer animation. It is used (a) on the map
  as the detected-person marker on both platforms (≈26 px, halo glow), and
  (b) full-size inside `ThermalDetectionVideo`, replacing the current abstract
  blob, for Live Monitoring and Detection Details.
- **Nearest-unit dispatch on the map.** When a mission/route is raised, the
  units that move must be the nearest *available* drone and rover to the
  destination (the same rule `dispatchIncident` already applies), not the
  `missionParams` defaults (`drone-01`/`rover-01`). Explicit origins from a
  dispatch result or a Mission Planning `missionAssignment` still win; the
  `missionParams.droneUnitId/roverUnitId` fallback is removed from the map.
  The HUD names the units that actually moved.
