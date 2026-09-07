export const STATS_CLOCK_SLACK_SEC = 20
export const STATS_CLOCK_MIN_SEC = 5

export function creditTimedSeconds(claimed, elapsedMs, maxSeconds) {
  const amount = Math.floor(Number(claimed))
  const elapsed = Math.floor(Number(elapsedMs) / 1000)
  const max = Math.max(1, Math.floor(Number(maxSeconds)))
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'INVALID' }
  if (!Number.isFinite(elapsed) || elapsed < STATS_CLOCK_MIN_SEC) return { error: 'TOO_SHORT' }
  return {
    seconds: Math.min(amount, elapsed + STATS_CLOCK_SLACK_SEC, max),
  }
}

export function clockElapsedMs(clock, now = Date.now()) {
  if (!clock || typeof clock !== 'object') return 0
  const accrued = Math.max(0, Number(clock.accruedMs) || 0)
  if (clock.running === false) return accrued
  const startedAt = Number(clock.startedAt) || now
  return accrued + Math.max(0, now - startedAt)
}
