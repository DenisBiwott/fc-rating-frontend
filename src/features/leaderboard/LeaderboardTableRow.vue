<script setup lang="ts">
// One desktop leaderboard row (DESIGN-SPEC.md §6, 3a): 58px, 28px gutters, fixed columns from
// columns.ts. The whole row links to the player's profile and lightens on hover.
import { computed } from 'vue'
import AvatarTile from '@/components/AvatarTile.vue'
import DeltaBadge from '@/components/DeltaBadge.vue'
import FormStrip from '@/components/FormStrip.vue'
import RatingNumber from '@/components/RatingNumber.vue'
import { useNow } from '@/composables/useNow'
import { formatPlayedAt } from '@/lib/played-at'
import type { LeaderboardRow } from '@/queries/useLeaderboard'
import type { DesktopColumns } from './columns'
import { medalFor, rankTextClass, winPctLabel } from './medal'
import { highlightRowClass, rankMoveLabel, type RowHighlight } from './useRecentMoves'

const props = defineProps<{
  row: LeaderboardRow
  columns: DesktopColumns
  provisionalGames: number
  /** Set for a few seconds after this player's match is recorded (3b). */
  highlight?: RowHighlight | undefined
}>()
const move = computed(() => rankMoveLabel(props.highlight))
// A tinted row keeps its tint under the cursor; hover only lightens an untinted one.
const rowTint = computed(() => highlightRowClass(props.highlight) || 'hover:bg-bg-raised')

const now = useNow()
const unrated = computed(() => props.row.gamesPlayed === 0)
const last = computed(() =>
  props.row.lastPlayedAt ? formatPlayedAt(props.row.lastPlayedAt, new Date(now.value)) : '—',
)
</script>

<template>
  <RouterLink
    :to="{ name: 'player-profile', params: { id: row.playerId } }"
    class="flex h-[58px] items-center border-t border-border-hairline px-7 font-mono text-[13px]"
    :class="rowTint"
  >
    <span class="w-10 flex-none text-[15px] font-bold" :class="rankTextClass(row.rank)">{{ row.rank }}</span>

    <div class="flex min-w-0 flex-1 items-center gap-3 pr-3 font-sans">
      <AvatarTile :name="row.name" :size="34" :medal="medalFor(row.rank)" :dashed="unrated" />
      <span class="truncate text-[15px] font-semibold text-text-primary">{{ row.name }}</span>
      <span v-if="move" class="flex-none font-mono text-[11px] font-bold" :class="move.class">{{ move.text }}</span>
      <span
        v-if="row.isProvisional"
        class="flex-none rounded border border-neutral-quiet px-1 py-px font-mono text-[9px] font-bold tracking-[0.08em] whitespace-nowrap text-text-secondary"
      >
        {{ unrated ? 'UNRATED' : `PROV ${row.gamesPlayed}/${provisionalGames}` }}
      </span>
    </div>

    <div class="w-29 flex-none"><FormStrip :form="row.form" :size="16" /></div>

    <template v-if="columns.splitWld">
      <span class="w-11 flex-none text-center text-text-emphasis">{{ row.wins }}</span>
      <span class="w-11 flex-none text-center text-text-emphasis">{{ row.losses }}</span>
      <span class="w-11 flex-none text-center text-text-emphasis">{{ row.draws }}</span>
    </template>
    <span v-else class="w-21 flex-none text-right text-text-emphasis">
      {{ row.wins }}-{{ row.losses }}-{{ row.draws }}
    </span>

    <span class="w-16 flex-none text-right" :class="unrated ? 'text-text-faint' : 'text-text-secondary'">
      {{ winPctLabel(row.winPct, row.gamesPlayed) }}
    </span>
    <span v-if="columns.mp" class="w-13 flex-none text-right text-text-muted">{{ row.gamesPlayed }}</span>
    <span v-if="columns.last" class="w-23 flex-none text-right text-xs text-text-muted">{{ last }}</span>

    <RatingNumber
      :value="row.rating"
      class="w-21 flex-none text-right text-[26px] font-semibold tracking-[-0.02em]"
      :class="unrated ? 'text-text-faint' : 'text-text-primary'"
    />
    <DeltaBadge :value="row.deltaSinceLastSession" class="w-15 flex-none text-right text-[13px]" />
  </RouterLink>
</template>
