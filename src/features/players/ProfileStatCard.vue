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
    /** Desktop (3c): 14px padding, 10px label, 22px value, 12px sub-line. */
    large?: boolean
  }>(),
  { valueClass: 'text-text-primary', subLabelClass: 'text-text-muted' },
)
</script>

<template>
  <div
    class="rounded-2xl bg-bg-raised"
    :class="large ? 'border border-border-default p-3.5' : 'border border-border-hairline px-3 py-2.75'"
  >
    <div class="font-mono tracking-[0.12em] text-text-muted" :class="large ? 'text-[10px]' : 'text-[9px]'">{{ label }}</div>
    <div
      class="font-mono font-semibold tracking-[-0.02em]"
      :class="[large ? 'mt-1.5 text-[22px]' : 'mt-1.25 text-[19px]', valueClass]"
    >
      {{ value }}
    </div>
    <div class="mt-0.5 font-mono" :class="[large ? 'text-xs' : 'text-[11px]', subLabelClass]">{{ subLabel }}</div>
  </div>
</template>
