<script setup lang="ts">
// DESIGN-SPEC.md §6 "Hover / focus" menus: bg/control surface, border/control border, deep shadow.
// reka-ui's DropdownMenu (already a dependency, like the Sheet) brings keyboard navigation,
// typeahead, Escape and click-outside. Right-aligned under its trigger by default, as in 3c.
import { DropdownMenuContent, DropdownMenuPortal } from 'reka-ui'
import { cn } from '@/lib/utils'

withDefaults(defineProps<{ class?: string; align?: 'start' | 'center' | 'end' }>(), { align: 'end' })
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent
      :align="align"
      :side-offset="6"
      :class="
        cn(
          'z-50 flex min-w-55 flex-col rounded-xl border border-border-control bg-bg-control p-1.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.9)] focus:outline-none',
          $props.class,
        )
      "
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
