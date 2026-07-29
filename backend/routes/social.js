import { Router } from 'express'
import { findUserById, getFollowStatus, listFollowers, listFollowing, toggleFollow } from '../db.js'
import { userMiddleware } from '../auth.js'

export function createSocialRouter({ jwtSecret }) {
  const router = Router()
  const auth = userMiddleware(jwtSecret)

  router.get('/users/:id/status', auth, (req, res) => {
    const targetId = Number(req.params.id)
    if (!Number.isFinite(targetId) || targetId < 1) {
      return res.status(400).json({ error: 'Invalid user id' })
    }
    if (targetId === req.auth.sub) {
      return res.status(400).json({ error: 'Cannot follow yourself.' })
    }
    const target = findUserById(targetId)
    if (!target) return res.status(404).json({ error: 'User not found' })
    res.json(getFollowStatus(req.auth.sub, targetId))
  })

  router.post('/users/:id/follow', auth, (req, res) => {
    const targetId = Number(req.params.id)
    if (!Number.isFinite(targetId) || targetId < 1) {
      return res.status(400).json({ error: 'Invalid user id' })
    }
    const result = toggleFollow(req.auth.sub, targetId, true)
    if (result.error === 'SELF') {
      return res.status(400).json({ error: 'Cannot follow yourself.' })
    }
    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(result)
  })

  router.get('/users/:id/followers', auth, (req, res) => {
    const targetId = Number(req.params.id)
    if (!Number.isFinite(targetId) || targetId < 1) {
      return res.status(400).json({ error: 'Invalid user id' })
    }
    if (!findUserById(targetId)) return res.status(404).json({ error: 'User not found' })
    res.json({ users: listFollowers(targetId) })
  })

  router.get('/users/:id/following', auth, (req, res) => {
    const targetId = Number(req.params.id)
    if (!Number.isFinite(targetId) || targetId < 1) {
      return res.status(400).json({ error: 'Invalid user id' })
    }
    if (!findUserById(targetId)) return res.status(404).json({ error: 'User not found' })
    res.json({ users: listFollowing(targetId) })
  })

  router.delete('/users/:id/follow', auth, (req, res) => {
    const targetId = Number(req.params.id)
    if (!Number.isFinite(targetId) || targetId < 1) {
      return res.status(400).json({ error: 'Invalid user id' })
    }
    const result = toggleFollow(req.auth.sub, targetId, false)
    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(result)
  })

  return router
}
