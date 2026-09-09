<script setup lang="ts">
// design-spec.md's ScoreStepper spec: one card, [-][value][+] per side, value tappable to type,
// range 0-20 (enforced by the composable's incrementScore/decrementScore/setScore).
import { ref } from 'vue'

const props = defineProps<{
  homeScore: number
  awayScore: number
}>()

const emit = defineEmits<{
  incrementHome: []
  decrementHome: []
  incrementAway: []
  decrementAway: []
  setHome: [value: number]
  setAway: [value: number]
}>()

const editingSide = ref<'home' | 'away' | null>(null)
const editValue = ref('')

function startEdit(side: 'home' | 'away'): void {
  editingSide.value = side
  editValue.value = String(side === 'home' ? props.homeScore : props.awayScore)
}
function commitEdit(): void {
  if (editingSide.value === 'home') emit('setHome', Number(editValue.value))
  else if (editingSide.value === 'away') emit('setAway', Number(editValue.value))
  editingSide.value = null
}
</script>

<template>
  <div class="mx-5 flex items-center justify-center gap-3 rounded-2xl bg-bg-raised p-3.5">
    <button
      type="button"
      class="h-11 w-11 flex-none rounded-xl border border-border-control bg-bg-control text-xl text-text-primary"
      aria-label="Decrease home score"
      @click="emit('decrementHome')"
    >
      −
    </button>
    <input
      v-if="editingSide === 'home'"
      v-model="editValue"
      type="number"
      inputmode="numeric"
      autofocus
      class="w-10 bg-transparent text-center font-mono text-[42px] font-bold text-text-primary outline-none"
      @blur="commitEdit"
      @keyup.enter="commitEdit"
    />
    <button
      v-else
      type="button"
      class="w-10 flex-none text-center font-mono text-[42px] font-bold text-text-primary"
      aria-label="Home score, tap to type"
      @click="startEdit('home')"
    >
      {{ homeScore }}
    </button>
    <button
      type="button"
      class="h-11 w-11 flex-none rounded-xl border border-border-control bg-bg-control text-xl text-text-primary"
      aria-label="Increase home score"
      @click="emit('incrementHome')"
    >
      +
    </button>

    <span class="px-1 font-mono text-lg text-text-faint">:</span>

    <button
      type="button"
      class="h-11 w-11 flex-none rounded-xl border border-border-control bg-bg-control text-xl text-text-primary"
      aria-label="Decrease away score"
      @click="emit('decrementAway')"
    >
      −
    </button>
    <input
      v-if="editingSide === 'away'"
      v-model="editValue"
      type="number"
      inputmode="numeric"
      autofocus
      class="w-10 bg-transparent text-center font-mono text-[42px] font-bold text-text-primary outline-none"
      @blur="commitEdit"
      @keyup.enter="commitEdit"
    />
    <button
      v-else
      type="button"
      class="w-10 flex-none text-center font-mono text-[42px] font-bold text-text-primary"
      aria-label="Away score, tap to type"
      @click="startEdit('away')"
    >
      {{ awayScore }}
    </button>
    <button
      type="button"
      class="h-11 w-11 flex-none rounded-xl border border-border-control bg-bg-control text-xl text-text-primary"
      aria-label="Increase away score"
      @click="emit('incrementAway')"
    >
      +
    </button>
  </div>
</template>
