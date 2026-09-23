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
})
