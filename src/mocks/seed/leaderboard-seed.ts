// Deterministic mock data — DESIGN-SPEC.md's own "Mock data (use verbatim for seeds and MSW)"
// table, §6. Per-player fields are derived here (gamesPlayed, winPct, streak, isProvisional)
// rather than hand-typed, mirroring how fc-rating-backend actually computes them
// (src/domain/leaderboard/compute.ts) so a mismatch shows up as a wrong number, not a typo.
//
// DESIGN-SPEC.md's own "142 matches total" doesn't reconcile with its per-player W-L-D rows
// (they sum to 215 player-games, i.e. ~108 matches) — this is a pre-existing inconsistency in the
// design doc's example data, not something reproduced here. The leaderboard screen derives its
// displayed match count from gamesPlayed sums instead of hardcoding either figure.

export type MatchResult = 'W' | 'L' | 'D'

export interface SeedPlayer {
  id: string
  name: string
  avatarUrl: string | null
  isActive: boolean
}

export interface SeedLeaderboardEntry {
  rank: number
  playerId: string
  rating: number
  gamesPlayed: number
  wins: number
  draws: number
  losses: number
  winPct: number
  form: MatchResult[]
  streak: { result: MatchResult; length: number } | null
  isProvisional: boolean
}

const PROVISIONAL_GAMES = 10 // default-elo config, design doc §4.2

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

interface RawPlayer {
  id: string
  name: string
  rating: number
  wins: number
  losses: number
  draws: number
  /** null = no session delta (didn't play this session), per DeltaBadge's "—" state. */
  delta: number | null
  form: MatchResult[]
}

const RAW: RawPlayer[] = [
  { id: 'ras', name: 'Ras', rating: 1387, wins: 24, losses: 9, draws: 4, delta: 31, form: ['L', 'W', 'W', 'W', 'W'] },
  { id: 'dennis', name: 'Dennis', rating: 1341, wins: 22, losses: 11, draws: 5, delta: -12, form: ['W', 'L', 'W', 'W', 'D'] },
  { id: 'jason', name: 'Jason', rating: 1298, wins: 19, losses: 13, draws: 3, delta: 18, form: ['D', 'W', 'W', 'L', 'W'] },
  { id: 'musya', name: 'Musya', rating: 1246, wins: 16, losses: 14, draws: 6, delta: 7, form: ['L', 'W', 'D', 'W', 'L'] },
  { id: 'dave', name: 'Dave', rating: 1188, wins: 13, losses: 17, draws: 4, delta: -23, form: ['L', 'L', 'W', 'L', 'D'] },
  { id: 'stan', name: 'Stan', rating: 1162, wins: 11, losses: 18, draws: 2, delta: null, form: ['D', 'L', 'L', 'W', 'L'] },
  { id: 'vin', name: 'Vin', rating: 1207, wins: 2, losses: 2, draws: 0, delta: 40, form: ['W', 'L', 'W', 'L'] },
  { id: 'katez', name: 'Katez', rating: 1200, wins: 0, losses: 0, draws: 0, delta: null, form: [] },
]

export const seedPlayers: SeedPlayer[] = RAW.map((p) => ({
  id: p.id,
  name: p.name,
  avatarUrl: null,
  isActive: true,
}))

export const seedLeaderboardEntries: SeedLeaderboardEntry[] = RAW.map((p, index) => {
  const gamesPlayed = p.wins + p.losses + p.draws
  return {
    rank: index + 1,
    playerId: p.id,
    rating: p.rating,
    gamesPlayed,
    wins: p.wins,
    losses: p.losses,
    draws: p.draws,
    winPct: gamesPlayed === 0 ? 0 : p.wins / gamesPlayed,
    form: p.form,
    streak: streakFromForm(p.form),
    isProvisional: gamesPlayed < PROVISIONAL_GAMES,
  }
})

export const seedMeanRating = 1204 // DESIGN-SPEC.md's stated figure — a server-computed aggregate, not derived here

export const seedSession = {
  id: 'friday-night-fc',
  name: 'Friday Night FC',
  startedAt: new Date(Date.now() - (2 * 60 + 14) * 60 * 1000).toISOString(),
  endedAt: null as string | null,
  createdBy: 'mock-admin',
  matchCount: 9,
  // DESIGN-SPEC.md names Ras (+31) as this session's biggest mover, even though Vin's own
  // leaderboard-row delta (+40, part of `playerDeltas` below since every non-"—" player in the
  // mock table gets one) is arithmetically bigger — Vin is PROV 4/10, so read his +40 as a swing
  // from whatever session he last actually played, not necessarily this one. This mock's
  // simplified "one open session's playerDeltas doubles as every row's deltaSinceLastSession"
  // composition can't literally represent "a different session per player," so biggestMover is
  // asserted directly here rather than derived by max(|delta|), which would silently pick Vin
  // and contradict the design doc's own stated example.
  biggestMover: { playerId: 'ras', delta: 31 } as { playerId: string; delta: number } | null,
  playerDeltas: RAW.filter((p) => p.delta !== null).map((p) => ({
    playerId: p.id,
    delta: p.delta as number,
  })),
}
