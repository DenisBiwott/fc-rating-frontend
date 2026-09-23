<script setup lang="ts">
// The small W/L/D colored square — extracted from FormStrip.vue's per-chip markup (its first
// real second use site is ProfileMatchRow.vue) so the color mapping lives in one place.
type MatchResult = 'W' | 'L' | 'D'

// fontSize is a separate prop (applied via inline style, not a passed-in class) rather than left
// for a caller to override with a class — two conflicting Tailwind text-[...] utilities on the
// same element resolve by generated-stylesheet order, not DOM order, which is exactly the
// class-cascade trap this project already got bitten by once on the layout-squish fix.
defineProps<{ result: MatchResult; size?: number; fontSize?: number }>()

const chipClasses: Record<MatchResult, string> = {
  W: 'bg-[rgba(52,211,153,0.16)] text-text-up-bright',
  L: 'bg-[rgba(244,113,89,0.16)] text-accent-down',
  D: 'bg-[rgba(161,161,170,0.16)] text-text-secondary',
}
</script>

<template>
  <span
    class="flex flex-none items-center justify-center rounded font-mono font-bold"
    :class="chipClasses[result]"
    :style="{ width: `${size ?? 20}px`, height: `${size ?? 20}px`, fontSize: `${fontSize ?? 11}px` }"
  >
    {{ result }}
  </span>
</template>
