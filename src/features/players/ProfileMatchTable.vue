<script setup lang="ts">
// The desktop profile's full match history (DESIGN-SPEC.md MatchHistoryRow, 3c): a bg/nav card,
// 54px rows — result chip · vs Opponent · Score · Δ · After · Session · When · ··· — newest first,
// loaded a page at a time. Columns fit the card's measured width (historyColumns.ts). The row menu holds Void match… (admins only; "Open match" isn't built,
// since there's no match screen).
import DeltaBadge from '@/components/DeltaBadge.vue'
import ResultChip from '@/components/ResultChip.vue'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { computed, ref } from 'vue'
import { useElementWidth } from '@/composables/useElementWidth'
import { useNow } from '@/composables/useNow'
import type { PlayerMatchRow } from '@/queries/usePlayerMatches'
import { historyColumnsForWidth } from './historyColumns'

defineProps<{
  rows: PlayerMatchRow[]
  total: number
  isAdmin: boolean
  hasMore: boolean
  loadingMore: boolean
}>()
const emit = defineEmits<{ void: [match: PlayerMatchRow]; loadMore: [] }>()

const now = useNow()
const card = ref<HTMLElement | null>(null)
const width = useElementWidth(card)
const columns = computed(() => historyColumnsForWidth(width.value))

// "Today 21:31" for tonight's matches, "Sep 5 21:40" before that (3c).
function whenLabel(iso: string): string {
  const played = new Date(iso)
  const today = new Date(now.value)
  const time = played.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
  const sameDay = played.toDateString() === today.toDateString()
  return sameDay ? `Today ${time}` : `${played.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${time}`
}
</script>

<template>
  <div ref="card" class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border-nav bg-bg-nav">
    <div class="flex items-center justify-between px-5 pt-4 pb-3 font-mono">
      <span class="text-[10px] tracking-[0.14em] text-text-muted">MATCHES · NEWEST FIRST</span>
      <span class="text-[11px] text-text-faint">{{ total }}</span>
    </div>
    <div
      class="flex items-center px-5 pb-2 font-mono text-[10px] tracking-[0.1em] text-text-faint uppercase"
      aria-hidden="true"
    >
      <span class="w-10 flex-none" />
      <span class="min-w-0 flex-1">Opponent</span>
      <span class="w-17.5 flex-none text-right">Score</span>
      <span class="w-15 flex-none text-right">Δ</span>
      <span v-if="columns.after" class="w-19 flex-none text-right">After</span>
      <span v-if="columns.session" class="w-37.5 flex-none pl-6">Session</span>
      <span v-if="columns.when" class="w-27.5 flex-none text-right">When</span>
      <span class="w-10 flex-none" />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <p v-if="rows.length === 0" class="border-t border-border-hairline px-5 py-6 font-mono text-xs text-text-muted">
        No matches yet.
      </p>
      <div
        v-for="match in rows"
        :key="match.matchId"
        class="flex h-13.5 items-center border-t border-border-hairline px-5 hover:bg-bg-raised"
      >
        <span class="w-10 flex-none"><ResultChip :result="match.result" :size="22" /></span>
        <span class="min-w-0 flex-1 truncate text-[15px] font-medium text-text-primary">vs {{ match.opponentName }}</span>
        <span class="w-17.5 flex-none text-right font-mono text-base font-semibold tabular-nums text-text-primary">
          {{ match.selfScore }}–{{ match.opponentScore }}
        </span>
        <DeltaBadge :value="match.delta" class="w-15 flex-none text-right text-[13px]" />
        <span v-if="columns.after" class="w-19 flex-none text-right font-mono text-[13px] text-text-secondary">
          {{ match.ratingAfter === null ? '—' : Math.round(match.ratingAfter) }}
        </span>
        <span v-if="columns.session" class="w-37.5 flex-none truncate pl-6 text-[13px] text-text-muted">
          {{ match.sessionName ?? '—' }}
        </span>
        <span v-if="columns.when" class="w-27.5 flex-none text-right font-mono text-xs text-text-faint">
          {{ whenLabel(match.playedAt) }}
        </span>
        <span class="flex w-10 flex-none justify-end">
          <DropdownMenu v-if="isAdmin">
            <DropdownMenuTrigger
              class="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-text-faint hover:bg-bg-control hover:text-text-secondary"
              :aria-label="`Actions for the match vs ${match.opponentName}`"
            >
              ···
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem destructive @select="emit('void', match)">Void match…</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>
      <div v-if="hasMore" class="border-t border-border-hairline p-3 text-center">
        <button
          type="button"
          class="h-9 rounded-lg px-4 font-mono text-[11px] text-text-secondary hover:bg-bg-raised disabled:opacity-50"
          :disabled="loadingMore"
          @click="emit('loadMore')"
        >
          {{ loadingMore ? 'Loading…' : 'Load older matches' }}
        </button>
      </div>
    </div>
  </div>
</template>
