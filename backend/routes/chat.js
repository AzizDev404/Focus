import { Router } from 'express'
import { listChatMessages, postChatMessage } from '../db.js'
import { userMiddleware } from '../auth.js'

export function createChatRouter({ jwtSecret }) {
  const router = Router()

  router.get('/', (req, res) => {
    const limit = Number(req.query?.limit ?? 50)
    const since = Number(req.query?.since ?? 0)
    res.json({ messages: listChatMessages({ limit, since }) })
  })

  router.post('/', userMiddleware(jwtSecret), (req, res) => {
    const result = postChatMessage(req.auth.sub, req.body?.html ?? req.body?.text)
    if (result.error === 'NOT_FOUND') {
      res.status(404).json({ error: 'User not found' })
      return
    }
    if (result.error === 'EMPTY') {
      res.status(400).json({ error: 'Message cannot be empty.' })
      return
    }
    if (result.error === 'TOO_LONG') {
      res.status(400).json({ error: 'Message is too long (max 500 chars).' })
      return
    }
    res.json(result)
  })

  return router
}
