# Architecture

## Layout

```
src/
  api/               # generated types from openapi.json (openapi-typescript) + openapi-fetch client
  queries/           # TanStack Query hooks per resource (usePlayers, useLeaderboard, useRecordMatch...)
  features/
    leaderboard/
    record-match/    # useRecordMatchForm composable — the only client state in the app
    players/
    sessions/
    admin/
  components/ui/     # shadcn-vue
  components/        # shared: RatingNumber, FormStrip, DeltaBadge, AvatarTile
  router/
  mocks/             # MSW handlers aligned to openapi.json — used until the real API exists
  styles/
```

Components stay small and call into `queries/` hooks; they never call `fetch` directly. Route-level
code splitting is required, with the leaderboard + record-match screens in the first chunk — those
are the two screens that matter on a phone at the table.

## State management

Server state (players, leaderboard, matches, sessions) lives entirely in TanStack Query — fetched,
cached, and invalidated through query hooks. There is no global client store (no Pinia) because
there is nothing that needs one: the leaderboard, profile, and history screens are pure
read-and-render over query data.

The **one** piece of genuine client state is the record-match form, and it lives in a single
composable, `useRecordMatchForm`, not scattered across component refs.

## The record-match state machine

```
selecting → scoring → submitting → result → done
```

- **selecting** — home/away slots empty or partially filled from the recently-played grid.
- **scoring** — both slots filled; score steppers active; preview line fetches
  `POST /matches/preview` on every score change, debounced 150ms, cancelled the moment submission
  starts.
- **submitting** — `POST /matches` in flight with a client-generated UUID v7. On network failure
  or a 5xx, the composable returns to `scoring` with all state intact and an inline retry — the
  entered match is never lost. A retry reuses the same UUID, so a duplicate that actually reached
  the server comes back as the original 200, not an error.
  See [backend docs/API.md](../../fc-rating-backend/docs/API.md#idempotency) for the server side
  of that contract.
- **result** — full-screen overlay: rating tick animation, UPSET badge when applicable, rank
  change. The leaderboard query cache is optimistically updated from the returned outcome instead
  of refetching.
- **done** — "Record another" re-enters `scoring` with players kept and sides swapped, scores
  reset; "Done" returns to the leaderboard.

Unit tests target the transitions themselves, the debounce behavior, and the idempotent-retry
path — this state machine is the one piece of this app worth testing in isolation from any
component.

## Contract sync

`scripts/sync-contract.ts` copies `openapi.json` from `CONTRACT_SOURCE` (a path or URL) into
`src/api/openapi.json` and regenerates `src/api/schema.d.ts`. CI fails if the generated file is
stale relative to the committed contract. Until backend endpoints exist, `src/mocks/` (MSW) backs
every operation in the contract against an in-memory store, seeded deterministically (6 players,
~40 matches, one open session) — enabled via `VITE_USE_MOCKS=true`.
