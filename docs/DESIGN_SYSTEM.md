# Design system

Distilled from `../design-spec.md` (pixel-level spec, outside this repo). That file governs visual
implementation in full detail; this page is the summary to keep in-repo. If they disagree, treat
`../design-spec.md` as more current and flag the drift here.

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
spec change, not a styling detail — don't add one without updating `../design-spec.md` first.

No gradients as decoration except the live-session banner. No glow except under the two green CTAs
and the Record FAB.

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
- **ResultOverlay** — full-screen, green-cast canvas, `aria-live="assertive"`, ~1.5s auto-linger,
  dismissible. Focus moves to it on open and returns to Confirm on close.

Full component specs (exact padding, every state, canonical markup) are in `../design-spec.md`
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
