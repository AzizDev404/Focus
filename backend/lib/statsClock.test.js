import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { clockElapsedMs, creditTimedSeconds } from './statsClock.js'

describe('creditTimedSeconds', () => {
  it('caps claimed time to elapsed wall clock', () => {
    const out = creditTimedSeconds(99999, 10_000, 4 * 3600)
    assert.equal(out.error, undefined)
    assert.equal(out.seconds, 30)
  })

  it('rejects sessions under 5 seconds', () => {
    assert.equal(creditTimedSeconds(60, 2000, 3600).error, 'TOO_SHORT')
  })
})

describe('clockElapsedMs', () => {
  it('adds running time to accrued pause time', () => {
    const now = 1_000_000
    const ms = clockElapsedMs(
      { accruedMs: 5000, running: true, startedAt: now - 3000 },
      now,
    )
    assert.equal(ms, 8000)
  })
})
