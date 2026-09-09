import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'
import { leaderboardQueryOptions } from './useLeaderboard'

export interface CreatePlayerInput {
  name: string
  avatarUrl?: string
}

/** Carries the HTTP status so the sheet can show the 409 name-conflict inline on the field. */
export class CreatePlayerError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function useCreatePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreatePlayerInput) => {
      const { data, response } = await apiClient.POST('/players', { body: input })
      if (data) return data
      if (response.status === 409) {
        throw new CreatePlayerError(409, `A player named "${input.name}" already exists.`)
      }
      throw new CreatePlayerError(response.status, 'Could not create player.')
    },
    onSuccess: async () => {
      // usePlayersRoster.ts's fetchPlayersRoster joins /players against the leaderboard cache via
      // queryClient.ensureQueryData — which, if the cache already holds *any* data, always
      // returns it as-is and never waits on a refresh (that's true even with the now-deprecated
      // revalidateIfStale option: it only fires an unawaited background prefetch, still returning
      // the old snapshot on this call). So invalidating the leaderboard query doesn't help here —
      // the roster's own refetch would just read the stale cache again before that prefetch lands.
      // fetchQuery, awaited, forces a real fetch and updates the cache before we invalidate the
      // roster/players queries — so their refetch's ensureQueryData call sees fresh data already.
      await queryClient.fetchQuery(leaderboardQueryOptions)
      await queryClient.invalidateQueries({ queryKey: ['players'] })
    },
  })
}
