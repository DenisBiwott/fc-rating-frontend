import { ref, watchEffect } from 'vue'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'fc-rating-theme'

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'dark' || stored === 'light' ? stored : null
  } catch {
    return null
  }
}

function systemPrefersLight(): boolean {
  return window.matchMedia('(prefers-color-scheme: light)').matches
}

// Dark by default; a stored choice wins, otherwise an explicit system preference for light is
// respected on first load (docs/DEVELOPMENT.md: "dark-by-default ... respects
// prefers-color-scheme on first load").
const theme = ref<Theme>(readStoredTheme() ?? (systemPrefersLight() ? 'light' : 'dark'))

watchEffect(() => {
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme.value)
  } catch {
    // localStorage unavailable (private browsing, etc.) — theme still applies for this load.
  }
})

export function useTheme() {
  function toggle(): void {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggle }
}
