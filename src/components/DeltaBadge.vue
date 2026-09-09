<script setup lang="ts">
// +14 green / −14 coral (U+2212, not a hyphen) / — faint when there's no session delta (or the
// delta is exactly zero — treated the same as "no visible signal", design-spec.md doesn't cover
// this edge case explicitly). Color-on-transparent, never a filled pill (design-spec.md's
// DeltaBadge spec).
defineProps<{ value: number | null }>()
</script>

<template>
  <span
    class="font-mono font-semibold"
    :class="!value ? 'text-text-faint' : value > 0 ? 'text-accent-up' : 'text-accent-down'"
  >
    <template v-if="!value">—</template>
    <template v-else-if="value > 0">+{{ value }}</template>
    <template v-else>−{{ Math.abs(value) }}</template>
  </span>
</template>
