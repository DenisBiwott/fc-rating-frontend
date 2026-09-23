import { describe, expect, it } from 'vitest'
import { historyColumnsForWidth } from './historyColumns'

describe('historyColumnsForWidth', () => {
  it('shows every column at 3c width (~800px)', () => {
    expect(historyColumnsForWidth(800)).toEqual({ after: true, session: true, when: true })
  })

  it('drops Session, then When, then After, at their exact boundaries', () => {
    expect(historyColumnsForWidth(706)).toEqual({ after: true, session: true, when: true })
    expect(historyColumnsForWidth(705)).toEqual({ after: true, session: false, when: true })
    expect(historyColumnsForWidth(555)).toEqual({ after: true, session: false, when: false })
    expect(historyColumnsForWidth(445)).toEqual({ after: false, session: false, when: false })
  })

  it('never drops below Result · Opponent · Score · Δ', () => {
    expect(historyColumnsForWidth(200)).toEqual({ after: false, session: false, when: false })
  })
})
