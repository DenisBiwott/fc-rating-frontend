import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'
import { applyRecordedMatchOptimistically } from './useLeaderboard'

export interface RecordMatchInput {
  id: string
  homePlayerId: string
  awayPlayerId: string
  homeScore: number
  awayScore: number
  decidedOnPenalties: boolean
  sessionId?: string
}

export function useRecordMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordMatchInput) => {
      const { data } = await apiClient.POST('/matches', { body: input })
      if (!data) throw new Error('POST /matches returned no data')
      return data
    },
    onSuccess: (data) => {
      applyRecordedMatchOptimistically(queryClient, data.outcome)
      // The desktop LATEST column (useLatestMatches) picks the new match up from the server.
      void queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}
