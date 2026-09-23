<script setup lang="ts">
// A keyboard-shortcut chip (DESIGN-SPEC.md §6): mono, 1px border. On a green button the border is
// the ink colour at 35% so it reads as part of the button. Decorative; the shortcut itself is
// described in the surrounding hint text or aria-keyshortcuts, so it's hidden from screen readers.
defineProps<{ onGreen?: boolean }>()
</script>

<template>
  <span
    aria-hidden="true"
    class="inline-flex flex-none items-center rounded-[5px] border px-1.5 py-px font-mono text-[10px] leading-4 font-medium"
    :class="onGreen ? 'border-[rgba(4,22,13,0.35)] text-accent-up-ink' : 'border-border-control text-text-secondary'"
  >
    <slot />
  </span>
</template>
