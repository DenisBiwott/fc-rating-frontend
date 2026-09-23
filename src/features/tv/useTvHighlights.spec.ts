import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { HIGHLIGHT_MS } from '@/features/leaderboard/useRecentMoves'
import { diffStandings, newMatchIds, useTvHighlights } from './useTvHighlights'

const row = (playerId: string, rank: number, rating: number) => ({ playerId, rank, rating })

describe('diffStandings', () => {
  it('marks a swap: the gainer up a rank, the loser down one', () => {
    const prev = [row('dave', 5, 1188), row('stan', 6, 1162)]
    const next = [row('stan', 5, 1179), row('dave', 6, 1171)]
    const moves = diffStandings(prev, next)
    expect(moves.get('stan')).toEqual({ tone: 'up', rankMove: 1 })
    expect(moves.get('dave')).toEqual({ tone: 'down', rankMove: -1 })
  })

  it('tints a rating change with no rank move, and leaves a pushed-down bystander unmarked', () => {
    const prev = [row('ras', 1, 1387), row('jason', 2, 1300), row('vin', 3, 1290)]
    // Vin beats Ras (still 1st) and passes Jason, who only moved because Vin passed him.
    const next = [row('ras', 1, 1375), row('vin', 2, 1302), row('jason', 3, 1300)]
    const moves = diffStandings(prev, next)
    expect(moves.get('ras')).toEqual({ tone: 'down', rankMove: 0 })
    expect(moves.get('vin')).toEqual({ tone: 'up', rankMove: 1 })
    expect(moves.has('jason')).toBe(false)
  })

  it('marks everyone a void recalculated, and nothing when nothing changed', () => {
    const prev = [row('a', 1, 1300), row('b', 2, 1250), row('c', 3, 1200)]
    const next = [row('a', 1, 1296.5), row('b', 2, 1252), row('c', 3, 1201.5)]
    expect(diffStandings(prev, next).size).toBe(3)
    expect(diffStandings(prev, prev).size).toBe(0)
  })

  it('skips a player who is new in this poll', () => {
    expect(diffStandings([], [row('new', 1, 1200)]).size).toBe(0)
  })
})

describe('newMatchIds', () => {
  it('returns the ids not seen in the previous poll', () => {
    expect(newMatchIds([{ id: 'm1' }, { id: 'm2' }], [{ id: 'm3' }, { id: 'm1' }, { id: 'm2' }])).toEqual(
      new Set(['m3']),
    )
    expect(newMatchIds([{ id: 'm1' }], [{ id: 'm1' }]).size).toBe(0)
  })
})

describe('useTvHighlights', () => {
  afterEach(() => vi.useRealTimers())

  function setup() {
    const standings = ref<ReturnType<typeof row>[] | undefined>(undefined)
    const latest = ref<{ id: string }[] | undefined>(undefined)
    let result!: ReturnType<typeof useTvHighlights>
    mount(
      defineComponent({
        setup() {
          result = useTvHighlights(standings, latest)
          return () => null
        },
      }),
    )
    return { standings, latest, result }
  }

  it('treats the first load as the baseline, then flashes changes for 4s', async () => {
    vi.useFakeTimers()
    const { standings, latest, result } = setup()

    standings.value = [row('dave', 5, 1188), row('stan', 6, 1162)]
    latest.value = [{ id: 'm1' }]
    await nextTick()
    expect(result.rowHighlights.value.size).toBe(0)
    expect(result.matchHighlights.value.size).toBe(0)

    standings.value = [row('stan', 5, 1179), row('dave', 6, 1171)]
    latest.value = [{ id: 'm2' }, { id: 'm1' }]
    await nextTick()
    expect(result.rowHighlights.value.get('stan')).toEqual({ tone: 'up', rankMove: 1 })
    expect(result.matchHighlights.value.has('m2')).toBe(true)

    vi.advanceTimersByTime(HIGHLIGHT_MS)
    expect(result.rowHighlights.value.size).toBe(0)
    expect(result.matchHighlights.value.size).toBe(0)
  })
})
