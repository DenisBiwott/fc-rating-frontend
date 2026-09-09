<script setup lang="ts">
// Desktop treatment: above `sm`, the mobile layout is contained in a fixed-width "phone card"
// (design-spec.md's Geometry section already has a `phone frame 34` radius token, even though
// neither design doc ever describes a wider viewport) rather than stretching edge to edge.
// Below `sm`, this is unchanged from the original edge-to-edge mobile layout.
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
  <div class="flex min-h-dvh items-center justify-center bg-bg-canvas sm:bg-bg-nav sm:p-6">
    <div
      class="relative flex h-dvh w-full flex-col overflow-hidden bg-bg-canvas sm:h-[calc(100dvh-3rem)] sm:max-w-[390px] sm:rounded-[34px] sm:border sm:border-border-default sm:shadow-2xl"
    >
      <RouterView class="flex flex-1 flex-col overflow-y-auto" :class="showNav ? 'pb-24' : ''" />
      <BottomNav v-if="showNav" class="absolute inset-x-0 bottom-0 z-10" />
    </div>
  </div>
</template>
