import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import PlayerRow from './PlayerRow.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/players/:id', name: 'player-profile', component: { template: '<div />' } }],
})

function mountRow(wins: number, losses: number, draws: number, winPct: number) {
  const gamesPlayed = wins + losses + draws
  return mount(PlayerRow, {
    props: {
      playerId: 'p',
      rank: 7,
      name: 'Vin',
      wins,
      losses,
      draws,
      winPct,
      rating: 1207,
      delta: null,
      form: [],
      gamesPlayed,
      isProvisional: gamesPlayed < 10,
      provisionalGames: 10,
    },
    global: { plugins: [router] },
  })
}

describe('PlayerRow', () => {
  it('shows Win% rounded from the API value, and the badge inline next to the name', () => {
    const wrapper = mountRow(2, 1, 0, 2 / 3)
    expect(wrapper.text()).toContain('67%')
    const badge = wrapper.findAll('span').find((s) => s.text() === 'PROV 3/10')
    // Same line as the name (its parent also holds the name), so the row keeps a uniform height.
    expect(badge?.element.parentElement?.textContent).toContain('Vin')
  })

  it('shows — rather than 0% for an unrated player', () => {
    const wrapper = mountRow(0, 0, 0, 0)
    expect(wrapper.text()).toContain('UNRATED')
    expect(wrapper.text()).not.toContain('0%')
    expect(wrapper.text()).toContain('—')
  })
})
