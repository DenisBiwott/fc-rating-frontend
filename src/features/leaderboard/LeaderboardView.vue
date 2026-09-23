<script setup lang="ts">
// DESIGN-SPEC.md §4 screen anatomy: title + summary line, live-session banner (only when one is
// open), column header row, player rows. Rows, not cards — nothing competes with the rating
// number. The summary line replaced the spec's "config · mean" line (Denis, 2026-09-19): in Elo the
// mean sits near the baseline by construction, so it told players nothing. It says how much has
// been played and how recently — who leads is already the first row right below it.
//
// Desktop (§6, 3a): the table column plus, for admins, the Record panel docked on the right.
// The table column picks its own columns from its measured width (columns.ts); if even the leanest
// table doesn't fit (1024px with the panel docked), it shows the compact list instead.
import { computed, ref } from 'vue'
import { useIsDesktop } from '@/composables/useBreakpoint'
import { useElementWidth } from '@/composables/useElementWidth'
import { useNow } from '@/composables/useNow'
import RecordMatchForm from '@/features/record-match/RecordMatchForm.vue'
import { useIsAdmin } from '@/queries/useCurrentUser'
import { useLeaderboard } from '@/queries/useLeaderboard'
import { columnsForWidth } from './columns'
import LeaderboardList from './LeaderboardList.vue'
import LeaderboardTable from './LeaderboardTable.vue'
import LiveSessionBanner from './LiveSessionBanner.vue'
import { leaderboardSummary } from './summary'

const { data, isPending, isError } = useLeaderboard()
const now = useNow()
const isDesktop = useIsDesktop()
const isAdmin = useIsAdmin()

const summary = computed(() =>
  data.value
    ? leaderboardSummary({
        totalMatches: data.value.totalMatches,
        lastMatchAt: data.value.lastMatchAt,
        now: new Date(now.value),
      })
    : '',
)

const tableColumn = ref<HTMLElement | null>(null)
const tableWidth = useElementWidth(tableColumn)
const tableColumns = computed(() => columnsForWidth(tableWidth.value))
</script>

<template>
  <section class="flex h-full flex-none flex-col *:shrink-0" :class="isDesktop ? '' : 'pb-6'">
    <div v-if="isDesktop" class="flex h-full">
      <div ref="tableColumn" class="flex min-w-0 flex-1 flex-col overflow-y-auto *:shrink-0">
        <!-- Wraps the session pill under the title when the column is narrow (panel docked at
             1024px) rather than squeezing the summary line onto three lines. -->
        <header class="flex flex-wrap items-end justify-between gap-x-5 gap-y-3 px-7 pt-7.5 pb-5">
          <div class="min-w-0">
            <h1 class="text-[30px] font-bold tracking-[-0.02em] text-text-primary">Leaderboard</h1>
            <p v-if="data" class="mt-0.75 font-mono text-[13px] whitespace-nowrap text-text-muted">{{ summary }}</p>
          </div>
          <LiveSessionBanner
            v-if="data?.currentSession"
            compact
            :session-name="data.currentSession.name"
            :started-at="data.currentSession.startedAt"
            :match-count="data.currentSession.matchCount"
            :biggest-mover="data.currentSession.biggestMover"
          />
        </header>
        <div v-if="isPending" class="px-7 py-10 font-mono text-sm text-text-muted">Loading…</div>
        <div v-else-if="isError" class="px-7 py-10 font-mono text-sm text-accent-down">
          Couldn't load the leaderboard.
        </div>
        <template v-else-if="data">
          <LeaderboardTable
            v-if="tableColumns"
            :rows="data.rows"
            :columns="tableColumns"
            :provisional-games="data.ratingConfig.provisionalGames"
          />
          <LeaderboardList v-else :rows="data.rows" :provisional-games="data.ratingConfig.provisionalGames" />
        </template>
      </div>

      <!-- Admin only: anonymous visitors get the table at full width (Turn 3 decision). `relative`
           here, not on the scrolling form, so the result overlay stays put (RecordMatchForm). -->
      <aside
        v-if="isAdmin"
        aria-label="Record match"
        class="relative w-105 flex-none overflow-hidden border-l border-border-nav"
      >
        <RecordMatchForm variant="panel" />
      </aside>
    </div>

    <template v-else>
      <header class="px-5 pt-6 pb-4 sm:px-8 sm:pt-8.5">
        <h1 class="text-2xl font-bold tracking-[-0.02em] text-text-primary sm:text-[30px]">Leaderboard</h1>
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
      <LeaderboardList v-else-if="data" :rows="data.rows" :provisional-games="data.ratingConfig.provisionalGames" />
    </template>
  </section>
</template>
