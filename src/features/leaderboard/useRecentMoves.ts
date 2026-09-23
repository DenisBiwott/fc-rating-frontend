// After a match is recorded, the leaderboard marks its two players for a few seconds
// (DESIGN-SPEC.md §6 "Result (in panel)", 3b): a green wash for whoever gained rating, a coral wash
// for whoever lost it, and ▲n / ▼n when their rank moved. The rows themselves reorder with the
// existing FLIP and their ratings tick. Module-level so the form that records the match and the
// leaderboard rows that show it can share it without passing anything through the router.
import { readonly, ref } from 'vue'

export const HIGHLIGHT_MS = 4000

export interface RowHighlight {
  /** Sign of the rating change; null for an exact-zero change. */
  tone: 'up' | 'down' | null
  /** Ranks gained (positive) or lost (negative); 0 when the rank didn't change. */
  rankMove: number
}

interface RecordedSide {
  playerId: string
  delta: number
}

const highlights = ref(new Map<string, RowHighlight>())
let clearTimer: ReturnType<typeof setTimeout> | undefined

export function flashRecordedMatch(
  outcome: { home: RecordedSide; away: RecordedSide },
  rankChanges: ReadonlyArray<{ playerId: string; from: number; to: number }>,
): void {
  const next = new Map<string, RowHighlight>()
  for (const side of [outcome.home, outcome.away]) {
    const change = rankChanges.find((c) => c.playerId === side.playerId)
    next.set(side.playerId, {
      tone: side.delta > 0 ? 'up' : side.delta < 0 ? 'down' : null,
      rankMove: change ? change.from - change.to : 0,
    })
  }
  highlights.value = next

  if (clearTimer) clearTimeout(clearTimer)
  clearTimer = setTimeout(() => {
    highlights.value = new Map()
  }, HIGHLIGHT_MS)
}

export function useRecentMoves() {
  return readonly(highlights)
}

/** Row background: 3b's green / coral washes (alpha tints, so they read on either theme). */
export function highlightRowClass(highlight: RowHighlight | undefined): string {
  if (highlight?.tone === 'up') return 'bg-[rgba(52,211,153,0.07)]'
  if (highlight?.tone === 'down') return 'bg-[rgba(244,113,89,0.05)]'
  return ''
}

/** "▲1" / "▼2" next to the name, or null when the rank didn't move. */
export function rankMoveLabel(highlight: RowHighlight | undefined): { text: string; class: string } | null {
  if (!highlight || highlight.rankMove === 0) return null
  return highlight.rankMove > 0
    ? { text: `▲${highlight.rankMove}`, class: 'text-text-up' }
    : { text: `▼${-highlight.rankMove}`, class: 'text-accent-down' }
}
