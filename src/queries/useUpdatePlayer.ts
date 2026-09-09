import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'
import { leaderboardQueryOptions } from './useLeaderboard'
import { playerProfileQueryOptions } from './usePlayerProfile'

export interface UpdatePlayerInput {
  id: string
  name?: string
  isActive?: boolean
}

/** First frontend use of PATCH /players/:id — rename (2d's "Rename") and deactivate (2d's "Deactivate") both go through it. */
export function useUpdatePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdatePlayerInput) => {
      const { data } = await apiClient.PATCH('/players/{id}', { params: { path: { id } }, body })
      if (!data) throw new Error(`PATCH /players/${id} returned no data`)
      return data
    },
    onSuccess: async (_data, variables) => {
      // Deactivating drops the player from GET /leaderboard (activePlayerRatings filters
      // is_active). usePlayersRoster.ts joins /players against the leaderboard cache via
      // ensureQueryData, which always returns whatever's already cached rather than waiting on a
      // revalidation — see useCreatePlayer.ts's onSuccess for the full explanation. fetchQuery,
      // awaited, forces a real refetch before the players/profile invalidations trigger the
      // roster/profile queries' own refetch, so they join against fresh data.
      await queryClient.fetchQuery(leaderboardQueryOptions)
      await queryClient.invalidateQueries({ queryKey: ['players'] })
      await queryClient.invalidateQueries({
        queryKey: playerProfileQueryOptions(variables.id).queryKey,
      })
    },
  })
}
