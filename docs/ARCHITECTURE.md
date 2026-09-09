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
  lib/               # utils.ts (shadcn-vue's cn() helper), uuid.ts (hand-rolled UUID v7 —
                     # CLAUDE.md's non-negotiable calls for v7 specifically)
  router/            # route table + the auth guard (redirects to /login on no session)
  mocks/             # MSW handlers, filled in per-resource as each phase needs them — not all at
                     # once from day one. mocks/seed/ is a real, mutable mock backend (an Elo
                     # engine mirroring fc-rating-backend's algorithm + an in-memory store),
                     # not static fixtures — recording a match through it actually updates
                     # ratings, so the record -> result -> leaderboard loop is verifiable
                     # end to end against MSW
  styles/
```

Components stay small and call into `queries/` hooks; they never call `fetch` directly. Route-level
code splitting is required, with the leaderboard + record-match screens in the first chunk — those
are the two screens that matter on a phone at the table.

## Responsive shell

Neither design doc says anything about a viewport wider than design-spec.md's 390×844 target —
every fixed column width and component size in that spec is a phone-viewport number. Rather than
design a second, desktop-native visual language with no spec to follow, `App.vue` contains the
unmodified mobile layout in a fixed-width "phone card" above the `sm` (640px) breakpoint: rounded
corners (`34px`, design-spec.md's own `phone frame` radius token — the only hint either doc gives
about a wider viewport), a subtle border, floating on a `bg-nav`-toned backdrop (reusing an
existing token rather than inventing a new one). Below `sm`, the card *is* the viewport —
edge-to-edge, unchanged from a plain mobile page. No component below `App.vue` needs to know this
exists.

The card's width (600px, wider than design-spec.md's literal 390px target) is a judgment call, not
a spec value — 390px read as "a mobile app running in a browser" rather than something at home on
a laptop. Widths past ~540px open a visible gap between a row's record text and its rating column,
since the name column absorbs the extra width with nothing more to put in it — tried once before
at 600px and reverted to 540px for exactly that reason, then deliberately re-accepted at 600px so
the bottom sheets (2c/2d) could match the card's width edge to edge. If that gap becomes a real
problem, the fix is scaling row content (avatar size, font sizes, padding) to use the space, not
picking a smaller number.

`BottomNav` is absolutely positioned (`bottom-0`) within that same card, which is `position:
relative` — not `position: fixed` against the real viewport, which would escape the card's
boundary on desktop and pin to the browser window instead. `RouterView` is the only scrollable
region (`overflow-y-auto` on a `flex-1` sibling inside a fixed-height, `overflow-hidden` card)
with bottom padding sized to clear the nav, so content scrolls independently while the nav stays
put — this is also what fixed a real bug, not just a desktop concern: previously the nav was a
normal flex-flow sibling after `RouterView`, so a leaderboard taller than the viewport pushed it
below the fold entirely.

`<RouterView class="...">` does not wrap the routed component in an extra element — Vue Router
merges those classes directly onto the matched component's own root node. So "RouterView is
scrollable" really means each view's own root element is scrollable, not some ancestor, and that
only works with a **capped** height, not just a floor. Every routed view's root therefore carries
three things together, all required: `h-full` (fills available height when content is short, caps
it when content is tall, so genuine overflow occurs on the root instead of it silently exceeding
its container), `flex-none` (no flex-grow/shrink fighting that explicit height), and `*:shrink-0`
(once the root's height is capped, its own direct children are ordinary flex items with the CSS
default `flex-shrink: 1` — without this, the same squish this was meant to fix just recurs one
level down onto the view's own children). See CLAUDE.md's Scars for the two dead ends that came
before this (a `flex-1` root squishes instead of scrolling; a `min-h-full` root scrolls nothing
because it never overflows itself, so oversized content is silently clipped by the phone card's
`overflow-hidden` instead).

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
  `POST /matches/preview` on every score change, debounced 150ms. "Cancelled the moment submission
  starts" means the *pending debounce timer* is cleared — an in-flight preview request already
  sent isn't aborted (no `AbortController` wiring), since its result is simply unused once the
  form moves past `scoring`. Deliberately not more precise than that; the debounce already makes
  overlap rare in practice.
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
MSW)" table rather than the generic "6 players, ~40 matches" this doc originally described. Phase 3
turned that static seed into a real mutable store (`mocks/seed/mock-db.ts`) — see the Layout
section above. Enabled via `VITE_USE_MOCKS=true`; not yet cross-checked against the real backend
running side by side (`VITE_USE_MOCKS=false`) — that's the next thing to do, not something this
build order has verified.
