<script setup lang="ts">
// design-spec.md §4 screen anatomy: title + summary line, live-session banner (only when one is
// open), column header row (1a only), player rows. Rows, not cards — nothing competes with the
// rating number. The summary line replaced the spec's "config · mean" line (Denis, 2026-09-19): in
// Elo the mean sits near the baseline by construction, so it told players nothing. It says how much
// has been played and how recently — who leads is already the first row right below it.
import { computed } from 'vue'
import { useNow } from '@/composables/useNow'
import { useLeaderboard } from '@/queries/useLeaderboard'
import LiveSessionBanner from './LiveSessionBanner.vue'
import PlayerRow from './PlayerRow.vue'
import { leaderboardSummary } from './summary'

const { data, isPending, isError } = useLeaderboard()
const now = useNow()

const summary = computed(() =>
  data.value
    ? leaderboardSummary({
        totalMatches: data.value.totalMatches,
        lastMatchAt: data.value.lastMatchAt,
        now: new Date(now.value),
      })
    : '',
)
</script>

<template>
  <section class="flex h-full flex-none flex-col pb-6 *:shrink-0">
    <header class="px-5 pt-6 pb-4">
      <h1 class="text-2xl font-bold tracking-[-0.02em] text-text-primary">Leaderboard</h1>
      <p v-if="data" class="mt-1 font-mono text-xs text-text-muted">
        {{ summary }}
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
          :player-id="row.playerId"
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
          :provisional-games="data.ratingConfig.provisionalGames"
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
