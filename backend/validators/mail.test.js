import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isValidDateKey, isValidStatsDateKey } from './mail.js'

describe('stats dates', () => {
  it('accepts ISO date keys', () => {
    assert.equal(isValidDateKey('2026-09-06'), true)
    assert.equal(isValidDateKey('2026/09/06'), false)
  })

  it('rejects far-future and ancient dates', () => {
    assert.equal(isValidStatsDateKey('2099-01-01'), false)
    assert.equal(isValidStatsDateKey('1999-01-01'), false)
    const today = new Date().toISOString().slice(0, 10)
    assert.equal(isValidStatsDateKey(today), true)
  })
})
