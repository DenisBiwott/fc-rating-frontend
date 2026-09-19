import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { queryClient } from '@/api/query-client'
import * as db from '@/mocks/seed/mock-db'
import { server } from '@/test-setup'
import LeaderboardView from './LeaderboardView.vue'

const testRouter = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'leaderboard', component: LeaderboardView },
    { path: '/players/:id', name: 'player-profile', component: { template: '<div />' } },
  ],
})

describe('LeaderboardView', () => {
  it('shows matches and recency only; PROV badges use the API threshold', async () => {
    // Everything else stays the default mock; only the active config differs from default-elo.
    server.use(
      http.get('*/leaderboard', () =>
        HttpResponse.json({
          ...db.getLeaderboardResponse(),
          ratingConfig: { name: 'elo-tuned-v1', provisionalGames: 12 },
        }),
      ),
    )

    const wrapper = mount(LeaderboardView, {
      global: { plugins: [testRouter, [VueQueryPlugin, { queryClient }]] },
    })
    await flushPromises()

    // The summary line: matches · recency — no title race, no config name.
    expect(wrapper.text()).toMatch(/\d+ matches · last match .+ ago/)
    expect(wrapper.text()).not.toMatch(/leads by|level at the top/)
    expect(wrapper.text()).not.toContain('elo-tuned-v1')
    expect(wrapper.text()).not.toContain('default-elo')
    expect(wrapper.text()).not.toContain('mean')
    // Vin has 4 games in the mock seed — his provisional badge uses the config's threshold.
    expect(wrapper.text()).toContain('PROV 4/12')
    expect(wrapper.text()).not.toContain('/10')
  })
})
