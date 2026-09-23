// Medals apply to ranks 1–3 only (DESIGN-SPEC.md §5), shared by every leaderboard row variant.
export type Medal = 'gold' | 'silver' | 'bronze'

export function medalFor(rank: number): Medal | undefined {
  return rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : undefined
}

const RANK_TEXT: Record<Medal, string> = {
  gold: 'text-medal-gold',
  silver: 'text-medal-silver',
  bronze: 'text-medal-bronze',
}

/** The rank number's colour: its medal, or plain secondary text below 3rd. */
export function rankTextClass(rank: number): string {
  const medal = medalFor(rank)
  return medal ? RANK_TEXT[medal] : 'text-text-secondary'
}

/** Win rate as the leaderboard shows it: rounded at render, and `—` (not 0%) with no games. */
export function winPctLabel(winPct: number, gamesPlayed: number): string {
  return gamesPlayed === 0 ? '—' : `${Math.round(winPct * 100)}%`
}
