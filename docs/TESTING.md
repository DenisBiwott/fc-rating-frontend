# Testing

Vitest + Vue Test Utils + MSW. Focus areas, roughly in priority order:

1. **`useRecordMatchForm` state machine** — every transition
   (`selecting → scoring → submitting → result → done`), the 150ms preview debounce (fake timers),
   and the idempotent-retry path (same UUID reused after a simulated network failure, resolves to
   the original result on retry). This composable is the one piece of business logic in the
   frontend worth testing in isolation from any component.
2. **Leaderboard rendering** — rank ordering, provisional markers, top-3 medal accents, and that a
   FLIP reorder actually fires when the underlying data changes rank.
3. **Theme toggle** — persists to `localStorage`, defaults to dark even when the system prefers
   light and nothing is stored yet (`useTheme.spec.ts`).

MSW handlers back all of the above against the seeded in-memory store described in
[ARCHITECTURE.md](ARCHITECTURE.md#contract-sync). Every handler is anchored to the API base URL
(`${API}/players/:id`), never a `*/` wildcard; see CLAUDE.md's Scar. The profile endpoints
(`/players/:id`, rating history, `/matches?playerId=` with cursor paging, `/sessions`) are derived
from matches recorded during the mock session, since the seed has no match history. Players can
be created, renamed, (de)activated and deleted (409 on a taken name, or deleting someone who has
played), and `GET /players?active=` filters; the seed adds two inactive players (Otieno, who has
played, and Kev, who hasn't) and spreads join dates over a few months — tests should exercise the real query hooks
against mocked network responses, not mock the query hooks themselves. `src/test-setup.ts` runs
the same `handlers` array against an `msw/node` server rather than a browser Service Worker, reset
between tests (`server.resetHandlers()` + `queryClient.clear()`). Two things make this work that
aren't obvious from the test code itself: `apiClient` (`src/api/client.ts`) must resolve
`globalThis.fetch` fresh per call rather than capturing it once at creation — see CLAUDE.md's Scar
on this — and `vite.config.ts`'s `test.env.VITE_API_BASE` gives requests an absolute (deliberately
unreachable) base URL, since apiClient's real baseUrl is `''` by design and Node's `fetch` has no
page origin to resolve a relative one against the way a browser does.

E2E (Playwright, post-MVP): the 10-second record-match flow on a mobile viewport. Not part of MVP
scope yet.

## CI quality gates

`eslint --max-warnings 0`, `tsc --noEmit`, a contract-staleness check (`schema.d.ts` vs committed
`openapi.json`), `vitest`, `vite build`.
