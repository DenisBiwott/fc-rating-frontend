<script setup lang="ts">
// Players CRUD, rating config viewer, and rebuild button land in build-order Phase 7.
// See docs/DEVELOPMENT.md.
//
// Theme toggle and logout live here for now as the only settings-shaped screen — neither design
// doc specifies a chrome location for them, and at MVP there's a single shared admin account, so
// this is a placement of convenience, not a design decision. Revisit if per-player login ever
// ships (design doc §13.7).
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useLogout } from '@/queries/useCurrentUser'

const { theme, toggle } = useTheme()
const logout = useLogout()
const router = useRouter()

async function handleLogout(): Promise<void> {
  await logout.mutateAsync()
  await router.push({ name: 'login' })
}
</script>

<template>
  <section class="flex h-full flex-none flex-col gap-4 p-5 *:shrink-0">
    <p class="font-mono text-sm text-text-muted">Admin — Phase 7</p>
    <button
      type="button"
      class="h-11 rounded-xl border border-border-default px-4 text-sm font-medium text-text-primary"
      @click="toggle"
    >
      Switch to {{ theme === 'dark' ? 'light' : 'dark' }} theme
    </button>
    <button
      type="button"
      class="h-11 rounded-xl border border-border-default px-4 text-sm font-medium text-text-primary"
      @click="handleLogout"
    >
      Log out
    </button>
  </section>
</template>
