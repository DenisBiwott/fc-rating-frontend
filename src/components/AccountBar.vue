<script setup lang="ts">
// New shell chrome — the design canvas never depicted a logged-out/public state at all, so this
// has no mockup to follow. A slim strip above RouterView rather than an absolutely-positioned
// corner chip: PlayersView's "+ Add" and PlayerProfileView's "···" already occupy each screen's
// own top-right corner, so a floating account chip there would collide with them. Rendered once
// in App.vue rather than per-view so it's reachable from anywhere a grey-out is encountered — which
// is also why the theme toggle lives here (moved from AdminView, which only admins could reach).
// Hidden at lg, where DesktopRail carries the same controls (both use useAccount).
import { useAccount } from '@/composables/useAccount'

const { user, isPending, isAdmin, nextTheme, toggleTheme, logOut: handleLogout } = useAccount()
</script>

<template>
  <div
    v-if="!isPending"
    class="flex h-8 flex-none items-center justify-between gap-2.5 border-b border-border-hairline bg-bg-nav px-4 lg:hidden"
  >
    <div class="font-mono text-[11px] font-semibold tracking-[0.04em] text-text-secondary">
      built•by•biwott
    </div>
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="h-8 font-mono text-[11px] font-semibold tracking-[0.04em] text-text-secondary"
        :aria-label="`Switch to ${nextTheme} theme`"
        @click="toggleTheme"
      >
        {{ nextTheme === 'light' ? 'Light' : 'Dark' }}
      </button>
      <RouterLink
        v-if="!isAdmin"
        :to="{ name: 'login' }"
        class="font-mono text-[11px] font-semibold tracking-[0.04em] text-text-secondary"
      >
        Log in
      </RouterLink>
      <div v-else class="flex items-center gap-2">
        <span class="font-mono text-[11px] text-text-faint">{{ user?.name }}</span>
        <button
          type="button"
          class="font-mono text-[11px] font-semibold tracking-[0.04em] text-text-secondary"
          @click="handleLogout"
        >
          Log out
        </button>
      </div>
    </div>
  </div>
</template>
