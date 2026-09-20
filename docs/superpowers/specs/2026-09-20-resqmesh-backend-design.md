# RESQMESH Backend — Design

## Context

RESQMESH is a React Native/Expo tactical disaster-response app. Until now
it has been fully client-side: all operational data (incidents, fleet,
alerts, missions, logs) is simulated in memory and lost on restart, and
there is one implicit operator.

This spec adds a real backend so that:

- operational data persists and is shared across devices/operators,
- operators log in,
- the app still works with zero connectivity (its core pitch) and syncs
  when a connection returns.

It reverses the earlier "no backend" scoping in
`2026-09-20-resqmesh-production-hardening-design.md`; that spec's
persistence item (AsyncStorage) is superseded by this design's local
SQLite mirror, which is built in the follow-on "app data layer" spec.

## Scope and sequencing

This spec covers **only the server** (`server/`) and the **shared types
package** (`shared/`). It makes no changes to the app. The overall effort
is:

1. Merge hardening batch 1 (typed navigation, Jest, crash fix).
2. **This spec** — backend server, buildable and testable on its own.
3. App data layer — replace the in-memory `TacticalContext` with a
   SQLite mirror + API client + sync engine (separate spec).
4. UI redesign on top of the new data hooks (separate spec).

Decisions taken during brainstorming:

- Backend role: data API + auth. No live telemetry push, no real drone
  hardware ingestion.
- Stack: Node 20, TypeScript, Fastify 5, Prisma, PostgreSQL 16, zod.
- Hosting: local-first via Docker Compose, deploy-ready via Dockerfile
  and env config. No deployment performed.
- Offline behavior: offline-first with sync (custom sync over REST, not a
  sync framework).
- Auth: email + password, single operator role, JWT access + rotating
  refresh tokens.

## 1. Architecture and repo layout

```
Resqmesh/
├── server/                  # Node 20, TypeScript, Fastify 5
│   ├── src/
│   │   ├── app.ts           # buildApp(): Fastify instance + plugin registration
│   │   ├── index.ts         # listen()
│   │   ├── config.ts        # zod-parsed env: DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGINS, SEED_OPERATOR_PASSWORD
│   │   ├── plugins/
│   │   │   ├── prisma.ts    # decorates fastify.prisma
│   │   │   ├── auth.ts      # verifies Bearer access token, decorates request.user
│   │   │   └── errors.ts    # global error handler + AppError classes
│   │   ├── routes/
│   │   │   ├── auth.ts      # register/login/refresh/logout
│   │   │   ├── me.ts
│   │   │   ├── incidents.ts
│   │   │   ├── assets.ts
│   │   │   ├── alerts.ts
│   │   │   ├── missions.ts
│   │   │   ├── logs.ts
│   │   │   ├── stations.ts
│   │   │   ├── sync.ts
│   │   │   └── health.ts
│   │   └── services/
│   │       ├── dispatch.ts  # selectUnits() pure function + dispatchIncident() transaction
│   │       ├── sync.ts      # applyMutation(), pullChanges()
│   │       └── tokens.ts    # sign/verify access, issue/rotate/revoke refresh
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── test/
│   │   ├── unit/            # dispatch, sync, tokens
│   │   └── integration/     # routes + full sync round-trip against Postgres
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── shared/                  # types + zod schemas used by app and server
│   ├── src/
│   │   ├── models.ts        # User, Station, Asset, Incident, Alert, Mission, Log + enums
│   │   ├── api.ts           # request/response schemas per route
│   │   └── sync.ts          # Mutation, MutationResult, SyncRequest, SyncResponse
│   ├── package.json
│   └── tsconfig.json
└── docker-compose.yml       # postgres:16 + server
```

- `shared/` is a plain TypeScript package (`@resqmesh/shared`) consumed
  via npm workspaces from both `server/` and (later) the app. It exports
  zod schemas; TypeScript types are inferred from them so there is one
  source of truth.
- The root `package.json` gains a `workspaces: ["shared", "server"]`
  entry. The app itself stays at the root as today.
- Telemetry (altitude/speed tick, camera mode) stays client-side
  simulated. The server has no telemetry concept.

## 2. Data model

Prisma schema, PostgreSQL. Enums are Prisma enums.

| Model | Fields |
|---|---|
| `User` | `id` uuid, `email` unique, `passwordHash`, `callsign`, `createdAt` |
| `RefreshToken` | `id` uuid, `userId` → User, `tokenHash` unique, `expiresAt`, `revokedAt?`, `createdAt` |
| `Station` | `id` string (from `stations.ts`), `name`, `type` (`FIRE`/`POLICE`/`HOSPITAL`), `lat`, `lng` |
| `Asset` | `id` string (`drone-01`…), `name`, `type` (`DRONE`/`ROVER`), `subType`, `status` (`AVAILABLE`/`ON_MISSION`/`CHARGING`/`MAINTENANCE`), `battery` int, `signal` (`STRONG`/`MODERATE`/`WEAK`), `payload`, `stationId` → Station, `lat`, `lng` (home coordinates, copied from the station at seed — what the app calls `homeCoordinates`), `assignedIncidentId?` → Incident, `eta?`, sync columns |
| `Incident` | `id` uuid, `title`, `type` (`MEDICAL`/`SAR`/`FIRE`/`FLOOD`/`LANDSLIDE`/`MISSING`), `priority` (`CRITICAL`/`HIGH`/`MEDIUM`/`LOW`), `location`, `lat`, `lng`, `description`, `status` (`PENDING_DISPATCH`/`ACTIVE`/`EN_ROUTE`/`SEARCH_ACTIVE`/`CONTAINED`/`RESOLVED`), `assignedAssetLabel`, `imageUrl?`, `createdById` → User, `createdAt`, sync columns |
| `Alert` | `id` uuid, `title`, `type` (`PERSON`/`HAZARD`/`VEHICLE`/`THERMAL`), `confidence` int, `severity` (`CRITICAL`/`HIGH`/`MEDIUM`/`LOW`), `sourceFeed`, `lat`, `lng`, `status` (`ACTIVE`/`RESOLVED`), `flirCameraModel`, `altitude` int, `azimuth` int, `occurredAt`, sync columns |
| `Mission` | `id` uuid, `code` unique (`OP-ALPHA-77`), `title`, `type` (`SAR`/`CONTAINMENT`/`RECON`/`MEDICAL`), `status` (`PLANNED`/`ACTIVE`/`COMPLETED`/`ARCHIVED`/`ABORTED`), `params` json (`{ areaKm2, altitude, speed, geofenceEnabled, aiProfile }`), `droneUnitId?` → Asset, `roverUnitId?` → Asset, `location`, `lat`, `lng`, `startedAt?`, `completedAt?`, `createdById` → User, sync columns |
| `Log` | `id` uuid, `category` (`SYS`/`NAV`/`AI`/`COMM`), `message`, `level` (`INFO`/`WARNING`/`ALERT`), `incidentId?` → Incident, `createdAt`, sync columns |
| `AppliedMutation` | `id` uuid (the client mutation id), `userId`, `appliedAt` — idempotency ledger |

**Sync columns** on `Asset`, `Incident`, `Alert`, `Mission`, `Log`:
`updatedAt`, `deletedAt?`, `serverSeq` bigint. `serverSeq` is assigned
from a single Postgres sequence on every insert/update (via a trigger),
giving a global, monotonic change order.

Deliberate changes from the app's current types:

- `Alert.coordinates` was a display string (`"18.5204° N, 73.8567° E"`)
  the app regex-parsed in two screens. The server stores `lat`/`lng`
  numbers; formatting is the client's job.
- `MissionParameters` (planner state) and `MissionHistoryItem` (static
  history) collapse into one `Mission` model with a status lifecycle.
- Enum values are `UPPER_SNAKE`; the app's display strings (`'ON
  MISSION'`) become a presentation concern in the data-layer step.
- `Incident.timestamp` (`'14:20 UTC'`, `'Just now'`) becomes
  `createdAt`; `Log.time` becomes `createdAt`.
- Record IDs for `Incident`, `Alert`, `Mission`, `Log` are UUIDs
  generated by whoever creates the record (client or server), so
  offline-created records need no renumbering. `Asset` and `Station`
  keep their human-readable seeded IDs.

## 3. API surface

Base path `/api/v1`. JSON in/out. All bodies, params and queries are
validated with zod schemas from `shared/`; unknown keys are stripped.
Errors are `{ error: { code: string, message: string, issues?: [...] } }`.

### Auth (public)

| Route | Body | Response |
|---|---|---|
| `POST /auth/register` | `{ email, password, callsign }` | `{ user, accessToken, refreshToken }` |
| `POST /auth/login` | `{ email, password }` | same |
| `POST /auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` (rotated; old one revoked) |
| `POST /auth/logout` | `{ refreshToken }` | `204` |

Access token: JWT HS256, 15 minutes, payload `{ sub: userId }`. Refresh
token: 32 random bytes base64url, stored as SHA-256 hash, 30 days.

### Authenticated resources

All require `Authorization: Bearer <accessToken>`; missing/invalid →
`401 UNAUTHORIZED`.

| Route | Purpose |
|---|---|
| `GET /me`, `PATCH /me { callsign }` | current operator |
| `GET /incidents`, `GET /incidents/:id` | list (non-deleted, newest first) / one |
| `POST /incidents { ...incident, dispatch?: boolean }` | create; with `dispatch: true` runs server-side dispatch in the same transaction and returns `{ incident, drone?, rover? }` |
| `PATCH /incidents/:id { status?, description?, ... }` | update |
| `GET /assets` | full fleet |
| `PATCH /assets/:id { status?, assignedIncidentId? }` | manual assign/unassign (today's `assignAsset` toggle); `409 ASSET_BUSY` if assigning an asset that is `ON_MISSION` |
| `GET /alerts`, `PATCH /alerts/:id { status }` | list / resolve |
| `GET /missions`, `POST /missions`, `PATCH /missions/:id` | planner + history |
| `GET /logs?limit=100&before=<createdAt>` , `POST /logs` | operator journal |
| `GET /stations` | reference data |
| `POST /sync` | see section 4 |
| `GET /health` | `{ ok: true, db: true }`; public; used by Docker healthcheck |

## 4. Sync protocol

### Cursor

The client's cursor is the highest `serverSeq` it has received (`0`
initially). A pull is `WHERE serverSeq > :cursor` across the five
syncable tables. This avoids timestamp clock-skew and tie problems.

### Outbox mutations

```ts
type Mutation =
  | { id, type: 'incident.create',   entityId, payload: IncidentCreate, clientTime }
  | { id, type: 'incident.dispatch', entityId, payload: IncidentCreate, clientTime }
  | { id, type: 'incident.update',   entityId, payload: IncidentPatch,  clientTime }
  | { id, type: 'asset.update',      entityId, payload: AssetPatch,     clientTime }
  | { id, type: 'alert.update',      entityId, payload: AlertPatch,     clientTime }
  | { id, type: 'mission.create',    entityId, payload: MissionCreate,  clientTime }
  | { id, type: 'mission.update',    entityId, payload: MissionPatch,   clientTime }
  | { id, type: 'log.create',        entityId, payload: LogCreate,      clientTime };

type MutationResult =
  | { id, status: 'applied' }
  | { id, status: 'rejected', code: 'ASSET_BUSY' | 'NOT_FOUND' | 'VALIDATION' | 'STALE', message };
```

### `POST /sync`

Request `{ cursor: number, outbox: Mutation[] }`.
Response `{ cursor: number, results: MutationResult[], changes: { assets, incidents, alerts, missions, logs } }`.

Inside one transaction, in order:

1. For each mutation, in array order: if its `id` is already in
   `AppliedMutation`, result `applied` without re-applying (idempotent
   replay after a dropped response). Otherwise apply per the rules
   below and record the result.
2. Pull all rows with `serverSeq > cursor` — this includes rows written
   in step 1, so the client immediately sees the server-assigned state of
   its own writes.
3. Respond with the new max `serverSeq` as `cursor`.

An outbox of up to 500 mutations is accepted per call; larger outboxes
are sent in successive calls.

### Conflict rules

- **`*.update`: last-writer-wins per record.** The mutation's
  `clientTime` is compared with the row's `updatedAt`; if the row is
  newer, result is `rejected STALE` and the client's copy is replaced by
  the pull. Otherwise the patch is applied and `updatedAt` set to
  `clientTime`.
- **`incident.dispatch` is server-authoritative.** The client created
  the incident locally as `PENDING_DISPATCH` with
  `assignedAssetLabel: 'Awaiting sync'`. The server creates the incident
  and runs `dispatchIncident` (section 5) against current fleet state.
  The result may assign different units than the client would have
  guessed, or none (`status: ACTIVE`, label `'No units available'`).
  The pull delivers the resolved incident and asset rows.
- **`asset.update` targeting a unit that is now `ON_MISSION`** (because
  a dispatch got there first) → `rejected ASSET_BUSY`; the pull delivers
  the server's truth.
- **`*.create` for an `entityId` that already exists** → `applied`
  (treated as replay; no change).
- **Deletes** are soft (`deletedAt`) and flow as updates; the client
  hides deleted rows.

Rejections are informational: the client writes a `WARNING` log line and
drops the mutation. Nothing blocks the UI on sync.

### Client-side triggers (documented here; implemented in the data-layer spec)

Sync runs on app launch, on foreground, every 30 s while online, and 2 s
(debounced) after any local write. A failed sync leaves the outbox
intact.

## 5. Server-side dispatch

`server/src/services/dispatch.ts`:

```ts
export function selectUnits(
  assets: Pick<Asset, 'id' | 'type' | 'status' | 'lat' | 'lng'>[],
  target: { lat: number; lng: number },
): { drone?: Asset; rover?: Asset };
```

Pure: nearest `AVAILABLE` `DRONE` and nearest `AVAILABLE` `ROVER` by
Euclidean distance on lat/lng (identical to the app's `distanceBetween`
today; assets' coordinates are their station's). Unit-tested.

`dispatchIncident(tx, input, userId)` runs inside a Prisma interactive
transaction: `SELECT … FOR UPDATE` on `AVAILABLE` assets, `selectUnits`,
insert the incident (`status: EN_ROUTE` if any unit, else `ACTIVE`),
update chosen assets to `ON_MISSION` with `assignedIncidentId`, insert a
`COMM` log summarising the dispatch, return `{ incident, drone?, rover? }`.
Row locks prevent two concurrent dispatches from taking the same unit.

## 6. Security, errors, configuration

- Passwords hashed with argon2id (`argon2` package).
- `@fastify/rate-limit`: 10 requests/minute/IP on `/auth/*`; 300/min
  elsewhere.
- `@fastify/cors` with an allowlist from `CORS_ORIGINS` (comma-separated).
- `@fastify/helmet` default headers.
- Global error handler maps `AppError` subclasses (`NotFoundError` 404,
  `UnauthorizedError` 401, `ConflictError` 409 e.g. `ASSET_BUSY`,
  `ValidationError` 400) to responses; anything else → 500 with a
  generic message and a server log line carrying the request ID. Stack
  traces are never returned.
- `config.ts` parses env with zod at startup; missing `DATABASE_URL` or
  `JWT_SECRET` (min 32 chars) aborts with a clear message.
  `.env.example` lists every variable with a comment.
- Logging: Fastify's pino logger, `LOG_LEVEL` env, pretty-printed in dev.

### Docker

- `server/Dockerfile`: multi-stage (`deps` → `build` → `runtime` on
  `node:20-alpine`), runs `prisma migrate deploy` then `node dist/index.js`.
- `docker-compose.yml`: `db` (`postgres:16`, volume, healthcheck) and
  `server` (build from `server/`, depends on healthy `db`, env from
  `.env`). `docker compose up` gives a working API on `:3000`.
- `npm run dev` in `server/` runs `tsx watch src/index.ts` against the
  compose database.

### Seed

`prisma/seed.ts` inserts: all stations and hospitals from the app's
`src/dispatch/stations.ts`; the 40-unit demo fleet matching today's
`initialAssets`; the 4 demo alerts; the 3 demo incidents; the 4 demo
missions as `COMPLETED`/`ARCHIVED` history; one operator
`operator@resqmesh.local` with password from `SEED_OPERATOR_PASSWORD`.
Seeding is idempotent (upserts).

## 7. Testing

- **Unit (vitest):** `selectUnits` (nearest choice, ties, no available
  drone/rover, empty fleet); `applyMutation` for every mutation type
  including LWW accept/`STALE` reject, idempotent replay via
  `AppliedMutation`, `ASSET_BUSY`; token sign/verify/expiry/rotation.
- **Integration (vitest against a real Postgres, using the compose `db`
  or testcontainers):** every route group — happy path, 401 without
  token, 400 on invalid body; `POST /incidents { dispatch: true }`
  assigns and locks units; a full sync round-trip: client A pushes an
  `incident.dispatch` at cursor 0, client B syncs and receives the
  incident, the two updated assets, and the log; replaying A's outbox
  returns `applied` without duplicates.
- **CI:** add a `server` job to `.github/workflows/ci.yml` with a
  Postgres service container: `npm ci`, `prisma migrate deploy`,
  `tsc --noEmit`, `npm test`.

## Non-goals

- Any change to the app (`src/`) — handled by the app data-layer spec.
- WebSocket / server-sent events / push notifications.
- Roles, permissions, multi-organisation, password reset email.
- File/photo upload storage (`Incident.imageUrl` is stored as-is; the
  app currently keeps a local URI).
- Deployment to a hosting provider.
