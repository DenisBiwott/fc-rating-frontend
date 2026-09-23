import { describe, expect, it } from 'vitest'
import { formatJoined, formatPlayedAt } from './played-at'

describe('formatPlayedAt', () => {
  const now = new Date(2026, 8, 23, 22, 0)

  it('shows a 24h time for a match played today', () => {
    expect(formatPlayedAt(new Date(2026, 8, 23, 21, 49).toISOString(), now)).toMatch(/21[:.]49/)
  })

  it('shows a short date for an earlier day', () => {
    const label = formatPlayedAt(new Date(2026, 8, 5, 20, 0).toISOString(), now)
    expect(label).toMatch(/5/)
    expect(label).not.toMatch(/20[:.]00/)
  })
})

describe('formatJoined', () => {
  it('shows the month and year only', () => {
    const label = formatJoined(new Date(2026, 4, 17, 20, 0).toISOString())
    expect(label).toMatch(/2026/)
    expect(label).not.toMatch(/17/)
  })
})
