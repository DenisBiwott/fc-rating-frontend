import { queryOptions, useQuery } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'

async function fetchPlayers() {
  const { data } = await apiClient.GET('/players')
  if (!data) throw new Error('GET /players returned no data')
  return data
}

export const playersQueryOptions = queryOptions({
  queryKey: ['players'],
  queryFn: fetchPlayers,
})

export function usePlayers() {
  return useQuery(playersQueryOptions)
}
