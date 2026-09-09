<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'
import { useTheme } from '@/composables/useTheme'

// Must be called unconditionally from a component that's always instantiated. Previously relied
// on a bare `import './composables/useTheme'` in main.ts for this side effect — that import went
// missing during a commit-splitting pass and nothing caught it, so the composable's initial
// system-preference read and .dark class application silently never ran for anyone who didn't
// happen to navigate to AdminView (the only other importer). Calling it here instead ties
// initialization to App.vue's own instantiation, which can't be skipped.
useTheme()

const route = useRoute()
const showNav = computed(() => !route.meta.public)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg-canvas">
    <RouterView class="flex flex-1 flex-col" />
    <BottomNav v-if="showNav" />
  </div>
</template>
