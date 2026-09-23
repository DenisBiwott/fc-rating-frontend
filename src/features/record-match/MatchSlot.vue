<script setup lang="ts">
// DESIGN-SPEC.md's MatchSlot spec. Empty state is a dashed avatar outline and no name; tapping a
// filled slot clears it (grid tiles only ever fill an empty slot, never clear one).
import AvatarTile from '@/components/AvatarTile.vue'
import RatingNumber from '@/components/RatingNumber.vue'

const props = defineProps<{
  label: 'HOME' | 'AWAY'
  name: string | null
  rating: number | null
  /** The slot the next pick fills (desktop panel, 3a): green border + a soft green ring. */
  focused?: boolean
}>()

const emit = defineEmits<{ clear: [] }>()
</script>

<template>
  <button
    type="button"
    class="flex min-h-41 flex-1 flex-col items-center gap-2 rounded-2xl border bg-bg-raised p-4 disabled:cursor-default"
    :class="
      focused ? 'border-accent-up shadow-[0_0_0_3px_rgba(52,211,153,0.14)]' : 'border-transparent'
    "
    :disabled="!name"
    :aria-label="name ? `Clear ${props.label.toLowerCase()} player ${name}` : `${props.label}, empty`"
    @click="emit('clear')"
  >
    <span class="font-mono text-[10px] font-semibold tracking-[0.14em] text-text-faint uppercase">{{
      label
    }}</span>
    <AvatarTile v-if="name" :name="name" :size="52" />
    <span v-else class="h-13 w-13 flex-none rounded-full border border-dashed border-border-default" />
    <span v-if="name" class="max-w-full truncate text-base font-semibold text-text-primary">{{ name }}</span>
    <RatingNumber v-if="rating !== null" :value="rating" class="text-[11px] text-text-muted" />
  </button>
</template>
