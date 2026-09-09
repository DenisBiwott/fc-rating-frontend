<script setup lang="ts">
// FC Rating UI.dc.html §2b, one roster row. rating/gamesPlayed/rank/isProvisional are null for an
// inactive player (usePlayersRoster.ts's documented design call — leaderboard doesn't cover
// inactive players, so this row shows "—" rather than an extra per-player fetch).
import { computed } from 'vue'
import AvatarTile from '@/components/AvatarTile.vue'
import RatingNumber from '@/components/RatingNumber.vue'
import type { RosterPlayer } from '@/queries/usePlayersRoster'

const props = defineProps<{ player: RosterPlayer }>()

const medal = computed<'gold' | 'silver' | 'bronze' | undefined>(() => {
  const rank = props.player.rank
  return rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : undefined
})

const unrated = computed(() => props.player.isActive && props.player.gamesPlayed === 0)

const lastPlayedLabel = computed(() => {
  if (!props.player.lastPlayedAt) return 'no matches yet'
  const played = new Date(props.player.lastPlayedAt)
  const now = new Date()
  const sameDay =
    played.getFullYear() === now.getFullYear() &&
    played.getMonth() === now.getMonth() &&
    played.getDate() === now.getDate()
  const when = sameDay
    ? played.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
    : played.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `last played ${when}`
})

const matchesLabel = computed(() =>
  props.player.gamesPlayed === null ? lastPlayedLabel.value : `${props.player.gamesPlayed} matches · ${lastPlayedLabel.value}`,
)
</script>

<template>
  <RouterLink
    :to="{ name: 'player-profile', params: { id: player.id } }"
    class="flex items-center gap-3 border-t border-border-hairline px-5 py-2.75"
  >
    <AvatarTile :name="player.name" :size="38" :medal="medal" :dashed="unrated" />
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1.75">
        <span class="text-base font-semibold text-text-primary">{{ player.name }}</span>
        <span
          v-if="player.isProvisional"
          class="inline-block rounded border border-border-default px-1 py-px font-mono text-[9px] font-bold tracking-[0.08em] text-text-secondary"
        >
          {{ unrated ? 'UNRATED' : `PROV ${player.gamesPlayed}/10` }}
        </span>
      </div>
      <div class="mt-0.5 font-mono text-[11px] text-text-muted">{{ matchesLabel }}</div>
    </div>
    <RatingNumber
      v-if="player.rating !== null"
      :value="player.rating"
      class="flex-none text-lg font-semibold tracking-[-0.02em]"
      :class="unrated ? 'text-text-faint' : 'text-text-primary'"
    />
    <span v-else class="flex-none font-mono text-lg text-text-faint">—</span>
    <span class="flex-none text-lg text-text-faint">&rsaquo;</span>
  </RouterLink>
</template>
