import { onBeforeUnmount, onMounted, readonly, ref, type Ref } from 'vue'

/** `Date.now()`, refreshed every `intervalMs` while the calling component is mounted — for "3h ago"-style labels. */
export function useNow(intervalMs = 60_000): Readonly<Ref<number>> {
  const now = ref(Date.now())
  let intervalId: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    intervalId = setInterval(() => {
      now.value = Date.now()
    }, intervalMs)
  })
  onBeforeUnmount(() => {
    clearInterval(intervalId)
  })

  return readonly(now)
}
