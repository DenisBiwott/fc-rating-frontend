<script setup lang="ts">
// DESIGN-SPEC.md's ResultOverlay spec: full-screen green-cast canvas (the only screen allowed a
// tinted canvas), UPSET badge, ticking ratings, rank change, then Record another / Done. Focus
// moves here on open (docs/CLAUDE.md's accessibility non-negotiable) and Escape acts like
// dismissing back to record another rather than losing the moment entirely.
// The `panel` variant (the desktop drawer, 4b) has no buttons: the form closes the drawer ~1.5s
// after it appears, and Escape or a click closes it sooner (`done`).
import { computed, onMounted, ref } from 'vue'
import AvatarTile from '@/components/AvatarTile.vue'
import DeltaBadge from '@/components/DeltaBadge.vue'
import RatingNumber from '@/components/RatingNumber.vue'

interface ParticipantOutcome {
  before: { rating: number }
  after: { rating: number }
  expectedScore: number
  actualScore: 1 | 0.5 | 0
  delta: number
}

const props = defineProps<{
  homePlayerId: string
  awayPlayerId: string
  homeName: string
  awayName: string
  homeScore: number
  awayScore: number
  homeOutcome: ParticipantOutcome
  awayOutcome: ParticipantOutcome
  upset: boolean
  rankChanges: Array<{ playerId: string; from: number; to: number }>
  sessionContext: { name: string; matchCount: number } | null
  /** When the match was recorded (the API's playedAt) — the panel header shows its time. */
  playedAt: string
  /** `screen`: phone/tablet full-screen result. `panel`: the desktop Record drawer (3b/4b) — a
   *  "Result | MATCH n · time" header, the player cards stacked full width, and no buttons. */
  variant?: 'screen' | 'panel'
}>()

const emit = defineEmits<{ recordAnother: []; done: [] }>()

const overlayRef = ref<HTMLElement | null>(null)
onMounted(() => overlayRef.value?.focus())

const isDraw = computed(() => props.homeOutcome.actualScore === 0.5)
const winnerIsHome = computed(() => props.homeOutcome.actualScore === 1)
// Winner green wash, loser coral wash (DESIGN-SPEC.md ResultOverlay); a draw has neither, so both
// cards get a neutral wash in the draw chip's grey (rgba(161,161,170,…), mode-independent like the
// other tints) rather than both reading as losers.
function cardClass(side: 'home' | 'away'): string {
  if (isDraw.value) return 'border-[rgba(161,161,170,0.24)] bg-[rgba(161,161,170,0.06)]'
  const won = side === 'home' ? winnerIsHome.value : !winnerIsHome.value
  return won
    ? 'border-[rgba(52,211,153,0.30)] bg-[rgba(52,211,153,0.07)]'
    : 'border-[rgba(244,113,89,0.24)] bg-[rgba(244,113,89,0.05)]'
}
const winnerName = computed(() => (winnerIsHome.value ? props.homeName : props.awayName))
const loserName = computed(() => (winnerIsHome.value ? props.awayName : props.homeName))
const winnerWinProb = computed(() =>
  Math.round((winnerIsHome.value ? props.homeOutcome : props.awayOutcome).expectedScore * 100),
)
const isPanel = computed(() => props.variant === 'panel')

const sides = computed(() =>
  (['home', 'away'] as const).map((side) => {
    const playerId = side === 'home' ? props.homePlayerId : props.awayPlayerId
    return {
      side,
      name: side === 'home' ? props.homeName : props.awayName,
      outcome: side === 'home' ? props.homeOutcome : props.awayOutcome,
      rankChange: props.rankChanges.find((c) => c.playerId === playerId),
    }
  }),
)

const playedTime = computed(() =>
  new Date(props.playedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
)

function handleKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  if (isPanel.value) emit('done')
  else emit('recordAnother')
}
function handleClick(): void {
  if (isPanel.value) emit('done')
}
</script>

<template>
  <div
    ref="overlayRef"
    class="absolute inset-0 z-20 flex flex-col overflow-y-auto bg-bg-result"
    :class="isPanel ? 'gap-6 px-6 pt-6.5 pb-6' : 'items-center px-5 py-8'"
    role="dialog"
    aria-live="assertive"
    aria-modal="true"
    tabindex="-1"
    @keydown="handleKeydown"
    @click="handleClick"
  >
    <header v-if="isPanel" class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-text-primary">Result</h2>
      <span class="font-mono text-[11px] text-text-result-faint uppercase">
        <template v-if="sessionContext">Match {{ sessionContext.matchCount }} · </template>{{ playedTime }}
      </span>
    </header>

    <div class="flex flex-col items-center" :class="isPanel ? 'gap-2.5 pt-4.5' : ''">
      <span
        v-if="upset"
        class="bg-accent-up font-mono font-bold text-accent-up-ink"
        :class="
          isPanel
            ? 'rounded-md px-3 py-1.25 text-[11px] tracking-[0.2em]'
            : 'mb-4 rounded-full px-3 py-1 text-xs tracking-[0.08em]'
        "
      >
        UPSET
      </span>
      <p class="font-mono text-[72px] leading-none font-bold tracking-[-0.04em] text-text-primary" :class="isPanel ? '' : 'py-3'">
        {{ homeScore }}–{{ awayScore }}
      </p>
      <p class="text-text-result-meta" :class="isPanel ? 'text-[13px]' : 'mb-6 text-base'">
        <template v-if="!isDraw">{{ winnerName }} beats {{ loserName }} · {{ winnerWinProb }}% to win</template>
        <template v-else>{{ homeName }} draws {{ awayName }}</template>
      </p>
    </div>

    <!-- Screen: two cards side by side, stacked contents. Panel (3b): full-width cards, one per row. -->
    <div class="flex w-full" :class="isPanel ? 'flex-col gap-3' : 'mb-6 max-w-xs gap-3'">
      <div
        v-for="card in sides"
        :key="card.side"
        class="flex rounded-2xl border"
        :class="[
          cardClass(card.side),
          isPanel ? 'items-center gap-3.25 p-3.75' : 'flex-1 flex-col items-center gap-1 p-3',
        ]"
      >
        <AvatarTile :name="card.name" :size="44" />
        <div :class="isPanel ? 'min-w-0 flex-1' : 'flex flex-col items-center gap-1'">
          <div class="truncate text-base text-text-primary" :class="isPanel ? 'font-semibold' : ''">{{ card.name }}</div>
          <div class="font-mono" :class="isPanel ? 'mt-0.5 text-[11px] text-text-result-meta' : 'text-xs text-text-muted'">
            {{ Math.round(card.outcome.before.rating) }} → {{ Math.round(card.outcome.after.rating) }}
            <template v-if="card.rankChange"> · rank {{ card.rankChange.from }} → {{ card.rankChange.to }}</template>
          </div>
        </div>
        <div :class="isPanel ? 'flex flex-col items-end' : 'flex items-center gap-2'">
          <RatingNumber
            :value="card.outcome.after.rating"
            class="text-[30px] leading-none font-bold tracking-[-0.03em] text-text-primary"
          />
          <DeltaBadge :value="card.outcome.delta" class="text-sm font-bold" />
        </div>
      </div>
    </div>

    <p
      v-if="sessionContext && !isPanel"
      class="mb-6 font-mono text-[10px] tracking-[0.14em] text-text-result-faint uppercase"
    >
      Match {{ sessionContext.matchCount }} of {{ sessionContext.name }}
    </p>

    <div v-if="!isPanel" class="mt-auto flex w-full max-w-xs flex-col gap-3">
      <button
        type="button"
        class="flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-accent-up text-[17px] font-bold text-accent-up-ink shadow-[0_12px_30px_-12px_rgba(52,211,153,0.6)]"
        @click="emit('recordAnother')"
      >
        Record another
      </button>
      <button
        type="button"
        class="h-13 rounded-2xl border border-border-result-secondary font-semibold text-text-result-secondary"
        @click="emit('done')"
      >
        Done
      </button>
    </div>
  </div>
</template>
