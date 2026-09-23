<script setup lang="ts">
// The desktop leaderboard's right column (DESIGN-SPEC.md §6 "Turn 4 revisions", 4a): the last five
// matches across all sessions, replacing 3a's docked Record form. Each card: `time · session`, an
// UPSET chip when the underdog won, then home name · score · away name with each name's delta
// under it (winner 700 text-primary, loser 500 text-secondary; both 600 on a draw). A match just
// recorded slides in at the top with a green wash for the same ~4s as the table's row tints.
// Cards are read-only. Admins get a ghost "Record match" button at the bottom.
import { computed } from 'vue'
import DeltaBadge from '@/components/DeltaBadge.vue'
import KeyHint from '@/components/KeyHint.vue'
import { useNow } from '@/composables/useNow'
import { useRecordLauncher } from '@/features/record-match/useRecordLauncher'
import { formatPlayedAt } from '@/lib/played-at'
import { useIsAdmin } from '@/queries/useCurrentUser'
import { LATEST_COUNT, useLatestMatches, type LatestMatch } from '@/queries/useLatestMatches'
import { latestNameClass as nameClass } from './latestCard'
import { useHighlightedMatch } from './useRecentMoves'

const { data: matches, isPending, isError } = useLatestMatches()
const highlightedMatch = useHighlightedMatch()
const isAdmin = useIsAdmin()
const { openRecord } = useRecordLauncher()
const now = useNow()

function when(match: LatestMatch): string {
  const played = new Date(match.playedAt)
  const time =
    now.value - played.getTime() < 60_000
      ? 'just now'
      : formatPlayedAt(match.playedAt, new Date(now.value))
  return match.sessionName ? `${time} · ${match.sessionName}` : time
}

const cards = computed(() => matches.value ?? [])
</script>

<template>
  <aside
    aria-label="Latest matches"
    class="flex h-full w-105 flex-none flex-col gap-2.5 border-l border-border-nav bg-bg-panel px-6 pt-7.5 pb-6"
  >
    <header class="flex items-baseline justify-between pb-1">
      <!-- <h2 class="text-lg font-medium text-text-primary">Latest</h2> -->
      <span class="font-mono text-[10px] tracking-[0.14em] text-text-faint"
        >LAST {{ LATEST_COUNT }} · ALL SESSIONS</span
      >
    </header>

    <p v-if="isPending" class="font-mono text-xs text-text-muted">Loading…</p>
    <p v-else-if="isError" class="font-mono text-xs text-text-down">
      Couldn't load the latest matches.
    </p>
    <p v-else-if="cards.length === 0" class="font-mono text-xs text-text-muted">No matches yet.</p>

    <TransitionGroup
      tag="ol"
      class="flex min-h-0 flex-col gap-2.5 overflow-y-auto"
      enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
      enter-from-class="-translate-y-2 opacity-0"
      move-class="transition-transform duration-300 ease-out motion-reduce:transition-none"
    >
      <!-- The just-recorded wash is an overlay that fades by opacity. Transitioning the card's own
           colours instead also animated every theme toggle, flashing the old theme's colours. -->
      <li
        v-for="match in cards"
        :key="match.id"
        class="relative isolate flex flex-col gap-2 rounded-[14px] border border-border-default bg-bg-raised px-4 py-3.5"
      >
        <span
          aria-hidden="true"
          class="pointer-events-none absolute -inset-px -z-10 rounded-[inherit] border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.07)] transition-opacity duration-700 motion-reduce:transition-none"
          :class="highlightedMatch === match.id ? 'opacity-100' : 'opacity-0'"
        />
        <div class="flex items-center justify-between gap-2">
          <span class="truncate font-mono text-[11px] text-text-muted">{{ when(match) }}</span>
          <span
            v-if="match.upset"
            class="flex-none rounded bg-accent-up px-1.75 py-0.5 font-mono text-[9px] font-bold tracking-[0.16em] text-accent-up-ink"
          >
            UPSET
          </span>
        </div>
        <div class="flex items-start justify-between gap-2.5">
          <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="truncate text-[17px]" :class="nameClass(match, 'home')">{{
              match.home.name
            }}</span>
            <DeltaBadge :value="match.home.delta" class="text-[11px]" />
          </div>
          <span
            class="flex-none font-mono text-[26px] leading-none font-bold tracking-[-0.03em] text-text-primary tabular-nums"
          >
            {{ match.home.score }}–{{ match.away.score }}
          </span>
          <div class="flex min-w-0 flex-1 flex-col items-end gap-0.5">
            <span class="max-w-full truncate text-[17px]" :class="nameClass(match, 'away')">{{
              match.away.name
            }}</span>
            <DeltaBadge :value="match.away.delta" class="text-[11px]" />
          </div>
        </div>
      </li>
    </TransitionGroup>

    <button
      v-if="isAdmin"
      type="button"
      class="mt-auto flex h-12 flex-none items-center justify-center gap-2.5 rounded-2xl border border-border-default text-[15px] font-semibold text-text-emphasis hover:bg-bg-raised"
      aria-keyshortcuts="R"
      @click="openRecord()"
    >
      Record match
      <KeyHint>R</KeyHint>
    </button>
  </aside>
</template>
