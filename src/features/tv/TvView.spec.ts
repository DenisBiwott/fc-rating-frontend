import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { queryClient } from '@/api/query-client'
import * as db from '@/mocks/seed/mock-db'
import { server } from '@/test-setup'
import TvView from './TvView.vue'

async function mountTv() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'leaderboard', component: { template: '<div />' } },
      { path: '/tv', name: 'tv', component: TvView },
    ],
  })
  await router.push('/tv')
  const wrapper = mount(TvView, {
    attachTo: document.body,
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]] },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('TvView', () => {
  it('shows the session, rated players only, and the last 3 results', async () => {
    const { wrapper } = await mountTv()

    expect(wrapper.find('h1').text()).toBe(db.getSessionCurrent().name)
    expect(wrapper.text()).toContain('esc to exit')
    const rows = wrapper.findAll('[aria-label="Standings"] > li')
    // 8 seeded players; Katez has no games, so is hidden on TV.
    expect(rows).toHaveLength(7)
    expect(wrapper.text()).not.toContain('Katez')
    // Vin is provisional: the PROV badge is kept, unlike the 3e mock.
    expect(wrapper.text()).toContain('PROV 4/10')
    expect(wrapper.findAll('[aria-label="Latest matches"] li')).toHaveLength(3)
    wrapper.unmount()
  })

  it('tints the players of a match recorded elsewhere on the next poll, and washes its card', async () => {
    const { wrapper } = await mountTv()

    // Recorded on another device: the TV only learns of it from its probe. Refetching the probe
    // alone must be enough, so this also covers probe → standings + LATEST refetch.
    db.recordMatch('0199a000-0000-7000-8000-00000000abcd', 'stan', 'dave', 2, 1, false)
    await queryClient.refetchQueries({ queryKey: ['tv', 'probe'] })
    await flushPromises()

    const rowFor = (name: string) =>
      wrapper.findAll('[aria-label="Standings"] > li').find((li) => li.text().includes(name))!
    expect(rowFor('Stan').classes()).toContain('bg-[rgba(52,211,153,0.07)]')
    expect(rowFor('Dave').classes()).toContain('bg-[rgba(244,113,89,0.05)]')
    expect(rowFor('Ras').classes()).not.toContain('bg-[rgba(52,211,153,0.07)]')

    const firstCard = wrapper.find('[aria-label="Latest matches"] li')
    expect(firstCard.text()).toContain('Stan')
    expect(firstCard.find('span[aria-hidden="true"]').classes()).toContain('opacity-100')
    wrapper.unmount()
  })

  it('an unchanged probe costs one request and refetches nothing else', async () => {
    const { wrapper } = await mountTv()
    const seen: string[] = []
    const record = ({ request }: { request: Request }) => seen.push(new URL(request.url).pathname)
    server.events.on('request:start', record)

    await queryClient.refetchQueries({ queryKey: ['tv', 'probe'] })
    await flushPromises()

    server.events.removeListener('request:start', record)
    expect(seen).toEqual(['/leaderboard'])
    wrapper.unmount()
  })

  it('input on the TV checks at once, but only once the checks have slowed down', async () => {
    const { wrapper } = await mountTv()
    const seen: string[] = []
    const record = ({ request }: { request: Request }) => seen.push(new URL(request.url).pathname)
    server.events.on('request:start', record)

    // Still at the fast pace: the next 10s tick is soon enough, so the mouse doesn't trigger one.
    document.dispatchEvent(new PointerEvent('pointerdown'))
    await flushPromises()
    expect(seen).toEqual([])

    // Quiet for 3 hours (slowest step): someone picks up the remote.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.now() + 3 * 60 * 60_000)
    document.dispatchEvent(new PointerEvent('pointerdown'))
    await flushPromises()
    vi.useRealTimers()

    server.events.removeListener('request:start', record)
    expect(seen).toEqual(['/leaderboard'])
    wrapper.unmount()
  })

  it('Esc exits to the leaderboard when there is nothing to go back to', async () => {
    const { wrapper, router } = await mountTv()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('leaderboard')
    wrapper.unmount()
  })
})
