// How TV mode learns about changes while keeping cost down (Denis, 2026-09-23). Two parts:
//
// 1. A cheap probe. Each tick fetches GET /leaderboard alone (1 request), not the standings'
//    4-request composite plus LATEST's /matches. Only when the probe's response differs from the
//    last one do the standings and LATEST refetch. Every change the TV shows alters it: a new match
//    or a void moves ratings, games played or form (even a 0-delta draw). A rename or a new player
//    who hasn't played yet doesn't, and waits for the next real change; unrated players are hidden
//    on TV anyway.
// 2. Steps down in pace. The interval depends on how long nothing has changed. Matches are 15–25
//    minutes apart, so the first step starts only after a gap longer than a normal one between
//    matches; otherwise nearly every result would land during a slow step, just as the room looks
//    up at the TV. Any change, or any input on the TV, goes back to the fast pace.
//
// "Last change" is tracked here, not read from the query: dataUpdatedAt moves on every successful
// fetch, changed or not. TanStack Query's structural sharing keeps the same data reference when a
// response is identical, so a reference change is a real change.
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { apiClient } from '@/api/client'
import { leaderboardQueryOptions } from '@/queries/useLeaderboard'
import { latestMatchesQueryOptions } from '@/queries/useLatestMatches'

const SECOND = 1000
const MINUTE = 60 * SECOND

export const POLL_STEPS: ReadonlyArray<{ quietFor: number; every: number }> = [
  { quietFor: 0, every: 10 * SECOND }, // during play
  { quietFor: 30 * MINUTE, every: MINUTE }, // a break
  { quietFor: 2 * 60 * MINUTE, every: 15 * MINUTE }, // left on and forgotten; Neon can sleep
]

/** The probe's interval after `quietMs` without a change: the last step already reached. */
export function pollInterval(quietMs: number): number {
  let every = POLL_STEPS[0]!.every
  for (const step of POLL_STEPS) if (quietMs >= step.quietFor) every = step.every
  return every
}

const FAST = POLL_STEPS[0]!.every

async function fetchProbe() {
  const { data } = await apiClient.GET('/leaderboard')
  if (!data) throw new Error('GET /leaderboard returned no data')
  return data
}

export function useTvPolling() {
  const queryClient = useQueryClient()
  let lastChangeAt = Date.now()

  const probe = useQuery({
    queryKey: ['tv', 'probe'],
    queryFn: fetchProbe,
    // Re-evaluated after every fetch. A failed probe steps down the same way, so an outage isn't
    // hit every 10s.
    refetchInterval: () => pollInterval(Date.now() - lastChangeAt),
  })

  watch(probe.data, (next, prev) => {
    if (!next || !prev) return
    lastChangeAt = Date.now()
    void queryClient.invalidateQueries({ queryKey: leaderboardQueryOptions.queryKey })
    void queryClient.invalidateQueries({ queryKey: latestMatchesQueryOptions.queryKey })
  })

  // Someone at the TV (a key, the mouse, a remote's click): back to the fast pace, and check now if
  // it had slowed, so whoever wakes it up sees fresh standings.
  function onActivity(): void {
    const wasSlow = pollInterval(Date.now() - lastChangeAt) > FAST
    lastChangeAt = Date.now()
    if (wasSlow) void probe.refetch()
  }
  const activityEvents = ['keydown', 'pointerdown', 'pointermove'] as const

  onMounted(() => activityEvents.forEach((e) => document.addEventListener(e, onActivity)))
  onBeforeUnmount(() => activityEvents.forEach((e) => document.removeEventListener(e, onActivity)))

  return { probeFailing: probe.isError }
}
