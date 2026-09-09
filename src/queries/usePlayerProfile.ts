import { queryOptions, useQuery } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'

async function fetchPlayerProfile(id: string) {
  const { data } = await apiClient.GET('/players/{id}', { params: { path: { id } } })
  if (!data) throw new Error(`GET /players/${id} returned no data`)
  return data
}

export function playerProfileQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['players', id, 'profile'],
    queryFn: () => fetchPlayerProfile(id),
  })
}

export function usePlayerProfile(id: string) {
  return useQuery(playerProfileQueryOptions(id))
}
