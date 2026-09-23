# Design system

Distilled from `../DESIGN-SPEC.md` (pixel-level spec, outside this repo). That file governs visual
implementation in full detail; this page is the summary to keep in-repo. If they disagree, treat
`../DESIGN-SPEC.md` as more current and flag the drift here.

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
spec change, not a styling detail — don't add one without updating `../DESIGN-SPEC.md` first.

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
  Never use `text-accent-up*` for text.
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
| `text-nav-inactive` | `#6b6b74` | `#71717a` | BottomNav inactive tab |
| `neutral-quiet` | `#3f3f46` | `#a1a1aa` | unplayed form chip, PROV/UNRATED badge border, chart baseline label |
| `chart-grid` | `#26262b` | `#e4e4e6` | sparkline gridlines |
| `preview-bar-home` / `-away` | `#4a5568` / `#2f3947` | `#8795a8` / `#c3cad4` | PreviewLine split bar (neutral, not accent) |
| `bg-result` | `#08110c` | `#eef6f0` | result canvas, the one tinted canvas (green-cast black / off-white) |
| `text-result-meta` / `-faint` | `#8b9a91` / `#6b7c72` | `#4f6157` / `#5f7167` | result caption / match-of-session label |
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
- **PreviewLine** — win-probability mono row + a neutral-grey (not accent-colored) split bar +
  delta row. Debounced 150ms, `aria-live="polite"`.
- **ResultOverlay** — full-screen, green-cast canvas (`bg-result`, both themes, see Theming),
  `aria-live="assertive"`, ~1.5s auto-linger, dismissible. Player cards: winner green wash,
  loser coral wash, both neutral grey on a draw. Focus moves to it on open. Returning
  focus to Confirm on close is specced but not built yet.
- **Navigation** — `BottomNav` below `lg` (Table / Record FAB / Players; icon + 10px label, FAB
  with a `RECORD` label under it), `DesktopRail` at `lg` and up (88px: FC mark, 52px Record
  button, Table, Players, account controls, TV). `NavIcon` draws the outlined glyphs in
  `currentColor`. The active item is `text-primary` (plus a `bg-control` fill on the rail), inactive
  is `text-nav-inactive`. Every focusable element gets the global `:focus-visible` ring: 2px
  `accent-up`, offset 2px (`main.css`).
- **PlayerRow (leaderboard)** — phone: 1a compact ledger, with W-L-D inline after the form
  strip. Tablet (`sm`, 3f): 66px rows, 32px gutters, 38px avatar, and W-L-D and Win% as their own
  columns. PROV/UNRATED badges sit inline after the name at every width, so every row is the same
  height. Win% comes from the API's `winPct` (the optimistic update recomputes it the backend's
  way: wins ÷ games); an unrated player shows `—`, not `0%`.
- **Sheets / dialogs** — `SheetContent` is a bottom sheet on phones and a centred dialog (440px,
  fade plus a 4px rise) from `sm` up. Initial focus goes to the first focusable element unless the
  sheet handles `@open-auto-focus` (Add player focuses Name, per spec).
- **Record screen chrome** — full-screen (no AccountBar/BottomNav), with Confirm pinned in a footer
  at the bottom of the scroll area. It is always rendered and disabled until both players are
  picked, so the nav's green FAB never competes with it and it's never below the fold.

Full component specs (exact padding, every state, canonical markup) are in `../DESIGN-SPEC.md`
§2 and §6 — copy the values from there, not from memory.

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
