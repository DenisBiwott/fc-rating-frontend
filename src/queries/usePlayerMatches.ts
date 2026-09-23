import { computed } from 'vue'
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'
import { queryClient } from '@/api/query-client'
import { playersQueryOptions } from './usePlayers'
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
  /** This player's rating change and rating after the match, from the match's own `outcome` under
   *  the active config. null only when the match has no outcome there (voided, or recorded before
   *  a config change), which the default non-voided listing shouldn't return. */
  delta: number | null
  ratingAfter: number | null
}

interface PlayerMatchesPage {
  rows: PlayerMatchRow[]
  nextCursor: number | null
}

/**
 * GET /matches?playerId=, one cursor page at a time (DESIGN-SPEC.md MatchHistoryRow: "full
 * scrolling list"). Each item carries its own outcome since the Turn 3 contract addition, so delta
 * and rating-after come straight from the page, with no join against rating history. Player and
 * session names are joined client-side, same pattern as useLeaderboard.ts.
 */
async function fetchPlayerMatchesPage(
  playerId: string,
  cursor: number | null,
  limit: number,
): Promise<PlayerMatchesPage> {
  const [{ data: matchList }, players, sessions] = await Promise.all([
    apiClient.GET('/matches', {
      params: { query: { playerId, limit, ...(cursor !== null ? { cursor } : {}) } },
    }),
    queryClient.ensureQueryData(playersQueryOptions),
    queryClient.ensureQueryData(sessionsQueryOptions),
  ])
  if (!matchList) throw new Error('GET /matches returned no data')

  const playersById = new Map(players.map((p) => [p.id, p]))
  const sessionsById = new Map(sessions.map((s) => [s.id, s]))

  const rows = matchList.items.map((match): PlayerMatchRow => {
    const isHome = match.homePlayerId === playerId
    const opponentId = isHome ? match.awayPlayerId : match.homePlayerId
    const selfScore = isHome ? match.homeScore : match.awayScore
    const opponentScore = isHome ? match.awayScore : match.homeScore
    const result: MatchResult =
      selfScore > opponentScore ? 'W' : selfScore < opponentScore ? 'L' : 'D'
    const self = match.outcome ? (isHome ? match.outcome.home : match.outcome.away) : null

    return {
      matchId: match.id,
      opponentId,
      opponentName: playersById.get(opponentId)?.name ?? opponentId,
      result,
      selfScore,
      opponentScore,
      playedAt: match.playedAt,
      sessionName: match.sessionId ? (sessionsById.get(match.sessionId)?.name ?? null) : null,
      delta: self?.delta ?? null,
      ratingAfter: self?.after.rating ?? null,
    }
  })

  return { rows, nextCursor: matchList.nextCursor }
}

export function playerMatchesQueryOptions(playerId: string, pageSize = 20) {
  return infiniteQueryOptions({
    queryKey: ['players', playerId, 'matches', pageSize],
    queryFn: ({ pageParam }) => fetchPlayerMatchesPage(playerId, pageParam, pageSize),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

/** Newest first; `rows` flattens every page loaded so far, `fetchNextPage` loads the next. */
export function usePlayerMatches(playerId: string, pageSize = 20) {
  const query = useInfiniteQuery(playerMatchesQueryOptions(playerId, pageSize))
  const rows = computed(() => query.data.value?.pages.flatMap((page) => page.rows) ?? [])
  return { ...query, rows }
}
