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

// Dark by default, including for a first-time visitor whose system prefers light — Denis's call
// (2026-09-23), replacing the earlier "respect prefers-color-scheme on first load" behaviour. Only
// an explicit choice via the toggle switches to light, and that choice is remembered. index.html
// ships `<html class="dark">` so the default paints before this module has even run.
const theme = ref<Theme>(readStoredTheme() ?? 'dark')

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
