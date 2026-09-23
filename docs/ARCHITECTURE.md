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

Three layouts, split at Tailwind's `sm` (640px) and `lg` (1024px), per `../DESIGN-SPEC.md` §6:

| Width | Chrome |
|---|---|
| < 640 | `AccountBar` on top, `BottomNav` pinned to the bottom, content edge to edge |
| 640–1023 | Same chrome; `BottomNav` centres its items with 120px gaps |
| ≥ 1024 | `DesktopRail` (88px, left) replaces both `AccountBar` and `BottomNav` |

Each chrome component owns its breakpoint in its own root classes (`BottomNav`/`AccountBar`:
`lg:hidden`; `DesktopRail`: `hidden lg:flex`). `App.vue` only decides *whether* chrome shows
(route meta, below), never *which*. JS breakpoint state exists only where *behaviour* depends on
width: `useIsDesktop()` (`src/composables/useBreakpoint.ts`, one shared `matchMedia` for `lg`)
and `useElementWidth()` (ResizeObserver), which the leaderboard uses to pick its desktop columns
from the table's own width (`features/leaderboard/columns.ts`). The phone/tablet leaderboard
list goes a step further with a CSS container query: `LeaderboardList` is an `@container`, and
its rows switch to the tablet layout at 640px of *container* width (`@min-[640px]:`). That lets
the same list sit in the narrow column beside the desktop Record panel (516px at 1024) as the
compact phone rows, while phones and tablets behave exactly as with `sm:`.
`AccountBar` and `DesktopRail` share their logic through `useAccount()`, so sign-in, log out and
the theme toggle can't drift apart between the two.

**Content width follows route meta `layout`**, the widest layout a screen has been designed for.
`App.vue` caps the column at 600px (centred) from the next breakpoint up: `phone` (the default)
from `sm`, `tablet` from `lg`. A `desktop` screen is only held to DESIGN-SPEC.md §6's page cap:
1440px minus the 88px rail (1352px), centred. That way no screen stretches edge to edge
before it has been designed to (600px is the old phone card's width; the card frame is gone).
Turn 3 moves screens up one slice at a time. At the moment the leaderboard is `desktop`, the players roster and
player profile are `tablet`, record-match, login and the 404 stay `phone`. A form gains nothing
from a wide column, so record-match may simply stay that way. Tablet gutters are 32px (`sm:px-8`)
where phone gutters are 20px (`px-5`).

`BottomNav` is absolutely positioned (`bottom-0`) inside the `relative` main column, which is a
fixed-height, `overflow-hidden` box. `RouterView` is the only scrollable region, with bottom
padding (`pb-24`, dropped at `lg`) to clear the nav. That's what keeps the nav put while content
scrolls. It also fixed a real bug: when the nav was a normal flex sibling after `RouterView`, a
leaderboard taller than the viewport pushed it below the fold.

Route meta decides which chrome renders. `public` (`/login`, the 404) and `fullscreen` (`/record`)
both hide `AccountBar` and `BottomNav`. They mean different things: `public` marks a screen that
isn't part of the app proper, while `fullscreen` marks a real app screen that needs the whole
viewport. The record screen is fullscreen so the nav's green Record FAB can't outshine its own
Confirm button. Confirm sits in a `sticky bottom-0` footer inside the view root, which is the
scroll container (see below), so it stays on screen however far the form scrolls.

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
because it never overflows itself, so oversized content is silently clipped by the shell's
`overflow-hidden` main column instead).

## State management

Server state (players, leaderboard, matches, sessions) lives entirely in TanStack Query — fetched,
cached, and invalidated through query hooks. There is no global client store (no Pinia) because
there is nothing that needs one so far: the leaderboard, profile, and history screens are pure
read-and-render over query data. This isn't a permanent ban — see CLAUDE.md's state-management
non-negotiable for when Pinia would be a legitimate addition.

The one piece of *feature* client state is the record-match form, in a single composable,
`useRecordMatchForm`, not scattered across component refs. Its desktop companion,
`useRecordLauncher`, decides *where* the form opens. On phones and tablets that's the `/record`
route (`?home=` pre-fills Home). On desktop it's the leaderboard's docked panel, or a right-side
`RecordDrawer` on any other screen. The router guard sends `/record` on a desktop window to the
panel. It holds only the drawer's open flag, a queued Home pre-fill, and a focus request.
`RecordMatchForm` is the single form component for both homes (variant `screen` or `panel`). The
panel variant resets itself on Done, since it outlives a single match. When a match is recorded,
the form hands its outcome and rank changes to `useRecentMoves` (`features/leaderboard/`), which
the leaderboard rows read to tint the two players for 4s. That's module-level UI state that clears
itself, separate from the optimistic cache update that moves the rows. `composables/useTheme.ts` is a second,
smaller piece — presentation state (which CSS class is on `<html>`), not server data, sitting
outside the record-match form and outside TanStack Query on purpose.

## The record-match state machine

```
selecting → scoring → submitting → result → done
```

- **selecting** — home/away slots empty or partially filled from the recently-played grid.
- **Active side** (not a state, a companion ref): `activeSide` is the slot a pick fills while
  selecting and the score ↑/↓ adjusts while scoring. It follows the first empty slot, so tapping
  tiles fills Home then Away as always. The desktop keyboard (`recordKeyboard.ts`, ← →) and
  clearing a slot move it.
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
leaderboard, lifted verbatim from DESIGN-SPEC.md's own "Mock data (use verbatim for seeds and
MSW)" table rather than the generic "6 players, ~40 matches" this doc originally described. Phase 3
turned that static seed into a real mutable store (`mocks/seed/mock-db.ts`) — see the Layout
section above. Enabled via `VITE_USE_MOCKS=true`; not yet cross-checked against the real backend
running side by side (`VITE_USE_MOCKS=false`) — that's the next thing to do, not something this
build order has verified.
