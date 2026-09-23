<script setup lang="ts">
// DESIGN-SPEC.md AddPlayer (3d): a raised card anchored under its trigger, right-aligned, with a
// deep shadow. reka-ui's Popover brings Escape, click-outside and returning focus to the trigger.
// `openAutoFocus` is re-emitted so a caller can focus a field instead of the first focusable.
import { PopoverContent, PopoverPortal } from 'reka-ui'
import { cn } from '@/lib/utils'

withDefaults(defineProps<{ class?: string; align?: 'start' | 'center' | 'end' }>(), { align: 'end' })
const emit = defineEmits<{ openAutoFocus: [event: Event] }>()
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      :align="align"
      :side-offset="12"
      :class="
        cn(
          'z-50 rounded-[18px] border border-border-control bg-bg-raised p-4.5 shadow-[0_30px_60px_-16px_rgba(0,0,0,0.9)] focus:outline-none',
          $props.class,
        )
      "
      @open-auto-focus="emit('openAutoFocus', $event)"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
