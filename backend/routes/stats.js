import { Router } from 'express'
import {
  addBreakStats,
  addFocusStats,
  addTaskCompleteStats,
  pauseStatsClock,
  startStatsClock,
} from '../db.js'
import { isValidStatsDateKey } from '../validators/mail.js'
import { userMiddleware } from '../auth.js'
import { rateLimit } from '../lib/rateLimit.js'

function statsDate(req) {
  return String(req.body?.date ?? new Date().toISOString().slice(0, 10))
}

function kindFromBody(req) {
  const kind = String(req.body?.kind ?? '')
  return kind === 'break' ? 'break' : kind === 'focus' ? 'focus' : null
}

function sendStatsResult(res, result) {
  if (result?.error === 'DAY_LIMIT') {
    res.status(429).json({ error: 'Daily stats limit reached.' })
    return
  }
  if (result?.error === 'NOT_FOUND') {
    res.status(401).json({ error: 'User not found' })
    return
  }
  if (result?.error === 'NO_SESSION') {
    res.status(400).json({ error: 'Start the timer before saving stats.' })
    return
  }
  if (result?.error === 'TOO_SHORT') {
    res.status(400).json({ error: 'Session is too short to save.' })
    return
  }
  if (result?.error) {
    res.status(400).json({ error: 'Invalid stats payload' })
    return
  }
  res.json({ ok: true, creditedSeconds: result.creditedSeconds })
}

export function createStatsRouter({ jwtSecret }) {
  const router = Router()
  const guard = userMiddleware(jwtSecret)
  const throttle = rateLimit({
    windowMs: 60 * 1000,
    max: 40,
    name: 'stats',
    keyFn: (req) => `u:${req.auth?.sub ?? 'anon'}`,
  })

  router.post('/start', guard, throttle, (req, res) => {
    const kind = kindFromBody(req)
    if (!kind) {
      res.status(400).json({ error: 'kind must be focus or break' })
      return
    }
    const result = startStatsClock(req.auth.sub, kind)
    if (result.error === 'NOT_FOUND') {
      res.status(401).json({ error: 'User not found' })
      return
    }
    if (result.error) {
      res.status(400).json({ error: 'Invalid stats payload' })
      return
    }
    res.json(result)
  })

  router.post('/pause', guard, throttle, (req, res) => {
    const kind = kindFromBody(req)
    if (!kind) {
      res.status(400).json({ error: 'kind must be focus or break' })
      return
    }
    const result = pauseStatsClock(req.auth.sub, kind)
    if (result.error === 'NOT_FOUND') {
      res.status(401).json({ error: 'User not found' })
      return
    }
    res.json({ ok: true })
  })

  router.post('/focus', guard, throttle, (req, res) => {
    const seconds = Number(req.body?.seconds ?? 0)
    const sessionId = String(req.body?.sessionId ?? '')
    const date = statsDate(req)
    if (!Number.isFinite(seconds) || seconds <= 0) {
      res.status(400).json({ error: 'Invalid seconds' })
      return
    }
    if (!sessionId) {
      res.status(400).json({ error: 'Start the timer before saving stats.' })
      return
    }
    if (!isValidStatsDateKey(date)) {
      res.status(400).json({ error: 'Invalid date' })
      return
    }
    sendStatsResult(res, addFocusStats(req.auth.sub, date, seconds, sessionId))
  })

  router.post('/break', guard, throttle, (req, res) => {
    const seconds = Number(req.body?.seconds ?? 0)
    const sessionId = String(req.body?.sessionId ?? '')
    const date = statsDate(req)
    if (!Number.isFinite(seconds) || seconds <= 0) {
      res.status(400).json({ error: 'Invalid seconds' })
      return
    }
    if (!sessionId) {
      res.status(400).json({ error: 'Start the timer before saving stats.' })
      return
    }
    if (!isValidStatsDateKey(date)) {
      res.status(400).json({ error: 'Invalid date' })
      return
    }
    sendStatsResult(res, addBreakStats(req.auth.sub, date, seconds, sessionId))
  })

  router.post('/task-complete', guard, throttle, (req, res) => {
    const date = statsDate(req)
    if (!isValidStatsDateKey(date)) {
      res.status(400).json({ error: 'Invalid date' })
      return
    }
    sendStatsResult(res, addTaskCompleteStats(req.auth.sub, date))
  })

  return router
}
