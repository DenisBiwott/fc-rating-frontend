<script setup lang="ts">
// design-spec.md §2 "PlayerRow (1a — compact ledger)": fixed rank/rating/delta columns, a
// form-strip + record line under the name, medal accents for ranks 1-3 only.
import { computed } from 'vue'
import AvatarTile from '@/components/AvatarTile.vue'
import DeltaBadge from '@/components/DeltaBadge.vue'
import FormStrip from '@/components/FormStrip.vue'
import RatingNumber from '@/components/RatingNumber.vue'

type MatchResult = 'W' | 'L' | 'D'

const props = defineProps<{
  rank: number
  name: string
  wins: number
  losses: number
  draws: number
  rating: number
  delta: number | null
  form: MatchResult[]
  gamesPlayed: number
  isProvisional: boolean
}>()

const medal = computed<'gold' | 'silver' | 'bronze' | undefined>(() =>
  props.rank === 1 ? 'gold' : props.rank === 2 ? 'silver' : props.rank === 3 ? 'bronze' : undefined,
)
const rankColorClass = computed(() =>
  medal.value === 'gold'
    ? 'text-[#e0b64a]'
    : medal.value === 'silver'
      ? 'text-[#b9bec6]'
      : medal.value === 'bronze'
        ? 'text-[#b07a4a]'
        : 'text-text-secondary',
)
const unrated = computed(() => props.gamesPlayed === 0)
</script>

<template>
  <div class="flex items-center gap-2.75 border-t border-border-hairline px-5 py-2.25">
    <span class="w-3.75 flex-none text-right font-mono text-sm font-bold" :class="rankColorClass">
      {{ rank }}
    </span>

    <AvatarTile :name="name" :size="32" :medal="medal" :dashed="unrated" />

    <div class="min-w-0 flex-1">
      <div class="truncate text-[15px] font-semibold text-text-primary">{{ name }}</div>

      <div v-if="isProvisional" class="mt-0.75">
        <span
          class="inline-block rounded border border-[#3f3f46] px-1 py-px font-mono text-[9px] font-bold tracking-[0.08em] text-text-secondary"
        >
          {{ unrated ? 'UNRATED' : `PROV ${gamesPlayed}/10` }}
        </span>
      </div>

      <div v-if="unrated" class="mt-0.75 font-mono text-[11px] text-text-muted">no matches yet</div>
      <div v-else class="mt-0.75 flex items-center gap-1">
        <FormStrip :form="form" />
        <span class="ml-0.75 flex-none whitespace-nowrap font-mono text-[11px] text-text-muted">
          {{ wins }}-{{ losses }}-{{ draws }}
        </span>
      </div>
    </div>

    <RatingNumber
      :value="rating"
      class="w-15.5 flex-none text-right text-[22px] font-semibold tracking-[-0.02em]"
      :class="unrated ? 'text-text-faint' : 'text-text-primary'"
    />

    <DeltaBadge :value="delta" class="w-10 flex-none text-right text-xs" />
  </div>
</template>
