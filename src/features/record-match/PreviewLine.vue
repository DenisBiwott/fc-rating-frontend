<script setup lang="ts">
// DESIGN-SPEC.md's PreviewLine spec. Colors follow DeltaBadge's own sign-based rule (not a fixed
// home=green/away=coral) — the design doc's own worked example just happens to have home win.
//
// Always renders its own layout height, filled or not: `outcome` is the caller's `lastOutcome`
// (see useRecordMatchForm.ts), which never collapses to null mid-edit the way a raw mutation
// result does, so this never unmounts/remounts once it has shown a result once. Before the very
// first result ever arrives, it shows a skeleton at the same height instead of nothing, so the
// Confirm result button below never jumps when the preview appears or updates. `pending` dims the
// (possibly stale) numbers while a newer preview is still in flight, as a lightweight
// stale-while-revalidate cue.
import { computed } from 'vue'
import DeltaBadge from '@/components/DeltaBadge.vue'

const props = defineProps<{
  outcome: {
    home: { expectedScore: number; delta: number; wasProvisional: boolean }
    away: { expectedScore: number; delta: number }
    upset: boolean
  } | null
  pending?: boolean
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
  <div
    class="flex flex-col gap-2 px-5 pb-3.5 transition-opacity"
    :class="pending ? 'opacity-50' : ''"
    aria-live="polite"
  >
    <template v-if="outcome">
      <div class="flex items-center justify-between font-mono text-[11px] text-text-muted">
        <span>WIN PROB {{ homePct }}%</span>
        <span class="text-text-faint">EXPECTED</span>
        <span>{{ awayPct }}%</span>
      </div>
      <div class="flex h-1.5 overflow-hidden rounded-full bg-bg-control">
        <span class="h-full" :style="{ width: `${homePct}%`, background: 'var(--color-preview-bar-home)' }" />
        <span class="h-full" :style="{ width: `${awayPct}%`, background: 'var(--color-preview-bar-away)' }" />
      </div>
      <div class="flex items-center justify-between">
        <DeltaBadge :value="outcome.home.delta" class="text-xl" />
        <span v-if="caption" class="text-xs text-text-muted">{{ caption }}</span>
        <DeltaBadge :value="outcome.away.delta" class="text-xl" />
      </div>
    </template>
    <template v-else>
      <div class="h-3.5 animate-pulse rounded bg-bg-control" />
      <div class="h-1.5 animate-pulse rounded-full bg-bg-control" />
      <div class="h-7 animate-pulse rounded bg-bg-control" />
    </template>
  </div>
</template>
