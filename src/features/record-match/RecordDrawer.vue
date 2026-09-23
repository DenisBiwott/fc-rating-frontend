<script setup lang="ts">
// The Record panel as a right-side drawer, for desktop screens other than the leaderboard
// (DESIGN-SPEC.md §6: "Rail Record button on non-leaderboard screens opens the panel as a
// right-side drawer over content"). Same form as the docked panel; Done closes it. Built on reka's
// Dialog, like SheetContent, for the focus trap, Escape and backdrop-click close.
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, VisuallyHidden } from 'reka-ui'
import RecordMatchForm from './RecordMatchForm.vue'
import { useRecordLauncher } from './useRecordLauncher'

const { drawerOpen } = useRecordLauncher()

// reka would focus the first focusable element (the Clear button); the form moves focus to the
// first pickable player itself once it mounts.
function keepFormFocus(event: Event): void {
  event.preventDefault()
}
</script>

<template>
  <DialogRoot v-model:open="drawerOpen">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-40 bg-black/50 opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100"
      />
      <DialogContent
        class="fixed inset-y-0 right-0 z-50 w-105 translate-x-full overflow-hidden border-l border-border-nav shadow-[-24px_0_60px_-20px_rgba(0,0,0,0.85)] transition-[translate] duration-200 ease-out focus:outline-none data-[state=open]:translate-x-0"
        @open-auto-focus="keepFormFocus"
      >
        <VisuallyHidden as-child>
          <DialogTitle>Record match</DialogTitle>
        </VisuallyHidden>
        <RecordMatchForm variant="panel" @done="drawerOpen = false" />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
