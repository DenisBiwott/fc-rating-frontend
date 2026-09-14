import { queryOptions, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { apiClient } from '@/api/client'
import { queryClient } from '@/api/query-client'
import { playersQueryOptions } from './usePlayers'

export interface VoidPreviewPlayer {
  playerId: string
  name: string
  ratingBefore: number
  ratingAfter: number
  rankBefore: number | null
  rankAfter: number | null
}

export interface VoidPreview {
  matchId: string
  players: VoidPreviewPlayer[]
}

/** Same player-name join pattern as useLeaderboard.ts/usePlayerMatches.ts — the endpoint only carries playerIds. */
async function fetchVoidPreview(matchId: string): Promise<VoidPreview> {
  const [{ data }, players] = await Promise.all([
    apiClient.GET('/matches/{id}/void-preview', { params: { path: { id: matchId } } }),
    queryClient.ensureQueryData(playersQueryOptions),
  ])
  if (!data) throw new Error(`GET /matches/${matchId}/void-preview returned no data`)

  const playersById = new Map(players.map((p) => [p.id, p]))
  const rankChangeByPlayerId = new Map(data.rankChanges.map((change) => [change.playerId, change]))

  return {
    matchId: data.matchId,
    players: data.players.map((player) => {
      const rankChange = rankChangeByPlayerId.get(player.playerId)
      return {
        playerId: player.playerId,
        name: playersById.get(player.playerId)?.name ?? player.playerId,
        ratingBefore: player.ratingBefore,
        ratingAfter: player.ratingAfter,
        rankBefore: rankChange?.from ?? null,
        rankAfter: rankChange?.to ?? null,
      }
    }),
  }
}

export function voidMatchPreviewQueryOptions(matchId: string) {
  return queryOptions({
    queryKey: ['matches', matchId, 'void-preview'],
    queryFn: () => fetchVoidPreview(matchId),
  })
}

/** enabled so this only fetches while VoidMatchSheet is actually open, not for every row rendered. */
export function useVoidMatchPreview(matchId: string, enabled: Ref<boolean>) {
  return useQuery(
    computed(() => ({
      ...voidMatchPreviewQueryOptions(matchId),
      enabled: enabled.value,
    })),
  )
}
