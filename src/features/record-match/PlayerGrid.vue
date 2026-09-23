<script setup lang="ts">
// DESIGN-SPEC.md's PlayerGrid spec: 5-column grid, already-selected tiles inert at 35% opacity.
// The desktop panel (3a) uses 4 columns and labels it as the full list it already is — every
// active player, most recently played first.
import AvatarTile from '@/components/AvatarTile.vue'

withDefaults(
  defineProps<{
    players: Array<{ id: string; name: string; avatarUrl: string | null }>
    selectedIds: string[]
    columns?: 4 | 5
    label?: string
  }>(),
  { columns: 5, label: 'Recently played' },
)

const emit = defineEmits<{ select: [playerId: string] }>()
</script>

<template>
  <div class="px-5 py-3">
    <p class="mb-2 font-mono text-[10px] font-semibold tracking-[0.14em] text-text-faint uppercase">
      {{ label }}
    </p>
    <div class="grid gap-2" :class="columns === 4 ? 'grid-cols-4' : 'grid-cols-5'">
      <button
        v-for="player in players"
        :key="player.id"
        type="button"
        class="flex flex-col items-center gap-1 rounded-xl"
        :class="selectedIds.includes(player.id) ? 'pointer-events-none opacity-35' : ''"
        :disabled="selectedIds.includes(player.id)"
        :aria-label="`Select ${player.name}`"
        @click="emit('select', player.id)"
      >
        <AvatarTile :name="player.name" :size="46" />
        <span class="w-full truncate text-center text-[11px] text-text-secondary">{{ player.name }}</span>
      </button>
    </div>
  </div>
</template>
