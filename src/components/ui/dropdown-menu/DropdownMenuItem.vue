<script setup lang="ts">
// A 38px menu row (DESIGN-SPEC.md §6). `destructive`: coral text on a faint coral wash.
import { DropdownMenuItem } from 'reka-ui'

defineProps<{ destructive?: boolean; disabled?: boolean }>()
const emit = defineEmits<{ select: [event: Event] }>()
</script>

<template>
  <DropdownMenuItem
    :disabled="disabled"
    class="flex h-9.5 cursor-pointer items-center rounded-lg px-2.5 text-[13px] outline-none select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40"
    :class="
      destructive
        ? 'bg-[rgba(244,113,89,0.08)] font-semibold text-text-down data-[highlighted]:bg-[rgba(244,113,89,0.16)]'
        : 'text-text-emphasis data-[highlighted]:bg-bg-raised'
    "
    @select="emit('select', $event)"
  >
    <slot />
  </DropdownMenuItem>
</template>
