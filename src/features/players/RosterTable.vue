<script setup lang="ts">
// The desktop roster table (DESIGN-SPEC.md RosterRow, 3d): a card with mono uppercase headers over
// RosterTableRow. The columns fit from 1024px up (the player column keeps ~180px there), so unlike
// the leaderboard and profile tables nothing needs dropping.
import type { RosterPlayer } from '@/queries/usePlayersRoster'
import RosterTableRow from './RosterTableRow.vue'

defineProps<{ players: RosterPlayer[]; emptyLabel: string; isAdmin: boolean; busy: boolean }>()
const emit = defineEmits<{
  rename: [player: RosterPlayer]
  setActive: [player: RosterPlayer, isActive: boolean]
  delete: [player: RosterPlayer]
  login: []
}>()
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-border-nav bg-bg-nav">
    <div class="flex h-10.5 items-center px-5.5 font-mono text-[10px] tracking-[0.1em] text-text-faint uppercase">
      <span class="min-w-0 flex-1">Player</span>
      <span class="w-27.5 flex-none text-right">Rating</span>
      <span class="w-30 flex-none text-right">W-L-D</span>
      <span class="w-25 flex-none text-right">Matches</span>
      <span class="w-32.5 flex-none text-right">Last played</span>
      <span class="w-32.5 flex-none text-right">Joined</span>
      <span class="w-14 flex-none" />
    </div>
    <RosterTableRow
      v-for="player in players"
      :key="player.id"
      :player="player"
      :is-admin="isAdmin"
      :busy="busy"
      @rename="emit('rename', $event)"
      @set-active="(p, isActive) => emit('setActive', p, isActive)"
      @delete="emit('delete', $event)"
      @login="emit('login')"
    />
    <p v-if="players.length === 0" class="border-t border-border-hairline px-5.5 py-6 font-mono text-sm text-text-muted">
      {{ emptyLabel }}
    </p>
  </div>
</template>
