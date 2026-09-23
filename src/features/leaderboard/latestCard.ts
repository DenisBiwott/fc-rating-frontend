// Shared by the desktop LATEST column (4a) and TV mode's LATEST (3e).
import type { LatestMatch } from '@/queries/useLatestMatches'

/** A side's name weight: winner 700 text-primary, loser 500 text-secondary, both 600 on a draw. */
export function latestNameClass(match: LatestMatch, side: 'home' | 'away'): string {
  const self = match[side].score
  const other = match[side === 'home' ? 'away' : 'home'].score
  if (self === other) return 'font-semibold text-text-primary'
  return self > other ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'
}
