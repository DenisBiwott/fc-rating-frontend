import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'
import { leaderboardQueryOptions } from './useLeaderboard'

export function useVoidMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ matchId, reason }: { matchId: string; reason: string }) => {
      const { data } = await apiClient.POST('/matches/{id}/void', {
        params: { path: { id: matchId } },
        body: { reason },
      })
      if (!data) throw new Error(`POST /matches/${matchId}/void returned no data`)
      return data
    },
    onSuccess: async (data) => {
      // Same ensureQueryData-serves-stale-cache concern as useCreatePlayer.ts/useUpdatePlayer.ts —
      // fetchQuery forces a real leaderboard refetch before dependent queries invalidate.
      await queryClient.fetchQuery(leaderboardQueryOptions)
      await queryClient.invalidateQueries({ queryKey: ['players'] })
      await Promise.all(
        data.affectedPlayers.map((playerId) =>
          queryClient.invalidateQueries({ queryKey: ['players', playerId] }),
        ),
      )
    },
  })
}
