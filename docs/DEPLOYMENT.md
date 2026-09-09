# Deployment

Multi-stage Dockerfile builds static assets; a Caddyfile serves the SPA and proxies `/api` to the
backend container. Deployed alongside the backend on the same single-VPS Docker Compose stack
(see [backend docs/DEPLOYMENT.md](../../fc-rating-backend/docs/DEPLOYMENT.md)) — this repo doesn't
run its own server process in production, only the static build.

CORS is dev-only (needed when the Vite dev server and a local API run on different ports); in
production, same-origin via Caddy's proxy makes it moot.

## CI/CD

GitHub Actions: install, lint, typecheck, contract-staleness check, vitest, build. On `main`,
build + push the static-asset image alongside the backend's deploy step.
