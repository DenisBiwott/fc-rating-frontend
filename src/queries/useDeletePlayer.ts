import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'
import { leaderboardQueryOptions } from './useLeaderboard'

export class DeletePlayerError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function useDeletePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { response } = await apiClient.DELETE('/players/{id}', { params: { path: { id } } })
      if (response.status === 409) {
        throw new DeletePlayerError(409, 'This player has matches and can no longer be deleted.')
      }
      if (!response.ok) throw new DeletePlayerError(response.status, 'Could not delete player.')
    },
    onSuccess: async () => {
      // Same ensureQueryData staleness concern as useCreatePlayer.ts/useUpdatePlayer.ts.
      await queryClient.fetchQuery(leaderboardQueryOptions)
      await queryClient.invalidateQueries({ queryKey: ['players'] })
    },
  })
}
