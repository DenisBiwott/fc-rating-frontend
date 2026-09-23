<script setup lang="ts">
// DESIGN-SPEC.md's MatchSlot spec. Empty state is a dashed avatar outline and no name; tapping a
// filled slot clears it (grid tiles only ever fill an empty slot, never clear one). `compact` is
// the phone's single-line card while the name filter is open (4d): 36px avatar, label over name.
import AvatarTile from '@/components/AvatarTile.vue'
import RatingNumber from '@/components/RatingNumber.vue'

const props = defineProps<{
  label: 'HOME' | 'AWAY'
  name: string | null
  rating: number | null
  /** The slot the next pick fills: green border + a soft green ring. */
  focused?: boolean
  compact?: boolean
}>()

const emit = defineEmits<{ clear: [] }>()
</script>

<template>
  <button
    v-if="compact"
    type="button"
    class="flex min-w-0 flex-1 items-center gap-2.5 rounded-[14px] border bg-bg-raised p-2.5 text-left disabled:cursor-default"
    :class="
      focused ? 'border-accent-up shadow-[0_0_0_3px_rgba(52,211,153,0.14)]' : 'border-border-default'
    "
    :disabled="!name"
    :aria-label="name ? `Clear ${props.label.toLowerCase()} player ${name}` : `${props.label}, empty`"
    @click="emit('clear')"
  >
    <AvatarTile v-if="name" :name="name" :size="36" />
    <span v-else class="h-9 w-9 flex-none rounded-full border border-dashed border-border-default" />
    <span class="min-w-0">
      <span class="block font-mono text-[9px] tracking-[0.14em] text-text-faint">{{ label }}</span>
      <span v-if="name" class="block truncate text-[15px] font-semibold text-text-primary">{{ name }}</span>
      <span v-else class="block text-sm text-text-muted">Pick player</span>
    </span>
  </button>
  <button
    v-else
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
