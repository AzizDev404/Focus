import { Router } from 'express'
import { listUserMail, markMailRead } from '../db.js'
import { userMiddleware } from '../auth.js'

export function createMailRouter({ jwtSecret }) {
  const router = Router()
  router.use(userMiddleware(jwtSecret))

  router.get('/', (req, res) => {
    const mail = listUserMail(req.auth.sub)
    if (!mail) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({ mail })
  })

  router.post('/:id/read', (req, res) => {
    const mailId = Number(req.params.id)
    if (!Number.isFinite(mailId)) {
      res.status(400).json({ error: 'Invalid mail id' })
      return
    }
    const result = markMailRead(req.auth.sub, mailId)
    if (result?.error === 'NOT_FOUND') {
      res.status(404).json({ error: 'Message not found' })
      return
    }
    res.json(result)
  })

  return router
}
