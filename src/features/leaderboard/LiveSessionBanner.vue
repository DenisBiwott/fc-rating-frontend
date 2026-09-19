<script setup lang="ts">
// design-spec.md §2 "LiveSessionBanner": inset card, green hairline border, a pulsing-radius dot
// (no animation — the box-shadow ring is static per the "nothing pulses" motion rule), elapsed
// time in mono green.
import { computed } from 'vue'
import { useNow } from '@/composables/useNow'
import { formatElapsed } from '@/lib/elapsed'

const props = defineProps<{
  sessionName: string
  startedAt: string
  matchCount: number
  biggestMover: { name: string; delta: number } | null
}>()

const now = useNow()

const elapsed = computed(() => formatElapsed(new Date(props.startedAt), new Date(now.value)))

// A session delta is a raw sum of Elo deltas — fractional, so it's rounded here, at display time
// (2dp). The sign comes from the rounded value so a near-zero mover never reads "−0.00".
const biggestMoverDelta = computed(() => {
  if (props.biggestMover === null) return ''
  const magnitude = Math.abs(props.biggestMover.delta).toFixed(2)
  if (magnitude === '0.00') return magnitude
  return `${props.biggestMover.delta > 0 ? '+' : '−'}${magnitude}`
})
</script>

<template>
  <div
    class="mx-5 mb-3 flex items-center gap-3 rounded-xl border p-4"
    style="
      background: linear-gradient(90deg, rgba(52, 211, 153, 0.1), rgba(52, 211, 153, 0.02));
      border-color: rgba(52, 211, 153, 0.3);
    "
  >
    <span
      class="h-[7px] w-[7px] flex-none rounded-full bg-accent-up"
      style="box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.16)"
    />
    <div class="min-w-0 flex-1">
      <div class="text-sm font-medium text-text-primary">{{ sessionName }} · open</div>
      <div class="truncate font-mono text-xs text-text-muted">
        {{ matchCount }} matches<template v-if="biggestMover">
          · biggest mover {{ biggestMover.name }} {{ biggestMoverDelta }}</template
        >
      </div>
    </div>
    <span class="flex-none font-mono text-xs text-accent-up">{{ elapsed }}</span>
  </div>
</template>
