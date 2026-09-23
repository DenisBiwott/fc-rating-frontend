import { queryOptions, useQuery } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'
import { queryClient } from '@/api/query-client'
import { playersQueryOptions } from './usePlayers'

export interface RecentPlayer {
  id: string
  name: string
  avatarUrl: string | null
}

/**
 * No endpoint returns players in "most recently played" order — DESIGN-SPEC.md's PlayerGrid
 * wants that ordering, so it's derived here from GET /matches (already newest-first per
 * docs/API.md), same "derived over cached" pattern as the rest of this project, not a contract
 * gap like useLeaderboard's composition.
 */
async function fetchRecentlyPlayedPlayers(): Promise<RecentPlayer[]> {
  const [players, { data: matchList }] = await Promise.all([
    queryClient.ensureQueryData(playersQueryOptions),
    apiClient.GET('/matches', { params: { query: { limit: 100 } } }),
  ])

  const recencyOrder: string[] = []
  for (const m of matchList?.items ?? []) {
    if (!recencyOrder.includes(m.homePlayerId)) recencyOrder.push(m.homePlayerId)
    if (!recencyOrder.includes(m.awayPlayerId)) recencyOrder.push(m.awayPlayerId)
  }
  const rank = new Map(recencyOrder.map((id, i) => [id, i]))

  return players
    .filter((p) => p.isActive)
    .sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity))
    .map((p) => ({ id: p.id, name: p.name, avatarUrl: p.avatarUrl }))
}

export const recentlyPlayedPlayersQueryOptions = queryOptions({
  queryKey: ['players', 'recently-played'],
  queryFn: fetchRecentlyPlayedPlayers,
})

export function useRecentlyPlayedPlayers() {
  return useQuery(recentlyPlayedPlayersQueryOptions)
}
