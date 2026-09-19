import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LiveSessionBanner from './LiveSessionBanner.vue'

describe('LiveSessionBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-21T15:58:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a long-running session in days, not hundreds of hours', () => {
    const wrapper = mount(LiveSessionBanner, {
      props: {
        sessionName: 'Ongoing',
        startedAt: '2026-09-14T15:46:00Z', // 7 days, 12 minutes ago
        matchCount: 71,
        biggestMover: null,
      },
    })

    expect(wrapper.text()).toContain('7d')
    expect(wrapper.text()).not.toContain('168h')
  })

  it.each([
    [23.456789, 'Ras +23.46'],
    [-7.004, 'Ras −7.00'],
    [31, 'Ras +31.00'],
    [-0.001, 'Ras 0.00'],
  ])('rounds the biggest mover’s raw delta %s to 2dp', (delta, expected) => {
    const wrapper = mount(LiveSessionBanner, {
      props: {
        sessionName: 'Ongoing',
        startedAt: '2026-09-21T15:00:00Z',
        matchCount: 3,
        biggestMover: { name: 'Ras', delta },
      },
    })

    expect(wrapper.text()).toContain(`biggest mover ${expected}`)
  })
})
