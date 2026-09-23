<script setup lang="ts">
// DESIGN-SPEC.md AddPlayer: Name (unique, 2–24 chars, focused on open), a one-line provisional
// note, and a CTA reading `Add {name}`. Shared by the phone/tablet sheet and the desktop popover
// (3d, `compact`: 46px field and CTA with an ↵ hint). Its containers unmount it while closed, so
// every open starts empty. The mock's note ends "ranked last until then", but only unrated
// (0-game) players rank last; provisional ones rank by rating, so the note leaves that out.
// Deliberately NOT built: the "Starting rating" override row — dropped permanently, ratings are
// derived by replay and there's no per-player rating concept.
import { computed, ref } from 'vue'
import KeyHint from '@/components/KeyHint.vue'
import { CreatePlayerError, useCreatePlayer } from '@/queries/useCreatePlayer'
import { useLeaderboard } from '@/queries/useLeaderboard'

defineProps<{ compact?: boolean }>()
const emit = defineEmits<{ added: [] }>()

const name = ref('')
const nameInput = ref<HTMLInputElement | null>(null)
const createPlayer = useCreatePlayer()
const { data: leaderboard } = useLeaderboard()
const provisionalGames = computed(() => leaderboard.value?.ratingConfig.provisionalGames ?? null)

const trimmedName = computed(() => name.value.trim())
const canSubmit = computed(
  () => trimmedName.value.length >= 2 && trimmedName.value.length <= 24 && !createPlayer.isPending.value,
)

async function submit(): Promise<void> {
  if (!canSubmit.value) return
  try {
    await createPlayer.mutateAsync({ name: trimmedName.value })
    emit('added')
  } catch {
    // Surfaced via createPlayer.isError/error in the template — nothing more to do here.
  }
}

defineExpose({ focus: () => nameInput.value?.focus() })
</script>

<template>
  <div class="flex flex-col" :class="compact ? 'gap-3.5' : 'gap-4'">
    <div class="flex flex-col gap-1.5">
      <label for="add-player-name" class="font-mono text-[10px] tracking-[0.14em] text-text-muted">NAME</label>
      <input
        id="add-player-name"
        ref="nameInput"
        v-model="name"
        type="text"
        maxlength="24"
        autocomplete="off"
        placeholder="Player name"
        class="border border-border-control bg-bg-control font-medium text-text-primary outline-none focus:border-accent-up"
        :class="compact ? 'h-11.5 rounded-xl px-3.25 text-base' : 'h-13 rounded-[14px] px-3.5 text-[17px]'"
        @keydown.enter="submit"
      />
      <span class="text-xs text-text-faint">Must be unique. 2–24 characters.</span>
      <span
        v-if="createPlayer.isError.value && createPlayer.error.value instanceof CreatePlayerError"
        role="alert"
        class="text-xs text-text-down"
      >
        {{ createPlayer.error.value.message }}
      </span>
    </div>

    <p v-if="provisionalGames" class="text-xs text-pretty text-text-secondary">
      Provisional for their first {{ provisionalGames }} matches — bigger rating swings until then.
    </p>

    <button
      type="button"
      class="flex items-center justify-center gap-2.5 bg-accent-up font-bold text-accent-up-ink disabled:opacity-50"
      :class="
        compact
          ? 'h-11.5 rounded-xl text-[15px]'
          : 'h-14 rounded-2xl text-[17px] shadow-[0_12px_30px_-12px_rgba(52,211,153,0.6)]'
      "
      :disabled="!canSubmit"
      @click="submit"
    >
      {{ createPlayer.isPending.value ? 'Adding…' : `Add ${trimmedName || 'player'}` }}
      <KeyHint v-if="compact" on-green>↵</KeyHint>
    </button>
  </div>
</template>
