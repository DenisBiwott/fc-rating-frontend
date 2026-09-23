<script setup lang="ts">
// DESIGN-SPEC.md §2 "PlayerRow (1a — compact ledger)": fixed rank/rating/delta columns, a
// form-strip + record line under the name, medal accents for ranks 1-3 only.
import { computed } from 'vue'
import AvatarTile from '@/components/AvatarTile.vue'
import DeltaBadge from '@/components/DeltaBadge.vue'
import FormStrip from '@/components/FormStrip.vue'
import RatingNumber from '@/components/RatingNumber.vue'

type MatchResult = 'W' | 'L' | 'D'

const props = defineProps<{
  playerId: string
  rank: number
  name: string
  wins: number
  losses: number
  draws: number
  rating: number
  delta: number | null
  form: MatchResult[]
  winPct: number
  gamesPlayed: number
  isProvisional: boolean
  provisionalGames: number
}>()

const medal = computed<'gold' | 'silver' | 'bronze' | undefined>(() =>
  props.rank === 1 ? 'gold' : props.rank === 2 ? 'silver' : props.rank === 3 ? 'bronze' : undefined,
)
const rankColorClass = computed(() =>
  medal.value === 'gold'
    ? 'text-medal-gold'
    : medal.value === 'silver'
      ? 'text-medal-silver'
      : medal.value === 'bronze'
        ? 'text-medal-bronze'
        : 'text-text-secondary',
)
const unrated = computed(() => props.gamesPlayed === 0)
const record = computed(() => `${props.wins}-${props.losses}-${props.draws}`)
// Rounded at render only; an unrated player has no win rate, not a 0% one.
const winPctLabel = computed(() => (unrated.value ? '—' : `${Math.round(props.winPct * 100)}%`))
</script>

<template>
  <!-- Phone: DESIGN-SPEC.md 1a — record inline after the form strip. Tablet (sm, 3f): 66px rows,
       32px gutters, and W-L-D + Win% get their own columns. Widths below are 3f's column widths
       minus the 12px row gap. -->
  <RouterLink
    :to="{ name: 'player-profile', params: { id: playerId } }"
    class="flex items-center gap-2.75 border-t border-border-hairline px-5 py-2.25 sm:h-[66px] sm:gap-3 sm:px-8 sm:py-0"
  >
    <span
      class="w-3.75 flex-none text-right font-mono text-sm font-bold sm:w-[22px] sm:text-left sm:text-[15px]"
      :class="rankColorClass"
    >
      {{ rank }}
    </span>

    <AvatarTile :name="name" :size="32" :tablet-size="38" :medal="medal" :dashed="unrated" />

    <div class="min-w-0 flex-1">
      <!-- Badge inline after the name (3f), so provisional/unrated rows stay the same height as
           every other row — DESIGN-SPEC.md: "Rows must be uniform height". -->
      <div class="flex items-center gap-[7px]">
        <span class="truncate text-[15px] font-semibold text-text-primary sm:text-base">{{ name }}</span>
        <span
          v-if="isProvisional"
          class="flex-none rounded border border-neutral-quiet px-1 py-px font-mono text-[9px] font-bold tracking-[0.08em] whitespace-nowrap text-text-secondary"
        >
          {{ unrated ? 'UNRATED' : `PROV ${gamesPlayed}/${provisionalGames}` }}
        </span>
      </div>

      <div v-if="unrated" class="mt-0.75 font-mono text-[11px] text-text-muted sm:mt-1">no matches yet</div>
      <div v-else class="mt-0.75 flex items-center gap-1 sm:mt-1">
        <FormStrip :form="form" />
        <span class="ml-0.75 flex-none font-mono text-[11px] whitespace-nowrap text-text-muted sm:hidden">
          {{ record }}
        </span>
      </div>
    </div>

    <span class="hidden w-[84px] flex-none text-right font-mono text-[13px] text-text-secondary sm:block">
      {{ record }}
    </span>
    <span
      class="hidden w-[58px] flex-none text-right font-mono text-[13px] sm:block"
      :class="unrated ? 'text-text-faint' : 'text-text-muted'"
    >
      {{ winPctLabel }}
    </span>

    <RatingNumber
      :value="rating"
      class="w-15.5 flex-none text-right text-[22px] font-semibold tracking-[-0.02em] sm:w-[78px] sm:text-2xl"
      :class="unrated ? 'text-text-faint' : 'text-text-primary'"
    />

    <DeltaBadge :value="delta" class="w-10 flex-none text-right text-xs sm:w-11 sm:text-[13px]" />
  </RouterLink>
</template>
