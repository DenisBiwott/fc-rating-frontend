<script setup lang="ts">
// FC Rating UI.dc.html §2c. Deliberately NOT built: 2c's "starting rating override" control —
// dropped permanently, ratings are derived by replay and there's no per-player rating concept.
import { ref, watch } from 'vue'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { CreatePlayerError, useCreatePlayer } from '@/queries/useCreatePlayer'

const open = defineModel<boolean>('open', { required: true })

const name = ref('')
const createPlayer = useCreatePlayer()

const trimmedName = () => name.value.trim()
const canSubmit = () => trimmedName().length >= 2 && trimmedName().length <= 24 && !createPlayer.isPending.value

watch(open, (isOpen) => {
  if (isOpen) {
    name.value = ''
    createPlayer.reset()
  }
})

async function submit(): Promise<void> {
  if (!canSubmit()) return
  try {
    await createPlayer.mutateAsync({ name: trimmedName() })
    open.value = false
  } catch {
    // Surfaced via createPlayer.isError/error in the template — nothing more to do here.
  }
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent title="Add player">
      <div class="flex items-center justify-between">
        <span class="text-lg font-bold text-text-primary">Add player</span>
        <button type="button" class="text-sm text-text-secondary" @click="open = false">Cancel</button>
      </div>

      <div class="flex flex-col gap-1.75">
        <span class="font-mono text-[10px] tracking-[0.14em] text-text-muted">NAME</span>
        <input
          v-model="name"
          type="text"
          autofocus
          maxlength="24"
          placeholder="Player name"
          class="h-13 rounded-[14px] border border-border-control bg-bg-control px-3.5 text-[17px] font-medium text-text-primary outline-none focus:border-accent-up"
          @keydown.enter="submit"
        />
        <span class="text-xs text-text-faint">Must be unique. 2–24 characters.</span>
        <span
          v-if="createPlayer.isError.value && createPlayer.error.value instanceof CreatePlayerError"
          class="text-xs text-accent-down"
        >
          {{ createPlayer.error.value.message }}
        </span>
      </div>

      <button
        type="button"
        class="h-14 rounded-2xl bg-accent-up text-[17px] font-bold text-accent-up-ink shadow-[0_12px_30px_-12px_rgba(52,211,153,0.6)] disabled:opacity-50"
        :disabled="!canSubmit()"
        @click="submit"
      >
        {{ createPlayer.isPending.value ? 'Adding…' : `Add ${trimmedName() || 'player'}` }}
      </button>
    </SheetContent>
  </Sheet>
</template>
