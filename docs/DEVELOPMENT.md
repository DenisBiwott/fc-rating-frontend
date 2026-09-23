# Development

## Prerequisites

- Node 22, pnpm via Corepack (`corepack enable` once — don't install pnpm globally via npm).
- The backend repo's `openapi.json`, or a hand-stubbed contract for day-1 work before the backend
  produces a real one (see [ARCHITECTURE.md](ARCHITECTURE.md#contract-sync)).

## Build order

Mirrors the original scaffold prompt, committing after each step:

1. App shell — bottom nav (Leaderboard / Record / Players), dark-by-default via a `dark` class on
   `<html>` (dark on first load regardless of system preference), with a light toggle in
   `AccountBar` persisted in `localStorage`. Login screen appears only on a 401 from `GET /auth/me` — never inline in the match
   flow. Can start against a hand-stubbed contract before the backend has real routes.
2. Leaderboard — rows, hero rating number with tabular tick animation, delta badge, form strip,
   provisional marker, top-3 medal accents, FLIP row reorder, live-session banner.
3. Record Match — the full flow in
   [ARCHITECTURE.md](ARCHITECTURE.md#the-record-match-state-machine): slots, player grid, steppers,
   preview line, Confirm, result overlay, Record another / Done. This is the screen to iterate on
   by feel, not just by spec compliance — time yourself recording a match.
4. Player profile — SVG sparkline (no chart library at MVP), W-L-D, streak, recent matches.
5. Match history — grouped by session, admin void/correct actions with a reason field.
6. Sessions — list, current summary, open/close.
7. Admin — players CRUD, rating config viewer, rebuild button.

## Local loop

```
pnpm install
VITE_USE_MOCKS=true pnpm dev      # full app against MSW, no backend needed
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Against a real backend: `VITE_USE_MOCKS=false VITE_API_BASE=http://localhost:3000 pnpm dev` — no
code change required to switch, only env vars.

## Syncing the contract

```
CONTRACT_SOURCE=../fc-rating-backend/openapi.json pnpm sync-contract
```

Run this whenever the backend's `openapi.json` changes. CI fails if `src/api/schema.d.ts` is
stale relative to the committed `src/api/openapi.json` — don't hand-edit either file.
