import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'
import {
  applyRecordedMatchOptimistically,
  leaderboardQueryOptions,
  type LeaderboardData,
  type LeaderboardRow,
} from './useLeaderboard'

function row(playerId: string, rating: number, wins: number, losses: number, draws: number): LeaderboardRow {
  const gamesPlayed = wins + losses + draws
  return {
    rank: 0,
    playerId,
    name: playerId,
    avatarUrl: null,
    rating,
    gamesPlayed,
    wins,
    losses,
    draws,
    winPct: gamesPlayed === 0 ? 0 : wins / gamesPlayed,
    lastPlayedAt: null,
    form: [],
    isProvisional: false,
    deltaSinceLastSession: null,
  }
}

describe('applyRecordedMatchOptimistically', () => {
  it('recomputes winPct the backend way (wins ÷ games) for both players', () => {
    const queryClient = new QueryClient()
    const data: LeaderboardData = {
      rows: [row('a', 1250, 3, 1, 0), row('b', 1200, 0, 0, 0)],
      lastMatchAt: null,
      ratingConfig: { name: 'default-elo', provisionalGames: 10 },
      totalMatches: 2,
      currentSession: null,
      session: null,
    }
    queryClient.setQueryData(leaderboardQueryOptions.queryKey, data)

    applyRecordedMatchOptimistically(queryClient, {
      home: { playerId: 'a', after: { rating: 1240, gamesPlayed: 5 }, actualScore: 0, delta: -10 },
      away: { playerId: 'b', after: { rating: 1210, gamesPlayed: 1 }, actualScore: 1, delta: 10 },
    })

    const rows = queryClient.getQueryData(leaderboardQueryOptions.queryKey)!.rows
    expect(rows.find((r) => r.playerId === 'a')?.winPct).toBe(3 / 5)
    expect(rows.find((r) => r.playerId === 'b')?.winPct).toBe(1)
  })

  const sessionTable = (currentSession: LeaderboardData['currentSession']): LeaderboardData => ({
    rows: [
      { ...row('a', 1250, 3, 1, 0), deltaSinceLastSession: 50 },
      { ...row('b', 1200, 0, 0, 0), deltaSinceLastSession: null },
    ],
    lastMatchAt: null,
    ratingConfig: { name: 'default-elo', provisionalGames: 10 },
    totalMatches: 2,
    currentSession,
    session: { id: 's1', name: 'FC 27' },
  })

  // The record response's `after`/`delta` are all-time values — far from this session's ladder here.
  const recorded = {
    home: { playerId: 'a', after: { rating: 1394, gamesPlayed: 34 }, actualScore: 0, delta: -9 },
    away: { playerId: 'b', after: { rating: 1177, gamesPlayed: 35 }, actualScore: 1, delta: 9 },
  } as const

  it("on a session table, keeps each row's rating and Δ (all-time values would be wrong there) and bumps the counts", () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(
      leaderboardQueryOptions.queryKey,
      sessionTable({ name: 'FC 27', matchCount: 2, startedAt: '2026-09-26T00:00:00Z', biggestMover: null }),
    )

    applyRecordedMatchOptimistically(queryClient, recorded)

    const rows = queryClient.getQueryData(leaderboardQueryOptions.queryKey)!.rows
    expect(rows.find((r) => r.playerId === 'a')).toMatchObject({
      rating: 1250,
      deltaSinceLastSession: 50,
      gamesPlayed: 5,
      losses: 2,
      winPct: 3 / 5,
    })
    expect(rows.find((r) => r.playerId === 'b')).toMatchObject({
      rating: 1200,
      deltaSinceLastSession: null,
      gamesPlayed: 1,
      wins: 1,
      isProvisional: true,
    })
  })

  it("leaves a closed session's table alone when no session is open (the match joins none)", () => {
    const queryClient = new QueryClient()
    const data = sessionTable(null)
    queryClient.setQueryData(leaderboardQueryOptions.queryKey, data)

    applyRecordedMatchOptimistically(queryClient, recorded)

    const after = queryClient.getQueryData(leaderboardQueryOptions.queryKey)!
    expect(after.rows).toEqual(data.rows)
    expect(after.lastMatchAt).not.toBeNull()
  })
})
