<script setup lang="ts">
// One row in the profile's "MATCHES · NEWEST FIRST" list. Score and result are already oriented
// to this player's own perspective by usePlayerMatches.ts, not raw home/away.
import { computed } from 'vue'
import DeltaBadge from '@/components/DeltaBadge.vue'
import ResultChip from '@/components/ResultChip.vue'
import { useIsAdmin } from '@/queries/useCurrentUser'
import type { PlayerMatchRow } from '@/queries/usePlayerMatches'

const props = defineProps<{ match: PlayerMatchRow }>()
const emit = defineEmits<{ void: [match: PlayerMatchRow] }>()

// Rendered only for admins, not just disabled — a void icon on every row for every anonymous
// visitor would be visual noise for a control almost nobody can use. voidMatch.ts is what
// actually gates the mutation server-side; this is purely a discoverability affordance.
const isAdmin = useIsAdmin()

// Today's matches show a time ("21:49"); older ones show a short date ("Sep 5") — matches the
// canvas mockup's own distinction between the live session's rows and an older casual match.
const timeLabel = computed(() => {
  const played = new Date(props.match.playedAt)
  const now = new Date()
  const sameDay =
    played.getFullYear() === now.getFullYear() &&
    played.getMonth() === now.getMonth() &&
    played.getDate() === now.getDate()
  return sameDay
    ? played.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
    : played.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})
</script>

<template>
  <div class="flex items-center gap-2.75 border-t border-border-hairline px-5 sm:px-8 py-2.5">
    <ResultChip :result="match.result" :size="20" />
    <div class="min-w-0 flex-1">
      <div class="text-sm font-medium text-text-primary">vs {{ match.opponentName }}</div>
      <div class="mt-0.5 font-mono text-[11px] text-text-muted">
        {{ timeLabel }}<span v-if="match.sessionName"> · {{ match.sessionName }}</span>
      </div>
    </div>
    <span class="w-11.5 flex-none text-right font-mono text-base font-semibold tabular-nums">
      {{ match.selfScore }}–{{ match.opponentScore }}
    </span>
    <DeltaBadge :value="match.delta" class="w-10 flex-none text-right text-xs" />
    <button
      v-if="isAdmin"
      type="button"
      aria-label="Void this match"
      class="flex h-6 w-6 flex-none items-center justify-center rounded-full text-sm text-text-faint"
      @click="emit('void', match)"
    >
      &times;
    </button>
  </div>
</template>
