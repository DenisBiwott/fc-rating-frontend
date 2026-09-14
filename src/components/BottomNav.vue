<script setup lang="ts">
// design-spec.md §2 "BottomNav": bg/nav, #1f1f24 top border, 10px/34px/22px padding, Table/Players
// text tabs (no icons — design-spec.md §5 forbids icon-decoration), a 62px green FAB pulled up
// -22px for Record.
import { RouterLink } from 'vue-router'
import { useIsAdmin } from '@/queries/useCurrentUser'

// Record still routes and works for an anonymous visitor (the router guard already redirects to
// /login, same as any other requiresAuth route) — this only mutes the styling so it stops
// implying the action is fully available to everyone.
const isAdmin = useIsAdmin()
</script>

<template>
  <nav
    class="flex items-end justify-between border-t border-[#1f1f24] bg-bg-nav px-[34px] pt-[10px] pb-[22px]"
  >
    <RouterLink
      to="/"
      class="flex h-11 min-w-11 items-center justify-center text-[10px] font-semibold"
      :class="$route.name === 'leaderboard' ? 'text-text-primary' : 'text-[#6b6b74]'"
    >
      Table
    </RouterLink>

    <RouterLink
      to="/record"
      class="-mt-[22px] flex h-[62px] w-[62px] flex-col items-center justify-center gap-0.5 rounded-full bg-accent-up text-accent-up-ink shadow-[0_10px_28px_-8px_rgba(52,211,153,0.55)]"
      :class="isAdmin ? '' : 'opacity-40 shadow-none'"
    >
      <span class="text-[9px] font-bold tracking-[0.08em]">RECORD</span>
    </RouterLink>

    <RouterLink
      to="/players"
      class="flex h-11 min-w-11 items-center justify-center text-[10px] font-semibold"
      :class="$route.name === 'players' ? 'text-text-primary' : 'text-[#6b6b74]'"
    >
      Players
    </RouterLink>
  </nav>
</template>
