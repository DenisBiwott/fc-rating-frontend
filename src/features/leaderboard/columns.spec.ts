import { describe, expect, it } from 'vitest'
import { columnsForWidth } from './columns'

describe('columnsForWidth', () => {
  it('shows every column when there is room (3a at 1440 without a panel)', () => {
    expect(columnsForWidth(1352)).toEqual({ last: true, mp: true, splitWld: true })
  })

  it('drops columns in the agreed order as the table narrows: Last, then MP, then W/L/D merge', () => {
    // Exact boundaries: 896 is the full table's minimum, then each step frees that column's width.
    expect(columnsForWidth(896)).toEqual({ last: true, mp: true, splitWld: true })
    expect(columnsForWidth(895)).toEqual({ last: false, mp: true, splitWld: true })
    expect(columnsForWidth(803)).toEqual({ last: false, mp: false, splitWld: true })
    expect(columnsForWidth(751)).toEqual({ last: false, mp: false, splitWld: false })
  })

  it('returns null when even the leanest table does not fit, so the tablet rows take over', () => {
    expect(columnsForWidth(704)).not.toBeNull()
    expect(columnsForWidth(703)).toBeNull()
  })
})
