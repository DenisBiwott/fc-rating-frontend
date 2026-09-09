import { queryOptions, useQuery } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'

export type MatchResult = 'W' | 'L' | 'D'

export interface LeaderboardRow {
  rank: number
  playerId: string
  name: string
  avatarUrl: string | null
  rating: number
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  form: MatchResult[]
  isProvisional: boolean
  /** null = no delta for the relevant session (didn't play in it, or no session exists at all). */
  deltaSinceLastSession: number | null
}

export interface LeaderboardData {
  rows: LeaderboardRow[]
  meanRating: number
  /** Derived client-side (sum of gamesPlayed / 2) — the API has no total-matches field, and each
   *  match counts for two players' gamesPlayed. */
  totalMatches: number
  currentSession: {
    name: string
    matchCount: number
    startedAt: string
    biggestMover: { name: string; delta: number } | null
  } | null
}

/**
 * TEMPORARY PLACEHOLDER — not the target architecture. GET /leaderboard doesn't return player
 * name/avatar (just playerId) or a per-player deltaSinceLastSession the way the design doc wants;
 * this composes /leaderboard + /players + the open session's playerDeltas client-side to fill the
 * gap. Denis was explicit that embedding this directly on /leaderboard is the backend's
 * responsibility long-term (see CLAUDE.md's "Known contract gap" and memory:
 * project-fc-rating-contract-gaps) — this whole function should become a one-file deletion once
 * that lands, replaced by a thinner mapping straight off the real response.
 */
async function fetchLeaderboard(): Promise<LeaderboardData> {
  const [{ data: board }, { data: players }] = await Promise.all([
    apiClient.GET('/leaderboard'),
    apiClient.GET('/players'),
  ])
  if (!board) throw new Error('GET /leaderboard returned no data')
  if (!players) throw new Error('GET /players returned no data')

  const playersById = new Map(players.map((p) => [p.id, p]))

  const { data: session, response: sessionResponse } = await apiClient.GET('/sessions/current')
  const hasOpenSession = sessionResponse.status === 200 && session !== undefined

  let deltasByPlayerId = new Map<string, number>()
  let currentSession: LeaderboardData['currentSession'] = null

  if (hasOpenSession && session) {
    const { data: summary } = await apiClient.GET('/sessions/{id}', {
      params: { path: { id: session.id } },
    })
    if (summary) {
      deltasByPlayerId = new Map(summary.playerDeltas.map((d) => [d.playerId, d.delta]))
      const mover = summary.biggestMover
      currentSession = {
        name: session.name,
        matchCount: summary.matchCount,
        startedAt: session.startedAt,
        biggestMover: mover
          ? { name: playersById.get(mover.playerId)?.name ?? mover.playerId, delta: mover.delta }
          : null,
      }
    }
  }

  const rows: LeaderboardRow[] = board.entries
    .map((entry) => ({
      rank: entry.rank,
      playerId: entry.playerId,
      name: playersById.get(entry.playerId)?.name ?? entry.playerId,
      avatarUrl: playersById.get(entry.playerId)?.avatarUrl ?? null,
      rating: entry.rating,
      gamesPlayed: entry.gamesPlayed,
      wins: entry.wins,
      losses: entry.losses,
      draws: entry.draws,
      form: entry.form,
      isProvisional: entry.isProvisional,
      deltaSinceLastSession: deltasByPlayerId.get(entry.playerId) ?? null,
    }))
    .sort((a, b) => a.rank - b.rank)

  const totalMatches = Math.round(rows.reduce((sum, r) => sum + r.gamesPlayed, 0) / 2)

  return { rows, meanRating: board.meanRating, totalMatches, currentSession }
}

export const leaderboardQueryOptions = queryOptions({
  queryKey: ['leaderboard'],
  queryFn: fetchLeaderboard,
})

export function useLeaderboard() {
  return useQuery(leaderboardQueryOptions)
}
