import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { queryClient } from '@/api/query-client'
import * as db from '@/mocks/seed/mock-db'
import { server } from '@/test-setup'
import { useRecordMatchForm } from './useRecordMatchForm'

function mountForm() {
  let form!: ReturnType<typeof useRecordMatchForm>
  mount(
    defineComponent({
      setup() {
        form = useRecordMatchForm()
        return () => h('div')
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
  )
  return form
}

describe('useRecordMatchForm', () => {
  it('starts selecting, fills slots in order, and enters scoring once both are filled', () => {
    const form = mountForm()
    expect(form.state.value).toBe('selecting')

    form.selectPlayer('ras')
    expect(form.homePlayerId.value).toBe('ras')
    expect(form.state.value).toBe('selecting')

    form.selectPlayer('dennis')
    expect(form.awayPlayerId.value).toBe('dennis')
    expect(form.state.value).toBe('scoring')
  })

  it('treats an already-selected grid tile as inert', () => {
    const form = mountForm()
    form.selectPlayer('ras')
    form.selectPlayer('ras')
    expect(form.homePlayerId.value).toBe('ras')
    expect(form.awayPlayerId.value).toBeNull()
  })

  it('clearing a filled slot returns to selecting without touching the other slot', () => {
    const form = mountForm()
    form.selectPlayer('ras')
    form.selectPlayer('dennis')
    form.clearSlot('home')
    expect(form.state.value).toBe('selecting')
    expect(form.homePlayerId.value).toBeNull()
    expect(form.awayPlayerId.value).toBe('dennis')
  })

  it('fills the active slot: Away first after → , and clearing a slot makes it active', () => {
    const form = mountForm()
    form.setActiveSide('away')
    form.selectPlayer('ras')
    expect(form.awayPlayerId.value).toBe('ras')
    expect(form.activeSide.value).toBe('home')

    form.selectPlayer('dennis')
    expect(form.homePlayerId.value).toBe('dennis')
    expect(form.state.value).toBe('scoring')
    // Scoring starts on Home, so ↑/↓ adjust the home score first.
    expect(form.activeSide.value).toBe('home')

    form.clearSlot('away')
    expect(form.activeSide.value).toBe('away')
    form.selectPlayer('jason')
    expect(form.awayPlayerId.value).toBe('jason')
  })

  it('clamps scores to the 0-20 range', () => {
    const form = mountForm()
    form.selectPlayer('ras')
    form.selectPlayer('dennis')
    for (let i = 0; i < 25; i += 1) form.incrementScore('home')
    expect(form.homeScore.value).toBe(20)
    form.decrementScore('home')
    for (let i = 0; i < 25; i += 1) form.decrementScore('home')
    expect(form.homeScore.value).toBe(0)
    form.setScore('away', 999)
    expect(form.awayScore.value).toBe(20)
  })

  it('debounces the preview fetch by 150ms and cancels superseded calls', async () => {
    vi.useFakeTimers()
    try {
      const form = mountForm()
      form.selectPlayer('ras')
      form.selectPlayer('dennis')
      form.incrementScore('home')
      await vi.advanceTimersByTimeAsync(100)
      form.incrementScore('home') // resets the debounce window before it fires
      await vi.advanceTimersByTimeAsync(100)
      expect(form.preview.data.value).toBeUndefined()

      await vi.advanceTimersByTimeAsync(60)
      await flushPromises()
      expect(form.preview.data.value).toBeDefined()
      expect(form.preview.data.value?.home.playerId).toBe('ras')
    } finally {
      vi.useRealTimers()
    }
  })

  it('submits, transitions to result, then recordAnother swaps sides and resets scores', async () => {
    const form = mountForm()
    form.selectPlayer('jason')
    form.selectPlayer('musya')
    form.setScore('home', 3)
    form.setScore('away', 1)

    await form.submit()

    expect(form.state.value).toBe('result')
    expect(form.record.data.value?.match.homePlayerId).toBe('jason')
    expect(form.record.data.value?.match.awayPlayerId).toBe('musya')

    form.recordAnother()

    expect(form.state.value).toBe('scoring')
    expect(form.homePlayerId.value).toBe('musya')
    expect(form.awayPlayerId.value).toBe('jason')
    expect(form.homeScore.value).toBe(0)
    expect(form.awayScore.value).toBe(0)
  })

  it('reset() returns a finished form to an empty selecting state', async () => {
    const form = mountForm()
    form.selectPlayer('dave')
    form.selectPlayer('stan')
    form.setScore('home', 2)
    form.decidedOnPenalties.value = true
    await form.submit()
    expect(form.state.value).toBe('result')

    form.reset()

    expect(form.state.value).toBe('selecting')
    expect(form.homePlayerId.value).toBeNull()
    expect(form.awayPlayerId.value).toBeNull()
    expect(form.homeScore.value).toBe(0)
    expect(form.decidedOnPenalties.value).toBe(false)
    expect(form.lastOutcome.value).toBeNull()
    expect(form.resultSession.value).toBeNull()
  })

  it('done() reaches a terminal state', async () => {
    const form = mountForm()
    form.selectPlayer('dave')
    form.selectPlayer('stan')
    await form.submit()
    form.done()
    expect(form.state.value).toBe('done')
  })

  it('retries with the same match id after a dropped response and gets the original result, not an error', async () => {
    const form = mountForm()
    form.selectPlayer('vin')
    form.selectPlayer('katez')
    form.setScore('home', 2)
    form.setScore('away', 2)

    // Simulate the write reaching the server and succeeding, but the response never arriving —
    // the exact scenario fc-rating-backend's idempotency contract exists for.
    server.use(
      http.post(
        '*/matches',
        async ({ request }) => {
          const body = (await request.clone().json()) as {
            id: string
            homePlayerId: string
            awayPlayerId: string
            homeScore: number
            awayScore: number
          }
          db.recordMatch(body.id, body.homePlayerId, body.awayPlayerId, body.homeScore, body.awayScore, false)
          return HttpResponse.error()
        },
        { once: true },
      ),
    )

    await form.submit()
    expect(form.state.value).toBe('scoring')
    expect(form.submitError.value).not.toBeNull()

    await form.submit() // retry — same matchId, no state was reset
    expect(form.state.value).toBe('result')
    // fc-rating-backend's documented behavior: a retry can't reconstruct historical rank
    // position, so rankChanges comes back empty even if ranks actually did shift.
    expect(form.record.data.value?.rankChanges).toEqual([])
  })
})
