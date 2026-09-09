import { queryOptions, useQuery } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'

async function fetchRatingHistory(id: string) {
  const { data } = await apiClient.GET('/players/{id}/rating-history', {
    params: { path: { id } },
  })
  if (!data) throw new Error(`GET /players/${id}/rating-history returned no data`)
  return data
}

export function ratingHistoryQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['players', id, 'rating-history'],
    queryFn: () => fetchRatingHistory(id),
  })
}

export function useRatingHistory(id: string) {
  return useQuery(ratingHistoryQueryOptions(id))
}
