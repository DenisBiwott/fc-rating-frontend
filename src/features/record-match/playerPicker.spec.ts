import { describe, expect, it } from 'vitest'
import { matchPlayers, orderForPicker, pickerTiles } from './playerPicker'

const p = (name: string, lastPlayedAt: string | null) => ({ id: name.toLowerCase(), name, lastPlayedAt })

describe('orderForPicker', () => {
  it('orders by last played, newest first, with never-played players last by name', () => {
    const ordered = orderForPicker([
      p('Katez', null),
      p('Ras', '2026-09-23T20:10:00Z'),
      p('Abel', null),
      p('Stan', '2026-09-23T21:58:00Z'),
      p('Vin', '2026-09-05T20:00:00Z'),
    ])
    expect(ordered.map((x) => x.name)).toEqual(['Stan', 'Ras', 'Vin', 'Abel', 'Katez'])
  })
})

describe('pickerTiles', () => {
  const nine = Array.from({ length: 9 }, (_, i) => i)

  it('shows everyone when they fit, with no All tile', () => {
    expect(pickerTiles(nine.slice(0, 8), 8)).toEqual({ shown: nine.slice(0, 8), hiddenCount: 0 })
  })

  it('gives the last tile to All +N when players outnumber the tiles', () => {
    expect(pickerTiles(nine, 8)).toEqual({ shown: nine.slice(0, 7), hiddenCount: 2 })
    expect(pickerTiles(nine, 10).hiddenCount).toBe(0)
  })
})

describe('matchPlayers', () => {
  const players = [p('Dennis', null), p('Dave', null), p('Adam', null), p('Katez', null)]

  it('matches anywhere, case-insensitively, prefix matches first, and marks the letters', () => {
    const result = matchPlayers(players, 'Da')
    expect(result.map((m) => m.player.name)).toEqual(['Dave', 'Adam'])
    expect(result.map((m) => m.range)).toEqual([
      [0, 2],
      [1, 3],
    ])
  })

  it('lists everyone for an empty query, and nobody for a miss', () => {
    expect(matchPlayers(players, '  ').map((m) => m.range)).toEqual([null, null, null, null])
    expect(matchPlayers(players, 'zz')).toEqual([])
  })
})
