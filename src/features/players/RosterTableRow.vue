<script setup lang="ts">
// One desktop roster row (DESIGN-SPEC.md RosterRow, 3d): 60px, Player · Rating · W-L-D · Matches ·
// Last played · Joined · ···. The player's name is the link to their profile, stretched over the
// whole row, so the ··· button can sit inside the row without nesting a button in a link.
// Inactive players have no leaderboard entry, so their rating and record read "—"
// (usePlayersRoster.ts).
import { computed } from 'vue'
import AvatarTile from '@/components/AvatarTile.vue'
import RatingNumber from '@/components/RatingNumber.vue'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useNow } from '@/composables/useNow'
import { medalFor } from '@/features/leaderboard/medal'
import { formatJoined, formatPlayedAt } from '@/lib/played-at'
import type { RosterPlayer } from '@/queries/usePlayersRoster'

const props = defineProps<{ player: RosterPlayer; isAdmin: boolean; busy: boolean }>()
const emit = defineEmits<{
  rename: [player: RosterPlayer]
  setActive: [player: RosterPlayer, isActive: boolean]
  delete: [player: RosterPlayer]
  login: []
}>()

const now = useNow()
const unrated = computed(() => props.player.isActive && props.player.gamesPlayed === 0)
const medal = computed(() => (props.player.rank === null ? undefined : medalFor(props.player.rank)))
const record = computed(() =>
  props.player.wins === null ? '—' : `${props.player.wins}-${props.player.losses}-${props.player.draws}`,
)
const last = computed(() =>
  props.player.lastPlayedAt ? formatPlayedAt(props.player.lastPlayedAt, new Date(now.value)) : '—',
)
// Delete is only for a player who has never played. An inactive player has no leaderboard entry,
// so fall back to "has a last-played date".
const hasMatches = computed(() =>
  props.player.gamesPlayed !== null ? props.player.gamesPlayed > 0 : props.player.lastPlayedAt !== null,
)
</script>

<template>
  <div class="relative flex h-15 items-center border-t border-border-hairline px-5.5 font-mono hover:bg-bg-raised">
    <div class="flex min-w-0 flex-1 items-center gap-3 pr-3 font-sans">
      <AvatarTile :name="player.name" :size="36" :medal="medal" :dashed="unrated" />
      <RouterLink
        :to="{ name: 'player-profile', params: { id: player.id } }"
        class="truncate text-base font-semibold text-text-primary after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-[inherit] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent-up"
      >
        {{ player.name }}
      </RouterLink>
      <span
        v-if="player.isProvisional"
        class="flex-none rounded border border-neutral-quiet px-1 py-px font-mono text-[9px] tracking-[0.08em] whitespace-nowrap text-text-secondary"
      >
        {{ unrated ? 'UNRATED' : `PROV ${player.gamesPlayed}/${player.provisionalGames}` }}
      </span>
    </div>

    <RatingNumber
      v-if="player.rating !== null"
      :value="player.rating"
      class="w-27.5 flex-none text-right text-xl font-semibold tracking-[-0.02em]"
      :class="unrated ? 'text-text-faint' : 'text-text-primary'"
    />
    <span v-else class="w-27.5 flex-none text-right text-xl text-text-faint">—</span>
    <span class="w-30 flex-none text-right text-[13px] text-text-secondary tabular-nums">{{ record }}</span>
    <span class="w-25 flex-none text-right text-[13px] text-text-muted tabular-nums">{{ player.gamesPlayed ?? '—' }}</span>
    <span class="w-32.5 flex-none text-right text-xs text-text-muted">{{ last }}</span>
    <span class="w-32.5 flex-none text-right text-xs text-text-faint">{{ formatJoined(player.createdAt) }}</span>

    <span class="relative z-10 flex w-14 flex-none justify-end">
      <DropdownMenu v-if="isAdmin">
        <DropdownMenuTrigger
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-[13px] text-text-muted hover:bg-bg-control hover:text-text-secondary"
          :aria-label="`Actions for ${player.name}`"
        >
          ···
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem @select="emit('rename', player)">Rename…</DropdownMenuItem>
          <DropdownMenuItem :disabled="busy" @select="emit('setActive', player, !player.isActive)">
            {{ player.isActive ? 'Deactivate' : 'Reactivate' }}
          </DropdownMenuItem>
          <DropdownMenuItem destructive :disabled="hasMatches" @select="emit('delete', player)">
            Delete player…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        v-else
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-[13px] text-text-muted opacity-40"
        :aria-label="`Actions for ${player.name}`"
        @click="emit('login')"
      >
        ···
      </button>
    </span>
  </div>
</template>
