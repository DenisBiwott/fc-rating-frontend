import { afterEach, describe, expect, it, vi } from 'vitest'
import { flashRecordedMatch, HIGHLIGHT_MS, useRecentMoves } from './useRecentMoves'

describe('flashRecordedMatch', () => {
  afterEach(() => vi.useRealTimers())

  it('marks the gainer up and the loser down, with their rank moves, then clears after 4s', () => {
    vi.useFakeTimers()
    const moves = useRecentMoves()

    flashRecordedMatch(
      { home: { playerId: 'stan', delta: 17 }, away: { playerId: 'dave', delta: -17 } },
      [
        { playerId: 'stan', from: 6, to: 5 },
        { playerId: 'dave', from: 5, to: 6 },
        { playerId: 'someone-else', from: 9, to: 8 },
      ],
    )

    expect(moves.value.get('stan')).toEqual({ tone: 'up', rankMove: 1 })
    expect(moves.value.get('dave')).toEqual({ tone: 'down', rankMove: -1 })
    // Only the two players who played are marked; bystanders just FLIP into place.
    expect(moves.value.has('someone-else')).toBe(false)

    vi.advanceTimersByTime(HIGHLIGHT_MS - 1)
    expect(moves.value.size).toBe(2)
    vi.advanceTimersByTime(1)
    expect(moves.value.size).toBe(0)
  })

  it('a second result restarts the timer and replaces the first', () => {
    vi.useFakeTimers()
    const moves = useRecentMoves()
    flashRecordedMatch({ home: { playerId: 'a', delta: 5 }, away: { playerId: 'b', delta: -5 } }, [])
    vi.advanceTimersByTime(3000)
    flashRecordedMatch({ home: { playerId: 'c', delta: 0 }, away: { playerId: 'd', delta: 0 } }, [])

    expect([...moves.value.keys()]).toEqual(['c', 'd'])
    expect(moves.value.get('c')).toEqual({ tone: null, rankMove: 0 })
    vi.advanceTimersByTime(3000)
    expect(moves.value.size).toBe(2)
    vi.advanceTimersByTime(1000)
    expect(moves.value.size).toBe(0)
  })
})
