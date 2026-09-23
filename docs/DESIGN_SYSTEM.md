# Design system

Distilled from `../DESIGN-SPEC.md`, one directory up, outside this repo. **That file is Denis's**:
he replaces it wholesale, along with the canvas export it's built from, every time he adds new
designs — so it holds no history and no annotations. A note added there is gone the next time he
pastes an update (confirmed 2026-09-23, when a Turn 4 paste silently reverted several documented
deviations, including this exact sentence). **This page is the durable record instead**: read
`../DESIGN-SPEC.md` for current pixel values and any screen it covers that isn't documented below,
but treat this page as authoritative for anything it already documents, and never edit
`../DESIGN-SPEC.md` itself — a deviation from it, once decided, is written here and only here. See
"Known deviations" below for the running list.

Target device: 390 × 844, dark default, Vue 3 + Tailwind + shadcn-vue.

## Color

Three neutral surface steps only — near-black, not pure black:

| Role | Value | Use |
|---|---|---|
| `bg/canvas` | `#0c0c0e` | app background |
| `bg/raised` | `#131317` | cards, player slots, stepper card |
| `bg/control` | `#18181c` / `#1c1c22` | avatar tiles, stepper buttons |

Text: `#fafafa` (primary) → `#a1a1aa` (secondary) → `#71717a` (muted) → `#52525b` (faint). **Two
accents only**: `accent/up` (green, `oklch(0.78 0.19 148)`) for positive delta / confirm / record;
`accent/down` (coral, `oklch(0.72 0.17 25)`) for negative delta. Gold/silver/bronze apply to ranks
1–3 only, never as a general accent. Adding a third hue (blue for info, amber for warning) is a
spec change, not a styling detail — flag it and get a decision before adding one; it's never a
silent addition.

No gradients as decoration except the live-session banner. No glow except under the two green CTAs
and the Record FAB.

## Theming

Two themes, **dark by default**. Light is an explicit opt-in. The default ignores
`prefers-color-scheme` (Denis's call, 2026-09-23).

**Mechanism.** A `dark` class on `<html>` selects the dark token values. `index.html` ships
`<html class="dark">` so the default paints before any JS runs. `useTheme()`
(`src/composables/useTheme.ts`) reads a stored choice from `localStorage` (`fc-rating-theme`),
falls back to dark, keeps the class in sync, and persists every change. It must be called from
`App.vue` (see CLAUDE.md's Scars). The toggle lives in `AccountBar`, which every visitor can
reach.

**Every colour a component uses is a token, never a hex.** Tokens are CSS variables defined twice
in `src/styles/main.css`, once in `:root` (light) and once in `.dark`, and exposed to Tailwind
through `@theme inline` (`bg-bg-result`, `text-text-muted`, `border-border-nav`, …). Inline SVG
uses `var(--color-…)`. There are two kinds of token:

- **Mode-dependent**: surfaces, text steps, borders, and the special-purpose neutrals below.
  Each has a dark value (the spec's hex, verbatim) and a light counterpart.
- **Green text** is the one accent exception. Fills (Record FAB, CTAs, live dot, chip washes) use
  `accent-up` in both themes. Green *text* uses `text-up` / `text-up-bright` instead: the spec's
  `accent-up` (dark) and `accent-up-bright` (dark), and `oklch(0.5 0.15 148)` in light mode.
  Measured in light mode, the accent as text was 1.3–1.8:1 against WCAG's 4.5:1 for small text.
  The darker green clears 4.5:1 on every light surface it sits on, including the green form chip.
  Never use `text-accent-up*` for text. **Coral text, the same way:** `text-down` is `accent-down`
  in dark mode and `oklch(0.52 0.17 25)` in light (measured 2.1:1 before, 4.6:1 or better after,
  worst case the coral L chip). Never use `text-accent-down` for text. Lines and fills (the
  sparkline stroke, destructive buttons, washes) keep the accents.
- **Mode-independent**: the two accents, the medals, `accent-up-ink`, and the alpha tints
  (green/coral washes, borders and chips, CTA shadows). An alpha tint works on either canvas
  because it's transparent over whatever surface is behind it, so these can be written as
  `rgba(...)` arbitrary values.

A hard-coded neutral hex that *looks* right in dark mode is a light-mode bug waiting to happen. The
worst case is a hard-coded surface under token-coloured text. The two flip independently, so a
dark-only background plus `text-text-primary` renders dark-on-dark in light mode.

Special-purpose neutrals:

| Token | Dark | Light | Use |
|---|---|---|---|
| `border-nav` | `#1f1f24` | `#e4e4e6` | BottomNav top border |
| `bg-panel` | `#0f0f12` | `#f4f4f5` | the leaderboard's LATEST column (4a) |
| `bg-drawer` | `#111114` | `#f7f7f8` | the Record drawer (4b) |
| `text-emphasis` | `#d4d4d8` | `#3f3f46` | desktop table W/L/D counts (between primary and secondary) |
| `text-nav-inactive` | `#6b6b74` | `#71717a` | BottomNav inactive tab |
| `neutral-quiet` | `#3f3f46` | `#a1a1aa` | unplayed form chip, PROV/UNRATED badge border, chart baseline label |
| `chart-grid` | `#26262b` | `#e4e4e6` | sparkline gridlines |
| `preview-bar-home` / `-away` | `#4a5568` / `#2f3947` | `#8795a8` / `#c3cad4` | PreviewLine split bar (neutral, not accent) |
| `bg-result` | `#08110c` | `#eef6f0` | result canvas, the one tinted canvas (green-cast black / off-white) |
| `text-result-meta` / `-faint` | `#8b9a91` / `#6b7c72` | `#4f6157` / `#5f7167` | result caption / match-of-session label |
| `text-down` | `oklch(0.72 0.17 25)` | `oklch(0.52 0.17 25)` | coral text: negative deltas, `L` letters, errors, destructive labels, `▼n` |
| `text-up` / `text-up-bright` | `oklch(0.78 0.19 148)` / `oklch(0.82 0.17 148)` | `oklch(0.5 0.15 148)` (both) | green text: positive deltas, `W` letters, RECORD label, streaks |
| `border-result-secondary`, `text-result-secondary` | `#2e3a34`, `#d4d4d8` | `#c3d3c9`, `#27272a` | result screen's secondary button |

The light values are this repo's own inversions. `../DESIGN-SPEC.md` only states the rule ("invert
surfaces and text, keep accents").

**Adding UI:** reuse an existing token. If none fits, add one to both `:root` and `.dark`, then
list it in the table above. Check the screen in both themes before calling it done.

## Typography

Two families: **Space Grotesk** for UI text, **IBM Plex Mono** (`font-variant-numeric:
tabular-nums`) for every rating, score, delta, record, percentage, timestamp, and uppercase
micro-label. If it's a number a player would compare against another number, it's mono. Never
below 9px; 9px is reserved for uppercase mono badges only.

## Geometry

Screen gutter 20px. Radii: cards 14–16, stepper buttons 12, chips 4–6, pills/avatars 99. **Every
tap target ≥ 44px** — this is a hard floor, not a guideline, because the whole product is used
one-handed on a couch. Numbers never wrap and never shift horizontally between states: fixed-width
columns, tabular figures, `white-space: nowrap` on anything sitting next to them.

## Core components

- **RatingNumber** — mono, tabular, animates old→new over ~700ms via `requestAnimationFrame`
  (never a CSS transition on text content). Rounds to integer at render only; state stays
  double-precision.
- **DeltaBadge** — `+14` green / `−14` coral (U+2212, not a hyphen) / `—` faint when there's no
  session delta. Color-on-transparent, never a filled pill on the leaderboard.
- **FormStrip** — five 14×14 chips, oldest→newest: `W` green / `L` coral / `D` neutral / `·` for
  not-yet-played. Letters are load-bearing, not decoration — color is never the only signal.
- **ScoreStepper** — `[− 44px][value][+ 44px]` per side, range 0–20, value tappable to type.
  Always on screen (4b/4c), dimmed to 35% and inert until both slots are filled, so nothing jumps
  when the second player lands. Hidden on phones only while the name filter is open.
- **PlayerGrid** (4b) — two rows only: 5 per row on phones, 4 in the drawer. "TONIGHT, THEN
  RECENT" (last played, newest first, never-played last by name; `playerPicker.ts`), with "type to
  filter" on the right in the drawer. When active players outnumber the tiles, the last tile is
  "All +N" (dashed circle), which opens the name filter. Picked players stay in place at 35%,
  inert.
- **PlayerFilter** (4c drawer / 4d phone) — replaces the grid while open: a focused field (`⌕`,
  "Back to recent", or "Back" on phones) over the matching active players, prefix matches first,
  matched letters in `text-up-bright`, PROV/UNRATED badge or rating, `↵` chip on the highlighted
  row in the drawer, and the "Searches all active players…" hint. Already-picked and inactive
  players aren't listed. A combobox (`aria-activedescendant`): `↑ ↓` move, `↵` picks, Esc goes
  back to the grid without closing the drawer. Picking fills the active slot and brings the grid
  back. On phones the slots shrink to one-line cards (36px avatar) and the stepper and Confirm
  step aside, so the list sits between the slots and the keyboard.
- **PreviewLine** — win-probability mono row + a neutral-grey (not accent-colored) split bar +
  delta row. Debounced 150ms, `aria-live="polite"`.
- **ResultOverlay** — full-screen, green-cast canvas (`bg-result`, both themes, see Theming),
  `aria-live="assertive"`, ~1.5s auto-linger, dismissible. Player cards: winner green wash,
  loser coral wash, both neutral grey on a draw. Two variants: `screen` (phones/tablets, cards side
  by side, "MATCH n OF {session}" below, Record another and Done) and `panel` (the desktop drawer,
  3b/4b: a "Result · MATCH n · time" header, full-width stacked cards, no buttons). The drawer
  closes itself ~1.5s after the result appears; Esc or a click closes it sooner. No Undo, as a
  button or a toast (dropped 2026-09-23).
- **Leaderboard after a result** (3b) — the two players' rows get the green (gained) or coral
  (lost) wash for 4s, with `▲n` / `▼n` after the name when their rank moved. The rows FLIP into
  their new order and the ratings tick (the existing two motions). The tint just switches on and
  off; there's no fade, because §3 allows exactly three animations. Bystanders only FLIP. Focus moves to it on open. Returning
  focus to Confirm on close is specced but not built yet.
- **Navigation** — `BottomNav` below `lg` (Table / Record FAB / Players; icon + 10px label, FAB
  with a `RECORD` label under it), `DesktopRail` at `lg` and up (88px: FC mark, 52px Record
  button, Table, Players, account controls, TV — inert until TV mode is built, see CLAUDE.md Scope boundaries). `NavIcon` draws the outlined glyphs in
  `currentColor`. The active item is `text-primary` (plus a `bg-control` fill on the rail), inactive
  is `text-nav-inactive`. Every focusable element gets the global `:focus-visible` ring: 2px
  `accent-up`, offset 2px (`main.css`).
- **PlayerRow (leaderboard)** — phone: 1a compact ledger, with W-L-D inline after the form
  strip. Tablet (3f, container ≥ 640px): 66px rows, 32px gutters, 38px avatar, and W-L-D and
  Win% as their own columns. PROV/UNRATED badges sit inline after the name at every width, so every row is the same
  height. Win% comes from the API's `winPct` (the optimistic update recomputes it the backend's
  way: wins ÷ games); an unrated player shows `—`, not `0%`.
- **Desktop leaderboard table** (3a, `lg` and up) — 58px rows, 28px gutters, columns
  `# · Player · Form · W · L · D · Win% · MP · Last · Rating (26px) · Δ`, with widths in
  `features/leaderboard/columns.ts`. Row hover is `bg-raised`, and a click opens the profile.
  Clicking a header sorts (one direction per column; `↓` marks the active one), and sorting resets
  on reload. **Columns fit the table's own width, not the viewport**: as it narrows (beside
  LATEST at 1024px), Last drops first, then MP, then W/L/D merge into W-L-D; below ~704px the tablet
  rows take over. **Unrated players sort last on every column; provisional players sort
  normally.** That's the backend's ranking rule (`rankPlayers`), so the default Rating sort is
  exactly rank order. DESIGN-SPEC.md §6 says "provisional & unrated sort last", but doing that
  would print ranks out of order (a provisional #5 below a rated #7), so this follows the
  backend. The footer hint reads "Unrated sort last".
- **LATEST column** (4a, desktop leaderboard, everyone) — 420px, `bg-panel`, left border: "LAST 5
  · ALL SESSIONS", then five read-only `bg-raised` cards (radius 14) from `useLatestMatches`:
  `time · session` (or "just now"), an UPSET chip, then home name · score (26px mono) · away name,
  each name with its delta under it. Winner 700 `text-primary`, loser 500 `text-secondary`, both
  600 on a draw. The just-recorded match slides in at the top with a green wash for 4s (an
  overlay that fades by opacity, see the theming Scar in CLAUDE.md). Admins get a ghost "Record
  match `R`" button at the bottom. It replaced 3a's docked Record panel.
- **Record drawer** (4b, desktop, admins only) — `RecordDrawer` on every desktop page: 420px,
  `bg-drawer`, `border-default` left border, over the page's right column (inset to the 1352px
  content column on wider screens, so on the leaderboard it covers LATEST exactly). A
  `rgba(8,8,10,0.55)` scrim dims the main area but not the rail; a scrim click or Esc closes it.
  Opened from the rail, `R`, LATEST's button, "Record with {name}" (Home filled), or `/record`.
  Header: "Record match", the session name (`text-up-bright`, uppercase) and an `esc` chip. The
  active slot gets a green border and a `0 0 0 3px rgba(52,211,153,0.14)` ring. Confirm is pinned
  at the bottom. After Confirm the result plays in the drawer, the drawer closes, and only then do
  the table tints and the LATEST wash start, so the scrim doesn't hide them.
- **Keyboard (desktop)** — the global `R` (outside the drawer, admins) opens it
  (`useRecordShortcut`). Inside the drawer (`recordKeyboard.ts`): `← →` switch the active slot
  (shown by the green ring, in scoring too); any letter opens the name filter with that letter
  typed in (R included); `↑ ↓` walk the grid's players, and `↵` picks one; while scoring `↑ ↓` change the active score and `↵`
  confirms; `Esc` closes the drawer.
  Picking, from the grid or the filter, keeps focus in the drawer (next player, then Confirm). `KeyHint` chips: mono 10px, 1px
  `border-control` border, or `rgba(4,22,13,0.35)` on green; they sit on the rail's Record,
  LATEST's Record match (`R`), the drawer's header (`esc`) and Confirm (`↵`), plus a hint line
  under Confirm. Buttons carry
  `aria-keyshortcuts`.
- **Profile, desktop** (3c, `lg`) — "‹ Leaderboard" with "Record with {name}" and `···` (a
  dropdown: Rename…, Deactivate or Reactivate, Delete player… disabled once they've played) in the header. Then
  a `460px | 1fr` grid. Left: `PlayerHero large` (avatar 76, name 34, rating 56),
  `ProfileStats large` (values 22), `RatingChart`. Right: `ProfileMatchTable`, a `bg-nav` card of
  54px rows (Opponent · Score · Δ · After · Session · When · `···` → Void match…), loaded 20 at a
  time with "Load older matches". Its columns fit its own width, dropping Session, then When,
  then After (`historyColumns.ts`). "Open match" isn't built (there's no match screen).
- **RatingChart** — gridlines every 50 points (100 when the range is wide), y labels, `#first` /
  `#last` match numbers, an endpoint dot, and the config baseline 1200 dashed. The mock's "1250"
  was just its lowest gridline, and the phone sparkline dashes 1200 too. The stroke is green or
  coral by net trend, as on the sparkline.
- **Roster, desktop** (3d, `lg`) — header: "Players" 30px with `n active · m inactive`, a
  segmented Active/Inactive control (`aria-pressed`), and "+ Add player". Below it,
  `RosterTable`: a `bg-nav` card of 60px rows (Player · Rating · W-L-D · Matches · Last played ·
  Joined · `···`), capped at 1180px. Every column fits from 1024px, so none is dropped. The name
  link stretches over the row (row click → profile) so the `···` button isn't nested in a link.
  The row menu has Rename…, Deactivate/Reactivate, and Delete player…, disabled once they've played. An inactive player
  has no leaderboard entry, so Rating, W-L-D and Matches read "—" and Delete falls back to "no
  last-played date". Anonymous visitors get a muted `···` and "+ Add player" that lead to login.
- **Add player** — `AddPlayerForm` in two containers: `AddPlayerSheet` (phone/tablet) and
  `AddPlayerPopover` (desktop, 360px, anchored under "+ Add player" right-aligned, with an `esc`
  chip and `↵` on the CTA). Name is focused on open; a duplicate name shows the 409 inline. The
  provisional note omits the mock's "ranked last until then", since only unrated players rank
  last. The "Starting rating" override row is not built.
- **Popover** (`components/ui/popover`, reka) — `bg-raised` surface, `border-control` border,
  radius 18, deep shadow; Escape, click-outside and focus return to the trigger are built in.
- **Menus** (`components/ui/dropdown-menu`, reka) — `bg-control` surface, `border-control` border,
  38px items, and destructive items in coral on a `rgba(244,113,89,0.08)` wash. Keyboard
  navigation, typeahead and Escape come built in.
- **Sheets / dialogs** — `SheetContent` is a bottom sheet on phones and a centred dialog (440px,
  fade plus a 4px rise) from `sm` up. Initial focus goes to the first focusable element unless the
  sheet handles `@open-auto-focus` (Add player focuses Name, per spec).
- **Record screen chrome** — full-screen (no AccountBar/BottomNav), with Confirm pinned in a footer
  at the bottom of the scroll area. It is always rendered and disabled until both players are
  picked, so the nav's green FAB never competes with it and it's never below the fold.

Full component specs (exact padding, every state, canonical markup) are in `../DESIGN-SPEC.md`
§2 and §6 — copy the values from there, not from memory, except where "Known deviations" just
below says otherwise.

## Known deviations from DESIGN-SPEC.md

DESIGN-SPEC.md is replaced wholesale on every export, so it has no way to track its own history —
these are things it currently says that this repo deliberately doesn't build, or builds
differently, because the decision was made and is recorded here rather than there. Detail on each
lives with the matching component above; this is the index, kept short on purpose so it stays easy
to scan and doesn't drift out of sync with the prose it points to.

- **Nav icons exist.** DESIGN-SPEC.md §5 still says "no emoji, no icon-decoration"; Denis dropped
  that rule 2026-09-23 for Turn 3, and `NavIcon`/`BottomNav`/`DesktopRail` (Navigation, above) use
  outlined glyphs throughout.
- **No Undo.** DESIGN-SPEC.md §6 currently describes a 10s-countdown Undo replacing Done (3b) and,
  in the Turn 4 revisions, that same button moving to a toast instead. Denis dropped Undo entirely
  2026-09-23; neither form is built, and the drawer's secondary action stays gone rather than
  becoming Done or Undo (ResultOverlay, above).
- **No AddPlayer "Starting rating" override.** DESIGN-SPEC.md §2/§6 still lists a `config default ·
  1200` + Override row. Ratings are derived by replaying matches, so there's no per-player starting
  value to set (Add player, above).
- **Unrated-only sort-last, not "provisional & unrated."** DESIGN-SPEC.md §6 says "provisional &
  unrated sort last"; this repo follows the backend's actual rule instead, since the spec's wording
  would print ranks out of order (Desktop leaderboard table, above).
- **Destructive button text isn't the spec's ink colour.** DESIGN-SPEC.md's VoidMatchDialog entry
  specifies `#1a0805` text on the coral fill, mirroring `accent-up-ink` on the green CTAs. The
  Delete-player and Void-match confirm buttons (`accent-down-solid` fill) currently use plain
  `text-white` instead — there's no `accent-down-ink` token yet. Not yet reconciled; flag before
  fixing, since it'd mean adding that token.
- **The retired `fc-rating-platform-design.md`.** DESIGN-SPEC.md's own intro line still calls
  itself a "companion" to that file. It was retired 2026-09-23 (this repo's docs are canonical for
  anything it used to cover); that's a stale reference in Denis's file, not something fixed here.

## Motion

Exactly three animations: rating tick (~700ms rAF), row reorder (FLIP, ~300ms), overlay enter/exit
(~200ms fade + rise). Nothing pulses, breathes, or loops. Respect `prefers-reduced-motion`: snap to
final values, keep the overlay itself (it's not decorative — it carries the result).

## Rules to hold the line

- Leaderboard is rows, not cards. Charts live on profiles only.
- Ratings are the largest text on the leaderboard; nothing competes.
- Derived facts (winner, win %, streak, rank) are computed client-side or server-side from raw
  data — never hard-coded in a component, never a prop that duplicates something computable from
  other props already on the page.
- Every screen answers: does this help record a match or enjoy the result? If neither, it doesn't
  ship.
