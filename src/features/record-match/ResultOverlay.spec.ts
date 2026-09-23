import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ResultOverlay from './ResultOverlay.vue'

function participant(actualScore: 1 | 0.5 | 0, delta: number) {
  return { before: { rating: 1200 }, after: { rating: 1200 + delta }, expectedScore: 0.5, actualScore, delta }
}

function mountResult(homeScore: number, awayScore: number, variant: 'screen' | 'panel' = 'screen') {
  const home = homeScore > awayScore ? 1 : homeScore < awayScore ? 0 : 0.5
  const away = home === 1 ? 0 : home === 0 ? 1 : 0.5
  return mount(ResultOverlay, {
    props: {
      homePlayerId: 'h',
      awayPlayerId: 'a',
      homeName: 'Ras',
      awayName: 'Dennis',
      homeScore,
      awayScore,
      homeOutcome: participant(home, home === 1 ? 10 : home === 0 ? -10 : 1),
      awayOutcome: participant(away, away === 1 ? 10 : away === 0 ? -10 : -1),
      upset: false,
      rankChanges: [],
      sessionContext: null,
      playedAt: '2026-09-23T21:58:00Z',
      variant,
    },
  })
}

// [home card, away card] wash classes, identified by their tint's RGB.
function cardTints(wrapper: ReturnType<typeof mountResult>): string[] {
  return wrapper.findAll('.flex-1.rounded-2xl.border').map((card) => {
    const cls = card.classes().join(' ')
    if (cls.includes('52,211,153')) return 'green'
    if (cls.includes('244,113,89')) return 'coral'
    if (cls.includes('161,161,170')) return 'neutral'
    return 'none'
  })
}

describe('ResultOverlay player cards', () => {
  it('washes the winner green and the loser coral', () => {
    expect(cardTints(mountResult(3, 1))).toEqual(['green', 'coral'])
    expect(cardTints(mountResult(0, 2))).toEqual(['coral', 'green'])
  })

  it('gives both cards a neutral wash on a draw', () => {
    expect(cardTints(mountResult(2, 2))).toEqual(['neutral', 'neutral'])
  })
})

describe('ResultOverlay in the drawer (4b)', () => {
  it('has no buttons; Escape or a click closes it', async () => {
    const wrapper = mountResult(3, 1, 'panel')
    expect(wrapper.findAll('button')).toHaveLength(0)

    await wrapper.trigger('keydown', { key: 'Escape' })
    await wrapper.trigger('click')
    expect(wrapper.emitted('done')).toHaveLength(2)
    expect(wrapper.emitted('recordAnother')).toBeUndefined()
  })

  it('keeps Record another and Done on the phone screen', () => {
    const labels = mountResult(3, 1).findAll('button').map((b) => b.text())
    expect(labels).toEqual(['Record another', 'Done'])
  })
})
