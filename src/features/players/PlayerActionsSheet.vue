<script setup lang="ts">
// FC Rating UI.dc.html §2d. Rename/Deactivate go through the already-supported
// PATCH /players/:id; Delete is new (DELETE /players/:id, gated to zero-match players).
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { DeletePlayerError, useDeletePlayer } from '@/queries/useDeletePlayer'
import { useUpdatePlayer } from '@/queries/useUpdatePlayer'

const props = defineProps<{
  playerId: string
  name: string
  rank: number | null
  gamesPlayed: number
}>()

const open = defineModel<boolean>('open', { required: true })

type Mode = 'menu' | 'rename' | 'confirm-delete'
const mode = ref<Mode>('menu')
const renameValue = ref('')

const router = useRouter()
const updatePlayer = useUpdatePlayer()
const deletePlayer = useDeletePlayer()

watch(open, (isOpen) => {
  if (isOpen) {
    mode.value = 'menu'
    renameValue.value = props.name
    updatePlayer.reset()
    deletePlayer.reset()
  }
})

async function saveRename(): Promise<void> {
  const trimmed = renameValue.value.trim()
  if (trimmed.length < 2 || trimmed.length > 24 || trimmed === props.name) return
  try {
    await updatePlayer.mutateAsync({ id: props.playerId, name: trimmed })
    open.value = false
  } catch {
    // Surfaced via updatePlayer.isError/error below.
  }
}

async function deactivate(): Promise<void> {
  try {
    await updatePlayer.mutateAsync({ id: props.playerId, isActive: false })
    open.value = false
  } catch {
    // Surfaced via updatePlayer.isError/error below.
  }
}

async function confirmDelete(): Promise<void> {
  try {
    await deletePlayer.mutateAsync(props.playerId)
    open.value = false
    await router.push({ name: 'players' })
  } catch {
    // Surfaced via deletePlayer.isError/error below.
  }
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent title="Player actions">
      <div v-if="mode === 'menu'" class="flex flex-col gap-3.5">
        <div class="flex items-center justify-between pb-0.5">
          <div class="flex items-center gap-2.75">
            <span class="text-lg font-bold text-text-primary">{{ name }}</span>
            <span v-if="rank" class="font-mono text-[11px] text-text-muted">rank {{ rank }} · {{ gamesPlayed }} matches</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="flex h-13 items-center rounded-[14px] border border-border-control bg-bg-control px-4 text-base font-semibold text-text-primary"
            @click="mode = 'rename'"
          >
            Rename
          </button>
          <button
            type="button"
            class="flex flex-col items-start rounded-[14px] border border-border-control bg-bg-control px-4 py-2.5 text-left"
            :disabled="updatePlayer.isPending.value"
            @click="deactivate"
          >
            <span class="text-base font-semibold text-text-primary">Deactivate</span>
            <span class="text-[11px] text-text-muted">Hides from standings and match picker. Reversible.</span>
          </button>
          <button
            type="button"
            class="flex flex-col items-start rounded-[14px] border border-accent-down/30 bg-accent-down/5 px-4 py-2.5 text-left disabled:opacity-50"
            :disabled="gamesPlayed > 0"
            @click="mode = 'confirm-delete'"
          >
            <span class="text-base font-semibold text-accent-down">Delete player</span>
            <span class="text-[11px] text-text-muted">Only while they have no matches</span>
          </button>
        </div>

        <span
          v-if="updatePlayer.isError.value"
          class="text-xs text-accent-down"
        >
          Could not update player.
        </span>

        <button type="button" class="h-13 rounded-[14px] border border-border-default text-base font-semibold text-text-primary" @click="open = false">
          Cancel
        </button>
      </div>

      <div v-else-if="mode === 'rename'" class="flex flex-col gap-4">
        <span class="text-lg font-bold text-text-primary">Rename {{ name }}</span>
        <div class="flex flex-col gap-1.75">
          <span class="font-mono text-[10px] tracking-[0.14em] text-text-muted">NAME</span>
          <input
            v-model="renameValue"
            type="text"
            autofocus
            maxlength="24"
            class="h-13 rounded-[14px] border border-border-control bg-bg-control px-3.5 text-[17px] font-medium text-text-primary outline-none focus:border-accent-up"
            @keydown.enter="saveRename"
          />
          <span
            v-if="updatePlayer.isError.value && updatePlayer.error.value"
            class="text-xs text-accent-down"
          >
            Could not rename player — the name may already be taken.
          </span>
        </div>
        <button
          type="button"
          class="h-13 rounded-2xl bg-accent-up text-base font-bold text-accent-up-ink disabled:opacity-50"
          :disabled="renameValue.trim().length < 2 || renameValue.trim().length > 24 || updatePlayer.isPending.value"
          @click="saveRename"
        >
          {{ updatePlayer.isPending.value ? 'Saving…' : 'Save' }}
        </button>
        <button type="button" class="h-13 rounded-[14px] border border-border-default text-base font-semibold text-text-primary" @click="mode = 'menu'">
          Back
        </button>
      </div>

      <div v-else class="flex flex-col gap-4">
        <div>
          <span class="font-mono text-[10px] tracking-[0.16em] font-semibold text-accent-down">DELETE PLAYER</span>
          <p class="mt-1.5 text-lg font-bold text-text-primary">Delete {{ name }}? This can't be undone.</p>
        </div>
        <span
          v-if="deletePlayer.isError.value && deletePlayer.error.value instanceof DeletePlayerError"
          class="text-xs text-accent-down"
        >
          {{ deletePlayer.error.value.message }}
        </span>
        <button
          type="button"
          class="h-13 rounded-2xl bg-accent-down-solid text-base font-bold text-white disabled:opacity-50"
          :disabled="deletePlayer.isPending.value"
          @click="confirmDelete"
        >
          {{ deletePlayer.isPending.value ? 'Deleting…' : 'Delete player' }}
        </button>
        <button type="button" class="h-13 rounded-[14px] border border-border-default text-base font-semibold text-text-primary" @click="mode = 'menu'">
          Keep it
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
