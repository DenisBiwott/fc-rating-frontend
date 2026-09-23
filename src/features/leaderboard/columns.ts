// Which desktop-table columns fit a given table width (DESIGN-SPEC.md §6, 3a). Measured on the
// table itself, not the viewport, so the same rule covers "no Record panel" and "panel docked".
// When space runs out, columns go in the order agreed for Turn 3: Last first, then MP, then W/L/D
// merge into one W-L-D column. Below that the table doesn't fit at all and the leaderboard falls
// back to the tablet (3f) rows.

/** 3a's fixed column widths, in px. */
export const COLUMN_WIDTH = {
  rank: 40,
  form: 116,
  wldEach: 44,
  wldMerged: 84,
  winPct: 64,
  mp: 52,
  last: 92,
  rating: 84,
  delta: 60,
} as const

/** Row side padding (28px each side) plus the least the Player column (avatar, name, badge) needs. */
const GUTTERS = 56
const PLAYER_MIN = 200

export interface DesktopColumns {
  last: boolean
  mp: boolean
  /** true = separate W, L, D columns; false = one merged W-L-D column. */
  splitWld: boolean
}

function widthNeeded(columns: DesktopColumns): number {
  const c = COLUMN_WIDTH
  return (
    GUTTERS +
    PLAYER_MIN +
    c.rank +
    c.form +
    (columns.splitWld ? c.wldEach * 3 : c.wldMerged) +
    c.winPct +
    (columns.mp ? c.mp : 0) +
    (columns.last ? c.last : 0) +
    c.rating +
    c.delta
  )
}

/** Most to least complete; the first that fits wins. */
const LAYOUTS: DesktopColumns[] = [
  { last: true, mp: true, splitWld: true },
  { last: false, mp: true, splitWld: true },
  { last: false, mp: false, splitWld: true },
  { last: false, mp: false, splitWld: false },
]

/** The columns to show at this table width, or null when even the leanest table doesn't fit. */
export function columnsForWidth(width: number): DesktopColumns | null {
  return LAYOUTS.find((layout) => widthNeeded(layout) <= width) ?? null
}
