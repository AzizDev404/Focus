import { Router } from 'express'
import multer from 'multer'
import { findUserById, updateUserById, equipItem, unequipItem, resetProfileSlot } from '../db.js'
import { publicProfile } from '../lib/publicProfile.js'
import { userMiddleware } from '../auth.js'
import { saveUserImage, validateImageFile } from '../lib/uploads.js'

export function createProfileRouter({ jwtSecret }) {
  const router = Router()
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  })

  router.get('/', userMiddleware(jwtSecret), (req, res) => {
    const user = findUserById(req.auth.sub)
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }
    res.json({ profile: publicProfile(user) })
  })

  router.patch('/display-name', userMiddleware(jwtSecret), (req, res) => {
    const name = String(req.body?.displayName ?? '').trim()
    if (name.length < 2 || name.length > 80) {
      res.status(400).json({ error: 'Display name must be 2–80 characters.' })
      return
    }
    const user = updateUserById(req.auth.sub, (u) => {
      u.displayName = name
    })
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({ profile: publicProfile(user) })
  })

  router.post('/equip', userMiddleware(jwtSecret), (req, res) => {
    const itemId = Number(req.body?.itemId)
    if (!Number.isFinite(itemId)) {
      res.status(400).json({ error: 'Invalid item id' })
      return
    }
    const result = equipItem(req.auth.sub, itemId)
    if (result.error === 'NOT_FOUND') {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    if (result.error === 'NOT_OWNED') {
      res.status(403).json({ error: 'You do not own this item.' })
      return
    }
    res.json({ profile: publicProfile(result.user) })
  })

  router.post('/unequip', userMiddleware(jwtSecret), (req, res) => {
    const type = String(req.body?.type ?? '')
    const result = unequipItem(req.auth.sub, type)
    if (result.error) {
      res.status(400).json({ error: result.error === 'INVALID_TYPE' ? 'Invalid slot type' : 'User not found' })
      return
    }
    res.json({ profile: publicProfile(result.user) })
  })

  router.post('/reset-slot', userMiddleware(jwtSecret), (req, res) => {
    const type = String(req.body?.type ?? '')
    const result = resetProfileSlot(req.auth.sub, type)
    if (result.error) {
      res.status(400).json({
        error: result.error === 'INVALID_TYPE' ? 'Invalid slot type' : 'User not found',
      })
      return
    }
    res.json({ profile: publicProfile(result.user) })
  })

  router.post('/upload-avatar', userMiddleware(jwtSecret), upload.single('image'), async (req, res) => {
    const fileError = validateImageFile(req.file)
    if (fileError) {
      res.status(400).json({ error: fileError })
      return
    }
    const avatarUrl = await saveUserImage({ userId: req.auth.sub, slot: 'avatar', file: req.file })
    const user = updateUserById(req.auth.sub, (u) => {
      u.media.avatarUrl = avatarUrl
    })
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({ profile: publicProfile(user) })
  })

  router.post('/upload-background', userMiddleware(jwtSecret), upload.single('image'), async (req, res) => {
    const fileError = validateImageFile(req.file)
    if (fileError) {
      res.status(400).json({ error: fileError })
      return
    }
    const backgroundUrl = await saveUserImage({ userId: req.auth.sub, slot: 'background', file: req.file })
    const user = updateUserById(req.auth.sub, (u) => {
      u.media.backgroundUrl = backgroundUrl
    })
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({ profile: publicProfile(user) })
  })

  return router
}
