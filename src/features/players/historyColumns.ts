// Which columns of the desktop match-history table fit its measured width (3c). The same idea as
// the leaderboard's columns.ts: fixed widths from the mock, a minimum for the flexible Opponent
// column, and an order to drop in — Session first (least needed; one long session at MVP), then
// When, then After. Result, Opponent, Score and Δ always stay.

export const HISTORY_WIDTH = {
  chip: 40,
  score: 70,
  delta: 60,
  after: 76,
  session: 150,
  when: 110,
  menu: 40,
} as const

const GUTTERS = 40 // 20px each side
const OPPONENT_MIN = 120

export interface HistoryColumns {
  after: boolean
  session: boolean
  when: boolean
}

const LAYOUTS: HistoryColumns[] = [
  { after: true, session: true, when: true },
  { after: true, session: false, when: true },
  { after: true, session: false, when: false },
  { after: false, session: false, when: false },
]

function widthNeeded(c: HistoryColumns): number {
  const w = HISTORY_WIDTH
  return (
    GUTTERS +
    OPPONENT_MIN +
    w.chip +
    w.score +
    w.delta +
    w.menu +
    (c.after ? w.after : 0) +
    (c.session ? w.session : 0) +
    (c.when ? w.when : 0)
  )
}

/** The richest layout that fits; the leanest one when nothing does (it's the floor, not a fallback). */
export function historyColumnsForWidth(width: number): HistoryColumns {
  return LAYOUTS.find((layout) => widthNeeded(layout) <= width) ?? LAYOUTS[LAYOUTS.length - 1]!
}
