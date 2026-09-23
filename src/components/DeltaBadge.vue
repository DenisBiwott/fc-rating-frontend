<script setup lang="ts">
// +14 green / −14 coral (U+2212, not a hyphen) / — faint when there's no session delta (or the
// delta rounds to exactly zero — treated the same as "no visible signal", DESIGN-SPEC.md doesn't
// cover this edge case explicitly). Color-on-transparent, never a filled pill (DESIGN-SPEC.md's
// DeltaBadge spec).
//
// Rounds internally, same as RatingNumber: design doc §5.2 keeps rating state double-precision
// and rounds "only in the UI" — a raw Elo delta (e.g. -14.28052...) reaching this component
// un-rounded is a bug at the call site, not something this component should trust.
import { computed } from 'vue'

const props = defineProps<{ value: number | null }>()
const rounded = computed(() => (props.value === null ? null : Math.round(props.value)))
</script>

<template>
  <span
    class="font-mono font-semibold"
    :class="!rounded ? 'text-text-faint' : rounded > 0 ? 'text-text-up' : 'text-accent-down'"
  >
    <template v-if="!rounded">—</template>
    <template v-else-if="rounded > 0">+{{ rounded }}</template>
    <template v-else>−{{ Math.abs(rounded) }}</template>
  </span>
</template>
