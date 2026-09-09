<script setup lang="ts">
// Bottom sheet chrome shared by 2c (add player) and 2d (player actions) — FC Rating UI.dc.html.
// Built on reka-ui's Dialog primitive (already a dependency, `components/ui/` per
// docs/ARCHITECTURE.md is "shadcn-vue, pulled in per-component as screens need them"): free focus
// trap, Escape-to-close, and backdrop-click-to-close, which the record-match flow's hand-rolled
// ResultOverlay.vue has to manage itself.
import { DialogContent, DialogOverlay, DialogPortal, DialogTitle, VisuallyHidden } from 'reka-ui'
import { cn } from '@/lib/utils'

defineProps<{ title: string; class?: string }>()
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="fixed inset-0 z-40 bg-black/60 opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100"
    />
    <DialogContent
      :class="
        cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] translate-y-full flex-col gap-4 rounded-t-3xl border-t border-border-default bg-bg-raised px-5 pt-3 pb-7 shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.85)] transition-transform duration-200 ease-out data-[state=open]:translate-y-0 focus:outline-none',
          $props.class,
        )
      "
    >
      <span class="mx-auto h-1 w-10 flex-none rounded-full bg-border-control" aria-hidden="true" />
      <VisuallyHidden as-child>
        <DialogTitle>{{ title }}</DialogTitle>
      </VisuallyHidden>
      <slot />
    </DialogContent>
  </DialogPortal>
</template>
