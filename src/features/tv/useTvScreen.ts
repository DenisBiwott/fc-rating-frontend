// What makes TV mode behave like a TV screen rather than a web page:
//   - the 1440×810 stage scales to fill the viewport (tvLayout.ts's stageScale)
//   - `Esc` exits (DESIGN-SPEC.md §6). Entered from the rail, the page also goes browser-fullscreen
//     (enterTvFullscreen). There the browser keeps Esc for itself and the page never sees it, so
//     leaving fullscreen also counts as exiting TV: one Esc, either way.
//   - a screen Wake Lock, so a laptop driving the TV doesn't sleep mid-evening. Browsers release it
//     whenever the tab is hidden, so it's re-requested when the tab is visible again.
import { onBeforeUnmount, onMounted, readonly, ref } from 'vue'
import { useRouter } from 'vue-router'
import { stageScale } from './tvLayout'

/** Called from the rail's click, the user gesture a fullscreen request needs. Best effort: a
 *  refusal (or no Fullscreen API) just leaves TV mode as a chrome-less page. */
export function enterTvFullscreen(): void {
  document.documentElement.requestFullscreen?.().catch(() => {})
}

export function useTvScreen() {
  const router = useRouter()
  const scale = ref(stageScale(window.innerWidth, window.innerHeight))

  function onResize(): void {
    scale.value = stageScale(window.innerWidth, window.innerHeight)
  }

  let exiting = false
  function exit(): void {
    if (exiting) return
    exiting = true
    // vue-router keeps the previous entry in history.state.back. A TV that opened /tv directly
    // (a bookmark) has none, so it goes to the leaderboard instead of off the site.
    const back = (window.history.state as { back?: string | null } | null)?.back
    if (back) router.back()
    else void router.push({ name: 'leaderboard' })
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') exit()
  }

  // The rail's fullscreen request can resolve just after this mounts, so track whether we were
  // ever fullscreen rather than reading it once.
  let wasFullscreen = false
  function onFullscreenChange(): void {
    if (document.fullscreenElement) wasFullscreen = true
    else if (wasFullscreen) exit()
  }

  let wakeLock: WakeLockSentinel | null = null
  let disposed = false
  async function requestWakeLock(): Promise<void> {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return
    try {
      const lock = await navigator.wakeLock.request('screen')
      if (disposed) void lock.release()
      else wakeLock = lock
    } catch {
      // Refused (battery saver, permissions policy): the screen may sleep, nothing else breaks.
    }
  }
  function onVisibilityChange(): void {
    if (document.visibilityState === 'visible') void requestWakeLock()
  }

  onMounted(() => {
    wasFullscreen = document.fullscreenElement !== null
    window.addEventListener('resize', onResize)
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('visibilitychange', onVisibilityChange)
    void requestWakeLock()
  })

  onBeforeUnmount(() => {
    disposed = true
    window.removeEventListener('resize', onResize)
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    void wakeLock?.release()
    // Leaving by any route (the browser's back button, say) shouldn't strand the app fullscreen.
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  })

  return { scale: readonly(scale) }
}
