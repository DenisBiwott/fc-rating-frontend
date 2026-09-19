import { describe, expect, it } from 'vitest'
import { formatElapsed } from './elapsed'

// Local-time dates (month is 1-based here for readability), kept to Jan–Mar windows so no DST
// transition in a common timezone shifts a day boundary under the day/hour assertions.
const at = (year: number, month: number, day: number, hour = 0, minute = 0) =>
  new Date(year, month - 1, day, hour, minute)

const start = at(2026, 1, 10, 15, 46)

describe('formatElapsed', () => {
  it('shows minutes, then hours and minutes, under a day', () => {
    expect(formatElapsed(start, start)).toBe('0m')
    expect(formatElapsed(start, at(2026, 1, 10, 16, 28))).toBe('42m')
    expect(formatElapsed(start, at(2026, 1, 10, 18, 58))).toBe('3h 12m')
    expect(formatElapsed(start, at(2026, 1, 10, 17, 46))).toBe('2h')
  })

  it('shows days and hours past a day — a week reads 7d, not 168h', () => {
    expect(formatElapsed(start, at(2026, 1, 15, 19, 46))).toBe('5d 4h')
    expect(formatElapsed(start, at(2026, 1, 17, 15, 58))).toBe('7d')
  })

  it('counts calendar months, not 30-day blocks', () => {
    expect(formatElapsed(start, at(2026, 2, 10, 15, 45))).toBe('30d 23h') // January has 31 days
    expect(formatElapsed(start, at(2026, 2, 10, 15, 46))).toBe('1mo')
    expect(formatElapsed(start, at(2026, 3, 13, 15, 46))).toBe('2mo 3d')
  })

  it('clamps a month-end start to the shorter month', () => {
    const endOfJanuary = at(2027, 1, 31, 12)
    expect(formatElapsed(endOfJanuary, at(2027, 2, 28, 12))).toBe('1mo')
    expect(formatElapsed(endOfJanuary, at(2027, 3, 1, 12))).toBe('1mo 1d')
  })

  it('shows years and months past a year', () => {
    expect(formatElapsed(start, at(2027, 3, 10, 15, 46))).toBe('1y 2mo')
    expect(formatElapsed(start, at(2028, 1, 10, 15, 46))).toBe('2y')
  })

  it('never goes negative when the clock is behind the server', () => {
    expect(formatElapsed(start, at(2026, 1, 10, 15, 40))).toBe('0m')
  })
})
