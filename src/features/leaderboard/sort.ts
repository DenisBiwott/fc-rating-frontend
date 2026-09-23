// Sorting for the desktop leaderboard's clickable column headers (DESIGN-SPEC.md §6).
//
// Unrated players (0 games) always sort last, whatever the column: the backend's own ranking does
// the same (rankPlayers, fc-rating-backend src/domain/leaderboard/compute.ts). Provisional players
// sort normally. That matches the official rank, so the default Rating sort is exactly rank order.
// DESIGN-SPEC.md says "provisional & unrated sort last"; see docs/DESIGN_SYSTEM.md for why this
// follows the backend instead.
import type { LeaderboardRow } from '@/queries/useLeaderboard'

export type SortKey = 'rating' | 'player' | 'w' | 'l' | 'd' | 'winPct' | 'mp' | 'last' | 'delta'

/** Each column sorts one way: best/most first, except Player (A→Z) and Last (most recent first). */
const compareBy: Record<SortKey, (a: LeaderboardRow, b: LeaderboardRow) => number> = {
  rating: (a, b) => a.rank - b.rank,
  player: (a, b) => a.name.localeCompare(b.name),
  w: (a, b) => b.wins - a.wins,
  l: (a, b) => b.losses - a.losses,
  d: (a, b) => b.draws - a.draws,
  winPct: (a, b) => b.winPct - a.winPct,
  mp: (a, b) => b.gamesPlayed - a.gamesPlayed,
  last: (a, b) => (b.lastPlayedAt ?? '').localeCompare(a.lastPlayedAt ?? ''),
  // No session delta sorts below any delta, including negative ones.
  delta: (a, b) => (b.deltaSinceLastSession ?? -Infinity) - (a.deltaSinceLastSession ?? -Infinity),
}

export function sortRows(rows: readonly LeaderboardRow[], key: SortKey): LeaderboardRow[] {
  return [...rows].sort((a, b) => {
    const aUnrated = a.gamesPlayed === 0
    const bUnrated = b.gamesPlayed === 0
    if (aUnrated !== bUnrated) return aUnrated ? 1 : -1
    return compareBy[key](a, b) || a.rank - b.rank
  })
}
