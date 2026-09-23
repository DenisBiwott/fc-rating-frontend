<script setup lang="ts">
// DESIGN-SPEC.md AddPlayer, desktop (3d): a 360px popover anchored under the header's
// "+ Add player" button, which is its trigger. Esc closes it (the chip says so); ↵ adds.
import { nextTick, ref } from 'vue'
import KeyHint from '@/components/KeyHint.vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import AddPlayerForm from './AddPlayerForm.vue'

const open = defineModel<boolean>('open', { required: true })
const form = ref<InstanceType<typeof AddPlayerForm> | null>(null)

function focusName(event: Event): void {
  event.preventDefault()
  void nextTick(() => form.value?.focus())
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <slot />
    </PopoverTrigger>
    <PopoverContent class="flex w-90 flex-col gap-3.5" aria-label="Add player" @open-auto-focus="focusName">
      <div class="flex items-center justify-between">
        <span class="text-base font-bold text-text-primary">Add player</span>
        <KeyHint>esc</KeyHint>
      </div>
      <AddPlayerForm ref="form" compact @added="open = false" />
    </PopoverContent>
  </Popover>
</template>
