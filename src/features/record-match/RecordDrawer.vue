<script setup lang="ts">
// The Record drawer on every desktop page (DESIGN-SPEC.md §6 "Turn 4 revisions", 4b): 420px,
// bg-drawer, sliding over the page's right column (on the leaderboard, LATEST) while the table
// stays put. A scrim dims the rest of the main area, not the rail; clicking it or pressing Esc
// closes the drawer. Opened from the rail, `R`, LATEST's button, a profile's "Record with {name}",
// or /record on a desktop window (useRecordLauncher). Built on reka's Dialog, like SheetContent,
// for the focus trap, Escape and outside-click close.
//
// The content column is centred and capped at 1352px (App.vue), so on screens wider than 1440 the
// drawer is inset by the same margin, keeping it over the right column rather than the gutter.
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, VisuallyHidden } from 'reka-ui'
import RecordMatchForm from './RecordMatchForm.vue'
import { useRecordLauncher } from './useRecordLauncher'

const { drawerOpen } = useRecordLauncher()

// reka would focus the first focusable element; the form moves focus to the first pickable player
// itself once it mounts.
function keepFormFocus(event: Event): void {
  event.preventDefault()
}
</script>

<template>
  <DialogRoot v-model:open="drawerOpen">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-y-0 right-0 left-22 z-40 bg-[rgba(8,8,10,0.55)] opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100 motion-reduce:transition-none"
      />
      <DialogContent
        class="fixed inset-y-0 right-[max(0px,calc((100vw-88px-1352px)/2))] z-50 w-105 translate-x-4 overflow-hidden border-l border-border-default opacity-0 shadow-[-30px_0_60px_-20px_rgba(0,0,0,0.9)] transition-[translate,opacity] duration-200 ease-out focus:outline-none data-[state=open]:translate-x-0 data-[state=open]:opacity-100 motion-reduce:transition-none"
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
