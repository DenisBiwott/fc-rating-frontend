import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'
import { applyRecordedMatchOptimistically } from './useLeaderboard'
import { recentlyPlayedPlayersQueryOptions } from './useRecentlyPlayedPlayers'

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
      // The desktop LATEST column (useLatestMatches) picks the new match up from the server, and
      // the picker's "tonight, then recent" order moves these two players to the front.
      void queryClient.invalidateQueries({ queryKey: ['matches'] })
      void queryClient.invalidateQueries({ queryKey: recentlyPlayedPlayersQueryOptions.queryKey })
    },
  })
}
