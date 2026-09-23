// TV mode (DESIGN-SPEC.md §6 "TV mode", 3e) marks changes the same way the desktop leaderboard
// does after a recorded match (useRecentMoves): a green/coral row wash with ▲n/▼n, and a green
// wash on a new LATEST card, for ~4s. The difference is where the change comes from. The TV
// records nothing itself, so useRecentMoves never fires there; instead each 10s poll is compared
// with the previous one. That also covers two matches landing in one poll, and a void (which
// moves several players at once).
import { onBeforeUnmount, readonly, ref, watch, type Ref } from 'vue'
import { HIGHLIGHT_MS, type RowHighlight } from '@/features/leaderboard/useRecentMoves'
import type { LeaderboardRow } from '@/queries/useLeaderboard'

type Standing = Pick<LeaderboardRow, 'playerId' | 'rank' | 'rating'>

/**
 * Every player whose rating changed between two polls: tone from the sign of the change, rankMove
 * from the rank change. Players who only moved because someone passed them get no marker (they
 * still FLIP into place), matching the desktop's "only the two who played" rule. A player missing
 * from either poll is skipped.
 */
export function diffStandings(
  prev: readonly Standing[],
  next: readonly Standing[],
): Map<string, RowHighlight> {
  const prevById = new Map(prev.map((row) => [row.playerId, row]))
  const moves = new Map<string, RowHighlight>()
  for (const row of next) {
    const before = prevById.get(row.playerId)
    if (!before || before.rating === row.rating) continue
    moves.set(row.playerId, {
      tone: row.rating > before.rating ? 'up' : 'down',
      rankMove: before.rank - row.rank,
    })
  }
  return moves
}

/** Match ids in this poll that weren't in the previous one: the LATEST cards to wash. */
export function newMatchIds(prev: readonly { id: string }[], next: readonly { id: string }[]): Set<string> {
  const seen = new Set(prev.map((m) => m.id))
  return new Set(next.filter((m) => !seen.has(m.id)).map((m) => m.id))
}

/**
 * Holds the highlights for the current poll and clears them after HIGHLIGHT_MS. The first load is
 * the baseline, so nothing flashes on entering TV mode. TanStack Query's structural sharing
 * returns the same reference when a poll changed nothing, so the watchers only run on real change.
 */
export function useTvHighlights(
  standings: Ref<readonly Standing[] | undefined>,
  latest: Ref<readonly { id: string }[] | undefined>,
) {
  const rows = ref(new Map<string, RowHighlight>())
  const matches = ref(new Set<string>())
  let rowTimer: ReturnType<typeof setTimeout> | undefined
  let matchTimer: ReturnType<typeof setTimeout> | undefined

  watch(standings, (next, prev) => {
    if (!next || !prev) return
    const moves = diffStandings(prev, next)
    if (moves.size === 0) return
    rows.value = moves
    clearTimeout(rowTimer)
    rowTimer = setTimeout(() => (rows.value = new Map()), HIGHLIGHT_MS)
  })

  watch(latest, (next, prev) => {
    if (!next || !prev) return
    const ids = newMatchIds(prev, next)
    if (ids.size === 0) return
    matches.value = ids
    clearTimeout(matchTimer)
    matchTimer = setTimeout(() => (matches.value = new Set()), HIGHLIGHT_MS)
  })

  onBeforeUnmount(() => {
    clearTimeout(rowTimer)
    clearTimeout(matchTimer)
  })

  return { rowHighlights: readonly(rows), matchHighlights: readonly(matches) }
}
