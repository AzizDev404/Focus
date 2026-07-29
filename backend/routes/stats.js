import { Router } from 'express'
import { addBreakStats, addFocusStats, addTaskCompleteStats } from '../db.js'
import { isValidDateKey } from '../validators/mail.js'
import { userMiddleware } from '../auth.js'

export function createStatsRouter({ jwtSecret }) {
  const router = Router()
  const guard = userMiddleware(jwtSecret)

  router.post('/focus', guard, (req, res) => {
    const seconds = Number(req.body?.seconds ?? 0)
    const date = String(req.body?.date ?? new Date().toISOString().slice(0, 10))
    if (!Number.isFinite(seconds) || seconds <= 0) {
      res.status(400).json({ error: 'Invalid seconds' })
      return
    }
    if (!isValidDateKey(date)) {
      res.status(400).json({ error: 'Invalid date' })
      return
    }
    addFocusStats(req.auth.sub, date, seconds)
    res.json({ ok: true })
  })

  router.post('/break', guard, (req, res) => {
    const seconds = Number(req.body?.seconds ?? 0)
    const date = String(req.body?.date ?? new Date().toISOString().slice(0, 10))
    if (!Number.isFinite(seconds) || seconds <= 0) {
      res.status(400).json({ error: 'Invalid seconds' })
      return
    }
    if (!isValidDateKey(date)) {
      res.status(400).json({ error: 'Invalid date' })
      return
    }
    addBreakStats(req.auth.sub, date, seconds)
    res.json({ ok: true })
  })

  router.post('/task-complete', guard, (req, res) => {
    const date = String(req.body?.date ?? new Date().toISOString().slice(0, 10))
    if (!isValidDateKey(date)) {
      res.status(400).json({ error: 'Invalid date' })
      return
    }
    addTaskCompleteStats(req.auth.sub, date)
    res.json({ ok: true })
  })

  return router
}
