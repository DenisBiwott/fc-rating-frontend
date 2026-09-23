<script setup lang="ts">
// DESIGN-SPEC.md §2 "LiveSessionBanner": inset card, green hairline border, a pulsing-radius dot
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
  /** Desktop (3a): a one-line pill in the header's right corner — name, match count, elapsed.
   *  No biggest mover; the table's Δ column already shows every mover. */
  compact?: boolean
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
    v-if="compact"
    class="flex flex-none items-center gap-[11px] rounded-xl border px-3.5 py-2.5"
    style="
      background: linear-gradient(90deg, rgba(52, 211, 153, 0.1), rgba(52, 211, 153, 0.02));
      border-color: rgba(52, 211, 153, 0.28);
    "
  >
    <span
      class="h-[7px] w-[7px] flex-none rounded-full bg-accent-up"
      style="box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.16)"
    />
    <span class="text-[13px] font-semibold whitespace-nowrap text-text-primary">{{ sessionName }} · open</span>
    <span class="font-mono text-[11px] whitespace-nowrap text-text-muted">{{ matchCount }} matches · {{ elapsed }}</span>
  </div>
  <div
    v-else
    class="mx-5 sm:mx-8 mb-3 flex items-center gap-3 rounded-xl border p-4"
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
    <span class="flex-none font-mono text-xs text-text-up">{{ elapsed }}</span>
  </div>
</template>
