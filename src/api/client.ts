import createClient from 'openapi-fetch'
import type { paths } from './schema'

/**
 * The real backend mounts every route at root (no `/api/v1` prefix), despite the design doc and
 * the backend's own docs/API.md saying otherwise — openapi.json's paths are the source of truth
 * here. See memory: project-fc-rating-contract-gaps.
 */
export const apiClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE ?? '',
  credentials: 'include',
  // openapi-fetch defaults to `fetch: globalThis.fetch`, captured once at createClient() call
  // time. Since apiClient is a module-level singleton, that permanently freezes in whatever
  // fetch existed at import time — MSW (real usage in dev via a Service Worker, tests via Node
  // interceptors) patches fetch *after* modules load, so a captured reference silently bypasses
  // it. Resolving `globalThis.fetch` fresh on every call avoids depending on import order.
  fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
})
