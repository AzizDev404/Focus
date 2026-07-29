import { Router } from 'express'
import { findUserById, listDmInbox, listDmMessages, postDmMessage } from '../db.js'
import { userMiddleware } from '../auth.js'

export function createDmRouter({ jwtSecret }) {
  const router = Router()
  const auth = userMiddleware(jwtSecret)

  router.get('/inbox', auth, (req, res) => {
    res.json({ conversations: listDmInbox(req.auth.sub) })
  })

  router.get('/:peerId/messages', auth, (req, res) => {
    const peerId = Number(req.params.peerId)
    if (!Number.isFinite(peerId) || peerId < 1) {
      return res.status(400).json({ error: 'Invalid user id' })
    }
    if (peerId === req.auth.sub) {
      return res.status(400).json({ error: 'Invalid conversation.' })
    }
    const peer = findUserById(peerId)
    if (!peer) return res.status(404).json({ error: 'User not found' })

    const limit = Number(req.query?.limit ?? 80)
    const since = Number(req.query?.since ?? 0)
    res.json({
      messages: listDmMessages(req.auth.sub, peerId, { limit, since }),
      peer: { id: peer.id, displayName: peer.displayName },
    })
  })

  router.post('/:peerId/messages', auth, (req, res) => {
    const peerId = Number(req.params.peerId)
    if (!Number.isFinite(peerId) || peerId < 1) {
      return res.status(400).json({ error: 'Invalid user id' })
    }
    const result = postDmMessage(req.auth.sub, peerId, req.body?.html ?? req.body?.text)
    if (result.error === 'SELF') {
      return res.status(400).json({ error: 'Invalid conversation.' })
    }
    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' })
    }
    if (result.error === 'EMPTY') {
      return res.status(400).json({ error: 'Message cannot be empty.' })
    }
    if (result.error === 'TOO_LONG') {
      return res.status(400).json({ error: 'Message is too long.' })
    }
    if (result.error === 'NOT_FOLLOWING') {
      return res.status(403).json({
        error: 'Follow this player to send messages.',
      })
    }
    res.json(result)
  })

  return router
}
