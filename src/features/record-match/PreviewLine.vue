<script setup lang="ts">
// design-spec.md's PreviewLine spec. Colors follow DeltaBadge's own sign-based rule (not a fixed
// home=green/away=coral) — the design doc's own worked example just happens to have home win.
import { computed } from 'vue'
import DeltaBadge from '@/components/DeltaBadge.vue'

const props = defineProps<{
  outcome: {
    home: { expectedScore: number; delta: number; wasProvisional: boolean }
    away: { expectedScore: number; delta: number }
    upset: boolean
  } | null
}>()

const homePct = computed(() => Math.round((props.outcome?.home.expectedScore ?? 0.5) * 100))
const awayPct = computed(() => 100 - homePct.value)
const caption = computed(() => {
  if (!props.outcome) return ''
  const parts: string[] = []
  if (props.outcome.home.wasProvisional) parts.push('provisional delta')
  if (props.outcome.upset) parts.push('upset')
  return parts.join(' · ')
})
</script>

<template>
  <div v-if="outcome" class="flex flex-col gap-2 px-5 pb-3.5" aria-live="polite">
    <div class="flex items-center justify-between font-mono text-[11px] text-text-muted">
      <span>WIN PROB {{ homePct }}%</span>
      <span class="text-text-faint">EXPECTED</span>
      <span>{{ awayPct }}%</span>
    </div>
    <div class="flex h-1.5 overflow-hidden rounded-full bg-bg-control">
      <span class="h-full" :style="{ width: `${homePct}%`, background: '#4a5568' }" />
      <span class="h-full" :style="{ width: `${awayPct}%`, background: '#2f3947' }" />
    </div>
    <div class="flex items-center justify-between">
      <DeltaBadge :value="outcome.home.delta" class="text-xl" />
      <span v-if="caption" class="text-xs text-text-muted">{{ caption }}</span>
      <DeltaBadge :value="outcome.away.delta" class="text-xl" />
    </div>
  </div>
</template>
