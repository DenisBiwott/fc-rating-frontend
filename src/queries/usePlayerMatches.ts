import { queryOptions, useQuery } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'
import { queryClient } from '@/api/query-client'
import { playersQueryOptions } from './usePlayers'
import { ratingHistoryQueryOptions } from './useRatingHistory'
import { sessionsQueryOptions } from './useSessions'

export type MatchResult = 'W' | 'L' | 'D'

export interface PlayerMatchRow {
  matchId: string
  opponentId: string
  opponentName: string
  result: MatchResult
  selfScore: number
  opponentScore: number
  playedAt: string
  sessionName: string | null
  /** null when this match predates rating-history coverage (shouldn't happen in practice, but the
   *  join is by matchId, not guaranteed). */
  delta: number | null
}

/**
 * GET /matches?playerId=, not GET /players/:id/matches — confirmed during the design-canvas audit
 * that only the former carries playedAt/sessionId, which this row needs. Composes /players (names)
 * and /sessions (names) client-side, same join pattern as useLeaderboard.ts.
 */
async function fetchPlayerMatches(playerId: string, limit: number): Promise<PlayerMatchRow[]> {
  const [{ data: matchList }, players, sessions, history] = await Promise.all([
    apiClient.GET('/matches', { params: { query: { playerId, limit } } }),
    queryClient.ensureQueryData(playersQueryOptions),
    queryClient.ensureQueryData(sessionsQueryOptions),
    queryClient.ensureQueryData(ratingHistoryQueryOptions(playerId)),
  ])
  if (!matchList) throw new Error('GET /matches returned no data')

  const playersById = new Map(players.map((p) => [p.id, p]))
  const sessionsById = new Map(sessions.map((s) => [s.id, s]))
  const deltaByMatchId = new Map(history.map((entry) => [entry.matchId, entry.delta]))

  return matchList.items.map((match) => {
    const isHome = match.homePlayerId === playerId
    const opponentId = isHome ? match.awayPlayerId : match.homePlayerId
    const selfScore = isHome ? match.homeScore : match.awayScore
    const opponentScore = isHome ? match.awayScore : match.homeScore
    const result: MatchResult =
      selfScore > opponentScore ? 'W' : selfScore < opponentScore ? 'L' : 'D'

    return {
      matchId: match.id,
      opponentId,
      opponentName: playersById.get(opponentId)?.name ?? opponentId,
      result,
      selfScore,
      opponentScore,
      playedAt: match.playedAt,
      sessionName: match.sessionId ? (sessionsById.get(match.sessionId)?.name ?? null) : null,
      delta: deltaByMatchId.get(match.id) ?? null,
    }
  })
}

export function playerMatchesQueryOptions(playerId: string, limit = 20) {
  return queryOptions({
    queryKey: ['players', playerId, 'matches', limit],
    queryFn: () => fetchPlayerMatches(playerId, limit),
  })
}

export function usePlayerMatches(playerId: string, limit = 20) {
  return useQuery(playerMatchesQueryOptions(playerId, limit))
}
