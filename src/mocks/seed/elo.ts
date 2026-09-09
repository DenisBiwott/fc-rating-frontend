// Mirrors fc-rating-backend's Elo engine (design doc §5.2) so the mock's preview/record handlers
// compute plausible, internally-consistent numbers for any player pair and score, not just the
// leaderboard's canned example row.

export type MatchResult = 'W' | 'L' | 'D'

export interface RatingState {
  rating: number
  gamesPlayed: number
}

export interface ParticipantOutcome {
  playerId: string
  before: RatingState
  after: RatingState
  expectedScore: number
  actualScore: 1 | 0.5 | 0
  delta: number
  wasProvisional: boolean
}

export interface MatchOutcome {
  home: ParticipantOutcome
  away: ParticipantOutcome
  upset: boolean
}

export const PROVISIONAL_GAMES = 10
const K_PROVISIONAL = 40
const K_ESTABLISHED = 24

function kFor(gamesPlayed: number): number {
  return gamesPlayed < PROVISIONAL_GAMES ? K_PROVISIONAL : K_ESTABLISHED
}

export function computeMatchOutcome(
  homeId: string,
  home: RatingState,
  awayId: string,
  away: RatingState,
  homeScore: number,
  awayScore: number,
): MatchOutcome {
  const expectedHome = 1 / (1 + 10 ** ((away.rating - home.rating) / 400))
  const expectedAway = 1 - expectedHome
  const actualHome: 1 | 0.5 | 0 = homeScore > awayScore ? 1 : homeScore === awayScore ? 0.5 : 0
  const actualAway: 1 | 0.5 | 0 = actualHome === 1 ? 0 : actualHome === 0 ? 1 : 0.5

  const deltaHome = kFor(home.gamesPlayed) * (actualHome - expectedHome)
  const deltaAway = kFor(away.gamesPlayed) * (actualAway - expectedAway)

  const winnerExpected = actualHome === 1 ? expectedHome : actualAway === 1 ? expectedAway : null

  return {
    home: {
      playerId: homeId,
      before: home,
      after: { rating: home.rating + deltaHome, gamesPlayed: home.gamesPlayed + 1 },
      expectedScore: expectedHome,
      actualScore: actualHome,
      delta: deltaHome,
      wasProvisional: home.gamesPlayed < PROVISIONAL_GAMES,
    },
    away: {
      playerId: awayId,
      before: away,
      after: { rating: away.rating + deltaAway, gamesPlayed: away.gamesPlayed + 1 },
      expectedScore: expectedAway,
      actualScore: actualAway,
      delta: deltaAway,
      wasProvisional: away.gamesPlayed < PROVISIONAL_GAMES,
    },
    upset: winnerExpected !== null && winnerExpected < 0.5,
  }
}

export function resultFor(actualScore: 1 | 0.5 | 0): MatchResult {
  return actualScore === 1 ? 'W' : actualScore === 0.5 ? 'D' : 'L'
}
