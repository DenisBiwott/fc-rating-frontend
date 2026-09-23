<script setup lang="ts">
// TV mode (DESIGN-SPEC.md §6 "TV mode", 3e): the standings read from the sofa. No chrome, a fixed
// 1440×810 stage scaled to the screen, standings on the left, the last 3 results on the right.
// A cheap probe checks for changes every 10s, less often after a long quiet spell
// (useTvPolling). Rows whose rating changed FLIP, tint and show ▲/▼ for ~4s, like the desktop
// leaderboard after a recorded match; here the change is found by comparing successive
// standings (useTvHighlights), since the match was recorded on another device.
//
// Decisions (Denis, 2026-09-23): unrated players are hidden; rows shrink to fit everyone before
// the list cuts off (tvLayout.ts); the header shows "N matches · last HH:MM" rather than the
// session's elapsed time, which reads in weeks for this group's one long-lived session.
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useNow } from '@/composables/useNow'
import { formatPlayedAt } from '@/lib/played-at'
import { leaderboardQueryOptions } from '@/queries/useLeaderboard'
import { latestMatchesQueryOptions, type LatestMatch } from '@/queries/useLatestMatches'
import TvLatestCard from './TvLatestCard.vue'
import TvStandingsRow from './TvStandingsRow.vue'
import { fitRows, MORE_LINE, STAGE_HEIGHT, STAGE_WIDTH } from './tvLayout'
import { useTvHighlights } from './useTvHighlights'
import { useTvPolling } from './useTvPolling'
import { useTvScreen } from './useTvScreen'

const LATEST_ON_TV = 3

// These don't poll themselves: useTvPolling refetches them when its probe sees a change.
const board = useQuery(leaderboardQueryOptions)
const latest = useQuery(latestMatchesQueryOptions)
const { probeFailing } = useTvPolling()

const { scale } = useTvScreen()
const now = useNow(10_000)

const standings = computed(() => board.data.value?.rows.filter((row) => row.gamesPlayed > 0))
const fit = computed(() => fitRows(standings.value?.length ?? 0))
const visibleRows = computed(() => standings.value?.slice(0, fit.value.visible) ?? [])
const latestCards = computed(() => latest.data.value?.slice(0, LATEST_ON_TV) ?? [])

const { rowHighlights, matchHighlights } = useTvHighlights(standings, latest.data)

const title = computed(() => board.data.value?.currentSession?.name ?? 'Leaderboard')
const meta = computed(() => {
  const data = board.data.value
  if (!data) return ''
  const count = data.currentSession?.matchCount ?? data.totalMatches
  const matches = `${count} ${count === 1 ? 'match' : 'matches'}`
  return data.lastMatchAt
    ? `${matches} · last ${formatPlayedAt(data.lastMatchAt, new Date(now.value))}`
    : matches
})

function when(match: LatestMatch): string {
  return now.value - new Date(match.playedAt).getTime() < 60_000
    ? 'just now'
    : formatPlayedAt(match.playedAt, new Date(now.value))
}
</script>

<template>
  <section class="relative" aria-label="TV mode">
    <div class="absolute inset-0 overflow-hidden bg-bg-canvas">
      <div
        class="absolute top-1/2 left-1/2 flex flex-col gap-6.5 px-14 py-10"
        :style="{
          width: `${STAGE_WIDTH}px`,
          height: `${STAGE_HEIGHT}px`,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }"
      >
        <header class="flex h-9.5 flex-none items-center justify-between">
          <div class="flex min-w-0 items-center gap-4">
            <span
              v-if="board.data.value?.currentSession"
              aria-hidden="true"
              class="h-3 w-3 flex-none rounded-full bg-accent-up shadow-[0_0_0_6px_rgba(52,211,153,0.16)]"
            />
            <h1 class="truncate text-[30px] font-bold tracking-[-0.01em] text-text-primary">{{ title }}</h1>
            <span class="font-mono text-base whitespace-nowrap text-text-muted">{{ meta }}</span>
          </div>
          <div class="flex flex-none items-center gap-4">
            <!-- A failed check keeps the last good standings on screen; this just says they may be old. -->
            <span v-if="(probeFailing || board.isError.value) && board.data.value" class="font-mono text-sm text-text-muted"
              >Reconnecting…</span
            >
            <span class="rounded-md border border-border-default px-2 py-0.75 font-mono text-xs text-text-faint"
              >esc to exit</span
            >
          </div>
        </header>

        <div class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_400px] gap-10">
          <div class="min-h-0">
            <p v-if="board.isPending.value" class="font-mono text-lg text-text-muted">Loading…</p>
            <p v-else-if="!board.data.value" class="font-mono text-lg text-text-down">
              Couldn't load the standings.
            </p>
            <p v-else-if="visibleRows.length === 0" class="font-mono text-lg text-text-muted">No matches yet.</p>
            <TransitionGroup v-else tag="ol" name="row" aria-label="Standings">
              <TvStandingsRow
                v-for="row in visibleRows"
                :key="row.playerId"
                :row="row"
                :height="fit.rowHeight"
                :provisional-games="board.data.value.ratingConfig.provisionalGames"
                :highlight="rowHighlights.get(row.playerId)"
              />
              <li
                v-if="fit.hidden > 0"
                key="more"
                class="flex items-center border-t border-border-hairline px-4 font-mono text-base text-text-faint"
                :style="{ height: `${MORE_LINE}px` }"
              >
                +{{ fit.hidden }} more
              </li>
            </TransitionGroup>
          </div>

          <aside aria-label="Latest matches" class="flex min-h-0 flex-col gap-3.5">
            <span class="font-mono text-[13px] tracking-[0.16em] text-text-muted">LATEST</span>
            <p v-if="latest.isPending.value" class="font-mono text-base text-text-muted">Loading…</p>
            <p v-else-if="latestCards.length === 0 && !latest.isError.value" class="font-mono text-base text-text-muted">
              No matches yet.
            </p>
            <TransitionGroup
              tag="ol"
              class="flex flex-col gap-3.5"
              enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
              enter-from-class="-translate-y-2 opacity-0"
              move-class="transition-transform duration-300 ease-out motion-reduce:transition-none"
            >
              <TvLatestCard
                v-for="match in latestCards"
                :key="match.id"
                :match="match"
                :when="when(match)"
                :highlighted="matchHighlights.has(match.id)"
              />
            </TransitionGroup>
          </aside>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Same FLIP reorder as the desktop table (DESIGN-SPEC.md §3). */
.row-move {
  transition: transform 300ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .row-move {
    transition: none;
  }
}
</style>
