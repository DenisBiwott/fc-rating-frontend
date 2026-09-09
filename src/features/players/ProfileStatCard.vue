<script setup lang="ts">
// The RECORD/STREAK/GOALS card shell, three call sites in PlayerProfileView.vue. Each card colors
// a different part (RECORD/GOALS color the sub-line, STREAK colors the value) so both are
// separate optional props rather than one fixed "accent" slot.
withDefaults(
  defineProps<{
    label: string
    value: string
    valueClass?: string
    subLabel: string
    subLabelClass?: string
  }>(),
  { valueClass: 'text-text-primary', subLabelClass: 'text-text-muted' },
)
</script>

<template>
  <div class="rounded-2xl border border-border-hairline bg-bg-raised px-3 py-2.75">
    <div class="font-mono text-[9px] tracking-[0.12em] text-text-muted">{{ label }}</div>
    <div class="mt-1.25 font-mono text-[19px] font-semibold tracking-[-0.02em]" :class="valueClass">
      {{ value }}
    </div>
    <div class="mt-0.5 font-mono text-[11px]" :class="subLabelClass">{{ subLabel }}</div>
  </div>
</template>
