<script setup lang="ts">
// Hand-rolled SVG, no chart library (design-spec.md §5: "one sparkline at MVP, hand-rolled SVG").
// Mirrors the canvas mockup's structure (viewBox 0 0 322 60, a dashed baseline reference line)
// but computes real scaling rather than copying static points: the plotted domain always includes
// the config baseline (1200) so the dashed reference line is never mathematically wrong or
// omitted, even though a player's actual range rarely touches it. Stroke color follows the
// established sign-based rule (DeltaBadge, PreviewLine) — green/coral by net trend over the
// visible window, not a fixed color regardless of direction.
import { computed } from 'vue'

const BASELINE = 1200
const VIEW_WIDTH = 322
const VIEW_HEIGHT = 60
const PADDING_TOP = 4
const PADDING_BOTTOM = 8

const props = defineProps<{
  history: Array<{ after: number }>
}>()

const last20 = computed(() => props.history.slice(-20))
const peak = computed(() =>
  props.history.length === 0 ? null : Math.max(...props.history.map((h) => h.after)),
)

const domain = computed(() => {
  const values = [...last20.value.map((h) => h.after), BASELINE]
  return { min: Math.min(...values), max: Math.max(...values) }
})

function scaleY(value: number): number {
  const { min, max } = domain.value
  const usable = VIEW_HEIGHT - PADDING_TOP - PADDING_BOTTOM
  if (max === min) return PADDING_TOP + usable / 2
  return PADDING_TOP + (1 - (value - min) / (max - min)) * usable
}

const points = computed(() => {
  const n = last20.value.length
  if (n < 2) return []
  return last20.value.map((entry, i) => {
    const x = (i / (n - 1)) * VIEW_WIDTH
    return `${x},${scaleY(entry.after)}`
  })
})

const baselineY = computed(() => scaleY(BASELINE))

const trendColor = computed(() => {
  const first = last20.value[0]?.after
  const last = last20.value.at(-1)?.after
  if (first === undefined || last === undefined || last === first) return '#71717a'
  return last > first ? 'oklch(0.78 0.19 148)' : 'oklch(0.72 0.17 25)'
})

const minValue = computed(() => Math.min(...last20.value.map((h) => h.after)))
const maxValue = computed(() => Math.max(...last20.value.map((h) => h.after)))
</script>

<template>
  <div class="mx-5 mb-3.5 rounded-2xl border border-border-hairline bg-bg-raised px-3.5 pt-3 pb-2.5">
    <div class="mb-2 flex items-baseline justify-between">
      <span class="font-mono text-[10px] tracking-[0.14em] text-text-muted">LAST 20 MATCHES</span>
      <span v-if="peak !== null" class="font-mono text-[11px] text-text-secondary">peak {{ Math.round(peak) }}</span>
    </div>

    <svg
      v-if="points.length >= 2"
      :viewBox="`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`"
      class="block w-full"
      style="height: 60px"
      preserveAspectRatio="none"
    >
      <polyline
        :points="points.join(' ')"
        fill="none"
        :stroke="trendColor"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <line
        x1="0"
        :y1="baselineY"
        :x2="VIEW_WIDTH"
        :y2="baselineY"
        stroke="#26262b"
        stroke-width="1"
        stroke-dasharray="3 4"
      />
    </svg>
    <p v-else class="flex h-[60px] items-center font-mono text-xs text-text-muted">
      Not enough matches yet for a trend.
    </p>

    <div v-if="points.length >= 2" class="mt-0.5 flex justify-between font-mono text-[10px] text-text-faint">
      <span>{{ Math.round(minValue) }}</span>
      <span class="text-[#3f3f46]">baseline {{ BASELINE }}</span>
      <span>{{ Math.round(maxValue) }}</span>
    </div>
  </div>
</template>
