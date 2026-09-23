<script setup lang="ts">
// DESIGN-SPEC.md PlayerGrid, as revised for Turn 4 (4b): two rows only, 5 per row on phones and 4
// in the desktop drawer, "tonight, then recent" (playerPicker.ts). When there are more active
// players than tiles, the last tile is "All +N", which opens the name filter. Already-selected
// tiles stay in place, inert at 35% opacity.
import { computed } from 'vue'
import AvatarTile from '@/components/AvatarTile.vue'
import { pickerTiles } from './playerPicker'

const props = withDefaults(
  defineProps<{
    players: Array<{ id: string; name: string; avatarUrl: string | null }>
    selectedIds: string[]
    columns?: 4 | 5
    /** Right of the label, e.g. the drawer's "type to filter". */
    hint?: string | null
  }>(),
  { columns: 5, hint: null },
)

const emit = defineEmits<{ select: [playerId: string]; showAll: [] }>()

const tiles = computed(() => pickerTiles(props.players, props.columns * 2))
const avatarSize = computed(() => (props.columns === 4 ? 44 : 46))
</script>

<template>
  <div class="px-5 py-3">
    <p class="mb-2 flex justify-between gap-3 font-mono text-[10px] tracking-[0.14em] text-text-faint uppercase">
      <span class="font-semibold">Tonight, then recent</span>
      <span v-if="hint" class="tracking-[0.04em] normal-case">{{ hint }}</span>
    </p>
    <div class="grid gap-2" :class="columns === 4 ? 'grid-cols-4 gap-y-2.5' : 'grid-cols-5'">
      <button
        v-for="player in tiles.shown"
        :key="player.id"
        type="button"
        class="flex flex-col items-center gap-1 rounded-xl"
        :class="selectedIds.includes(player.id) ? 'pointer-events-none opacity-35' : ''"
        :disabled="selectedIds.includes(player.id)"
        :aria-label="`Select ${player.name}`"
        @click="emit('select', player.id)"
      >
        <AvatarTile :name="player.name" :size="avatarSize" />
        <span class="w-full truncate text-center text-[11px] text-text-secondary">{{ player.name }}</span>
      </button>
      <button
        v-if="tiles.hiddenCount > 0"
        type="button"
        class="flex flex-col items-center gap-1 rounded-xl"
        :aria-label="`All players (${tiles.hiddenCount} more)`"
        @click="emit('showAll')"
      >
        <span
          class="flex flex-none items-center justify-center rounded-full border border-dashed border-text-faint font-mono text-xs font-semibold text-text-secondary"
          :style="{ width: `${avatarSize}px`, height: `${avatarSize}px` }"
        >
          +{{ tiles.hiddenCount }}
        </span>
        <span class="w-full truncate text-center text-[11px] text-text-secondary">All</span>
      </button>
    </div>
  </div>
</template>
