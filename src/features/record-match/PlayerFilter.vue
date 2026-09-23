<script setup lang="ts">
// The record form's name filter (DESIGN-SPEC.md §6 "Turn 4 revisions", 4c drawer / 4d phone). It
// replaces the player grid while open: a focused field (⌕, Back) over the active players whose
// names match, with the matched letters in text-up-bright and PROV/UNRATED badges. Already-picked
// players aren't listed. Opened by the All tile, or on desktop by typing any letter (that letter
// becomes the first character here).
//
// Keyboard: ↑ ↓ move the highlighted row, ↵ picks it, Esc goes back to the grid. Esc stops here
// so it doesn't also close the drawer. A combobox: focus stays in the field and the highlight is
// announced through aria-activedescendant.
import { computed, onMounted, ref, useId, watch } from 'vue'
import AvatarTile from '@/components/AvatarTile.vue'
import KeyHint from '@/components/KeyHint.vue'
import RatingNumber from '@/components/RatingNumber.vue'
import { matchPlayers } from './playerPicker'

export interface FilterPlayerInfo {
  rating: number | null
  /** "PROV 4/10" or "UNRATED", or null for an established player. */
  badge: string | null
}

const props = withDefaults(
  defineProps<{
    players: Array<{ id: string; name: string }>
    selectedIds: string[]
    infoById: Map<string, FilterPlayerInfo>
    initialQuery?: string
    /** The desktop drawer: ↵ chip on the highlighted row and the usage hint under the list. */
    panel?: boolean
  }>(),
  { initialQuery: '', panel: false },
)
const emit = defineEmits<{ pick: [playerId: string]; close: [] }>()

const query = ref(props.initialQuery)
const highlighted = ref(0)
const input = ref<HTMLInputElement | null>(null)
const listId = useId()

const results = computed(() =>
  matchPlayers(
    props.players.filter((p) => !props.selectedIds.includes(p.id)),
    query.value,
  ),
)
watch(query, () => {
  highlighted.value = 0
})

function parts(name: string, range: [number, number] | null): Array<{ text: string; hit: boolean }> {
  if (!range) return [{ text: name, hit: false }]
  return [
    { text: name.slice(0, range[0]), hit: false },
    { text: name.slice(range[0], range[1]), hit: true },
    { text: name.slice(range[1]), hit: false },
  ].filter((part) => part.text !== '')
}

const NO_INFO: FilterPlayerInfo = { rating: null, badge: null }
function info(playerId: string): FilterPlayerInfo {
  return props.infoById.get(playerId) ?? NO_INFO
}

function optionId(index: number): string {
  return `${listId}-${index}`
}

function onKeydown(event: KeyboardEvent): void {
  const count = results.value.length
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      event.preventDefault()
      if (count === 0) return
      highlighted.value = (highlighted.value + (event.key === 'ArrowDown' ? 1 : -1) + count) % count
      document.getElementById(optionId(highlighted.value))?.scrollIntoView({ block: 'nearest' })
      return
    case 'Enter': {
      event.preventDefault()
      const match = results.value[highlighted.value]
      if (match) emit('pick', match.player.id)
      return
    }
    case 'Escape':
      event.preventDefault()
      event.stopPropagation()
      emit('close')
      return
  }
}

onMounted(() => {
  input.value?.focus()
  // Put the caret after the letter the user already typed.
  input.value?.setSelectionRange(query.value.length, query.value.length)
})
</script>

<template>
  <div class="flex flex-col gap-2 px-5 py-3">
    <div class="flex h-11.5 items-center gap-2.5 rounded-xl border border-accent-up bg-bg-control px-3">
      <span aria-hidden="true" class="font-mono text-xs text-text-faint">⌕</span>
      <input
        ref="input"
        v-model="query"
        type="text"
        role="combobox"
        aria-label="Find a player"
        aria-autocomplete="list"
        :aria-expanded="true"
        :aria-controls="listId"
        :aria-activedescendant="results.length ? optionId(highlighted) : undefined"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="Type a name"
        class="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-text-primary outline-none placeholder:text-text-faint"
        @keydown="onKeydown"
      />
      <button type="button" class="flex-none text-xs text-text-secondary hover:text-text-primary" @click="emit('close')">
        {{ panel ? 'Back to recent' : 'Back' }}
      </button>
    </div>

    <ul
      v-if="results.length > 0"
      :id="listId"
      role="listbox"
      aria-label="Matching players"
      class="flex max-h-78 flex-col overflow-y-auto rounded-xl border border-border-default"
    >
      <li
        v-for="(match, index) in results"
        :id="optionId(index)"
        :key="match.player.id"
        role="option"
        :aria-selected="index === highlighted"
        class="flex flex-none cursor-pointer items-center gap-2.75 px-3"
        :class="[panel ? 'h-12.5' : 'h-13', index === highlighted ? 'bg-bg-control' : '', index > 0 ? 'border-t border-border-hairline' : '']"
        @mousedown.prevent
        @mousemove="highlighted = index"
        @click="emit('pick', match.player.id)"
      >
        <AvatarTile :name="match.player.name" :size="32" :dashed="info(match.player.id).badge === 'UNRATED'" />
        <span class="min-w-0 flex-1 truncate text-[15px] font-semibold text-text-primary">
          <span v-for="(part, i) in parts(match.player.name, match.range)" :key="i" :class="part.hit ? 'text-text-up-bright' : ''">{{
            part.text
          }}</span>
        </span>
        <span
          v-if="info(match.player.id).badge"
          class="flex-none rounded border border-neutral-quiet px-1 py-px font-mono text-[9px] tracking-[0.08em] whitespace-nowrap text-text-secondary"
        >
          {{ info(match.player.id).badge }}
        </span>
        <RatingNumber
          v-else-if="info(match.player.id).rating !== null"
          :value="info(match.player.id).rating ?? 0"
          class="flex-none text-xs text-text-muted"
        />
        <KeyHint v-if="panel && index === highlighted">↵</KeyHint>
      </li>
    </ul>
    <p v-else class="rounded-xl border border-border-default px-3 py-3.5 text-[13px] text-text-muted">
      No active player matches “{{ query.trim() }}”.
    </p>

    <p v-if="panel" class="text-xs text-text-faint">
      Searches all active players. ↑ ↓ to move, ↵ to pick. Inactive players aren't listed; reactivate
      them in Players.
    </p>
  </div>
</template>
