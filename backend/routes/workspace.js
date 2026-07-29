import { Router } from 'express'
import { findUserById, getUserWorkspace, saveUserNotepad, saveUserTasks } from '../db.js'
import { userMiddleware } from '../auth.js'

export function createWorkspaceRouter({ jwtSecret }) {
  const router = Router()
  const auth = userMiddleware(jwtSecret)

  router.get('/', auth, (req, res) => {
    const user = findUserById(req.auth.sub)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(getUserWorkspace(user.id))
  })

  router.put('/tasks', auth, (req, res) => {
    const result = saveUserTasks(req.auth.sub, req.body?.tasks)
    if (result.error === 'NOT_FOUND') return res.status(404).json({ error: 'User not found' })
    res.json(result)
  })

  router.put('/notepad', auth, (req, res) => {
    const date = req.body?.date
    const html = req.body?.html ?? ''
    const result = saveUserNotepad(req.auth.sub, date, html)
    if (result.error === 'NOT_FOUND') return res.status(404).json({ error: 'User not found' })
    if (result.error === 'INVALID_DATE') return res.status(400).json({ error: 'Invalid date' })
    res.json(result)
  })

  return router
}
