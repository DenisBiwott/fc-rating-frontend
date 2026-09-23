<script setup lang="ts">
// The three profile stat tiles (DESIGN-SPEC.md StatTiles): RECORD W-L-D + win %, STREAK current +
// best, GOALS F:A + diff. Colours follow sign (green good, coral bad, muted even), as DeltaBadge.
import { computed } from 'vue'
import ProfileStatCard from './ProfileStatCard.vue'

type Streak = { result: 'W' | 'L' | 'D'; length: number } | null

const props = defineProps<{
  wins: number
  losses: number
  draws: number
  gamesPlayed: number
  streak: Streak
  bestStreak: Streak
  goalsFor: number
  goalsAgainst: number
  large?: boolean
}>()

const winPct = computed(() => {
  const total = props.wins + props.draws + props.losses
  return total === 0 ? 0 : Math.round((props.wins / total) * 100)
})
const winPctClass = computed(() =>
  props.gamesPlayed === 0 || winPct.value === 50 ? 'text-text-muted' : winPct.value > 50 ? 'text-text-up' : 'text-text-down',
)
const goalDiff = computed(() => props.goalsFor - props.goalsAgainst)
</script>

<template>
  <div class="grid grid-cols-3" :class="large ? 'gap-2.5' : 'gap-2'">
    <ProfileStatCard
      :large="large"
      :label="large ? 'RECORD W-L-D' : 'RECORD'"
      :value="`${wins}-${losses}-${draws}`"
      :sub-label="`${winPct}% win`"
      :sub-label-class="winPctClass"
    />
    <ProfileStatCard
      :large="large"
      label="STREAK"
      :value="streak ? `${streak.length} ${streak.result}` : '—'"
      :value-class="streak?.result === 'W' ? 'text-text-up-bright' : streak?.result === 'L' ? 'text-text-down' : 'text-text-primary'"
      :sub-label="bestStreak ? `best ${bestStreak.length} ${bestStreak.result}` : 'no streak yet'"
    />
    <ProfileStatCard
      :large="large"
      :label="large ? 'GOALS F:A' : 'GOALS'"
      :value="`${goalsFor}:${goalsAgainst}`"
      :sub-label="goalDiff === 0 ? 'even' : `${goalDiff > 0 ? '+' : ''}${goalDiff} diff`"
      :sub-label-class="goalDiff > 0 ? 'text-text-up' : goalDiff < 0 ? 'text-text-down' : 'text-text-muted'"
    />
  </div>
</template>
