import { describe, expect, it } from 'vitest'
import { leaderboardSummary, type SummaryInput } from './summary'

const now = new Date('2026-09-19T15:00:00Z')

const summary = (overrides: Partial<SummaryInput>) =>
  leaderboardSummary({ totalMatches: 108, lastMatchAt: '2026-09-19T12:00:00Z', now, ...overrides })

describe('leaderboardSummary', () => {
  it('match count and recency', () => {
    expect(summary({})).toBe('108 matches · last match 3h ago')
  })

  it('handles no matches, one match, and a match moments ago', () => {
    expect(summary({ totalMatches: 0, lastMatchAt: null })).toBe('no matches yet')
    expect(summary({ totalMatches: 1 })).toBe('1 match · last match 3h ago')
    expect(summary({ lastMatchAt: '2026-09-19T14:59:30Z' })).toBe(
      '108 matches · last match just now',
    )
  })

  it('scales recency past hours, like the session banner', () => {
    expect(summary({ lastMatchAt: '2026-09-12T15:00:00Z' })).toBe('108 matches · last match 7d ago')
  })
})
