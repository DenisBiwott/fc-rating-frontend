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
})
