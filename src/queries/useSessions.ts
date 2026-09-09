import { queryOptions, useQuery } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'

async function fetchSessions() {
  const { data } = await apiClient.GET('/sessions')
  if (!data) throw new Error('GET /sessions returned no data')
  return data
}

export const sessionsQueryOptions = queryOptions({
  queryKey: ['sessions'],
  queryFn: fetchSessions,
})

export function useSessions() {
  return useQuery(sessionsQueryOptions)
}
