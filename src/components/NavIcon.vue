<script setup lang="ts">
// The nav's wayfinding glyphs, drawn exactly as the Turn 3 canvas draws them: plain outlined
// shapes in currentColor (a rounded square for Table, a circle for Players, a screen for TV), so
// they inherit the item's active/inactive colour. DESIGN-SPEC.md §5's "no icon-decoration" rule
// was dropped for these on 2026-09-23.
defineProps<{ name: 'table' | 'players' | 'tv' }>()
</script>

<template>
  <span
    aria-hidden="true"
    class="block flex-none border-2 border-current"
    :class="{
      'h-5 w-5 rounded-[4px]': name === 'table',
      'h-5 w-5 rounded-full': name === 'players',
      'h-[15px] w-[22px] rounded-[3px]': name === 'tv',
    }"
  />
</template>
