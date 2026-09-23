import { queryOptions, useQuery, type QueryClient } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'

export type MatchResult = 'W' | 'L' | 'D'

export interface LeaderboardRow {
  rank: number
  playerId: string
  name: string
  avatarUrl: string | null
  rating: number
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  /** 0..1, from GET /leaderboard (wins / games, 0 with no games) — never recomputed for display. */
  winPct: number
  form: MatchResult[]
  isProvisional: boolean
  /** null = no delta for the relevant session (didn't play in it, or no session exists at all). */
  deltaSinceLastSession: number | null
}

export interface LeaderboardData {
  rows: LeaderboardRow[]
  /** Most recent non-void match across all players (max of GET /players' lastPlayedAt); null if none. */
  lastMatchAt: string | null
  /** The active rating config, as GET /leaderboard reports it — never hardcoded here, since the
   *  active config can change (a new one is activated and rebuilt) without a frontend deploy. */
  ratingConfig: { name: string; provisionalGames: number }
  /** Derived client-side (sum of gamesPlayed / 2) — the API has no total-matches field, and each
   *  match counts for two players' gamesPlayed. */
  totalMatches: number
  currentSession: {
    name: string
    matchCount: number
    startedAt: string
    biggestMover: { name: string; delta: number } | null
  } | null
}

/**
 * TEMPORARY PLACEHOLDER — not the target architecture. GET /leaderboard doesn't return player
 * name/avatar (just playerId) or a per-player deltaSinceLastSession the way the design doc wants;
 * this composes /leaderboard + /players + the open session's playerDeltas client-side to fill the
 * gap. Denis was explicit that embedding this directly on /leaderboard is the backend's
 * responsibility long-term (see CLAUDE.md's "Known contract gap" and memory:
 * project-fc-rating-contract-gaps) — this whole function should become a one-file deletion once
 * that lands, replaced by a thinner mapping straight off the real response.
 */
async function fetchLeaderboard(): Promise<LeaderboardData> {
  const [{ data: board }, { data: players }] = await Promise.all([
    apiClient.GET('/leaderboard'),
    apiClient.GET('/players'),
  ])
  if (!board) throw new Error('GET /leaderboard returned no data')
  if (!players) throw new Error('GET /players returned no data')

  const playersById = new Map(players.map((p) => [p.id, p]))

  const { data: session, response: sessionResponse } = await apiClient.GET('/sessions/current')
  const hasOpenSession = sessionResponse.status === 200 && session !== undefined

  let deltasByPlayerId = new Map<string, number>()
  let currentSession: LeaderboardData['currentSession'] = null

  if (hasOpenSession && session) {
    const { data: summary } = await apiClient.GET('/sessions/{id}', {
      params: { path: { id: session.id } },
    })
    if (summary) {
      deltasByPlayerId = new Map(summary.playerDeltas.map((d) => [d.playerId, d.delta]))
      const mover = summary.biggestMover
      currentSession = {
        name: session.name,
        matchCount: summary.matchCount,
        startedAt: session.startedAt,
        biggestMover: mover
          ? { name: playersById.get(mover.playerId)?.name ?? mover.playerId, delta: mover.delta }
          : null,
      }
    }
  }

  const lastMatchAt = players.reduce<string | null>(
    (latest, player) =>
      player.lastPlayedAt !== null && (latest === null || player.lastPlayedAt > latest)
        ? player.lastPlayedAt
        : latest,
    null,
  )

  const rows: LeaderboardRow[] = board.entries
    .map((entry) => ({
      rank: entry.rank,
      playerId: entry.playerId,
      name: playersById.get(entry.playerId)?.name ?? entry.playerId,
      avatarUrl: playersById.get(entry.playerId)?.avatarUrl ?? null,
      rating: entry.rating,
      gamesPlayed: entry.gamesPlayed,
      wins: entry.wins,
      losses: entry.losses,
      draws: entry.draws,
      winPct: entry.winPct,
      form: entry.form,
      isProvisional: entry.isProvisional,
      deltaSinceLastSession: deltasByPlayerId.get(entry.playerId) ?? null,
    }))
    .sort((a, b) => a.rank - b.rank)

  const totalMatches = Math.round(rows.reduce((sum, r) => sum + r.gamesPlayed, 0) / 2)

  return {
    rows,
    lastMatchAt,
    ratingConfig: board.ratingConfig,
    totalMatches,
    currentSession,
  }
}

export const leaderboardQueryOptions = queryOptions({
  queryKey: ['leaderboard'],
  queryFn: fetchLeaderboard,
})

export function useLeaderboard() {
  return useQuery(leaderboardQueryOptions)
}

interface RecordedSide {
  playerId: string
  after: { rating: number; gamesPlayed: number }
  actualScore: 1 | 0.5 | 0
  delta: number
}

/**
 * Applies a just-recorded match to the cached leaderboard directly (design doc: "optimistically
 * updated... instead of refetching"), so returning to the leaderboard after the result overlay
 * shows the new standings immediately rather than a stale-then-refetch flash. Re-sorts and
 * re-ranks the whole list — a partial patch of just the two affected rows would leave stale ranks
 * for anyone whose position shifted as a side effect.
 */
export function applyRecordedMatchOptimistically(
  queryClient: QueryClient,
  outcome: { home: RecordedSide; away: RecordedSide },
): void {
  queryClient.setQueryData(leaderboardQueryOptions.queryKey, (old: LeaderboardData | undefined) => {
    if (!old) return old

    const updateRow = (row: LeaderboardRow, side: RecordedSide): LeaderboardRow => {
      const result: MatchResult = side.actualScore === 1 ? 'W' : side.actualScore === 0.5 ? 'D' : 'L'
      const wins = row.wins + (result === 'W' ? 1 : 0)
      return {
        ...row,
        rating: side.after.rating,
        gamesPlayed: side.after.gamesPlayed,
        wins,
        // Same definition as the backend's leaderboard (src/app/leaderboard.ts), so the optimistic
        // value matches what the next refetch returns.
        winPct: side.after.gamesPlayed === 0 ? 0 : wins / side.after.gamesPlayed,
        losses: row.losses + (result === 'L' ? 1 : 0),
        draws: row.draws + (result === 'D' ? 1 : 0),
        form: [...row.form, result].slice(-5),
        isProvisional: side.after.gamesPlayed < old.ratingConfig.provisionalGames,
        deltaSinceLastSession: side.delta,
      }
    }

    const rows = old.rows
      .map((row) => {
        if (row.playerId === outcome.home.playerId) return updateRow(row, outcome.home)
        if (row.playerId === outcome.away.playerId) return updateRow(row, outcome.away)
        return row
      })
      .sort((a, b) => {
        // Mirrors the backend's rankPlayers() (src/domain/leaderboard/compute.ts): 0-game
        // (UNRATED) players always sort last, regardless of rating.
        const aUnrated = a.gamesPlayed === 0
        const bUnrated = b.gamesPlayed === 0
        if (aUnrated !== bUnrated) return aUnrated ? 1 : -1
        return b.rating !== a.rating ? b.rating - a.rating : a.playerId.localeCompare(b.playerId)
      })
      .map((row, index) => ({ ...row, rank: index + 1 }))

    return {
      ...old,
      rows,
      totalMatches: Math.round(rows.reduce((sum, r) => sum + r.gamesPlayed, 0) / 2),
      // The server stamps playedAt at record time, so "now" is what the refetch would say anyway.
      lastMatchAt: new Date().toISOString(),
    }
  })
}
