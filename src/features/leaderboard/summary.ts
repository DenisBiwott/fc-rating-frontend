import { formatElapsed } from '@/lib/elapsed'

export interface SummaryInput {
  totalMatches: number
  lastMatchAt: string | null
  now: Date
}

function lastMatch(lastMatchAt: string | null, now: Date): string | null {
  if (lastMatchAt === null) return null
  const elapsed = formatElapsed(new Date(lastMatchAt), now)
  return elapsed === '0m' ? 'last match just now' : `last match ${elapsed} ago`
}

/** The line under the leaderboard title, e.g. "108 matches · last match 3h ago". */
export function leaderboardSummary(input: SummaryInput): string {
  const matches =
    input.totalMatches === 0
      ? 'no matches yet'
      : `${String(input.totalMatches)} ${input.totalMatches === 1 ? 'match' : 'matches'}`
  return [matches, lastMatch(input.lastMatchAt, input.now)]
    .filter((part) => part !== null)
    .join(' · ')
}
