<script setup lang="ts">
// Five 14x14 chips, oldest -> newest, left to right (design-spec.md's FormStrip spec). The API
// returns 0-5 results (fewer for a player who hasn't played 5 games yet, per
// fc-rating-backend's recentForm) — padding on the left with "not yet played" slots to always
// show exactly 5 is this component's job, not the API's.
import { computed } from 'vue'

type MatchResult = 'W' | 'L' | 'D'

const props = defineProps<{ form: MatchResult[] }>()

const slots = computed<Array<MatchResult | null>>(() => {
  const padding = Math.max(0, 5 - props.form.length)
  return [...(Array.from({ length: padding }, () => null) as null[]), ...props.form.slice(-5)]
})

const chipClasses: Record<MatchResult, string> = {
  W: 'bg-[rgba(52,211,153,0.16)] text-accent-up-bright',
  L: 'bg-[rgba(244,113,89,0.16)] text-accent-down',
  D: 'bg-[rgba(161,161,170,0.16)] text-text-secondary',
}
</script>

<template>
  <div class="flex flex-none items-center gap-1">
    <span
      v-for="(slot, i) in slots"
      :key="i"
      class="flex h-3.5 w-3.5 flex-none items-center justify-center rounded font-mono text-[9px] font-bold"
      :class="slot ? chipClasses[slot] : 'bg-bg-control text-[#3f3f46]'"
    >
      {{ slot ?? '·' }}
    </span>
  </div>
</template>
