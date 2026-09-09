<script setup lang="ts">
// design-spec.md §4 screen anatomy: title + config/mean line + match count, live-session banner
// (only when one is open), column header row (1a only), player rows. Rows, not cards — nothing
// competes with the rating number.
import { useLeaderboard } from '@/queries/useLeaderboard'
import LiveSessionBanner from './LiveSessionBanner.vue'
import PlayerRow from './PlayerRow.vue'

const { data, isPending, isError } = useLeaderboard()
</script>

<template>
  <section class="flex flex-1 flex-col pb-6">
    <header class="px-5 pt-6 pb-4">
      <h1 class="text-2xl font-bold tracking-[-0.02em] text-text-primary">Leaderboard</h1>
      <p v-if="data" class="mt-1 font-mono text-xs text-text-muted">
        default-elo · mean {{ Math.round(data.meanRating) }} · {{ data.totalMatches }} matches
      </p>
    </header>

    <LiveSessionBanner
      v-if="data?.currentSession"
      :session-name="data.currentSession.name"
      :started-at="data.currentSession.startedAt"
      :match-count="data.currentSession.matchCount"
      :biggest-mover="data.currentSession.biggestMover"
    />

    <div v-if="isPending" class="px-5 py-10 text-center font-mono text-sm text-text-muted">
      Loading…
    </div>
    <div v-else-if="isError" class="px-5 py-10 text-center font-mono text-sm text-accent-down">
      Couldn't load the leaderboard.
    </div>
    <template v-else-if="data">
      <div
        class="flex items-center gap-2.75 px-5 pb-2 font-mono text-[10px] font-semibold tracking-[0.14em] text-text-faint uppercase"
      >
        <span class="w-3.75 flex-none text-right">#</span>
        <span class="w-8 flex-none" />
        <span class="flex-1">Player</span>
        <span class="w-15.5 flex-none text-right">Rating</span>
        <span class="w-10 flex-none text-right">Δ</span>
      </div>

      <TransitionGroup tag="div" name="row">
        <PlayerRow
          v-for="row in data.rows"
          :key="row.playerId"
          :rank="row.rank"
          :name="row.name"
          :wins="row.wins"
          :losses="row.losses"
          :draws="row.draws"
          :rating="row.rating"
          :delta="row.deltaSinceLastSession"
          :form="row.form"
          :games-played="row.gamesPlayed"
          :is-provisional="row.isProvisional"
        />
      </TransitionGroup>
    </template>
  </section>
</template>

<style scoped>
/* FLIP row reorder (design-spec.md's Motion §3.2) — Vue's TransitionGroup handles the
   measure/invert/play mechanics; this is just the "play" transition. */
.row-move {
  transition: transform 300ms ease;
}
</style>
