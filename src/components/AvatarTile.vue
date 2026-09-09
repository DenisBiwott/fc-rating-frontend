<script setup lang="ts">
// Circular initials tile, 1-2px border, initials in 700 weight (design-spec.md's Avatars spec).
// Medal colors apply to ranks 1-3's border+text only; a dashed border marks an unrated (zero-game)
// player.
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number
    // `| undefined` is explicit, not redundant: with exactOptionalPropertyTypes, `medal?: T`
    // alone forbids passing a literal `undefined` (only omitting the prop is allowed) — but
    // callers commonly pass a computed ref that's `T | undefined`, not omit the attribute.
    medal?: 'gold' | 'silver' | 'bronze' | undefined
    dashed?: boolean
  }>(),
  { size: 32 },
)

const initials = computed(() => {
  const words = props.name.trim().split(/\s+/)
  if (words.length >= 2 && words[0] && words[1]) {
    return (words[0][0]! + words[1][0]!).toUpperCase()
  }
  return props.name.slice(0, 2).toUpperCase()
})

const medalColor: Record<'gold' | 'silver' | 'bronze', string> = {
  gold: 'var(--color-medal-gold)',
  silver: 'var(--color-medal-silver)',
  bronze: 'var(--color-medal-bronze)',
}
</script>

<template>
  <span
    class="flex flex-none items-center justify-center rounded-full border border-border-default bg-bg-control font-bold text-text-secondary"
    :class="dashed ? 'border-dashed' : ''"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${Math.round(size * 0.375)}px`,
      borderColor: medal ? medalColor[medal] : undefined,
      color: medal ? medalColor[medal] : undefined,
    }"
  >
    {{ initials }}
  </span>
</template>
