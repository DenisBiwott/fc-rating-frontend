<script setup lang="ts">
// The record-match form, one component for both places it lives (DESIGN-SPEC.md §4 and §6):
//   - `screen`: the full-screen /record route on phones and tablets. Cancel | Record match |
//     session header, 5-column "Recently played" grid; Cancel and Done leave via `exit`.
//   - `panel`: the desktop Record drawer (4b, RecordDrawer). "Record match" with the session and an
//     esc chip on the right, a 4-column "All players · recent first" grid, the next slot to fill
//     highlighted. After Confirm the result plays for ~1.5s, then `done` closes the drawer.
// Both: one scrolling card, no wizard, no login, Confirm pinned in a footer so it's always on
// screen and the only green button in view.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import KeyHint from '@/components/KeyHint.vue'
import { useCurrentSession } from '@/queries/useCurrentSession'
import { useLeaderboard } from '@/queries/useLeaderboard'
import { useRecentlyPlayedPlayers } from '@/queries/useRecentlyPlayedPlayers'
import MatchSlot from './MatchSlot.vue'
import PlayerFilter, { type FilterPlayerInfo } from './PlayerFilter.vue'
import PlayerGrid from './PlayerGrid.vue'
import { orderForPicker } from './playerPicker'
import PreviewLine from './PreviewLine.vue'
import { handleRecordKeydown } from './recordKeyboard'
import ResultOverlay from './ResultOverlay.vue'
import ScoreStepper from './ScoreStepper.vue'
import { flashRecordedMatch } from '@/features/leaderboard/useRecentMoves'
import { useRecordLauncher } from './useRecordLauncher'
import { useRecordMatchForm } from './useRecordMatchForm'

const props = withDefaults(
  defineProps<{
    variant?: 'screen' | 'panel'
    initialHomePlayerId?: string | null
  }>(),
  { variant: 'screen', initialHomePlayerId: null },
)
const emit = defineEmits<{ exit: []; done: [] }>()

const form = useRecordMatchForm()
const { data: session } = useCurrentSession()
const { data: players, isPending: playersPending } = useRecentlyPlayedPlayers()
const { data: leaderboard } = useLeaderboard()
const isPanel = computed(() => props.variant === 'panel')

const ratingByPlayerId = computed(() => {
  const map = new Map<string, number>()
  for (const row of leaderboard.value?.rows ?? []) map.set(row.playerId, row.rating)
  return map
})
// "Tonight, then recent" (playerPicker.ts): the grid's first two rows and the filter's order.
const orderedPlayers = computed(() => orderForPicker(players.value ?? []))
// The filter rows' rating and PROV/UNRATED badge, from the leaderboard.
const infoByPlayerId = computed(() => {
  const map = new Map<string, FilterPlayerInfo>()
  const provisionalGames = leaderboard.value?.ratingConfig.provisionalGames ?? 0
  for (const row of leaderboard.value?.rows ?? []) {
    const badge =
      row.gamesPlayed === 0 ? 'UNRATED' : row.isProvisional ? `PROV ${row.gamesPlayed}/${provisionalGames}` : null
    map.set(row.playerId, { rating: row.rating, badge })
  }
  return map
})
const nameByPlayerId = computed(() => {
  const map = new Map<string, string>()
  for (const p of players.value ?? []) map.set(p.id, p.name)
  return map
})

const homeName = computed(() => (form.homePlayerId.value ? (nameByPlayerId.value.get(form.homePlayerId.value) ?? null) : null))
const awayName = computed(() => (form.awayPlayerId.value ? (nameByPlayerId.value.get(form.awayPlayerId.value) ?? null) : null))
const homeRating = computed(() => (form.homePlayerId.value ? (ratingByPlayerId.value.get(form.homePlayerId.value) ?? null) : null))
const awayRating = computed(() => (form.awayPlayerId.value ? (ratingByPlayerId.value.get(form.awayPlayerId.value) ?? null) : null))

const selectedIds = computed(() =>
  [form.homePlayerId.value, form.awayPlayerId.value].filter((id): id is string => id !== null),
)
// The active slot — the one a pick fills, and whose score ↑/↓ adjusts — highlighted in the panel
// (3a's "Home slot focused"), while selecting and scoring.
const highlightedSlot = computed(() =>
  form.state.value === 'selecting' || form.state.value === 'scoring' ? form.activeSide.value : null,
)

const canCancel = computed(() => form.state.value === 'selecting' || form.state.value === 'scoring')

// Pre-fill Home: from the /record route's ?home= on phones, or from the launcher on desktop (the
// rail's Record button, "Record with {name}", or /record redirected to the drawer).
const launcher = useRecordLauncher()
const root = ref<HTMLElement | null>(null)

function prefillHome(playerId: string): void {
  form.reset()
  form.selectPlayer(playerId)
}

// Move focus into the drawer, onto the first pickable player (where the next pick goes). An empty
// slot is a disabled button and can't take focus. On the first open the players are still loading,
// so there's no tile yet: focus the first one once they arrive.
let focusWhenLoaded = false
function focusFirstPlayer(): void {
  const tile = root.value?.querySelector<HTMLElement>('button[aria-label^="Select "]:not([disabled])')
  focusWhenLoaded = !tile
  tile?.focus()
}
watch(playersPending, async (pending) => {
  if (pending || !focusWhenLoaded) return
  await nextTick()
  focusFirstPlayer()
})

function applyLauncherRequest(): void {
  if (!isPanel.value) return
  const home = launcher.takePendingHome()
  if (home) prefillHome(home)
  focusFirstPlayer()
}

// The name filter (4c/4d) replaces the grid while open: from the All tile, or in the drawer from
// typing any letter. It only makes sense while a slot is empty, so it closes once both are filled.
const filterOpen = ref(false)
const filterInitial = ref('')
function openFilter(initial = ''): void {
  if (form.state.value !== 'selecting') return
  filterInitial.value = initial
  filterOpen.value = true
}
function pickFromFilter(playerId: string): void {
  form.selectPlayer(playerId)
  filterOpen.value = false
}
function closeFilter(): void {
  filterOpen.value = false
  if (isPanel.value) void nextTick(focusFirstPlayer)
}
watch(
  () => form.state.value,
  (state) => {
    if (state !== 'selecting') filterOpen.value = false
  },
)
// Phones: while filtering, the slots shrink to one line and the stepper and Confirm step aside so
// the list sits between the slots and the on-screen keyboard (4d).
const phoneFiltering = computed(() => filterOpen.value && !isPanel.value)

// Desktop keyboard (recordKeyboard.ts). Panel only; a phone has no keyboard to speak of. Esc is
// left to the drawer, which closes (or, in the filter's field, back to the grid).
function onKeydown(event: KeyboardEvent): void {
  if (!isPanel.value || !root.value || filterOpen.value) return
  handleRecordKeydown(event, { form, root: root.value, openFilter })
}

// A picked tile becomes disabled, and a disabled element drops focus to <body>; picking from the
// name filter removes its field, and reka's focus trap then parks focus on the drawer itself. Either
// way keyboard input would leave the form. Keep focus in it: on the next pickable player while
// selecting, on Confirm once both players are in (so ↵ confirms and ↑/↓ still reach the form).
const confirmButton = ref<HTMLButtonElement | null>(null)
watch(selectedIds, async () => {
  if (!isPanel.value) return
  await nextTick()
  const focused = document.activeElement
  const lost =
    !focused ||
    !root.value?.contains(focused) ||
    (focused instanceof HTMLButtonElement && focused.disabled)
  if (!lost) return
  if (form.state.value === 'scoring') confirmButton.value?.focus()
  else focusFirstPlayer()
})

onMounted(() => {
  if (props.initialHomePlayerId) prefillHome(props.initialHomePlayerId)
  applyLauncherRequest()
})
watch(launcher.focusRequests, applyLauncherRequest)

// Each newly recorded match marks its two players on the leaderboard, and its LATEST card, for a
// few seconds (3b, 4a). In the drawer that waits until the drawer closes, since the scrim would
// hide most of it; on a phone it fires straight away (and has usually faded by the time the
// leaderboard is back on screen, which is fine — it's a desktop-console cue).
let flashedMatchId: string | null = null
function flashResult(): void {
  const data = form.record.data.value
  if (!data || flashedMatchId === data.match.id) return
  flashedMatchId = data.match.id
  flashRecordedMatch(data.match.id, data.outcome, data.rankChanges)
}
watch(
  () => form.record.data.value,
  (data) => {
    if (data && !isPanel.value) flashResult()
  },
)

// Drawer (4b): the result plays for ~1.5s, then the drawer closes on its own. Esc or a click on the
// result closes it sooner, and so does the drawer's own Esc/scrim close, which unmounts this form.
const RESULT_LINGER_MS = 1500
let lingerTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => form.state.value,
  (state) => {
    if (isPanel.value && state === 'result') lingerTimer = setTimeout(handleDone, RESULT_LINGER_MS)
  },
)
onBeforeUnmount(() => {
  clearTimeout(lingerTimer)
  if (isPanel.value && form.state.value === 'result') flashResult()
})

function handleDone(): void {
  if (isPanel.value) {
    clearTimeout(lingerTimer)
    flashResult()
    form.reset()
    emit('done')
  } else {
    form.done()
    emit('exit')
  }
}

const sessionLabel = computed(() => session.value?.name ?? '')
</script>

<template>
  <!-- Deliberately not `relative`: this root scrolls, and ResultOverlay (absolute inset-0) must be
       positioned against the non-scrolling box around it (the shell's main column, or the
       panel/drawer wrapper), or it would scroll away with the form. -->
  <section
    ref="root"
    data-record-form
    tabindex="-1"
    class="flex h-full flex-none flex-col overflow-y-auto *:shrink-0 focus:outline-none"
    :class="isPanel ? 'bg-bg-drawer px-1 pt-6' : ''"
    @keydown="onKeydown"
  >
    <header v-if="isPanel" class="flex items-center justify-between gap-3 px-5 pb-4">
      <h2 class="text-lg font-bold text-text-primary">Record match</h2>
      <div class="flex min-w-0 items-center gap-3">
        <span class="truncate font-mono text-[11px] text-text-up-bright uppercase">{{ sessionLabel }}</span>
        <KeyHint>esc</KeyHint>
      </div>
    </header>
    <header v-else class="flex items-center justify-between px-5 py-4">
      <button
        type="button"
        class="text-sm text-text-secondary disabled:opacity-40"
        :disabled="!canCancel"
        @click="emit('exit')"
      >
        Cancel
      </button>
      <span class="text-base font-bold text-text-primary">Record match</span>
      <span class="font-mono text-xs text-text-muted">{{ sessionLabel }}</span>
    </header>

    <div class="flex items-center gap-3 px-5 pb-4">
      <MatchSlot
        label="HOME"
        :name="homeName"
        :rating="homeRating"
        :focused="(isPanel || filterOpen) && highlightedSlot === 'home'"
        :compact="phoneFiltering"
        @clear="form.clearSlot('home')"
      />
      <div v-if="!phoneFiltering" class="flex w-11 flex-none flex-col items-center gap-1">
        <span class="text-xs text-text-faint">vs</span>
        <button
          v-if="!filterOpen"
          type="button"
          class="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-border-default bg-bg-raised text-sm text-text-secondary"
          aria-label="Swap sides"
          @click="form.swapSides()"
        >
          ⇄
        </button>
      </div>
      <MatchSlot
        label="AWAY"
        :name="awayName"
        :rating="awayRating"
        :focused="(isPanel || filterOpen) && highlightedSlot === 'away'"
        :compact="phoneFiltering"
        @clear="form.clearSlot('away')"
      />
    </div>

    <PlayerFilter
      v-if="filterOpen"
      :players="orderedPlayers"
      :selected-ids="selectedIds"
      :info-by-id="infoByPlayerId"
      :initial-query="filterInitial"
      :panel="isPanel"
      @pick="pickFromFilter"
      @close="closeFilter"
    />
    <PlayerGrid
      v-else-if="!playersPending"
      :players="orderedPlayers"
      :selected-ids="selectedIds"
      :columns="isPanel ? 4 : 5"
      :hint="isPanel ? 'type to filter' : null"
      @select="form.selectPlayer($event)"
      @show-all="openFilter()"
    />

    <!-- Always on screen so nothing jumps when the second player lands, dimmed and inert until
         both slots are filled (4b/4c). -->
    <div
      v-if="!phoneFiltering"
      class="mt-3 transition-opacity duration-150 motion-reduce:transition-none"
      :class="form.state.value === 'selecting' ? 'pointer-events-none opacity-35' : ''"
      :inert="form.state.value === 'selecting'"
    >
      <ScoreStepper
        :home-score="form.homeScore.value"
        :away-score="form.awayScore.value"
        @increment-home="form.incrementScore('home')"
        @decrement-home="form.decrementScore('home')"
        @increment-away="form.incrementScore('away')"
        @decrement-away="form.decrementScore('away')"
        @set-home="form.setScore('home', $event)"
        @set-away="form.setScore('away', $event)"
      />
    </div>

    <template v-if="form.state.value !== 'selecting'">
      <PreviewLine class="mt-3" :outcome="form.lastOutcome.value" :pending="form.preview.isPending.value" />

      <button
        type="button"
        class="mx-5 mt-1 mb-4 text-center text-xs text-text-muted underline"
        @click="form.decidedOnPenalties.value = !form.decidedOnPenalties.value"
      >
        {{ form.decidedOnPenalties.value ? 'Went to penalties ✓' : 'Went to penalties' }}
      </button>
    </template>

    <!-- Pinned to the bottom of this scroll container so Confirm is always on screen, however far
         the form scrolls. Always rendered, disabled until both players are picked, so the layout
         never jumps and the goal is visible from the first tap. mt-auto keeps it at the bottom
         when the form is shorter than its container. -->
    <footer
      v-if="!phoneFiltering"
      class="sticky bottom-0 mt-auto flex flex-col gap-3 border-t border-border-hairline px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      :class="isPanel ? 'bg-bg-drawer' : 'bg-bg-canvas'"
    >
      <p v-if="form.submitError.value" role="alert" class="text-sm text-text-down">
        {{ form.submitError.value }} —
        <button type="button" class="underline" @click="form.submit()">Retry</button>
      </p>
      <button
        ref="confirmButton"
        type="button"
        class="flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-accent-up text-[17px] font-bold text-accent-up-ink shadow-[0_12px_30px_-12px_rgba(52,211,153,0.6)] disabled:opacity-50 disabled:shadow-none"
        :disabled="!form.isValid.value || form.state.value === 'submitting'"
        :aria-keyshortcuts="isPanel ? 'Enter' : undefined"
        @click="form.submit()"
      >
        {{ form.state.value === 'submitting' ? 'Recording…' : 'Confirm result' }}
        <KeyHint v-if="isPanel" on-green>↵</KeyHint>
      </button>
      <p v-if="isPanel" class="text-center font-mono text-[10px] text-text-faint">
        ← → side · ↑ ↓ score · ↵ confirm · esc close
      </p>
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
      :played-at="form.record.data.value.match.playedAt"
      :variant="variant"
      @record-another="form.recordAnother()"
      @done="handleDone"
    />
  </section>
</template>
