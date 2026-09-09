# Testing

Vitest + Vue Test Utils + MSW. Focus areas, roughly in priority order:

1. **`useRecordMatchForm` state machine** — every transition
   (`selecting → scoring → submitting → result → done`), the 150ms preview debounce (fake timers),
   and the idempotent-retry path (same UUID reused after a simulated network failure, resolves to
   the original result on retry). This composable is the one piece of business logic in the
   frontend worth testing in isolation from any component.
2. **Leaderboard rendering** — rank ordering, provisional markers, top-3 medal accents, and that a
   FLIP reorder actually fires when the underlying data changes rank.
3. **Theme toggle** — persists to `localStorage`, respects `prefers-color-scheme` on first load
   when nothing is stored yet.

MSW handlers back all of the above against the seeded in-memory store described in
[ARCHITECTURE.md](ARCHITECTURE.md#contract-sync) — tests should exercise the real query hooks
against mocked network responses, not mock the query hooks themselves.

E2E (Playwright, post-MVP): the 10-second record-match flow on a mobile viewport. Not part of MVP
scope — see design doc §10.

## CI quality gates

`eslint --max-warnings 0`, `tsc --noEmit`, a contract-staleness check (`schema.d.ts` vs committed
`openapi.json`), `vitest`, `vite build`.
