// An element's live content width, via ResizeObserver: container-relative decisions (like which
// leaderboard columns fit) rather than viewport-relative ones.
import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

export function useElementWidth(target: Ref<HTMLElement | null>): Ref<number> {
  const width = ref(0)
  const observer = new ResizeObserver(([entry]) => {
    if (entry) width.value = entry.contentRect.width
  })

  watch(
    target,
    (el, previous) => {
      if (previous) observer.unobserve(previous)
      if (el) {
        width.value = el.getBoundingClientRect().width
        observer.observe(el)
      }
    },
    { immediate: true },
  )
  onBeforeUnmount(() => observer.disconnect())

  return width
}
