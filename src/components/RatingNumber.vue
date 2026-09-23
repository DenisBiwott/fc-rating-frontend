<script setup lang="ts">
// Mono, tabular, animates old -> new over ~700ms via requestAnimationFrame — never a CSS
// transition on text content (DESIGN-SPEC.md's RatingNumber spec). Rounds to integer at render
// only; only animates on a value *change*, not on initial mount.
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{ value: number }>()

const displayed = ref(Math.round(props.value))
let rafId: number | null = null

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function animateTo(target: number): void {
  if (rafId !== null) cancelAnimationFrame(rafId)
  if (prefersReducedMotion()) {
    displayed.value = Math.round(target)
    return
  }
  const start = displayed.value
  const startTime = performance.now()
  const duration = 700

  const tick = (now: number): void => {
    const t = Math.min(1, (now - startTime) / duration)
    const eased = 1 - (1 - t) * (1 - t) // ease-out
    displayed.value = Math.round(start + (target - start) * eased)
    rafId = t < 1 ? requestAnimationFrame(tick) : null
  }
  rafId = requestAnimationFrame(tick)
}

watch(
  () => props.value,
  (next, prev) => {
    if (next !== prev) animateTo(next)
  },
)

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <span class="font-mono tabular-nums">{{ displayed }}</span>
</template>
