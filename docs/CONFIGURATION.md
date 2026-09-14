# Configuration

| Var | Required | Notes |
|---|---|---|
| `VITE_USE_MOCKS` | no (default `false` in prod builds) | `true` runs entirely against MSW with the deterministic seed — no backend needed. |
| `VITE_API_BASE` | when `VITE_USE_MOCKS=false` | Base URL of the running API, e.g. `http://localhost:3000`. In production this is the Cloud Run API's own URL (genuinely cross-origin from Netlify) — set via Netlify's site environment variables, not committed. |
| `CONTRACT_SOURCE` | only for `sync-contract` | Path or URL to the backend's `openapi.json`, e.g. `../fc-rating-backend/openapi.json` locally. Not read at runtime — build-time only. |

`.env.example` at the repo root mirrors this table once the repo is scaffolded — keep the two in
sync; this table explains *why* a var exists.
