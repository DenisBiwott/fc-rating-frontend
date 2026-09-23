// TV mode is drawn on a fixed 1440×810 stage (3e) and scaled to the screen, so the standings
// always have the same height to fill. A TV can't scroll: rows shrink from 76px to fit everyone,
// and only below a legible minimum does the list cut off with a "+N more" line.

export const STAGE_WIDTH = 1440
export const STAGE_HEIGHT = 810

/** 810 − 2×40 padding − the header (38) − the header/board gap (26). */
export const BOARD_HEIGHT = 666
export const IDEAL_ROW = 76
export const MIN_ROW = 52
export const MORE_LINE = 40

export interface RowFit {
  rowHeight: number
  /** How many rows to show, from the top. */
  visible: number
  /** How many are cut off (shown as "+N more"). */
  hidden: number
}

export function fitRows(count: number, available = BOARD_HEIGHT): RowFit {
  if (count * IDEAL_ROW <= available) return { rowHeight: IDEAL_ROW, visible: count, hidden: 0 }
  if (count * MIN_ROW <= available) {
    return { rowHeight: Math.floor(available / count), visible: count, hidden: 0 }
  }
  const visible = Math.floor((available - MORE_LINE) / MIN_ROW)
  return { rowHeight: MIN_ROW, visible, hidden: count - visible }
}

/** The stage's scale to fit a viewport, letterboxed: the smaller of the two ratios. */
export function stageScale(viewportWidth: number, viewportHeight: number): number {
  return Math.min(viewportWidth / STAGE_WIDTH, viewportHeight / STAGE_HEIGHT)
}
