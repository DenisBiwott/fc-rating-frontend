# CLAUDE.md — FC Rating Web

This file is the authoritative, always-loaded context for working in this repo. It holds only
what must never be silently dropped: non-negotiables, scope boundaries, and process rules.
Everything else — how things work, why, current setup — lives in `docs/` and is linked at the
bottom. Read it fully before writing code.

## What this is

Mobile-first, dark-by-default Vue 3 web app for recording EA Sports FC match results and viewing a
competitive leaderboard, for a friend group. Vite + TypeScript strict + Tailwind + shadcn-vue +
TanStack Query. The record-match flow is the product: it must complete in under 10 seconds,
one-handed, on a phone. Everything else is secondary.

**Status:** build-order Phases 0-4 done. Phase 0: tooling scaffold (Vite + Vue 3 + TS strict,
Tailwind v4, ESLint+Prettier, Vitest), OpenAPI contract sync run for real against
`fc-rating-backend`'s committed `openapi.json`. Phase 1: auth (Vue Router guard, login, theme
composable), the `BottomNav`/`App.vue` shell. Phase 2: the real leaderboard (1a compact ledger),
`useLeaderboard`'s composition placeholder (see "Known contract gap" below) now real code. Both
followed by real shell/theme bug fixes (see Scars) and a desktop "phone card" containment above the
`sm` breakpoint (docs/ARCHITECTURE.md#responsive-shell). **Phase 3 (record-match — the product):**
`useRecordMatchForm`'s state machine (`selecting → scoring → submitting → result → done`,
docs/ARCHITECTURE.md), the full screen (`MatchSlot`/`PlayerGrid`/`ScoreStepper`/`PreviewLine`/
`ResultOverlay`), idempotent submission with a client-generated UUID v7, and an optimistic
leaderboard cache update on success (`useLeaderboard`'s new `applyRecordedMatchOptimistically`).
The mock backend is now real and stateful (`src/mocks/seed/mock-db.ts` + an Elo engine mirroring
the backend's algorithm exactly) — recording a match against MSW actually updates ratings, so the
full loop is verifiable end to end. Found two real bugs along the way (see Scars): `apiClient`
silently bypassed MSW entirely due to a `fetch`-capture-at-creation issue, and `DeltaBadge` wasn't
rounding, leaking raw Elo deltas into the UI. `pnpm lint && pnpm typecheck && pnpm test && pnpm
build` all pass; the full record → result → leaderboard-updates loop verified against a running dev
server (MSW). Since then, verified for real against the live backend (not MSW) in an actual
browser: login/cookie auth, leaderboard, record-match, and the live-session banner all work
correctly against real Postgres data. The only blocker was the backend having no CORS
configuration — fixed there, not worked around here (see `fc-rating-backend`'s CLAUDE.md); no
frontend code changes were needed. **Phase 4 (player profile + players roster) is done.** Built
from a Claude Design canvas Denis shared (`../FC Rating UI.dc.html`, not committed — same tier as
the other planning docs) — only 2a/2b of its five screens; 2c (add-player), 2d (player actions), 2e
(void-match preview) stay out of scope for now: two conflict with documented architecture (a
per-player rating override; deleting a player, which contradicts this repo's own "never deleted,
only deactivated" design) and one needs a new backend capability (a void-match dry-run), all
deferred pending a deliberate decision rather than silently built around. New query hooks
(`usePlayerProfile`/`useRatingHistory`/`useSessions`/`usePlayerMatches`/`usePlayersRoster` in
`src/queries/`) compose the real contract, including `bestStreak`/`goalsFor`/`goalsAgainst`/
`createdAt`/`lastPlayedAt` — added to the backend specifically for this phase (see
`fc-rating-backend/CLAUDE.md`). `RatingSparkline` (hand-rolled SVG, no chart library) computes its
own scaling rather than copying the source canvas's static points. Verified against the real dev
server, not MSW — cross-checked against already-known values from this session's Elo investigation.
**2026-09-10: 2c/2d built — 2e (void-match preview) stays deferred**, its backend counterpart is
a real endpoint now but no frontend screen yet, out of scope this round like 2c/2d were last
round. `AddPlayerSheet.vue` (2c) and `PlayerActionsSheet.vue` (2d, Rename/Deactivate/Delete)
un-inert the previously-disabled "Coming soon" affordances. First screens needing a real
dialog/sheet primitive, so this pulled in shadcn-vue's `Sheet` (`components/ui/sheet/`, built on
the already-installed `reka-ui`) rather than hand-rolling backdrop/focus-trap/dismiss again.
`PlayerRow.vue` now links to the player's profile, matching `PlayerRosterRow.vue`;
`useLeaderboard.ts`'s `applyRecordedMatchOptimistically` mirrors the backend's unrated-sorts-last
rule. Two real bugs found and fixed during verification, both about `queryClient.ensureQueryData`
(confirmed from its actual runtime implementation, not just its types): it always returns
whatever's already cached synchronously and never waits on a revalidation, invalidated or not —
so `usePlayersRoster.ts`'s leaderboard join served a stale snapshot right after creating/
renaming/deactivating a player. Fixed by having the create/update/delete-player mutations force a
real, awaited leaderboard `fetchQuery` before invalidating the roster/players queries. Also
surfaced a genuine backend CORS gap (fixed there, not worked around here): PATCH wasn't in
`@fastify/cors`'s allowed methods, so this repo's first-ever PATCH call 405'd at the browser's
preflight.
**Public-viewing access model shipped 2026-09-10.** `meta.public`/`meta.requiresAuth` are now
decoupled in `src/router/index.ts` — `meta.public` keeps its narrower meaning (hide `BottomNav`;
`/login` and the 404 only), and a new `meta.requiresAuth`, set only on `/record` and `/admin`,
gates the router guard. Leaderboard, players roster, player profile, match history, and sessions
all render for an anonymous visitor with the nav intact, matching the backend's now-public GET
routes; `useCurrentUser`'s 401-means-logged-out handling is unaffected.

**MVP simplification pass, 2026-09-14 — Denis's call, not a reversal of the access-model work
above but the UI polish it was missing.** The public-viewing change left no way to *reach* login
from a logged-out state (only `/admin`, itself gated, had a logout button) and no visual signal
that Record/`+ Add`/`···` were admin-only rather than just broken. `AccountBar.vue` is a new,
persistent shell control mounted in `App.vue` above `RouterView` (hidden on `/login`/404 like
`BottomNav`) — deliberately not a floating top-right corner chip, since `PlayersView`'s `+ Add`
and `PlayerProfileView`'s `···` already live in that exact corner on their own screens. Record,
`+ Add`, and `···` are now visibly muted for anonymous visitors; the non-route ones (`+ Add`,
`···`) redirect to `/login?redirect=…` on click, mirroring the router guard's own pattern.
`useIsAdmin()` (`src/queries/useCurrentUser.ts`) factors out the shared role check.

Also shipped: **2e (void-match), finally wired up** — reusing the profile's existing match list as
the entry point rather than building Phase 5's dedicated match-history screen, and **explicitly
skipping Phase 5 (match history) and Phase 6 (sessions) for this MVP**, not deferring them by
default — the product runs as one long-lived session (already open in the dev database; no
session-management UI needed, `sessionId` was already optional on `recordMatch`), which also
means Phase 5's "grouped by session" premise doesn't apply. `ProfileMatchRow.vue` shows a void icon
only for admins (not merely disabled — noise otherwise); `VoidMatchSheet.vue` (modeled on
`PlayerActionsSheet.vue`) previews recalculated ratings via the already-shipped
`GET /matches/:id/void-preview` before confirming. `correctMatch` stays unbuilt — void only, per
Denis. Verified end to end against the real backend: voiding a match flipped `isVoid`, recalculated
ratings exactly as previewed, and both the profile and leaderboard updated without a manual
refresh.

**Hosting, 2026-09-14: backend live on Cloud Run, frontend prepped for Netlify.** Backend is
deployed and verified at `https://fc-rating-1067185865527.europe-west1.run.app/` (see
`fc-rating-backend/CLAUDE.md`). This repo gained `netlify.toml` (build `pnpm build`, publish
`dist`, `NODE_VERSION=22` pinned since none was declared before, an SPA fallback redirect for
`createWebHistory`) — Netlify site creation and its `VITE_API_BASE`/`VITE_USE_MOCKS` env vars are
a manual dashboard step, not committed here. One real cross-origin bug surfaced and was fixed on
the backend side (not here): the session cookie was `SameSite=Lax`, which is silently withheld on
cross-*site* `fetch`/XHR (Netlify and Cloud Run are different registrable domains, unlike
`localhost:5173`→`localhost:3000` in dev, which counts as same-site) — now `SameSite=None; Secure`.
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Not yet done: the actual Netlify site connection,
setting Cloud Run's `CORS_ORIGIN` to the final Netlify URL, and end-to-end verification in a real
browser. Phase 7 (admin — rating-config viewer/rebuild button) is real remaining work but wasn't
asked for before the hosting push; revisit after hosting is verified live.
**Turn 3 (desktop & tablet) started 2026-09-23 — Slice 0 done.** Built from the canvas's Turn 3
(`../FC Rating UI.dc.html`, 3a–3f) and `../DESIGN-SPEC.md` §6, as sequential slices (shell → tablet
→ desktop table → docked Record panel → result/FLIP → keyboard → profile → roster → TV).
Slice 0: contract synced for the backend's two additions (`createdAt` on `GET /players`, nullable
`outcome` on `GET /matches` items), mocks updated to match. Also: the theme toggle moved from
`AdminView` (admin-only) to `AccountBar`, and the default is now always dark rather than following
`prefers-color-scheme`; `index.html` ships `class="dark"` so the default paints before JS runs.
**Slice 1 (mobile fixes) done, 2026-09-23.** Every hard-coded colour in components is now a theme
token (docs/DESIGN_SYSTEM.md#theming), which fixed a light-mode result screen that was unreadable
(see Scars). `/record` is `fullscreen` (no AccountBar/BottomNav) with Confirm pinned in a footer.
Verified in Chrome at 390×844 and 390×600 against MSW, in both themes. On a draw, both result
cards now get a neutral grey wash instead of both reading as losers.
**Slice 2 (responsive shell) done, 2026-09-23.** The phone card is gone. `DesktopRail` (lg+)
replaces `AccountBar` + `BottomNav`, the nav gets Turn 3's icons, the tablet nav is centred, and
there's a global focus-visible ring. Content stays a 600px centred column from sm up until each
screen's own slice (docs/ARCHITECTURE.md#responsive-shell). `useAccount()` is shared by
`AccountBar` and the rail. TV sits inert in the rail until its slice.
**Light-mode green text + Slice 3 (tablet) done, 2026-09-23.** Green *text* uses new `text-up*`
tokens, darker in light mode (measured 1.3–1.8:1 before, ≥4.5:1 after). Fills keep the accent.
Tablet (3f): route meta `layout` now decides when a screen's content column is capped
(docs/ARCHITECTURE.md#responsive-shell). Leaderboard, roster and profile are full width with
32px gutters from `sm`, and the leaderboard gains W-L-D/Win% columns with 66px rows. Provisional
badges are inline, so phone rows are uniform again. Sheets are centred dialogs from `sm`. Fixed
while here: Add player now focuses Name on open (it was focusing Cancel).
**Slice 4 (desktop leaderboard, 3a left) done, 2026-09-23.** From `lg`, the leaderboard is the
3a table (`LeaderboardTable`), with click-to-sort headers and columns chosen from the table's
measured width (`columns.ts`: Last, then MP, then W/L/D merge, then the tablet rows). Unrated
players sort last and provisional ones normally, following the backend's ranking rather than the
spec's wording (docs/DESIGN_SYSTEM.md). `lastPlayedAt` is now on leaderboard rows, and the page
caps at 1440. The mock db now ranks unrated players last like the backend does.
**Slice 5 (docked Record panel, 3a right) done, 2026-09-23.** `RecordMatchForm` (variants
`screen`/`panel`) was extracted from `RecordMatchView`. On desktop, admins get a 420px panel docked
beside the leaderboard (anonymous visitors don't); other screens open it as a right-side drawer
from the rail's Record button or a profile's "Record with {name}". `/record` on a desktop window
redirects to the panel, carrying `?home=`. The phone/tablet list now switches layout on its
*container* width, so it fits beside the panel at 1024px (docs/ARCHITECTURE.md).
**Slice 6 (result in panel, 3b) done, 2026-09-23.** `ResultOverlay` has a `panel` variant (a
"Result · MATCH n · time" header and stacked full-width cards). After each recorded match the
leaderboard tints its two players' rows green/coral with ▲n/▼n for 4s (`useRecentMoves`), while
the rows FLIP and the ratings tick. **Undo was dropped (Denis, 2026-09-23)**: not built, and the
secondary action stays Done.
**Coral text + Slice 7 (desktop keyboard) done, 2026-09-23.** Coral text uses `text-down`
(light mode `oklch(0.52 0.17 25)`, ≥4.6:1), like green. Keyboard: global `R` opens/focuses
Record, and inside the panel ← → switch the active slot (new `activeSide` in the form), letters and
↑ ↓ pick players, ↑ ↓ set scores, ↵ confirms, Esc clears; `R` on the result is Record another.
A whole match was recorded by keyboard alone in Chrome (docs/DESIGN_SYSTEM.md#core-components).
**Slice 8 (desktop profile, 3c) done, 2026-09-23.** From `lg`, the profile has two columns: hero,
stat tiles and `RatingChart` (axis, gridlines, peak), beside `ProfileMatchTable` (full history,
cursor-paged, columns fit its width, row `···` → Void). The header `···` is a dropdown (Rename…,
Deactivate, Delete…) over the same actions dialog. `usePlayerMatches` is now an infinite query
reading Δ/After from each match's `outcome`, so the rating-history join is gone. shadcn-vue's
`DropdownMenu` was added. The MSW mock now serves the profile endpoints (see the MSW Scar below).
**Slice 9 (desktop roster, 3d) done, 2026-09-23.** From `lg`, Players is `RosterTable` (Player ·
Rating · W-L-D · Matches · Last played · Joined · `···`) capped at 1180px, with a segmented
Active/Inactive control. "+ Add player" opens `AddPlayerPopover`, which shares `AddPlayerForm`
with the phone sheet. Row menus: Rename…, Deactivate/Reactivate, Delete player…. Reactivate is
new (the profile's desktop menu has it too); there was no way to undo a deactivation before.
shadcn-vue's `Popover` was added. The MSW mock now handles player create/update/delete and
`?active=`.
**Slice 10 (TV mode, 3e) deferred, 2026-09-23** — see Scope boundaries for the plan.
Build order otherwise lives in
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). The product design and
pixel-level visual spec live in `../DESIGN-SPEC.md` (one directory up, outside this repo — a
planning document, not committed here). This repo's docs
distill the sections that govern it; if the two ever disagree, treat that as a bug in this repo's
docs, not a decision to quietly follow one side.

Known contract gap: the real `openapi.json` has no `/api/v1` prefix (design doc and the backend's
own `docs/API.md` both claim one) and `GET /leaderboard` doesn't return `player`/
`deltaSinceLastSession` the way the design doc wants — `src/queries`' leaderboard hook composes
`/leaderboard` + `/players` + a session's `playerDeltas` client-side as a documented placeholder.
Both are backend-owned fixes long-term, not frontend workarounds to keep.

## Non-negotiables

- **This repo never invents an endpoint.** The API contract is `openapi.json`, generated by the
  backend repo from its Zod schemas. If a screen needs something the contract doesn't have, that's
  a contract PR to the backend first — not a hand-written type, not a guessed shape.
- **API types are generated** (`openapi-typescript` from `openapi.json`), never hand-written.
  `scripts/sync-contract.ts` regenerates them; CI fails if `schema.d.ts` is stale relative to the
  committed contract.
- **Server state lives in TanStack Query. The only client state so far is the record-match form**,
  held in one composable (`useRecordMatchForm`) as an explicit state machine (`selecting → scoring
  → submitting → result → done`). No Pinia/Vuex introduced so far because nothing has needed
  one — not a permanent ban. If a genuine cross-cutting client-state need emerges that a composable
  can't reasonably express, Pinia (not Vuex — Pinia is Vue's current recommendation) is a legitimate
  addition; that's an architecture decision worth a line in this file, not a silent dependency add.
  **Decided 2026-09-23 (Turn 3):** a second, small piece of client state, `useRecordLauncher`
  (`src/features/record-match/`), holds where the record form opens on desktop: drawer open, a
  queued Home pre-fill, and a focus request. It's module-level so the router guard, the rail, a
  profile and the panel share it. A composable, still no Pinia. Likewise `useRecentMoves`
  (`src/features/leaderboard/`): which two rows to tint for 4s after a recorded match.
- **The record-match flow is one scrolling card** — no wizard, no modal, no login inside it. Tap
  Home/Away slots to fill from a recently-played grid, two score steppers, a debounced (150ms)
  preview line, a full-width Confirm using a client-generated UUID v7 reused verbatim on retry
  (idempotent against the backend). One component, `RecordMatchForm`, serves both places it lives:
  the full-screen `/record` route (phones/tablets) and the desktop docked panel/drawer.
- **Two accent hues, full stop**: green for positive, coral for negative, plus gold/silver/bronze
  for ranks 1–3 only. Ratings are the largest text on the leaderboard — nothing competes with
  them. All ratings/scores/deltas/records are tabular mono
  (`font-variant-numeric: tabular-nums`); color is never the only signal (form strip uses `W`/`L`/
  `D` letters, deltas use `+`/`−`). Every tap target is ≥ 44px. Full detail in
  [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).
- **Every colour works in both themes.** Dark is the default, light is opt-in via the toggle in
  `AccountBar` / `DesktopRail`. Components use theme tokens only, never a hard-coded neutral hex/rgb. A mode-dependent
  colour gets a token defined in both `:root` and `.dark` in `src/styles/main.css`. Only the
  accents, medals and alpha tints are mode-independent, except that green and coral *text* use
  `text-up*` / `text-down` (darker in light mode for contrast), never `text-accent-*`. A new or changed screen isn't done until
  it has been looked at in both themes. Full rules and the token table:
  [docs/DESIGN_SYSTEM.md#theming](docs/DESIGN_SYSTEM.md#theming).
- Do **not** introduce: Vuex, Axios, hand-written API types, any UI kit besides shadcn-vue, or
  Nuxt. (Pinia is not on this list — see the state-management non-negotiable above.)

## Scars

- **This already happened once — don't reintroduce it.** `useTheme.ts`'s initial system-preference
  read and `.dark` class application happen at module-evaluation time (a module-scope `ref` +
  `watchEffect`), not inside a Vue lifecycle hook, so *something* has to import the module eagerly
  or it never runs. The first version of this relied on a bare `import './composables/useTheme'`
  in `main.ts` for that side effect — that line went missing during a commit-splitting pass and
  nothing caught it (lint doesn't flag an apparently-unused side-effect import as *missing*), so
  every user who never happened to navigate to `AdminView` (the only other importer) silently got
  the light theme regardless of system preference, for an entire build-order phase, undetected by
  its own verification pass (the verification script always visited Admin, incidentally triggering
  the import). Fixed by calling `useTheme()` from `App.vue`'s `<script setup>` instead — a
  component that's structurally guaranteed to instantiate, unlike a side-effect import that reads
  as dead code to skim past. If `useTheme`'s initialization ever needs to move again, keep it
  somewhere that *must* run, not somewhere that merely happens to.
- **`openapi-fetch` narrows a whole response branch to `never` when a contract documents only one
  status.** `POST /auth/login`'s `openapi.json` entry has just a `200` response, so TypeScript
  infers no other branch is reachable — the ordinary "check `!data`, read `error`/`response` in the
  failure path" pattern fails to typecheck, with `response.status` erroring on a type of `never`
  despite `response` always being a real `Response` at runtime. Cast the whole result to a
  permissive shape right after the `await` rather than fight the narrowing (see
  `src/queries/useCurrentUser.ts`'s `useLogin`). The real fix is the backend documenting its error
  responses; this is a workaround for a contract that undersells runtime behavior, not a
  frontend-side design choice worth keeping once that's added.
- **`apiClient` (`src/api/client.ts`) must pass an explicit `fetch` wrapper, never rely on
  `openapi-fetch`'s default.** `createClient()`'s `fetch` parameter defaults to `globalThis.fetch`
  — a *default parameter value resolved once, at the moment `createClient()` is called*, not looked
  up fresh per request. `apiClient` is a module-level singleton created at import time, so removing
  the wrapper (`fetch: (...args) => globalThis.fetch(...args)`) would make it permanently capture
  whatever `fetch` existed the instant that module first loaded. Anything that patches `fetch`
  *after* that — MSW's browser Service Worker, MSW's Node interceptor in tests, any future
  monkey-patch — gets silently bypassed; every request falls through to a real network call instead
  of being intercepted. Found via `useRecordMatchForm.spec.ts`'s "fetch failed" / DNS-lookup
  failures against a deliberately-unreachable test host.
- **A routed view's root using `flex-1` inside `RouterView`'s `flex flex-col overflow-y-auto`
  defeats that overflow, and the naive fix (a `min-height` floor instead) trades a squish bug for a
  silent-clipping bug.** `<RouterView class="...">` merges its classes directly onto the matched
  component's own root — there is no separate wrapper element — so "RouterView is scrollable"
  really means "each view's own root is scrollable," and that only works if the root has a definite
  (capped) height, not just a floor. `flex-1` (grow+shrink, basis 0) never lets the root exceed its
  parent's box, so nothing ever overflows and flex-shrink compresses every descendant to fit
  instead — most visibly a fixed-height button collapsing to a fraction of its declared height.
  Swapping to `min-h-full` looked like the fix (fills-when-short is preserved, squish is gone), but
  a floor has no ceiling either: the root just grows to fit *all* its content with nothing capping
  it, so it never overflows *itself* — the excess is then silently clipped by the outer shell's
  `overflow-hidden` main column, invisible and unscrollable, which is worse than squishing. The actual fix is
  `h-full` (a hard 100%, fills when short, caps when tall) *plus* `*:shrink-0` on that same root —
  because once its height is capped, its own direct children are ordinary flex items with the CSS
  default `flex-shrink: 1`, so the identical squish bug recurses one level down onto the view's own
  children unless they're explicitly told not to shrink. All three pieces (`h-full`, `flex-none`,
  `*:shrink-0`) are required together; any one alone reproduces either the squish or the clipping.
  See docs/ARCHITECTURE.md#responsive-shell.
- **A `useMutation`'s `data` resets to `undefined` synchronously the instant a new `.mutate()` call
  starts, before the network round trip resolves.** `useMatchPreview` is a mutation (not a query)
  driving a debounced preview derived from form inputs, so every score change or player pick
  briefly nuked the previous result. `PreviewLine`'s `v-if="outcome"` reacted to that gap by
  unmounting/remounting on every edit, visibly shifting the Confirm button below it — confirmed via
  `MutationObserver`, which caught the DOM node being removed and re-added ~13ms apart, too fast to
  reliably eyeball but clearly visible in real use. Fixed by holding a `lastOutcome` ref in
  `useRecordMatchForm` that only updates when `preview.data` actually resolves, never resetting on
  a new call, with `PreviewLine` rendering a same-height skeleton before the first-ever result so
  even that initial reveal doesn't move anything.

- **A hard-coded surface under token-coloured text goes invisible in the other theme.**
  `ResultOverlay` hard-coded its canvas as `#08110c` (the spec's green-cast black) while its
  score, names and ratings used `text-text-primary`. The token flipped to `#0c0c0e` in light mode
  and the background didn't, so the result screen, the product's payoff moment, rendered
  near-black on near-black. It went unnoticed because the app had only ever been checked in dark
  mode. Fixed by moving every mode-dependent colour onto tokens (docs/DESIGN_SYSTEM.md#theming).
  The lesson: a surface and the text on it must both be tokens, or both be fixed. Never mix.

- **An MSW `*/…` wildcard also matches the app's own source files.** The browser Service Worker sees
  every request the page makes, including Vite's module URLs. A new `*/players/:id` handler matched
  `/src/features/players/PlayerProfileView.vue` and answered the route's lazy import with a "player
  not found" 404. The profile route then silently never loaded in mock mode: the router aborted
  the navigation, and the page stayed where it was. Fixed by anchoring every handler to the API
  base URL (`src/mocks/handlers.ts`). For mock-mode browser checks, also set
  `VITE_API_BASE=http://localhost.invalid` so nothing a handler misses can reach a real backend.

## Scope boundaries

Deliberately deferred — flag rather than silently building toward these: player head-to-head
comparison, what-if rating-config UI (backend API can already support it), seasons, 2v2 matches,
offline-first / PWA sync queue. See design doc §13 for the intended order if one becomes real
work.

**Future improvement: TV mode (Turn 3's 3e, the planned Slice 10, deferred by Denis 2026-09-23).**
Designed in `../DESIGN-SPEC.md` §6 "TV mode" and the canvas's 3e. The plan when it's picked up:
- a `/tv` route with no chrome (a `fullscreen`-style meta), entered from the rail's TV item;
- standings refetched every 10s (TanStack Query `refetchInterval`);
- diff each poll against the previous one, so changed rows FLIP, tint and show ▲/▼ like the
  desktop leaderboard (`useRecentMoves` holds the same idea for one recorded match);
- a LATEST column of the last 3 results from `GET /matches`, using each item's `outcome` for
  deltas and the UPSET badge;
- `Esc` exits.
Until then the rail's TV item stays inert ("TV mode — coming soon").

## Process rules

- **Documentation updates.** When a change makes an existing doc claim wrong, or adds something a
  doc is supposed to cover, the doc update is part of that change. Trigger on: a new/changed
  screen or user flow, a change to the visual language, a new/changed env var, a contract sync
  that changes how a feature consumes the API, or a scar-worthy fix. **Always propose before
  editing a doc**: state which doc(s), quote the lines, show the replacement, and wait for a
  go-ahead — never edit a doc as a silent side effect of a code change.
- Each topic has exactly one owning doc; update the owner rather than restating the fact
  elsewhere.
- Components stay small; logic lives in composables. No `any`; `defineProps` uses type-only
  declarations.
- Accessibility is not optional: semantic buttons, `aria-live` on the preview line and result
  overlay, focus management on overlay open/close.

## Where to look

| Doc | Read it when |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Feature folder layout, state management rules, the record-match state machine |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Color, type, spacing, components, motion — the visual language |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Local setup, build order, mocks, contract sync |
| [docs/CONFIGURATION.md](docs/CONFIGURATION.md) | Env vars |
| [docs/TESTING.md](docs/TESTING.md) | Testing strategy, what MSW covers |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Netlify, cross-origin CORS/cookie requirements, CI |
