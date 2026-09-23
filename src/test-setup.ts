import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { queryClient } from '@/api/query-client'
import { handlers } from '@/mocks/handlers'

// jsdom doesn't implement matchMedia at all — anything touching prefers-color-scheme
// (src/composables/useTheme.ts) needs this polyfilled to be testable. Defaults to "no match"
// (light/no-preference); individual tests can override via `window.matchMedia = vi.fn(...)`.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// jsdom doesn't implement ResizeObserver either (src/composables/useElementWidth.ts). A no-op is
// enough: components start from the element's measured width, which jsdom reports as 0.
class NoopResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
Object.defineProperty(window, 'ResizeObserver', { writable: true, value: NoopResizeObserver })

// docs/TESTING.md: "tests should exercise the real query hooks against mocked network responses,
// not mock the query hooks themselves" — the same MSW handlers the real dev server uses, run
// against Node instead of a browser Service Worker.
export const server = setupServer(...handlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  queryClient.clear()
})
afterAll(() => server.close())
