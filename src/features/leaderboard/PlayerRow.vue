<script setup lang="ts">
// DESIGN-SPEC.md §2 "PlayerRow (1a — compact ledger)": fixed rank/rating/delta columns, a
// form-strip + record line under the name, medal accents for ranks 1-3 only.
import { computed } from 'vue'
import AvatarTile from '@/components/AvatarTile.vue'
import DeltaBadge from '@/components/DeltaBadge.vue'
import FormStrip from '@/components/FormStrip.vue'
import RatingNumber from '@/components/RatingNumber.vue'
import { medalFor, rankTextClass, winPctLabel } from './medal'

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

const medal = computed(() => medalFor(props.rank))
const rankColorClass = computed(() => rankTextClass(props.rank))
const unrated = computed(() => props.gamesPlayed === 0)
const record = computed(() => `${props.wins}-${props.losses}-${props.draws}`)
const winPct = computed(() => winPctLabel(props.winPct, props.gamesPlayed))
</script>

<template>
  <!-- Phone: DESIGN-SPEC.md 1a — record inline after the form strip. Tablet (3f): 66px rows, 32px
       gutters, and W-L-D + Win% get their own columns. Widths below are 3f's column widths minus
       the 12px row gap. Switched by LeaderboardList's container width (@min-[640px]), not the
       viewport, so a narrow column beside the desktop Record panel gets the compact phone rows. -->
  <RouterLink
    :to="{ name: 'player-profile', params: { id: playerId } }"
    class="flex items-center gap-2.75 border-t border-border-hairline px-5 py-2.25 @min-[640px]:h-[66px] @min-[640px]:gap-3 @min-[640px]:px-8 @min-[640px]:py-0"
  >
    <span
      class="w-3.75 flex-none text-right font-mono text-sm font-bold @min-[640px]:w-[22px] @min-[640px]:text-left @min-[640px]:text-[15px]"
      :class="rankColorClass"
    >
      {{ rank }}
    </span>

    <AvatarTile :name="name" :size="32" :tablet-size="38" :medal="medal" :dashed="unrated" />

    <div class="min-w-0 flex-1">
      <!-- Badge inline after the name (3f), so provisional/unrated rows stay the same height as
           every other row — DESIGN-SPEC.md: "Rows must be uniform height". -->
      <div class="flex items-center gap-[7px]">
        <span class="truncate text-[15px] font-semibold text-text-primary @min-[640px]:text-base">{{ name }}</span>
        <span
          v-if="isProvisional"
          class="flex-none rounded border border-neutral-quiet px-1 py-px font-mono text-[9px] font-bold tracking-[0.08em] whitespace-nowrap text-text-secondary"
        >
          {{ unrated ? 'UNRATED' : `PROV ${gamesPlayed}/${provisionalGames}` }}
        </span>
      </div>

      <div v-if="unrated" class="mt-0.75 font-mono text-[11px] text-text-muted @min-[640px]:mt-1">no matches yet</div>
      <div v-else class="mt-0.75 flex items-center gap-1 @min-[640px]:mt-1">
        <FormStrip :form="form" />
        <span class="ml-0.75 flex-none font-mono text-[11px] whitespace-nowrap text-text-muted @min-[640px]:hidden">
          {{ record }}
        </span>
      </div>
    </div>

    <span class="hidden w-[84px] flex-none text-right font-mono text-[13px] text-text-secondary @min-[640px]:block">
      {{ record }}
    </span>
    <span
      class="hidden w-[58px] flex-none text-right font-mono text-[13px] @min-[640px]:block"
      :class="unrated ? 'text-text-faint' : 'text-text-muted'"
    >
      {{ winPct }}
    </span>

    <RatingNumber
      :value="rating"
      class="w-15.5 flex-none text-right text-[22px] font-semibold tracking-[-0.02em] @min-[640px]:w-[78px] @min-[640px]:text-2xl"
      :class="unrated ? 'text-text-faint' : 'text-text-primary'"
    />

    <DeltaBadge :value="delta" class="w-10 flex-none text-right text-xs @min-[640px]:w-11 @min-[640px]:text-[13px]" />
  </RouterLink>
</template>
