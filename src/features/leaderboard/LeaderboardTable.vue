<script setup lang="ts">
// The desktop leaderboard table (DESIGN-SPEC.md §6, 3a). Headers sort on click, with `↓` on the
// active column. Sorting is local view state: it's how you *read* the table, not a setting, so it
// resets on reload. Which columns show is decided by the parent from the table's measured width.
import { computed, ref } from 'vue'
import type { LeaderboardRow } from '@/queries/useLeaderboard'
import type { DesktopColumns } from './columns'
import LeaderboardTableRow from './LeaderboardTableRow.vue'
import { sortRows, type SortKey } from './sort'
import { useRecentMoves } from './useRecentMoves'

const props = defineProps<{ rows: LeaderboardRow[]; columns: DesktopColumns; provisionalGames: number }>()

const recentMoves = useRecentMoves()
const sortKey = ref<SortKey>('rating')
const sortedRows = computed(() => sortRows(props.rows, sortKey.value))

interface Header {
  key: SortKey | null
  label: string
  class: string
}

const headers = computed<Header[]>(() => {
  const c = props.columns
  return [
    { key: null, label: '#', class: 'flex-none w-10 text-left' },
    { key: 'player', label: 'Player', class: 'min-w-0 flex-1 pr-3 text-left' },
    { key: null, label: 'Form', class: 'flex-none w-29 text-left' },
    ...(c.splitWld
      ? ([
          { key: 'w', label: 'W', class: 'flex-none w-11 text-center' },
          { key: 'l', label: 'L', class: 'flex-none w-11 text-center' },
          { key: 'd', label: 'D', class: 'flex-none w-11 text-center' },
        ] as Header[])
      : ([{ key: 'w', label: 'W-L-D', class: 'flex-none w-21 text-right' }] as Header[])),
    { key: 'winPct', label: 'Win%', class: 'flex-none w-16 text-right' },
    ...(c.mp ? ([{ key: 'mp', label: 'MP', class: 'flex-none w-13 text-right' }] as Header[]) : []),
    ...(c.last ? ([{ key: 'last', label: 'Last', class: 'flex-none w-23 text-right' }] as Header[]) : []),
    { key: 'rating', label: 'Rating', class: 'flex-none w-21 text-right' },
    { key: 'delta', label: 'Δ', class: 'flex-none w-15 text-right' },
  ]
})
</script>

<template>
  <div class="flex flex-1 flex-col">
    <div
      class="flex items-center px-7 pb-2 font-mono text-[10px] font-semibold tracking-[0.1em] text-text-faint uppercase"
    >
      <template v-for="header in headers" :key="header.label">
        <button
          v-if="header.key"
          type="button"
          class="uppercase hover:text-text-secondary"
          :class="[header.class, sortKey === header.key ? 'text-text-secondary' : '']"
          :aria-pressed="sortKey === header.key"
          :aria-label="`Sort by ${header.label}`"
          @click="sortKey = header.key"
        >
          {{ header.label }}<template v-if="sortKey === header.key"> ↓</template>
        </button>
        <span v-else :class="header.class">{{ header.label }}</span>
      </template>
    </div>

    <TransitionGroup tag="div" name="row">
      <LeaderboardTableRow
        v-for="row in sortedRows"
        :key="row.playerId"
        :row="row"
        :columns="columns"
        :provisional-games="provisionalGames"
        :highlight="recentMoves.get(row.playerId)"
      />
    </TransitionGroup>

    <div
      class="mt-auto flex flex-wrap gap-4.5 border-t border-border-hairline px-7 py-4 font-mono text-[11px] text-text-faint"
    >
      <span>Click a row for profile</span><span aria-hidden="true">·</span><span>Click a column to sort</span>
      <span aria-hidden="true">·</span><span>Unrated sort last</span>
    </div>
  </div>
</template>

<style scoped>
/* Same FLIP reorder as the phone/tablet list (DESIGN-SPEC.md §3) — rank changes and re-sorts. */
.row-move {
  transition: transform 300ms ease;
}
</style>
