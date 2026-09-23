import { queryOptions, useQuery } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'
import { queryClient } from '@/api/query-client'
import { playersQueryOptions } from './usePlayers'
import { sessionsQueryOptions } from './useSessions'

export const LATEST_COUNT = 5

export interface LatestMatchSide {
  playerId: string
  name: string
  score: number
  /** Rating change under the active config; null when the match has no outcome there. */
  delta: number | null
}

export interface LatestMatch {
  id: string
  playedAt: string
  sessionName: string | null
  home: LatestMatchSide
  away: LatestMatchSide
  upset: boolean
}

/**
 * The desktop leaderboard's LATEST column (DESIGN-SPEC.md §6 "Turn 4 revisions", 4a): the last
 * five non-voided matches across all sessions, newest first. Deltas and the upset flag come from
 * each item's own `outcome`; player and session names are joined client-side, the same pattern as
 * usePlayerMatches.ts.
 */
async function fetchLatestMatches(): Promise<LatestMatch[]> {
  const [{ data: matchList }, players, sessions] = await Promise.all([
    apiClient.GET('/matches', { params: { query: { limit: LATEST_COUNT } } }),
    queryClient.ensureQueryData(playersQueryOptions),
    queryClient.ensureQueryData(sessionsQueryOptions),
  ])
  if (!matchList) throw new Error('GET /matches returned no data')

  const nameById = new Map(players.map((p) => [p.id, p.name]))
  const sessionById = new Map(sessions.map((s) => [s.id, s.name]))

  return matchList.items.map((match) => ({
    id: match.id,
    playedAt: match.playedAt,
    sessionName: match.sessionId ? (sessionById.get(match.sessionId) ?? null) : null,
    home: {
      playerId: match.homePlayerId,
      name: nameById.get(match.homePlayerId) ?? match.homePlayerId,
      score: match.homeScore,
      delta: match.outcome?.home.delta ?? null,
    },
    away: {
      playerId: match.awayPlayerId,
      name: nameById.get(match.awayPlayerId) ?? match.awayPlayerId,
      score: match.awayScore,
      delta: match.outcome?.away.delta ?? null,
    },
    upset: match.outcome?.upset ?? false,
  }))
}

export const latestMatchesQueryOptions = queryOptions({
  queryKey: ['matches', 'latest'],
  queryFn: fetchLatestMatches,
})

export function useLatestMatches() {
  return useQuery(latestMatchesQueryOptions)
}
