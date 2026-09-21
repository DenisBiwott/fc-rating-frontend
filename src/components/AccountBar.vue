<script setup lang="ts">
// New shell chrome — the design canvas never depicted a logged-out/public state at all, so this
// has no mockup to follow. A slim strip above RouterView rather than an absolutely-positioned
// corner chip: PlayersView's "+ Add" and PlayerProfileView's "···" already occupy each screen's
// own top-right corner, so a floating account chip there would collide with them. Rendered once
// in App.vue rather than per-view so it's reachable from anywhere a grey-out is encountered.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentUser, useLogout } from '@/queries/useCurrentUser'

const { data: user, isPending } = useCurrentUser()
const logout = useLogout()
const router = useRouter()

const isAdmin = computed(() => user.value?.role === 'admin')

async function handleLogout(): Promise<void> {
  await logout.mutateAsync()
  await router.push({ name: 'leaderboard' })
}
</script>

<template>
  <div
    v-if="!isPending"
    class="flex h-8 flex-none items-center justify-between gap-2.5 border-b border-border-hairline bg-bg-nav px-4"
  >
    <div class="font-mono text-[11px] font-semibold tracking-[0.04em] text-text-secondary">
      built•by•biwott
    </div>
    <div class="space-x-2">
      <RouterLink
        v-if="!isAdmin"
        :to="{ name: 'login' }"
        class="font-mono text-[11px] font-semibold tracking-[0.04em] text-text-secondary"
      >
        Log in
      </RouterLink>
      <template v-else>
        <span class="font-mono text-[11px] text-text-faint">{{ user?.name }}</span>
        <button
          type="button"
          class="font-mono text-[11px] font-semibold tracking-[0.04em] text-text-secondary"
          @click="handleLogout"
        >
          Log out
        </button>
      </template>
    </div>
  </div>
</template>
