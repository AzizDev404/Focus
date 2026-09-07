import { Router } from 'express'
import { listChatMessages, postChatMessage } from '../db.js'
import { userMiddleware } from '../auth.js'
import { rateLimit } from '../lib/rateLimit.js'

export function createChatRouter({ jwtSecret }) {
  const router = Router()
  const guard = userMiddleware(jwtSecret)

  router.get('/', guard, (req, res) => {
    const limit = Number(req.query?.limit ?? 50)
    const since = Number(req.query?.since ?? 0)
    res.json({ messages: listChatMessages({ limit, since }) })
  })

  router.post(
    '/',
    guard,
    rateLimit({
      windowMs: 60 * 1000,
      max: 30,
      name: 'chat-post',
      keyFn: (req) => `u:${req.auth?.sub ?? 'anon'}`,
    }),
    (req, res) => {
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
        res.status(400).json({ error: 'Message is too long (max 12000 characters).' })
        return
      }
      res.json(result)
    },
  )

  return router
}
