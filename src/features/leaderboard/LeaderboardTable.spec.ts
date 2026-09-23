import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { LeaderboardRow } from '@/queries/useLeaderboard'
import LeaderboardTable from './LeaderboardTable.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/players/:id', name: 'player-profile', component: { template: '<div />' } }],
})

function row(rank: number, name: string, wins: number): LeaderboardRow {
  return {
    rank,
    playerId: name,
    name,
    avatarUrl: null,
    rating: 1400 - rank * 10,
    gamesPlayed: 20,
    wins,
    losses: 20 - wins,
    draws: 0,
    winPct: wins / 20,
    lastPlayedAt: null,
    form: [],
    isProvisional: false,
    deltaSinceLastSession: null,
  }
}

const rows = [row(1, 'Ras', 9), row(2, 'Dennis', 14), row(3, 'Ade', 11)]
const names = (w: ReturnType<typeof mount>) => w.findAll('a').map((a) => a.find('.truncate').text())

function mountTable(columns = { last: true, mp: true, splitWld: true }) {
  return mount(LeaderboardTable, {
    props: { rows, columns, provisionalGames: 10 },
    global: { plugins: [router] },
  })
}

describe('LeaderboardTable', () => {
  it('starts in rank order with ↓ on Rating, and re-sorts when a header is clicked', async () => {
    const wrapper = mountTable()
    expect(names(wrapper)).toEqual(['Ras', 'Dennis', 'Ade'])
    expect(wrapper.find('button[aria-pressed="true"]').text()).toBe('Rating ↓')

    await wrapper.find('button[aria-label="Sort by W"]').trigger('click')
    expect(names(wrapper)).toEqual(['Dennis', 'Ade', 'Ras'])
    expect(wrapper.find('button[aria-pressed="true"]').text()).toBe('W ↓')

    await wrapper.find('button[aria-label="Sort by Player"]').trigger('click')
    expect(names(wrapper)).toEqual(['Ade', 'Dennis', 'Ras'])
  })

  it('renders only the columns it is given', () => {
    const wrapper = mountTable({ last: false, mp: false, splitWld: false })
    const headers = wrapper.text()
    expect(headers).toContain('W-L-D')
    expect(wrapper.find('button[aria-label="Sort by MP"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Sort by Last"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Sort by L"]').exists()).toBe(false)
  })
})
