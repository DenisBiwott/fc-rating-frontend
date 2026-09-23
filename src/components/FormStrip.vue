<script setup lang="ts">
// Five 14x14 chips, oldest -> newest, left to right (DESIGN-SPEC.md's FormStrip spec). The API
// returns 0-5 results (fewer for a player who hasn't played 5 games yet, per
// fc-rating-backend's recentForm) — padding on the left with "not yet played" slots to always
// show exactly 5 is this component's job, not the API's.
import { computed } from 'vue'
import ResultChip from './ResultChip.vue'

type MatchResult = 'W' | 'L' | 'D'

// 14px everywhere except the desktop leaderboard table (3a: 16px) and TV mode (3e: 24px, 12px text).
const props = withDefaults(defineProps<{ form: MatchResult[]; size?: number; fontSize?: number }>(), {
  size: 14,
  fontSize: 9,
})

const slots = computed<Array<MatchResult | null>>(() => {
  const padding = Math.max(0, 5 - props.form.length)
  return [...(Array.from({ length: padding }, () => null) as null[]), ...props.form.slice(-5)]
})
</script>

<template>
  <div class="flex flex-none items-center gap-1">
    <template v-for="(slot, i) in slots" :key="i">
      <ResultChip v-if="slot" :result="slot" :size="size" :font-size="fontSize" />
      <span
        v-else
        class="flex flex-none items-center justify-center rounded bg-bg-control font-mono font-bold text-neutral-quiet"
        :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${fontSize}px` }"
      >
        ·
      </span>
    </template>
  </div>
</template>
