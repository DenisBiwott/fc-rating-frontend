<script setup lang="ts">
// design-spec.md's PlayerGrid spec: 5-column grid, already-selected tiles inert at 35% opacity.
import AvatarTile from '@/components/AvatarTile.vue'

defineProps<{
  players: Array<{ id: string; name: string; avatarUrl: string | null }>
  selectedIds: string[]
}>()

const emit = defineEmits<{ select: [playerId: string] }>()
</script>

<template>
  <div class="px-5 py-3">
    <p class="mb-2 font-mono text-[10px] font-semibold tracking-[0.14em] text-text-faint uppercase">
      Recently played
    </p>
    <div class="grid grid-cols-5 gap-2">
      <button
        v-for="player in players"
        :key="player.id"
        type="button"
        class="flex flex-col items-center gap-1"
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
