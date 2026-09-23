<script setup lang="ts">
// FC Rating UI.dc.html §2c: the phone/tablet container for AddPlayerForm (a bottom sheet, a
// centred dialog from sm). Desktop uses AddPlayerPopover instead (3d).
import { nextTick, ref } from 'vue'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import AddPlayerForm from './AddPlayerForm.vue'

const open = defineModel<boolean>('open', { required: true })
const form = ref<InstanceType<typeof AddPlayerForm> | null>(null)

// DESIGN-SPEC.md AddPlayer: Name is "focused on open". reka would focus Cancel (first in the DOM).
function focusName(event: Event): void {
  event.preventDefault()
  void nextTick(() => form.value?.focus())
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent title="Add player" @open-auto-focus="focusName">
      <div class="flex items-center justify-between">
        <span class="text-lg font-bold text-text-primary">Add player</span>
        <button type="button" class="text-sm text-text-secondary" @click="open = false">Cancel</button>
      </div>
      <AddPlayerForm ref="form" @added="open = false" />
    </SheetContent>
  </Sheet>
</template>
