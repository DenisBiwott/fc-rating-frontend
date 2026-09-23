// Desktop keyboard for the Record drawer (DESIGN-SPEC.md §6 "Keyboard"). Handles keys pressed while
// focus is anywhere inside the drawer's form:
//   ← →        switch the active slot (which slot a pick fills; which score ↑↓ adjusts)
//   letter     selecting: focus the next player whose name starts with it (↵ then picks them)
//   ↑ ↓        selecting: move through the players · scoring: change the active side's score
//   ↵          scoring: confirm (on a focused button, the button's own action runs instead)
// Esc isn't handled here: reka's Dialog closes the drawer.
// `R` to open the panel lives outside it (useRecordLauncher's global shortcut), and in the result
// state the overlay handles its own keys. So inside the panel every letter, R included, picks.
import type { Ref } from 'vue'
import type { FormState, Side } from './useRecordMatchForm'

export interface RecordKeyboardTarget {
  state: Ref<FormState>
  activeSide: Ref<Side>
  isValid: Ref<boolean>
  setActiveSide(side: Side): void
  incrementScore(side: Side): void
  decrementScore(side: Side): void
  submit(): Promise<void>
}

export interface RecordKeyboardContext {
  form: RecordKeyboardTarget
  root: HTMLElement
}

const PLAYER_TILE = 'button[aria-label^="Select "]:not([disabled])'

function playerTiles(root: HTMLElement): HTMLButtonElement[] {
  return [...root.querySelectorAll<HTMLButtonElement>(PLAYER_TILE)]
}

function tileName(tile: HTMLElement): string {
  return (tile.getAttribute('aria-label') ?? '').slice('Select '.length)
}

/** Focus the next tile after the focused one that matches, wrapping around. */
function focusNextTile(root: HTMLElement, matches: (tile: HTMLElement) => boolean, step: 1 | -1): boolean {
  const tiles = playerTiles(root)
  if (tiles.length === 0) return false
  const current = tiles.indexOf(document.activeElement as HTMLButtonElement)
  for (let i = 1; i <= tiles.length; i += 1) {
    const index = (current + step * i + tiles.length * 2) % tiles.length
    const tile = tiles[index]!
    if (matches(tile)) {
      tile.focus()
      return true
    }
  }
  return false
}

export function handleRecordKeydown(event: KeyboardEvent, ctx: RecordKeyboardContext): void {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return

  const { form, root } = ctx
  const state = form.state.value
  if (state !== 'selecting' && state !== 'scoring') return

  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowRight':
      form.setActiveSide(event.key === 'ArrowLeft' ? 'home' : 'away')
      event.preventDefault()
      return
    case 'ArrowUp':
    case 'ArrowDown': {
      const up = event.key === 'ArrowUp'
      if (state === 'scoring') {
        if (up) form.incrementScore(form.activeSide.value)
        else form.decrementScore(form.activeSide.value)
      } else {
        focusNextTile(root, () => true, up ? -1 : 1)
      }
      event.preventDefault()
      return
    }
    case 'Enter':
      // A focused button (a player tile, Swap, Clear, Confirm) does its own thing.
      if (target?.closest('button')) return
      if (state === 'scoring' && form.isValid.value) {
        event.preventDefault()
        void form.submit()
      }
      return
  }

  if (state === 'selecting' && /^[a-z]$/i.test(event.key)) {
    const letter = event.key.toLowerCase()
    if (focusNextTile(root, (tile) => tileName(tile).toLowerCase().startsWith(letter), 1)) {
      event.preventDefault()
    }
  }
}
