<script setup lang="ts">
// The desktop profile chart (DESIGN-SPEC.md RatingChart, 3c): hand-rolled SVG like the phone
// sparkline, but with an axis: gridlines at 50-point steps (100 when the range is wide) with y
// labels, match-number x labels (#first … #last of the 20 shown), an endpoint dot, and the config
// baseline (1200) as the dashed line — the same reference the sparkline dashes. The spec's "1250"
// is just the mock's lowest gridline. All-time peak is text, not plotted.
import { computed } from 'vue'

const BASELINE = 1200
const WINDOW = 20
const W = 400
const H = 210
const PLOT = { left: 28, right: 388, top: 31, bottom: 190 }

const props = defineProps<{ history: Array<{ after: number; playedAt: string }> }>()

const recent = computed(() => props.history.slice(-WINDOW))
const firstMatchNumber = computed(() => props.history.length - recent.value.length + 1)

const peak = computed(() => {
  if (props.history.length === 0) return null
  const best = props.history.reduce((a, b) => (b.after > a.after ? b : a))
  return {
    rating: Math.round(best.after),
    month: new Date(best.playedAt).toLocaleDateString(undefined, { month: 'short' }),
  }
})

const grid = computed(() => {
  const values = [...recent.value.map((h) => h.after), BASELINE]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const step = (max - min) / 50 > 6 ? 100 : 50
  const lo = Math.floor(min / step) * step
  const hi = Math.max(Math.ceil(max / step) * step, lo + step)
  const lines: number[] = []
  for (let v = hi; v >= lo; v -= step) lines.push(v)
  return { lo, hi, lines }
})

function y(value: number): number {
  const { lo, hi } = grid.value
  return PLOT.top + (1 - (value - lo) / (hi - lo)) * (PLOT.bottom - PLOT.top)
}

const points = computed(() => {
  const n = recent.value.length
  if (n < 2) return []
  return recent.value.map((h, i) => ({ x: PLOT.left + (i / (n - 1)) * (PLOT.right - PLOT.left), y: y(h.after) }))
})
const end = computed(() => points.value.at(-1) ?? null)

// Same sign-based colour as the sparkline (and DeltaBadge): the net trend over the 20 shown.
const stroke = computed(() => {
  const first = recent.value[0]?.after
  const last = recent.value.at(-1)?.after
  if (first === undefined || last === undefined || first === last) return 'var(--color-text-muted)'
  return last > first ? 'var(--color-accent-up)' : 'var(--color-accent-down)'
})
</script>

<template>
  <div class="flex flex-col gap-2.5 rounded-2xl border border-border-default bg-bg-raised px-4.5 py-4">
    <div class="flex items-baseline justify-between">
      <span class="font-mono text-[10px] tracking-[0.14em] text-text-muted">RATING · LAST {{ WINDOW }} MATCHES</span>
      <span v-if="peak" class="font-mono text-[11px] text-text-secondary">all-time peak {{ peak.rating }} · {{ peak.month }}</span>
    </div>

    <svg
      v-if="points.length >= 2"
      :viewBox="`0 0 ${W} ${H}`"
      class="block h-auto w-full"
      role="img"
      :aria-label="`Rating over the last ${recent.length} matches, from ${Math.round(recent[0]!.after)} to ${Math.round(recent.at(-1)!.after)}`"
    >
      <template v-for="value in grid.lines" :key="value">
        <line
          x1="20"
          :y1="y(value)"
          :x2="W - 8"
          :y2="y(value)"
          :stroke="value === BASELINE ? 'var(--color-chart-grid)' : 'var(--color-border-nav)'"
          stroke-width="1"
          :stroke-dasharray="value === BASELINE ? '3 4' : undefined"
        />
        <text x="0" :y="y(value) + 3" fill="var(--color-text-faint)" font-family="IBM Plex Mono, monospace" font-size="9">
          {{ value }}
        </text>
      </template>
      <polyline
        :points="points.map((p) => `${p.x},${p.y}`).join(' ')"
        fill="none"
        :stroke="stroke"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <circle v-if="end" :cx="end.x" :cy="end.y" r="4" :fill="stroke" />
      <text :x="PLOT.left" :y="H - 4" fill="var(--color-text-faint)" font-family="IBM Plex Mono, monospace" font-size="9">
        #{{ firstMatchNumber }}
      </text>
      <text :x="PLOT.right" :y="H - 4" text-anchor="end" fill="var(--color-text-faint)" font-family="IBM Plex Mono, monospace" font-size="9">
        #{{ history.length }}
      </text>
    </svg>
    <p v-else class="flex h-40 items-center font-mono text-xs text-text-muted">Not enough matches yet for a trend.</p>
  </div>
</template>
