import { describe, expect, it } from 'vitest'
import { BOARD_HEIGHT, fitRows, IDEAL_ROW, MIN_ROW, MORE_LINE, stageScale } from './tvLayout'

describe('fitRows', () => {
  it('keeps the designed 76px rows while everyone fits (the 3e case: 8 players)', () => {
    expect(fitRows(8)).toEqual({ rowHeight: IDEAL_ROW, visible: 8, hidden: 0 })
  })

  it('shrinks rows to fit everyone, down to the minimum', () => {
    const fit = fitRows(10)
    expect(fit.visible).toBe(10)
    expect(fit.rowHeight).toBeLessThan(IDEAL_ROW)
    expect(fit.rowHeight).toBeGreaterThanOrEqual(MIN_ROW)
    expect(fit.rowHeight * 10).toBeLessThanOrEqual(BOARD_HEIGHT)
  })

  it('cuts off with a "+N more" line once even the minimum is too tall', () => {
    const fit = fitRows(20)
    expect(fit.rowHeight).toBe(MIN_ROW)
    expect(fit.visible + fit.hidden).toBe(20)
    expect(fit.visible * MIN_ROW + MORE_LINE).toBeLessThanOrEqual(BOARD_HEIGHT)
  })
})

describe('stageScale', () => {
  it('fits 16:9 screens exactly and letterboxes other shapes', () => {
    expect(stageScale(1920, 1080)).toBeCloseTo(4 / 3)
    expect(stageScale(1440, 810)).toBe(1)
    // A 16:10 laptop: width-bound, bars top and bottom.
    expect(stageScale(1440, 900)).toBe(1)
  })
})
