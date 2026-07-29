import { Router } from 'express'
import { listLeaderboard } from '../db.js'

export function createLeaderboardRouter() {
  const router = Router()

  router.get('/', (req, res) => {
    const rawLimit = Number(req.query?.limit ?? 20)
    const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 20
    const sort = String(req.query?.sort ?? 'level')
    const allowed = new Set(['level', 'focus', 'coins'])
    res.json({ users: listLeaderboard(limit, allowed.has(sort) ? sort : 'level') })
  })

  return router
}
