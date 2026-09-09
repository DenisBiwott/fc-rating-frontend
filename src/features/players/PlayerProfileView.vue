<script setup lang="ts">
// Player profile (sparkline, W-L-D, streak, recent matches) lands in build-order Phase 4.
// See docs/DEVELOPMENT.md.
defineProps<{ id: string }>()
</script>

<template>
  <section class="flex flex-1 items-center justify-center p-5">
    <p class="font-mono text-sm text-text-muted">Player profile — Phase 4</p>
  </section>
</template>
