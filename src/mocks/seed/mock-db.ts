// A small, real, mutable mock "backend": recording a match here actually updates ratings, W-L-D,
// form, and the session's deltas, so the whole loop (record -> result -> leaderboard reflects it)
// is verifiable end to end against MSW, not just the static Phase 2 seed. Built from
// leaderboard-seed.ts's initial values rather than replacing that file.
import { computeMatchOutcome, PROVISIONAL_GAMES, resultFor, type MatchOutcome, type MatchResult } from './elo'
import { seedLeaderboardEntries, seedPlayers, seedSession } from './leaderboard-seed'

// The seed has no join dates; these spread the roster's Joined column over a few months (3d).
// Anyone not listed joined as this session started.
const JOINED_MONTHS_AGO: Record<string, number> = { ras: 6, dennis: 6, jason: 5, musya: 5, dave: 4, stan: 4, vin: 1 }
function joinedAt(playerId: string): string {
  const monthsAgo = JOINED_MONTHS_AGO[playerId]
  if (monthsAgo === undefined) return seedSession.startedAt
  const date = new Date()
  date.setMonth(date.getMonth() - monthsAgo)
  return date.toISOString()
}

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
  createdAt: string
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
        createdAt: joinedAt(entry.playerId),
        // The seed has no match timestamps; anyone who's played is taken to have played this session.
        lastPlayedAt: entry.gamesPlayed > 0 ? seedSession.startedAt : null,
      },
    ]
  }),
)

// Two deactivated players so the roster's Inactive tab has content (3d: "8 active · 2 inactive").
// Otieno has history (so can't be deleted); Kev never played (so can).
const monthsAgo = (n: number) => {
  const date = new Date()
  date.setMonth(date.getMonth() - n)
  return date.toISOString()
}
for (const p of [
  { id: 'otieno', name: 'Otieno', rating: 1231, wins: 7, losses: 5, draws: 2, form: ['W', 'D', 'L', 'W', 'W'] as MatchResult[], joined: 7, last: 2 },
  { id: 'kev', name: 'Kev', rating: 1200, wins: 0, losses: 0, draws: 0, form: [] as MatchResult[], joined: 3, last: null },
]) {
  players.set(p.id, {
    id: p.id,
    name: p.name,
    avatarUrl: null,
    isActive: false,
    rating: p.rating,
    gamesPlayed: p.wins + p.losses + p.draws,
    wins: p.wins,
    losses: p.losses,
    draws: p.draws,
    form: p.form,
    createdAt: monthsAgo(p.joined),
    lastPlayedAt: p.last === null ? null : monthsAgo(p.last),
  })
}

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
  // Like the backend's activePlayerRatings: deactivated players drop out of the standings.
  return [...players.values()]
    .filter((p) => p.isActive)
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
    // Mirrors the backend's rankPlayers(): 0-game (unrated) players rank last regardless of rating.
    .sort((a, b) => {
      if ((a.gamesPlayed === 0) !== (b.gamesPlayed === 0)) return a.gamesPlayed === 0 ? 1 : -1
      return b.rating !== a.rating ? b.rating - a.rating : a.playerId.localeCompare(b.playerId)
    })
    .map((entry, index) => ({ rank: index + 1, ...entry }))
}

/** GET /players: every player, or only active/inactive ones when `active` is given. */
export function getPlayers(active?: boolean) {
  return [...players.values()]
    .filter((p) => active === undefined || p.isActive === active)
    .map((p) => ({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatarUrl,
      isActive: p.isActive,
      createdAt: p.createdAt,
      lastPlayedAt: p.lastPlayedAt,
    }))
}

function toPlayerDto(p: PlayerState) {
  return { id: p.id, name: p.name, avatarUrl: p.avatarUrl, isActive: p.isActive }
}

function nameTaken(name: string, exceptId?: string): boolean {
  const lower = name.toLowerCase()
  return [...players.values()].some((p) => p.id !== exceptId && p.name.toLowerCase() === lower)
}

/** POST /players. `null` when the name is taken (the handler's 409). */
export function createPlayer(name: string) {
  if (nameTaken(name)) return null
  const player: PlayerState = {
    id: crypto.randomUUID(),
    name,
    avatarUrl: null,
    isActive: true,
    rating: 1200,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    form: [],
    createdAt: new Date().toISOString(),
    lastPlayedAt: null,
  }
  players.set(player.id, player)
  return toPlayerDto(player)
}

/** PATCH /players/:id. 'not-found' / 'conflict' map to the handler's 404 / 409. */
export function updatePlayer(id: string, patch: { name?: string; isActive?: boolean }) {
  const player = players.get(id)
  if (!player) return 'not-found' as const
  if (patch.name !== undefined && nameTaken(patch.name, id)) return 'conflict' as const
  if (patch.name !== undefined) player.name = patch.name
  if (patch.isActive !== undefined) player.isActive = patch.isActive
  return toPlayerDto(player)
}

/** DELETE /players/:id, only for a player who has never played (the backend's 409 otherwise). */
export function deletePlayer(id: string) {
  const player = players.get(id)
  if (!player) return 'not-found' as const
  if (player.gamesPlayed > 0) return 'conflict' as const
  players.delete(id)
  recentlyPlayedOrder = recentlyPlayedOrder.filter((p) => p !== id)
  return 'deleted' as const
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
  const real = [...matchLog]
    .sort((a, b) => b.sequence - a.sequence)
    .map((m) => ({ ...m, isVoid: false, outcome: recordedById.get(m.id)?.outcome ?? null }))
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
      // No recorded history to reconstruct a seeded match's outcome from.
      outcome: null,
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

// ── Profile endpoints (Turn 3's desktop profile needed them in the browser; Phase 4 had only been
// verified against the real API). The seed has no match history, so everything below is derived
// from the matches recorded in this mock session: a profile gains history as you record.

function playerLog(playerId: string) {
  return matchLog
    .filter((m) => m.homePlayerId === playerId || m.awayPlayerId === playerId)
    .sort((a, b) => a.sequence - b.sequence)
}

function sideOf(match: (typeof matchLog)[number], playerId: string) {
  const outcome = recordedById.get(match.id)!.outcome
  return match.homePlayerId === playerId ? outcome.home : outcome.away
}

export function getSessions() {
  return [getSessionCurrent()]
}

export function getRatingHistory(playerId: string) {
  return playerLog(playerId).map((m) => {
    const side = sideOf(m, playerId)
    return {
      matchId: m.id,
      sequence: m.sequence,
      playedAt: m.playedAt,
      before: side.before.rating,
      after: side.after.rating,
      delta: side.delta,
    }
  })
}

export function getPlayerProfile(playerId: string) {
  const p = players.get(playerId)
  if (!p) return null
  let goalsFor = 0
  let goalsAgainst = 0
  type Run = { result: MatchResult; length: number }
  let best = null as Run | null
  let run = null as Run | null
  for (const m of playerLog(playerId)) {
    const isHome = m.homePlayerId === playerId
    goalsFor += isHome ? m.homeScore : m.awayScore
    goalsAgainst += isHome ? m.awayScore : m.homeScore
    const result = resultFor(sideOf(m, playerId).actualScore)
    run = run?.result === result ? { result, length: run.length + 1 } : { result, length: 1 }
    if (!best || run.length > best.length) best = run
  }
  const streak = streakFromForm(p.form)
  return {
    playerId: p.id,
    name: p.name,
    isActive: p.isActive,
    createdAt: p.createdAt,
    rating: p.rating,
    gamesPlayed: p.gamesPlayed,
    wins: p.wins,
    draws: p.draws,
    losses: p.losses,
    form: p.form,
    streak,
    bestStreak: best ?? streak,
    goalsFor,
    goalsAgainst,
    isProvisional: p.gamesPlayed < PROVISIONAL_GAMES,
  }
}

/** GET /matches?playerId=, newest first, paged by `sequence` like the backend's cursor. */
export function getPlayerMatches(playerId: string, limit: number, cursor: number | null) {
  const all = playerLog(playerId)
    .reverse()
    .filter((m) => cursor === null || m.sequence < cursor)
  const page = all.slice(0, limit)
  return {
    items: page.map((m) => ({ ...m, isVoid: false, outcome: recordedById.get(m.id)?.outcome ?? null })),
    nextCursor: all.length > limit ? (page.at(-1)?.sequence ?? null) : null,
  }
}
