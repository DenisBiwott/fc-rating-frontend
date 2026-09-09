<script setup lang="ts">
// FC Rating UI.dc.html §2b. "+ Add" is inert — 2c (the add-player sheet) isn't built yet.
import { computed, ref } from 'vue'
import { usePlayersRoster } from '@/queries/usePlayersRoster'
import PlayerRosterRow from './PlayerRosterRow.vue'

const showActive = ref(true)

const { data: activePlayers } = usePlayersRoster(true)
const { data: inactivePlayers } = usePlayersRoster(false)

const players = computed(() => (showActive.value ? activePlayers.value : inactivePlayers.value))
const activeCount = computed(() => activePlayers.value?.length ?? 0)
const inactiveCount = computed(() => inactivePlayers.value?.length ?? 0)
</script>

<template>
  <section class="flex h-full flex-none flex-col *:shrink-0">
    <header class="flex items-end justify-between px-5 pt-3.5 pb-3.5">
      <div>
        <div class="text-[26px] font-bold tracking-[-0.02em] text-text-primary">Players</div>
        <div class="mt-0.5 text-[13px] text-text-muted">
          {{ activeCount }} active · {{ inactiveCount }} inactive
        </div>
      </div>
      <button
        type="button"
        disabled
        title="Coming soon"
        class="h-9 rounded-[10px] bg-accent-up px-3.5 text-sm font-bold text-accent-up-ink opacity-50"
      >
        + Add
      </button>
    </header>

    <div class="flex gap-1.5 px-5 pb-3.5">
      <button
        type="button"
        class="h-8.5 flex-1 rounded-[9px] text-[13px] font-semibold"
        :class="
          showActive
            ? 'border border-border-control bg-bg-control text-text-primary'
            : 'border border-border-hairline text-text-muted'
        "
        @click="showActive = true"
      >
        Active
      </button>
      <button
        type="button"
        class="h-8.5 flex-1 rounded-[9px] text-[13px] font-medium"
        :class="
          !showActive
            ? 'border border-border-control bg-bg-control text-text-primary'
            : 'border border-border-hairline text-text-muted'
        "
        @click="showActive = false"
      >
        Inactive
      </button>
    </div>

    <PlayerRosterRow v-for="player in players" :key="player.id" :player="player" />
    <p v-if="players?.length === 0" class="px-5 py-6 font-mono text-sm text-text-muted">
      No {{ showActive ? 'active' : 'inactive' }} players.
    </p>
  </section>
</template>
