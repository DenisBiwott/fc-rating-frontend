import type { HttpHandler } from 'msw'

/**
 * One array entry per contract operation, filled in as each feature phase needs it — not all at
 * once. See docs/ARCHITECTURE.md#contract-sync and design-spec.md's seed data table for the
 * deterministic fixtures each phase's handlers should return.
 */
export const handlers: HttpHandler[] = []
