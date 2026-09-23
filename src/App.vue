<script setup lang="ts">
// The shell (docs/ARCHITECTURE.md#responsive-shell). Below lg: AccountBar on top, BottomNav pinned
// to the bottom. At lg and up: DesktopRail on the left instead. Each chrome component owns its own
// breakpoint (lg:hidden / hidden lg:flex), so this file only decides *whether* chrome shows (route
// meta), never *which*. The content column is capped at 600px and centred from the breakpoint
// above the widest layout the screen was designed for (route meta `layout`).
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AccountBar from '@/components/AccountBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import DesktopRail from '@/components/DesktopRail.vue'
import { useIsDesktop } from '@/composables/useBreakpoint'
import { useTheme } from '@/composables/useTheme'
import RecordDrawer from '@/features/record-match/RecordDrawer.vue'
import { useIsAdmin } from '@/queries/useCurrentUser'

// Must be called unconditionally from a component that's always instantiated. Previously relied
// on a bare `import './composables/useTheme'` in main.ts for this side effect — that import went
// missing during a commit-splitting pass and nothing caught it, so the composable's initial
// system-preference read and .dark class application silently never ran for anyone who didn't
// happen to navigate to AdminView (the only other importer). Calling it here instead ties
// initialization to App.vue's own instantiation, which can't be skipped.
useTheme()

const route = useRoute()
const isDesktop = useIsDesktop()
const isAdmin = useIsAdmin()
// Neither chrome piece shows on /login or the 404 (`public`), nor on a `fullscreen` screen.
const showNav = computed(() => !route.meta.public && !route.meta.fullscreen)

const COLUMN_CAP = {
  phone: 'sm:mx-auto sm:w-full sm:max-w-150',
  tablet: 'lg:mx-auto lg:w-full lg:max-w-150',
  // DESIGN-SPEC.md §6: content caps at 1440 and centres. The rail (88px) sits outside the column.
  desktop: 'mx-auto w-full max-w-[1352px]',
} as const
const columnCap = computed(() => COLUMN_CAP[route.meta.layout ?? 'phone'])
</script>

<template>
  <div class="flex h-dvh bg-bg-canvas">
    <DesktopRail v-if="showNav" />
    <div class="relative flex min-w-0 flex-1 flex-col overflow-hidden">
      <AccountBar v-if="showNav" />
      <RouterView
        class="flex flex-1 flex-col overflow-y-auto"
        :class="[columnCap, showNav ? 'pb-24 lg:pb-0' : '']"
      />
      <BottomNav v-if="showNav" class="absolute inset-x-0 bottom-0 z-10" />
    </div>
    <RecordDrawer v-if="isDesktop && isAdmin" />
  </div>
</template>
