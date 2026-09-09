<script setup lang="ts">
// design-spec.md §2 "LiveSessionBanner": inset card, green hairline border, a pulsing-radius dot
// (no animation — the box-shadow ring is static per the "nothing pulses" motion rule), elapsed
// time in mono green.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  sessionName: string
  startedAt: string
  matchCount: number
  biggestMover: { name: string; delta: number } | null
}>()

const now = ref(Date.now())
let intervalId: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  intervalId = setInterval(() => {
    now.value = Date.now()
  }, 60_000)
})
onBeforeUnmount(() => {
  clearInterval(intervalId)
})

const elapsed = computed(() => {
  const ms = Math.max(0, now.value - new Date(props.startedAt).getTime())
  const totalMinutes = Math.floor(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
})
</script>

<template>
  <div
    class="mx-5 mb-3 flex items-center gap-3 rounded-xl border p-4"
    style="
      background: linear-gradient(90deg, rgba(52, 211, 153, 0.1), rgba(52, 211, 153, 0.02));
      border-color: rgba(52, 211, 153, 0.3);
    "
  >
    <span
      class="h-[7px] w-[7px] flex-none rounded-full bg-accent-up"
      style="box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.16)"
    />
    <div class="min-w-0 flex-1">
      <div class="text-sm font-medium text-text-primary">{{ sessionName }} · open</div>
      <div class="truncate font-mono text-xs text-text-muted">
        {{ matchCount }} matches<template v-if="biggestMover">
          · biggest mover {{ biggestMover.name }}
          {{ biggestMover.delta > 0 ? '+' : '−' }}{{ Math.abs(biggestMover.delta) }}</template
        >
      </div>
    </div>
    <span class="flex-none font-mono text-xs text-accent-up">{{ elapsed }}</span>
  </div>
</template>
