import { useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { apiClient } from '@/api/client'
import { queryClient } from '@/api/query-client'
import { leaderboardQueryOptions } from './useLeaderboard'

export interface RosterPlayer {
  id: string
  name: string
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
  lastPlayedAt: string | null
  gamesPlayed: number | null
  wins: number | null
  losses: number | null
  draws: number | null
  rating: number | null
  isProvisional: boolean | null
  /** The active config's provisional threshold, for the "PROV n/N" badge. */
  provisionalGames: number
  rank: number | null
}

/**
 * GET /leaderboard only includes active players (activePlayerRatings' query filters `where
 * p.is_active`, confirmed reading the backend) — so on the Inactive tab, rating/gamesPlayed/rank
 * and W-L-D stay null rather than triggering a per-player /players/:id fetch just to show a number nobody's
 * tracking anymore. See the plan's "Design call" note.
 */
async function fetchPlayersRoster(active: boolean): Promise<RosterPlayer[]> {
  const [{ data: players }, leaderboard] = await Promise.all([
    apiClient.GET('/players', { params: { query: { active: active ? 'true' : 'false' } } }),
    queryClient.ensureQueryData(leaderboardQueryOptions),
  ])
  if (!players) throw new Error('GET /players returned no data')

  const leaderboardByPlayerId = new Map(leaderboard.rows.map((row) => [row.playerId, row]))

  return players.map((player) => {
    const row = leaderboardByPlayerId.get(player.id)
    return {
      id: player.id,
      name: player.name,
      avatarUrl: player.avatarUrl,
      isActive: player.isActive,
      createdAt: player.createdAt,
      lastPlayedAt: player.lastPlayedAt,
      gamesPlayed: row?.gamesPlayed ?? null,
      wins: row?.wins ?? null,
      losses: row?.losses ?? null,
      draws: row?.draws ?? null,
      rating: row?.rating ?? null,
      isProvisional: row?.isProvisional ?? null,
      provisionalGames: leaderboard.ratingConfig.provisionalGames,
      rank: row?.rank ?? null,
    }
  })
}

export function usePlayersRoster(active: MaybeRefOrGetter<boolean>) {
  return useQuery({
    queryKey: ['players', 'roster', active],
    queryFn: () => fetchPlayersRoster(toValue(active)),
  })
}
