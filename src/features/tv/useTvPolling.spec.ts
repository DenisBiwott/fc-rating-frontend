import { describe, expect, it } from 'vitest'
import { pollInterval } from './useTvPolling'

const MIN = 60_000

describe('pollInterval', () => {
  it('stays at 10s through a normal gap between matches', () => {
    expect(pollInterval(0)).toBe(10_000)
    // FC matches run 15–25 minutes apart: still fast when the next result lands.
    expect(pollInterval(25 * MIN)).toBe(10_000)
  })

  it('slows to 60s after 30 quiet minutes, and to 15 minutes after 2 hours', () => {
    expect(pollInterval(30 * MIN)).toBe(MIN)
    expect(pollInterval(119 * MIN)).toBe(MIN)
    expect(pollInterval(120 * MIN)).toBe(15 * MIN)
    expect(pollInterval(3 * 24 * 60 * MIN)).toBe(15 * MIN)
  })
})
