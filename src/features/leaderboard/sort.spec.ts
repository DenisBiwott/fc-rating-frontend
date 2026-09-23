import { describe, expect, it } from 'vitest'
import type { LeaderboardRow } from '@/queries/useLeaderboard'
import { sortRows } from './sort'

function row(
  rank: number,
  name: string,
  opts: Partial<Pick<LeaderboardRow, 'wins' | 'gamesPlayed' | 'winPct' | 'lastPlayedAt' | 'deltaSinceLastSession'>> = {},
): LeaderboardRow {
  return {
    rank,
    playerId: name,
    name,
    avatarUrl: null,
    rating: 1400 - rank * 10,
    gamesPlayed: opts.gamesPlayed ?? 20,
    wins: opts.wins ?? 10,
    losses: 5,
    draws: 5,
    winPct: opts.winPct ?? 0.5,
    lastPlayedAt: opts.lastPlayedAt ?? null,
    form: [],
    isProvisional: (opts.gamesPlayed ?? 20) < 10,
    deltaSinceLastSession: opts.deltaSinceLastSession ?? null,
  }
}

const names = (rows: LeaderboardRow[]) => rows.map((r) => r.name)

describe('sortRows', () => {
  const rows = [
    row(1, 'Ras', { wins: 24, winPct: 0.65, deltaSinceLastSession: 31, lastPlayedAt: '2026-09-23T21:49:00Z' }),
    row(2, 'Vin', { gamesPlayed: 4, wins: 2, winPct: 0.5, deltaSinceLastSession: -5, lastPlayedAt: '2026-09-05T20:00:00Z' }),
    row(3, 'Dave', { wins: 13, winPct: 0.38, lastPlayedAt: '2026-09-23T20:58:00Z' }),
    row(4, 'Katez', { gamesPlayed: 0, wins: 0, winPct: 0 }),
  ]

  it('Rating keeps the official rank order', () => {
    expect(names(sortRows(rows, 'rating'))).toEqual(['Ras', 'Vin', 'Dave', 'Katez'])
  })

  it('keeps unrated players last on every column, and sorts provisional ones normally', () => {
    expect(names(sortRows(rows, 'player'))).toEqual(['Dave', 'Ras', 'Vin', 'Katez'])
    expect(names(sortRows(rows, 'w'))).toEqual(['Ras', 'Dave', 'Vin', 'Katez'])
    expect(names(sortRows(rows, 'winPct'))).toEqual(['Ras', 'Vin', 'Dave', 'Katez'])
  })

  it('sorts Last most-recent first and puts "no session delta" below negative deltas', () => {
    expect(names(sortRows(rows, 'last'))).toEqual(['Ras', 'Dave', 'Vin', 'Katez'])
    expect(names(sortRows(rows, 'delta'))).toEqual(['Ras', 'Vin', 'Dave', 'Katez'])
  })

  it('does not mutate its input', () => {
    const before = names(rows)
    sortRows(rows, 'player')
    expect(names(rows)).toEqual(before)
  })
})
