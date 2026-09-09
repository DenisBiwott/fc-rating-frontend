# Architecture

## Layout

```
src/
  api/               # generated types from openapi.json (openapi-typescript), the openapi-fetch
                     # client, and the shared QueryClient instance (query-client.ts)
  queries/           # TanStack Query hooks per resource (useCurrentUser, useLeaderboard...)
  composables/       # shared composables not tied to one feature (useTheme) — see State management
  features/
    leaderboard/
    record-match/    # useRecordMatchForm composable — the only *feature* client state in the app
    players/
    sessions/        # also owns match history (design doc groups it "by session"; ARCHITECTURE
                     # has no dedicated match-history folder of its own)
    admin/
  components/ui/     # shadcn-vue, pulled in per-component as screens need them
  components/        # shared: BottomNav, RatingNumber, FormStrip, DeltaBadge, AvatarTile
  views/             # top-level pages that aren't tied to a feature or the bottom nav (LoginView,
                     # NotFoundView)
  lib/               # utils.ts — shadcn-vue's cn() class-merging helper
  router/            # route table + the auth guard (redirects to /login on no session)
  mocks/             # MSW handlers, filled in per-resource as each phase needs them — not all at
                     # once from day one
  styles/
```

Components stay small and call into `queries/` hooks; they never call `fetch` directly. Route-level
code splitting is required, with the leaderboard + record-match screens in the first chunk — those
are the two screens that matter on a phone at the table.

## State management

Server state (players, leaderboard, matches, sessions) lives entirely in TanStack Query — fetched,
cached, and invalidated through query hooks. There is no global client store (no Pinia) because
there is nothing that needs one so far: the leaderboard, profile, and history screens are pure
read-and-render over query data. This isn't a permanent ban — see CLAUDE.md's state-management
non-negotiable for when Pinia would be a legitimate addition.

The one piece of *feature* client state is the record-match form, in a single composable,
`useRecordMatchForm`, not scattered across component refs. `composables/useTheme.ts` is a second,
smaller piece — presentation state (which CSS class is on `<html>`), not server data, sitting
outside the record-match form and outside TanStack Query on purpose.

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
`src/api/openapi.json` and regenerates `src/api/schema.d.ts`. CI will fail if the generated file is
stale relative to the committed contract (the check itself isn't wired into a CI workflow yet — no
`.github/` directory exists). The backend's real endpoints exist and this has already been run
against them once; it isn't a hand-stubbed contract.

`src/mocks/` (MSW) backs operations against an in-memory store, filled in per-resource as each
build-order phase needs it rather than all at once — auth landed with Phase 1's login gate;
`src/mocks/seed/leaderboard-seed.ts` (8 players, one open session) landed with Phase 2's
leaderboard, lifted verbatim from design-spec.md's own "Mock data (use verbatim for seeds and
MSW)" table rather than the generic "6 players, ~40 matches" this doc originally described.
Enabled via `VITE_USE_MOCKS=true`.
