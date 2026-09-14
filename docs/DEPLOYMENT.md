# Deployment

Netlify, building straight from this repo — no Dockerfile, no Caddy, no proxy. `netlify.toml` at
the repo root declares the build command (`pnpm build`), publish directory (`dist`), a pinned
`NODE_VERSION` (the repo has no `engines`/`.nvmrc` otherwise), and an SPA fallback redirect
(`/* -> /index.html`, required because `src/router/index.ts` uses `createWebHistory` — without it,
a hard refresh or deep link on any route but `/` 404s on Netlify's static host). Netlify
auto-detects `pnpm-lock.yaml` and installs via pnpm/corepack; no separate install command needed.
(This supersedes an earlier single-VPS-Dockerfile-plus-Caddy plan that predated the Netlify/Cloud
Run decision.)

CORS is **not** dev-only. The backend (Cloud Run, `*.run.app`) and this frontend (Netlify,
`*.netlify.app`) are genuinely different origins in production — not same-origin-via-proxy like the
old VPS plan assumed. The backend's `CORS_ORIGIN` env var must be set to this site's exact Netlify
URL, and its session cookie is `SameSite=None; Secure` for the same reason (see
[backend docs/API.md](../../fc-rating-backend/docs/API.md#auth)) — `SameSite=Lax` cookies are
withheld on cross-site `fetch`/XHR requests, so without this the login cookie would silently stop
being sent after the first request.

`VITE_API_BASE` (the live Cloud Run URL) and `VITE_USE_MOCKS` (`false`, or omitted) are set via
Netlify's own site environment variables (Site settings → Environment variables) during setup, not
committed to `netlify.toml` or any `.env` file — so the live backend URL isn't hardcoded into
version control and can change without a redeploy-via-commit.

**Known limitation, not addressed:** Netlify deploy-preview URLs
(`deploy-preview-N--<site>.netlify.app`) are each a distinct origin the backend's single-string
`CORS_ORIGIN` can't match — API calls from preview deploys fail CORS by default. Acceptable for a
solo project; previews simply won't reach the real API unless this becomes worth revisiting.

## CI/CD

Netlify builds and deploys on every push to the connected branch itself — no GitHub Actions deploy
step needed for the frontend, same as the backend's Cloud Run trigger.

A `.github/` workflow is still worth adding as a PR gate (install, lint, typecheck, contract
staleness check, vitest, build) so a broken PR is caught before it ever reaches Netlify's own
build — not build/deploy itself. Not yet built.
