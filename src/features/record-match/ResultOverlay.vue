<script setup lang="ts">
// design-spec.md's ResultOverlay spec: full-screen green-cast canvas (the only screen allowed a
// tinted canvas), UPSET badge, ticking ratings, rank change, then Record another / Done. Focus
// moves here on open (docs/CLAUDE.md's accessibility non-negotiable) and Escape acts like
// dismissing back to record another rather than losing the moment entirely.
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
}>()

const emit = defineEmits<{ recordAnother: []; done: [] }>()

const overlayRef = ref<HTMLElement | null>(null)
onMounted(() => overlayRef.value?.focus())

const isDraw = computed(() => props.homeOutcome.actualScore === 0.5)
const winnerIsHome = computed(() => props.homeOutcome.actualScore === 1)
const winnerName = computed(() => (winnerIsHome.value ? props.homeName : props.awayName))
const loserName = computed(() => (winnerIsHome.value ? props.awayName : props.homeName))
const winnerWinProb = computed(() =>
  Math.round((winnerIsHome.value ? props.homeOutcome : props.awayOutcome).expectedScore * 100),
)
const homeRankChange = computed(() => props.rankChanges.find((c) => c.playerId === props.homePlayerId))
const awayRankChange = computed(() => props.rankChanges.find((c) => c.playerId === props.awayPlayerId))

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('recordAnother')
}
</script>

<template>
  <div
    ref="overlayRef"
    class="absolute inset-0 z-20 flex flex-col items-center overflow-y-auto px-5 py-8"
    style="background: #08110c"
    role="dialog"
    aria-live="assertive"
    aria-modal="true"
    tabindex="-1"
    @keydown="handleKeydown"
  >
    <span
      v-if="upset"
      class="mb-4 rounded-full bg-accent-up px-3 py-1 font-mono text-xs font-bold tracking-[0.08em] text-accent-up-ink"
    >
      UPSET
    </span>

    <p class="font-mono text-[72px] font-bold tracking-[-0.04em] text-text-primary">
      {{ homeScore }}–{{ awayScore }}
    </p>
    <p class="mb-6 text-base" style="color: #8b9a91">
      <template v-if="!isDraw">{{ winnerName }} beats {{ loserName }} · {{ winnerWinProb }}% to win</template>
      <template v-else>{{ homeName }} draws {{ awayName }}</template>
    </p>

    <div class="mb-6 flex w-full max-w-xs gap-3">
      <div
        class="flex flex-1 flex-col items-center gap-1 rounded-2xl border p-3"
        :class="
          winnerIsHome
            ? 'border-[rgba(52,211,153,0.30)] bg-[rgba(52,211,153,0.07)]'
            : 'border-[rgba(244,113,89,0.24)] bg-[rgba(244,113,89,0.05)]'
        "
      >
        <AvatarTile :name="homeName" :size="44" />
        <span class="text-base text-text-primary">{{ homeName }}</span>
        <span class="font-mono text-xs text-text-muted">
          {{ Math.round(homeOutcome.before.rating) }} → {{ Math.round(homeOutcome.after.rating) }}
          <template v-if="homeRankChange"> · rank {{ homeRankChange.from }} → {{ homeRankChange.to }}</template>
        </span>
        <div class="flex items-center gap-2">
          <RatingNumber :value="homeOutcome.after.rating" class="text-[30px] font-bold text-text-primary" />
          <DeltaBadge :value="homeOutcome.delta" class="text-sm" />
        </div>
      </div>
      <div
        class="flex flex-1 flex-col items-center gap-1 rounded-2xl border p-3"
        :class="
          !winnerIsHome && !isDraw
            ? 'border-[rgba(52,211,153,0.30)] bg-[rgba(52,211,153,0.07)]'
            : 'border-[rgba(244,113,89,0.24)] bg-[rgba(244,113,89,0.05)]'
        "
      >
        <AvatarTile :name="awayName" :size="44" />
        <span class="text-base text-text-primary">{{ awayName }}</span>
        <span class="font-mono text-xs text-text-muted">
          {{ Math.round(awayOutcome.before.rating) }} → {{ Math.round(awayOutcome.after.rating) }}
          <template v-if="awayRankChange"> · rank {{ awayRankChange.from }} → {{ awayRankChange.to }}</template>
        </span>
        <div class="flex items-center gap-2">
          <RatingNumber :value="awayOutcome.after.rating" class="text-[30px] font-bold text-text-primary" />
          <DeltaBadge :value="awayOutcome.delta" class="text-sm" />
        </div>
      </div>
    </div>

    <p
      v-if="sessionContext"
      class="mb-6 font-mono text-[10px] tracking-[0.14em] uppercase"
      style="color: #6b7c72"
    >
      Match {{ sessionContext.matchCount }} of {{ sessionContext.name }}
    </p>

    <div class="mt-auto flex w-full max-w-xs flex-col gap-3">
      <button
        type="button"
        class="h-14 rounded-2xl bg-accent-up text-[17px] font-bold text-accent-up-ink shadow-[0_12px_30px_-12px_rgba(52,211,153,0.6)]"
        @click="emit('recordAnother')"
      >
        Record another
      </button>
      <button type="button" class="h-13 rounded-2xl border border-[#2e3a34] text-[#d4d4d8]" @click="emit('done')">
        Done
      </button>
    </div>
  </div>
</template>
