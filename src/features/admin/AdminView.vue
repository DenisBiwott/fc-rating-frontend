<script setup lang="ts">
// Players CRUD, rating config viewer, and rebuild button land in build-order Phase 7.
// See docs/DEVELOPMENT.md.
//
// Theme toggle lives here for now as the only settings-shaped screen — neither design doc
// specifies a chrome location for it, so this is a placement of convenience, not a design
// decision. Logout used to live here too but moved to AccountBar.vue (App.vue's shell), which is
// reachable from every screen, not just this one.
import { useTheme } from '@/composables/useTheme'

const { theme, toggle } = useTheme()
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
  </section>
</template>
