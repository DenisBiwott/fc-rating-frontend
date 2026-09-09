import { vi } from 'vitest'

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
