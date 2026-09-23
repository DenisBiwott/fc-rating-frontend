<script setup lang="ts">
// The phone/tablet leaderboard (DESIGN-SPEC.md 1a / 3f): a column header and PlayerRows. It's a
// CSS container, and the rows switch to the tablet layout at 640px of *container* width, so the
// same list reads right on a phone, a tablet, and in the narrow column beside the desktop Record
// panel when the full table doesn't fit.
import type { LeaderboardRow } from '@/queries/useLeaderboard'
import PlayerRow from './PlayerRow.vue'
import { useRecentMoves } from './useRecentMoves'

defineProps<{ rows: LeaderboardRow[]; provisionalGames: number }>()
const recentMoves = useRecentMoves()
</script>

<template>
  <div class="@container">
    <div
      class="flex items-center gap-2.75 px-5 pb-2 font-mono text-[10px] font-semibold tracking-[0.14em] text-text-faint uppercase @min-[640px]:gap-3 @min-[640px]:px-8 @min-[640px]:tracking-[0.1em]"
    >
      <span class="w-3.75 flex-none text-right @min-[640px]:w-[22px] @min-[640px]:text-left">#</span>
      <span class="w-8 flex-none @min-[640px]:w-[38px]" />
      <span class="flex-1">Player</span>
      <span class="hidden w-[84px] flex-none text-right @min-[640px]:block">W-L-D</span>
      <span class="hidden w-[58px] flex-none text-right @min-[640px]:block">Win%</span>
      <span class="w-15.5 flex-none text-right @min-[640px]:w-[78px]">Rating</span>
      <span class="w-10 flex-none text-right @min-[640px]:w-11">Δ</span>
    </div>

    <TransitionGroup tag="div" name="row">
      <PlayerRow
        v-for="row in rows"
        :key="row.playerId"
        :player-id="row.playerId"
        :rank="row.rank"
        :name="row.name"
        :wins="row.wins"
        :losses="row.losses"
        :draws="row.draws"
        :win-pct="row.winPct"
        :rating="row.rating"
        :delta="row.deltaSinceLastSession"
        :form="row.form"
        :games-played="row.gamesPlayed"
        :is-provisional="row.isProvisional"
        :provisional-games="provisionalGames"
        :highlight="recentMoves.get(row.playerId)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* FLIP row reorder (DESIGN-SPEC.md's Motion §3.2) — Vue's TransitionGroup handles the
   measure/invert/play mechanics; this is just the "play" transition. */
.row-move {
  transition: transform 300ms ease;
}
</style>
