import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// useTheme reads its initial value at module-evaluation time, so each case re-imports a fresh
// module against whatever localStorage/matchMedia it sets up first.
async function loadTheme() {
  vi.resetModules()
  const { useTheme } = await import('./useTheme')
  await nextTick()
  return useTheme()
}

function stubSystemPreference(prefersLight: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({ matches: prefersLight && query === '(prefers-color-scheme: light)' }) as MediaQueryList,
  )
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('defaults to dark, even when the system prefers light', async () => {
    stubSystemPreference(true)
    const { theme } = await loadTheme()
    expect(theme.value).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('restores a stored light choice', async () => {
    localStorage.setItem('fc-rating-theme', 'light')
    const { theme } = await loadTheme()
    expect(theme.value).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggles, applies the class, and persists the choice', async () => {
    const { theme, toggle } = await loadTheme()
    toggle()
    await nextTick()
    expect(theme.value).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('fc-rating-theme')).toBe('light')
  })
})
