<script setup lang="ts">
// One TV LATEST card (DESIGN-SPEC.md §6 "TV mode", 3e): time, an UPSET chip when the underdog won,
// home · score (34) · away, then both deltas. Names follow 4a (winner bold), not the 3e mock's
// always-grey away name. A new match's green wash is an overlay that fades by opacity, like the
// desktop LATEST, so a theme toggle never animates the card's own colours.
import DeltaBadge from '@/components/DeltaBadge.vue'
import { latestNameClass } from '@/features/leaderboard/latestCard'
import type { LatestMatch } from '@/queries/useLatestMatches'

defineProps<{ match: LatestMatch; when: string; highlighted: boolean }>()
</script>

<template>
  <li
    class="relative isolate flex flex-col gap-2.5 rounded-[18px] border border-border-default bg-bg-raised px-5.5 py-5"
  >
    <span
      aria-hidden="true"
      class="pointer-events-none absolute -inset-px -z-10 rounded-[inherit] border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.07)] transition-opacity duration-700 motion-reduce:transition-none"
      :class="highlighted ? 'opacity-100' : 'opacity-0'"
    />
    <div class="flex items-center justify-between">
      <span class="font-mono text-sm text-text-muted">{{ when }}</span>
      <span
        v-if="match.upset"
        class="rounded-[5px] bg-accent-up px-2.25 py-0.75 font-mono text-xs font-bold tracking-[0.16em] text-accent-up-ink"
      >
        UPSET
      </span>
    </div>
    <div class="flex items-center justify-between gap-3">
      <span class="min-w-0 flex-1 truncate text-2xl" :class="latestNameClass(match, 'home')">{{
        match.home.name
      }}</span>
      <span class="flex-none font-mono text-[34px] font-bold tracking-[-0.03em] text-text-primary tabular-nums">
        {{ match.home.score }}–{{ match.away.score }}
      </span>
      <span class="min-w-0 flex-1 truncate text-right text-2xl" :class="latestNameClass(match, 'away')">{{
        match.away.name
      }}</span>
    </div>
    <span class="font-mono text-sm text-text-muted">
      <DeltaBadge :value="match.home.delta" /> / <DeltaBadge :value="match.away.delta" />
    </span>
  </li>
</template>
