import { queryOptions, useQuery } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'

export interface RecentPlayer {
  id: string
  name: string
  avatarUrl: string | null
  lastPlayedAt: string | null
}

/**
 * Every active player with their last-played time, for the record form's picker, which orders them
 * "tonight, then recent" (features/record-match/playerPicker.ts). `GET /players` carries
 * `lastPlayedAt`, so this no longer derives recency from a page of recent matches.
 */
async function fetchRecentlyPlayedPlayers(): Promise<RecentPlayer[]> {
  const { data } = await apiClient.GET('/players', { params: { query: { active: 'true' } } })
  if (!data) throw new Error('GET /players returned no data')
  return data.map((p) => ({ id: p.id, name: p.name, avatarUrl: p.avatarUrl, lastPlayedAt: p.lastPlayedAt }))
}

export const recentlyPlayedPlayersQueryOptions = queryOptions({
  queryKey: ['players', 'recently-played'],
  queryFn: fetchRecentlyPlayedPlayers,
})

export function useRecentlyPlayedPlayers() {
  return useQuery(recentlyPlayedPlayersQueryOptions)
}
