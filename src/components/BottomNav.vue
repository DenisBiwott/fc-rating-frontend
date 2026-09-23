<script setup lang="ts">
// DESIGN-SPEC.md §2 "BottomNav" and Turn 3's 3f: bg/nav, border-nav top border, Table/Players as
// icon + 10px label, and a 62px green Record FAB pulled up above the bar with a RECORD label under
// it. Phone: items spread edge to edge (10/34/22 padding). Tablet (sm): centred with 120px gaps.
// Hidden at lg, where DesktopRail takes over — this component owns that breakpoint itself.
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import NavIcon from '@/components/NavIcon.vue'
import { useIsAdmin } from '@/queries/useCurrentUser'

// Record still routes and works for an anonymous visitor (the router guard already redirects to
// /login, same as any other requiresAuth route) — this only mutes the styling so it stops
// implying the action is fully available to everyone.
const isAdmin = useIsAdmin()
const route = useRoute()
const tableActive = computed(() => route.name === 'leaderboard')
const playersActive = computed(() => route.name === 'players' || route.name === 'player-profile')
</script>

<template>
  <nav
    aria-label="Primary"
    class="flex items-end justify-between border-t border-border-nav bg-bg-nav px-[34px] pt-[10px] pb-[22px] sm:justify-center sm:gap-[120px] sm:pt-3 sm:pb-[26px] lg:hidden"
  >
    <RouterLink
      to="/"
      class="flex min-h-11 w-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold"
      :class="tableActive ? 'text-text-primary' : 'text-text-nav-inactive'"
      :aria-current="tableActive ? 'page' : undefined"
    >
      <NavIcon name="table" />
      Table
    </RouterLink>

    <RouterLink
      to="/record"
      aria-label="Record match"
      class="-mt-6 flex flex-col items-center gap-[5px]"
      :class="isAdmin ? '' : 'opacity-40'"
    >
      <span
        class="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-accent-up text-[26px] font-bold text-accent-up-ink"
        :class="isAdmin ? 'shadow-[0_10px_28px_-8px_rgba(52,211,153,0.55)]' : ''"
        aria-hidden="true"
      >
        +
      </span>
      <span class="text-[10px] font-bold tracking-[0.06em] text-text-up-bright" aria-hidden="true">RECORD</span>
    </RouterLink>

    <RouterLink
      to="/players"
      class="flex min-h-11 w-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold"
      :class="playersActive ? 'text-text-primary' : 'text-text-nav-inactive'"
      :aria-current="playersActive ? 'page' : undefined"
    >
      <NavIcon name="players" />
      Players
    </RouterLink>
  </nav>
</template>
