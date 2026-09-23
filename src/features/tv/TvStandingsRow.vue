<script setup lang="ts">
// One TV standings row (DESIGN-SPEC.md §6 "TV mode", 3e): at the designed 76px, rank 26, avatar
// 50, name 30, form chips 24, rating 48/700, delta 22. When there are too many players for 76px
// rows (tvLayout.ts), everything scales with the row height, so a shorter row is the same row,
// smaller. Read-only: nobody clicks a TV.
import { computed } from 'vue'
import AvatarTile from '@/components/AvatarTile.vue'
import DeltaBadge from '@/components/DeltaBadge.vue'
import FormStrip from '@/components/FormStrip.vue'
import RatingNumber from '@/components/RatingNumber.vue'
import { medalFor, rankTextClass } from '@/features/leaderboard/medal'
import { highlightRowClass, rankMoveLabel, type RowHighlight } from '@/features/leaderboard/useRecentMoves'
import type { LeaderboardRow } from '@/queries/useLeaderboard'
import { IDEAL_ROW } from './tvLayout'

const props = defineProps<{
  row: LeaderboardRow
  height: number
  provisionalGames: number
  highlight?: RowHighlight | undefined
}>()

const move = computed(() => rankMoveLabel(props.highlight))
const px = (designed: number) => Math.round((designed * props.height) / IDEAL_ROW)
</script>

<template>
  <li
    class="flex items-center border-t border-border-hairline px-4"
    :class="highlightRowClass(highlight)"
    :style="{ height: `${height}px`, gap: `${px(20)}px` }"
  >
    <span
      class="flex-none font-mono font-bold tabular-nums"
      :class="rankTextClass(row.rank)"
      :style="{ width: `${px(36)}px`, fontSize: `${px(26)}px` }"
      >{{ row.rank }}</span
    >
    <AvatarTile :name="row.name" :size="px(50)" :medal="medalFor(row.rank)" />

    <div class="flex min-w-0 flex-1 items-center" :style="{ gap: `${px(14)}px` }">
      <span
        class="truncate font-semibold tracking-[-0.01em] text-text-primary"
        :style="{ fontSize: `${px(30)}px` }"
        >{{ row.name }}</span
      >
      <span
        v-if="move"
        class="flex-none font-mono font-bold"
        :class="move.class"
        :style="{ fontSize: `${px(18)}px` }"
        >{{ move.text }}</span
      >
      <!-- Not in the 3e mock, which only dims a provisional rating. Kept so colour isn't the only
           signal (CLAUDE.md), as on every other leaderboard. -->
      <span
        v-if="row.isProvisional"
        class="flex-none rounded border border-neutral-quiet px-1.5 py-px font-mono font-bold tracking-[0.08em] whitespace-nowrap text-text-secondary"
        :style="{ fontSize: `${px(13)}px` }"
      >
        PROV {{ row.gamesPlayed }}/{{ provisionalGames }}
      </span>
    </div>

    <FormStrip :form="row.form" :size="px(24)" :font-size="px(12)" />

    <RatingNumber
      :value="row.rating"
      class="flex-none text-right leading-none font-bold tracking-[-0.03em]"
      :class="row.isProvisional ? 'text-text-secondary' : 'text-text-primary'"
      :style="{ width: `${px(150)}px`, fontSize: `${px(48)}px` }"
    />
    <DeltaBadge
      :value="row.deltaSinceLastSession"
      class="flex-none text-right"
      :style="{ width: `${px(80)}px`, fontSize: `${px(22)}px` }"
    />
  </li>
</template>
