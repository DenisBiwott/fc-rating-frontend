<script setup lang="ts">
// FC Rating UI.dc.html §2e — recalculated ratings shown before the admin confirms voiding.
// A fixed reason rather than a free-text field: the canvas doesn't show one, and adding one is a
// small, easy follow-up if it's ever actually wanted.
import { computed, watch } from 'vue'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useVoidMatch } from '@/queries/useVoidMatch'
import { useVoidMatchPreview } from '@/queries/useVoidMatchPreview'

const props = defineProps<{
  matchId: string
  opponentName: string
  selfScore: number
  opponentScore: number
}>()

const open = defineModel<boolean>('open', { required: true })

const { data: preview, isPending: previewPending } = useVoidMatchPreview(props.matchId, open)
const voidMatch = useVoidMatch()

watch(open, (isOpen) => {
  if (isOpen) voidMatch.reset()
})

const scoreLabel = computed(() => `${props.selfScore}–${props.opponentScore}`)

async function confirmVoid(): Promise<void> {
  try {
    await voidMatch.mutateAsync({ matchId: props.matchId, reason: 'Recorded in error' })
    open.value = false
  } catch {
    // Surfaced via voidMatch.isError/error below.
  }
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent title="Void match">
      <div>
        <span class="font-mono text-[10px] font-semibold tracking-[0.16em] text-accent-down">VOID MATCH</span>
        <p class="mt-1.5 text-lg font-bold text-text-primary">Remove {{ scoreLabel }} vs {{ opponentName }}?</p>
      </div>

      <p v-if="previewPending" class="font-mono text-sm text-text-muted">Calculating…</p>

      <div v-else-if="preview" class="flex flex-col gap-2 rounded-[14px] border border-border-hairline bg-bg-control p-3.5">
        <span class="font-mono text-[10px] tracking-[0.12em] text-text-muted">RATINGS AFTER RECALC</span>
        <div v-for="player in preview.players" :key="player.playerId" class="flex items-center justify-between">
          <span class="text-sm font-medium text-text-primary">{{ player.name }}</span>
          <span class="font-mono text-[13px] text-text-secondary">
            {{ Math.round(player.ratingBefore) }} &rarr;
            <span
              class="font-semibold"
              :class="player.ratingAfter >= player.ratingBefore ? 'text-accent-up-bright' : 'text-accent-down'"
            >
              {{ Math.round(player.ratingAfter) }}
            </span>
          </span>
        </div>
      </div>

      <span v-if="voidMatch.isError.value" class="text-xs text-accent-down">Could not void this match.</span>

      <div class="flex flex-col gap-2.5">
        <button
          type="button"
          class="h-13 rounded-2xl bg-accent-down-solid text-base font-bold text-white disabled:opacity-50"
          :disabled="voidMatch.isPending.value"
          @click="confirmVoid"
        >
          {{ voidMatch.isPending.value ? 'Voiding…' : 'Void and recalculate' }}
        </button>
        <button
          type="button"
          class="h-12.5 rounded-[14px] border border-border-default text-base font-semibold text-text-primary"
          @click="open = false"
        >
          Keep it
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
