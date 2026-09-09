import { queryOptions, useQuery } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'

export interface CurrentSession {
  id: string
  name: string
  startedAt: string
  endedAt: string | null
  createdBy: string
}

async function fetchCurrentSession(): Promise<CurrentSession | null> {
  const { data, response } = await apiClient.GET('/sessions/current')
  if (response.status === 204 || !data) return null
  return data
}

export const currentSessionQueryOptions = queryOptions({
  queryKey: ['sessions', 'current'],
  queryFn: fetchCurrentSession,
})

export function useCurrentSession() {
  return useQuery(currentSessionQueryOptions)
}
