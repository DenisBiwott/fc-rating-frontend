<script setup lang="ts">
// Circular initials tile, 1-2px border, initials in 700 weight (DESIGN-SPEC.md's Avatars spec).
// Medal colors apply to ranks 1-3's border+text only; a dashed border marks an unrated (zero-game)
// player.
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number
    /** Size once the nearest `@container` is 640px or wider, for the tablet leaderboard rows (3f:
     *  38 vs 32). A container query, not the viewport: the same rows sit in a narrow column beside
     *  the desktop Record panel. Applied through CSS variables, so no JS state is needed. */
    tabletSize?: number | undefined
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
    class="flex h-(--av) w-(--av) flex-none items-center justify-center rounded-full border border-border-default bg-bg-control text-(length:--av-font) font-bold text-text-secondary @min-[640px]:h-(--av-sm) @min-[640px]:w-(--av-sm) @min-[640px]:text-(length:--av-font-sm)"
    :class="dashed ? 'border-dashed' : ''"
    :style="{
      '--av': `${size}px`,
      '--av-font': `${Math.round(size * 0.375)}px`,
      '--av-sm': `${tabletSize ?? size}px`,
      '--av-font-sm': `${Math.round((tabletSize ?? size) * 0.375)}px`,
      borderColor: medal ? medalColor[medal] : undefined,
      color: medal ? medalColor[medal] : undefined,
    }"
  >
    {{ initials }}
  </span>
</template>
