// Opening the record form from anywhere: the desktop rail's Record button, "Record with {name}"
// on a profile, and /record visited on a desktop window. Where the form lives depends on the
// screen (DESIGN-SPEC.md §6):
//   - phone/tablet: the full-screen /record route (`?home=` pre-fills Home)
//   - desktop leaderboard: the docked panel, already on screen — pre-fill it and focus it
//   - any other desktop screen: the same panel as a right-side drawer over the content
//
// This is client state beyond the record form itself (CLAUDE.md's state-management rule): whether
// the drawer is open, a queued Home player, and a focus request. It's module-level so the router
// guard, the rail, a profile and the panel all share it. Small enough not to need Pinia.
import { onBeforeUnmount, onMounted, readonly, ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIsDesktop } from '@/composables/useBreakpoint'

const drawerOpen = ref(false)
const pendingHome = ref<string | null>(null)
const focusRequests = ref(0)

/** Queue a Home pre-fill and a focus for whichever desktop form is (or is about to be) on screen.
 *  Plain function so the router guard can call it outside any component. */
export function queueDesktopRecord(homePlayerId: string | null): void {
  pendingHome.value = homePlayerId
  focusRequests.value += 1
}

export function useRecordLauncher() {
  const isDesktop = useIsDesktop()
  const route = useRoute()
  const router = useRouter()

  function openRecord(homePlayerId: string | null = null): void {
    if (!isDesktop.value) {
      void router.push({ name: 'record-match', query: homePlayerId ? { home: homePlayerId } : {} })
      return
    }
    queueDesktopRecord(homePlayerId)
    if (route.name !== 'leaderboard') drawerOpen.value = true
  }

  /** The queued Home player, cleared as it's read so it's applied exactly once. */
  function takePendingHome(): string | null {
    const id = pendingHome.value
    pendingHome.value = null
    return id
  }

  return {
    drawerOpen,
    pendingHome: readonly(pendingHome),
    focusRequests: readonly(focusRequests),
    openRecord,
    takePendingHome,
  }
}

/**
 * The global `R` shortcut (DESIGN-SPEC.md §6 "Keyboard"): open or focus Record. Ignored while
 * typing, inside any dialog, and inside the record form itself, where letters pick players
 * (including R for Ras). Call once, from a component that's always mounted (App.vue).
 */
export function useRecordShortcut(enabled: Ref<boolean>): void {
  const { openRecord } = useRecordLauncher()

  function onKeydown(event: KeyboardEvent): void {
    if (!enabled.value || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
    if (event.key.toLowerCase() !== 'r') return
    const focused = document.activeElement
    if (focused?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [data-record-form]')) {
      return
    }
    event.preventDefault()
    openRecord()
  }

  onMounted(() => document.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
}
