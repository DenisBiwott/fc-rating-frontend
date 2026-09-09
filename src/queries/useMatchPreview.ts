import { useMutation } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'

export interface PreviewInput {
  homePlayerId: string
  awayPlayerId: string
  homeScore: number
  awayScore: number
}

export function useMatchPreview() {
  return useMutation({
    mutationFn: async (input: PreviewInput) => {
      const { data } = await apiClient.POST('/matches/preview', { body: input })
      if (!data) throw new Error('POST /matches/preview returned no data')
      return data
    },
  })
}
