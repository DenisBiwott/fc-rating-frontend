<script setup lang="ts">
// DESIGN-SPEC.md §4: "Record match — status bar, Cancel | Record match | session name bar,
// Home/Away slots + swap, player grid, score steppers, preview line, Went to penalties link,
// Confirm. One scrolling card, no wizard, no modal, no login."
// Full-screen (route meta `fullscreen`: no AccountBar/BottomNav), with Confirm pinned in a footer —
// the nav's green Record FAB used to outshine a Confirm that could sit below the fold.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentSession } from '@/queries/useCurrentSession'
import { useLeaderboard } from '@/queries/useLeaderboard'
import { useRecentlyPlayedPlayers } from '@/queries/useRecentlyPlayedPlayers'
import MatchSlot from './MatchSlot.vue'
import PlayerGrid from './PlayerGrid.vue'
import PreviewLine from './PreviewLine.vue'
import ResultOverlay from './ResultOverlay.vue'
import ScoreStepper from './ScoreStepper.vue'
import { useRecordMatchForm } from './useRecordMatchForm'

const router = useRouter()
const form = useRecordMatchForm()
const { data: session } = useCurrentSession()
const { data: recentPlayers, isPending: playersPending } = useRecentlyPlayedPlayers()
const { data: leaderboard } = useLeaderboard()

const ratingByPlayerId = computed(() => {
  const map = new Map<string, number>()
  for (const row of leaderboard.value?.rows ?? []) map.set(row.playerId, row.rating)
  return map
})
const nameByPlayerId = computed(() => {
  const map = new Map<string, string>()
  for (const p of recentPlayers.value ?? []) map.set(p.id, p.name)
  return map
})

const homeName = computed(() => (form.homePlayerId.value ? (nameByPlayerId.value.get(form.homePlayerId.value) ?? null) : null))
const awayName = computed(() => (form.awayPlayerId.value ? (nameByPlayerId.value.get(form.awayPlayerId.value) ?? null) : null))
const homeRating = computed(() => (form.homePlayerId.value ? (ratingByPlayerId.value.get(form.homePlayerId.value) ?? null) : null))
const awayRating = computed(() => (form.awayPlayerId.value ? (ratingByPlayerId.value.get(form.awayPlayerId.value) ?? null) : null))

const selectedIds = computed(() =>
  [form.homePlayerId.value, form.awayPlayerId.value].filter((id): id is string => id !== null),
)

const canCancel = computed(() => form.state.value === 'selecting' || form.state.value === 'scoring')

function goToLeaderboard(): void {
  void router.push({ name: 'leaderboard' })
}

function handleDone(): void {
  form.done()
  goToLeaderboard()
}
</script>

<template>
  <section class="flex h-full flex-none flex-col *:shrink-0">
    <header class="flex items-center justify-between px-5 py-4">
      <button
        type="button"
        class="text-sm text-text-secondary disabled:opacity-40"
        :disabled="!canCancel"
        @click="goToLeaderboard"
      >
        Cancel
      </button>
      <span class="text-base font-bold text-text-primary">Record match</span>
      <span class="font-mono text-xs text-text-muted">{{ session?.name ?? '' }}</span>
    </header>

    <div class="flex items-center gap-3 px-5 pb-4">
      <MatchSlot label="HOME" :name="homeName" :rating="homeRating" @clear="form.clearSlot('home')" />
      <div class="flex w-11 flex-none flex-col items-center gap-1">
        <span class="text-xs text-text-faint">vs</span>
        <button
          type="button"
          class="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-border-default bg-bg-raised text-sm text-text-secondary"
          aria-label="Swap sides"
          @click="form.swapSides()"
        >
          ⇄
        </button>
      </div>
      <MatchSlot label="AWAY" :name="awayName" :rating="awayRating" @clear="form.clearSlot('away')" />
    </div>

    <PlayerGrid
      v-if="!playersPending"
      :players="recentPlayers ?? []"
      :selected-ids="selectedIds"
      @select="form.selectPlayer($event)"
    />

    <template v-if="form.state.value !== 'selecting'">
      <ScoreStepper
        :home-score="form.homeScore.value"
        :away-score="form.awayScore.value"
        class="mt-3"
        @increment-home="form.incrementScore('home')"
        @decrement-home="form.decrementScore('home')"
        @increment-away="form.incrementScore('away')"
        @decrement-away="form.decrementScore('away')"
        @set-home="form.setScore('home', $event)"
        @set-away="form.setScore('away', $event)"
      />

      <PreviewLine
        class="mt-3"
        :outcome="form.lastOutcome.value"
        :pending="form.preview.isPending.value"
      />

      <button
        type="button"
        class="mx-5 mt-1 mb-4 text-center text-xs text-text-muted underline"
        @click="form.decidedOnPenalties.value = !form.decidedOnPenalties.value"
      >
        {{ form.decidedOnPenalties.value ? 'Went to penalties ✓' : 'Went to penalties' }}
      </button>

    </template>

    <!-- Pinned to the bottom of this scroll container (the view root) so Confirm is always on
         screen, however far the form scrolls. Always rendered, disabled until both players are
         picked, so the layout never jumps and the goal is visible from the first tap. mt-auto
         keeps it at the bottom when the form is shorter than the viewport. -->
    <footer class="sticky bottom-0 mt-auto flex flex-col gap-3 border-t border-border-hairline bg-bg-canvas px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <p v-if="form.submitError.value" role="alert" class="text-sm text-accent-down">
        {{ form.submitError.value }} — <button type="button" class="underline" @click="form.submit()">Retry</button>
      </p>
      <button
        type="button"
        class="h-14 rounded-2xl bg-accent-up text-[17px] font-bold text-accent-up-ink shadow-[0_12px_30px_-12px_rgba(52,211,153,0.6)] disabled:opacity-50 disabled:shadow-none"
        :disabled="!form.isValid.value || form.state.value === 'submitting'"
        @click="form.submit()"
      >
        {{ form.state.value === 'submitting' ? 'Recording…' : 'Confirm result' }}
      </button>
    </footer>

    <ResultOverlay
      v-if="form.state.value === 'result' && form.record.data.value"
      :home-player-id="form.homePlayerId.value!"
      :away-player-id="form.awayPlayerId.value!"
      :home-name="homeName ?? ''"
      :away-name="awayName ?? ''"
      :home-score="form.record.data.value.match.homeScore"
      :away-score="form.record.data.value.match.awayScore"
      :home-outcome="form.record.data.value.outcome.home"
      :away-outcome="form.record.data.value.outcome.away"
      :upset="form.record.data.value.outcome.upset"
      :rank-changes="form.record.data.value.rankChanges"
      :session-context="form.resultSession.value"
      @record-another="form.recordAnother()"
      @done="handleDone"
    />
  </section>
</template>
