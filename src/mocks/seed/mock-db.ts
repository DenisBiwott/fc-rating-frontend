// A small, real, mutable mock "backend": recording a match here actually updates ratings, W-L-D,
// form, and the session's deltas, so the whole loop (record -> result -> leaderboard reflects it)
// is verifiable end to end against MSW, not just the static Phase 2 seed. Built from
// leaderboard-seed.ts's initial values rather than replacing that file.
import { computeMatchOutcome, PROVISIONAL_GAMES, resultFor, type MatchOutcome, type MatchResult } from './elo'
import { seedLeaderboardEntries, seedPlayers, seedSession } from './leaderboard-seed'

interface PlayerState {
  id: string
  name: string
  avatarUrl: string | null
  isActive: boolean
  rating: number
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  form: MatchResult[]
  lastPlayedAt: string | null
}

const players = new Map<string, PlayerState>(
  seedLeaderboardEntries.map((entry) => {
    const player = seedPlayers.find((p) => p.id === entry.playerId)
    if (!player) throw new Error(`Seed inconsistency: no player for entry ${entry.playerId}`)
    return [
      entry.playerId,
      {
        id: entry.playerId,
        name: player.name,
        avatarUrl: player.avatarUrl,
        isActive: player.isActive,
        rating: entry.rating,
        gamesPlayed: entry.gamesPlayed,
        wins: entry.wins,
        losses: entry.losses,
        draws: entry.draws,
        form: entry.form,
        // The seed has no match timestamps; anyone who's played is taken to have played this session.
        lastPlayedAt: entry.gamesPlayed > 0 ? seedSession.startedAt : null,
      },
    ]
  }),
)

const session = {
  id: seedSession.id,
  name: seedSession.name,
  startedAt: seedSession.startedAt,
  endedAt: seedSession.endedAt as string | null,
  createdBy: seedSession.createdBy,
  matchCount: seedSession.matchCount,
  playerDeltas: new Map(seedSession.playerDeltas.map((d) => [d.playerId, d.delta])),
  biggestMover: seedSession.biggestMover,
}

// Most-recently-played first. Seeded with a plausible initial order (established players before
// the barely-played ones); recordMatch moves both participants to the front.
let recentlyPlayedOrder = ['ras', 'dennis', 'jason', 'musya', 'dave', 'stan', 'vin', 'katez']

let nextSequence = 1000 // arbitrary, well above any "already played" match
const matchLog: Array<{
  id: string
  sequence: number
  homePlayerId: string
  awayPlayerId: string
  homeScore: number
  awayScore: number
  decidedOnPenalties: boolean
  playedAt: string
  sessionId: string | null
  recordedBy: string
}> = []
const recordedById = new Map<string, { match: (typeof matchLog)[number]; outcome: MatchOutcome }>()

function streakFromForm(form: MatchResult[]): { result: MatchResult; length: number } | null {
  const mostRecent = form.at(-1)
  if (mostRecent === undefined) return null
  let length = 0
  for (let i = form.length - 1; i >= 0; i -= 1) {
    if (form[i] !== mostRecent) break
    length += 1
  }
  return { result: mostRecent, length }
}

function rankedEntries() {
  return [...players.values()]
    .map((p) => ({
      playerId: p.id,
      rating: p.rating,
      gamesPlayed: p.gamesPlayed,
      wins: p.wins,
      losses: p.losses,
      draws: p.draws,
      winPct: p.gamesPlayed === 0 ? 0 : p.wins / p.gamesPlayed,
      form: p.form,
      streak: streakFromForm(p.form),
      isProvisional: p.gamesPlayed < PROVISIONAL_GAMES,
    }))
    .sort((a, b) => (b.rating !== a.rating ? b.rating - a.rating : a.playerId.localeCompare(b.playerId)))
    .map((entry, index) => ({ rank: index + 1, ...entry }))
}

export function getPlayers() {
  return [...players.values()]
    .filter((p) => p.isActive)
    .map((p) => ({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatarUrl,
      isActive: p.isActive,
      lastPlayedAt: p.lastPlayedAt,
    }))
}

export function getLeaderboardResponse() {
  const entries = rankedEntries()
  const meanRating = entries.reduce((sum, e) => sum + e.rating, 0) / entries.length
  return {
    entries,
    meanRating,
    ratingConfig: { name: 'default-elo', provisionalGames: PROVISIONAL_GAMES },
  }
}

export function getSessionCurrent() {
  return {
    id: session.id,
    name: session.name,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    createdBy: session.createdBy,
  }
}

export function getSessionSummary(id: string) {
  if (id !== session.id) return null
  return {
    id: session.id,
    name: session.name,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    matchCount: session.matchCount,
    playerDeltas: [...session.playerDeltas.entries()].map(([playerId, delta]) => ({ playerId, delta })),
    biggestMover: session.biggestMover,
  }
}

/** Only identity/order matter here — the frontend derives "recently played" from this, not the
 *  scores or timestamps. */
export function getRecentMatches(limit: number) {
  const real = [...matchLog].sort((a, b) => b.sequence - a.sequence)
  const seeded = recentlyPlayedOrder
    .filter((id) => !real.some((m) => m.homePlayerId === id || m.awayPlayerId === id))
    .map((playerId, index) => ({
      id: `seed-match-${playerId}`,
      sequence: 100 - index,
      homePlayerId: playerId,
      awayPlayerId: recentlyPlayedOrder[(index + 1) % recentlyPlayedOrder.length]!,
      homeScore: 1,
      awayScore: 0,
      isVoid: false,
      playedAt: new Date(Date.now() - (index + 1) * 3_600_000).toISOString(),
      sessionId: null,
      recordedBy: 'mock-admin',
    }))
  return [...real, ...seeded].slice(0, limit)
}

export function previewMatch(homeId: string, awayId: string, homeScore: number, awayScore: number) {
  const home = players.get(homeId)
  const away = players.get(awayId)
  if (!home || !away) return null
  return computeMatchOutcome(
    homeId,
    { rating: home.rating, gamesPlayed: home.gamesPlayed },
    awayId,
    { rating: away.rating, gamesPlayed: away.gamesPlayed },
    homeScore,
    awayScore,
  )
}

export function recordMatch(
  id: string,
  homeId: string,
  awayId: string,
  homeScore: number,
  awayScore: number,
  decidedOnPenalties: boolean,
) {
  const existing = recordedById.get(id)
  if (existing) {
    // Idempotent retry — fc-rating-backend's own documented behavior: rankChanges comes back
    // empty because it can't reconstruct historical rank position on retry.
    return { match: existing.match, outcome: existing.outcome, rankChanges: [] as never[] }
  }

  const home = players.get(homeId)
  const away = players.get(awayId)
  if (!home || !away) throw new Error('Unknown player')

  const rankBefore = new Map(rankedEntries().map((e) => [e.playerId, e.rank]))

  const outcome = computeMatchOutcome(
    homeId,
    { rating: home.rating, gamesPlayed: home.gamesPlayed },
    awayId,
    { rating: away.rating, gamesPlayed: away.gamesPlayed },
    homeScore,
    awayScore,
  )

  home.rating = outcome.home.after.rating
  home.gamesPlayed = outcome.home.after.gamesPlayed
  away.rating = outcome.away.after.rating
  away.gamesPlayed = outcome.away.after.gamesPlayed

  const homeResult = resultFor(outcome.home.actualScore)
  const awayResult = resultFor(outcome.away.actualScore)
  home.form = [...home.form, homeResult].slice(-5)
  away.form = [...away.form, awayResult].slice(-5)
  for (const [player, result] of [
    [home, homeResult],
    [away, awayResult],
  ] as const) {
    if (result === 'W') player.wins += 1
    else if (result === 'L') player.losses += 1
    else player.draws += 1
  }

  recentlyPlayedOrder = [homeId, awayId, ...recentlyPlayedOrder.filter((p) => p !== homeId && p !== awayId)]

  session.matchCount += 1
  session.playerDeltas.set(homeId, outcome.home.delta)
  session.playerDeltas.set(awayId, outcome.away.delta)
  session.biggestMover = [...session.playerDeltas.entries()].reduce<{
    playerId: string
    delta: number
  } | null>((max, [playerId, delta]) => (max === null || Math.abs(delta) > Math.abs(max.delta) ? { playerId, delta } : max), null)

  const match = {
    id,
    sequence: nextSequence,
    homePlayerId: homeId,
    awayPlayerId: awayId,
    homeScore,
    awayScore,
    decidedOnPenalties,
    playedAt: new Date().toISOString(),
    sessionId: session.id,
    recordedBy: 'mock-admin',
  }
  nextSequence += 1
  matchLog.push(match)
  home.lastPlayedAt = match.playedAt
  away.lastPlayedAt = match.playedAt

  const rankAfter = new Map(rankedEntries().map((e) => [e.playerId, e.rank]))
  const rankChanges = [homeId, awayId]
    .map((playerId) => ({ playerId, from: rankBefore.get(playerId)!, to: rankAfter.get(playerId)! }))
    .filter((c) => c.from !== c.to)

  const result = { match, outcome, rankChanges }
  recordedById.set(id, { match, outcome })
  return result
}
