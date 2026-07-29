import { Router } from 'express'
import multer from 'multer'
import {
  createShopItem,
  createShopEvent,
  createAchievementDef,
  deleteAchievementDef,
  deleteShopEvent,
  deleteShopItem,
  deleteUser,
  getAdminDashboardStats,
  getAdminUserDetail,
  grantShopItemToUser,
  grantUserCoins,
  listShopEvents,
  listShopItems,
  listAdminAchievementDefs,
  listUsers,
  revokeShopItemFromUser,
  resetDatabase,
  sendUserMail,
  shopItemRequiresUpload,
  updateAdminUser,
  updateAchievementDef,
  updateShopEvent,
  updateShopItem,
} from '../db.js'
import { signAdminToken, adminMiddleware } from '../auth.js'
import { saveShopPreviewImage, saveAchievementImage, validateAdminImageFile, cleanupOrphanUploads } from '../lib/uploads.js'
import { getAdminSystemInfo } from '../lib/systemInfo.js'

export function createAdminRouter({ jwtSecret, adminUsername, adminPassword }) {
  const router = Router()
  const upload = multer({
    storage: multer.memoryStorage(),
  })

  router.post('/login', (req, res) => {
    const username = String(req.body?.username ?? '').trim()
    const password = String(req.body?.password ?? '')

    if (username !== adminUsername || password !== adminPassword) {
      res.status(401).json({ error: 'Invalid admin credentials.' })
      return
    }

    res.json({ token: signAdminToken(username, jwtSecret), username })
  })

  router.get('/stats', adminMiddleware(jwtSecret), (_req, res) => {
    res.json({ stats: getAdminDashboardStats() })
  })

  router.get('/users', adminMiddleware(jwtSecret), (_req, res) => {
    const users = listUsers()
    res.json({ users, total: users.length })
  })

  router.get('/users/:id', adminMiddleware(jwtSecret), (req, res) => {
    const id = Number(req.params.id)
    const user = getAdminUserDetail(id)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({ user })
  })

  router.patch('/users/:id', adminMiddleware(jwtSecret), (req, res) => {
    const id = Number(req.params.id)
    const result = updateAdminUser(id, req.body ?? {})
    if (result.error === 'NOT_FOUND') {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(result)
  })

  router.post('/users/:id/coins', adminMiddleware(jwtSecret), (req, res) => {
    const id = Number(req.params.id)
    const amount = req.body?.amount ?? req.body?.coins
    const note = String(req.body?.note ?? '').trim()
    const result = grantUserCoins(id, amount, note)
    if (result.error === 'NOT_FOUND') {
      res.status(404).json({ error: 'User not found' })
      return
    }
    if (result.error === 'INVALID_AMOUNT') {
      res.status(400).json({ error: 'Enter a non-zero coin amount.' })
      return
    }
    res.json(result)
  })

  router.post('/users/:id/mail', adminMiddleware(jwtSecret), (req, res) => {
    const id = Number(req.params.id)
    const result = sendUserMail(id, {
      subject: req.body?.subject,
      body: req.body?.body,
      type: req.body?.type ?? 'admin_message',
    })
    if (result.error === 'NOT_FOUND') {
      res.status(404).json({ error: 'User not found' })
      return
    }
    if (result.error === 'INVALID') {
      res.status(400).json({ error: 'Subject and message are required.' })
      return
    }
    if (result.error === 'SUBJECT_TOO_LONG') {
      res.status(400).json({ error: 'Subject is too long (max 120 characters).' })
      return
    }
    if (result.error === 'BODY_TOO_LONG') {
      res.status(400).json({ error: 'Message is too long (max 2000 characters).' })
      return
    }
    res.json(result)
  })

  router.post('/users/:id/gift', adminMiddleware(jwtSecret), (req, res) => {
    const id = Number(req.params.id)
    const itemId = Number(req.body?.itemId)
    if (!Number.isFinite(itemId)) {
      res.status(400).json({ error: 'Select a shop item to gift.' })
      return
    }
    const result = grantShopItemToUser(id, itemId, req.body?.note)
    if (result.error === 'NOT_FOUND') {
      res.status(404).json({ error: 'User not found' })
      return
    }
    if (result.error === 'ITEM_NOT_FOUND') {
      res.status(404).json({ error: 'Shop item not found' })
      return
    }
    if (result.error === 'ALREADY_OWNED') {
      res.status(409).json({ error: 'User already owns this item.' })
      return
    }
    res.json(result)
  })

  router.delete('/users/:id/inventory/:itemId', adminMiddleware(jwtSecret), (req, res) => {
    const userId = Number(req.params.id)
    const itemId = Number(req.params.itemId)
    const result = revokeShopItemFromUser(userId, itemId)
    if (result.error === 'NOT_FOUND') {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(result)
  })

  router.delete('/users/:id', adminMiddleware(jwtSecret), (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'Invalid user id' })
      return
    }
    if (!deleteUser(id)) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({ ok: true })
  })

  router.get('/shop/items', adminMiddleware(jwtSecret), (_req, res) => {
    res.json({ items: listShopItems({ includeDisabled: true }) })
  })

  router.get('/shop/events', adminMiddleware(jwtSecret), (_req, res) => {
    res.json({ events: listShopEvents({ includeDisabled: true }) })
  })

  router.post('/shop/events', adminMiddleware(jwtSecret), (req, res) => {
    const result = createShopEvent(req.body ?? {})
    if (result.error === 'DUPLICATE_SLUG') {
      res.status(409).json({ error: 'An event with this slug already exists' })
      return
    }
    if (result.error) {
      res.status(400).json({ error: 'Invalid event data' })
      return
    }
    res.status(201).json({ event: result.event })
  })

  router.patch('/shop/events/:id', adminMiddleware(jwtSecret), (req, res) => {
    const id = Number(req.params.id)
    const result = updateShopEvent(id, req.body ?? {})
    if (result.error === 'NOT_FOUND') {
      res.status(404).json({ error: 'Event not found' })
      return
    }
    if (result.error === 'DUPLICATE_SLUG') {
      res.status(409).json({ error: 'An event with this slug already exists' })
      return
    }
    if (result.error) {
      res.status(400).json({ error: 'Invalid event data' })
      return
    }
    res.json({ event: result.event })
  })

  router.delete('/shop/events/:id', adminMiddleware(jwtSecret), (req, res) => {
    const id = Number(req.params.id)
    if (!deleteShopEvent(id)) {
      res.status(404).json({ error: 'Event not found' })
      return
    }
    res.json({ ok: true })
  })

  router.post('/shop/items', adminMiddleware(jwtSecret), (req, res) => {
    const result = createShopItem(req.body ?? {})
    if (result.error) {
      res.status(400).json({ error: 'Invalid shop item data' })
      return
    }
    res.status(201).json({ item: result.item })
  })

  router.post(
    '/shop/items/with-image',
    adminMiddleware(jwtSecret),
    upload.single('image'),
    async (req, res) => {
      const body = req.body ?? {}
      const type = String(body.type ?? 'background')
      const fileError = validateAdminImageFile(req.file)
      if (shopItemRequiresUpload(type) && fileError) {
        res.status(400).json({ error: fileError || 'Image file is required for this item type.' })
        return
      }

      const payload = {
        type,
        name: body.name,
        description: body.description ?? '',
        preview: body.preview ?? '#334155',
        emoji: body.emoji ?? '✨',
        price: body.price,
        discountPercent: body.useDiscount === 'true' || body.useDiscount === true ? body.discountPercent : 0,
        isFree: body.isFree === 'true' || body.isFree === true,
        isEvent: body.isEvent === 'true' || body.isEvent === true,
        eventId: body.eventId === '' || body.eventId == null ? null : body.eventId,
        stockLimit: body.stockLimit === '' || body.stockLimit == null ? null : body.stockLimit,
        enabled: body.enabled !== 'false' && body.enabled !== false,
      }

      const created = createShopItem(payload)
      if (created.error) {
        res.status(400).json({ error: 'Invalid shop item data. Check name and type.' })
        return
      }

      let item = created.item
      if (req.file) {
        try {
          const previewUrl = await saveShopPreviewImage({ itemId: item.id, file: req.file })
          const updated = updateShopItem(item.id, { preview: previewUrl })
          if (updated.item) item = updated.item
        } catch (err) {
          deleteShopItem(item.id)
          console.error('[admin] shop create upload:', err)
          res.status(500).json({ error: 'Upload failed' })
          return
        }
      } else if (shopItemRequiresUpload(type)) {
        deleteShopItem(item.id)
        res.status(400).json({ error: 'Background, avatar, and frame items require an image upload.' })
        return
      }

      res.status(201).json({ item })
    },
  )

  router.patch('/shop/items/:id', adminMiddleware(jwtSecret), (req, res) => {
    const id = Number(req.params.id)
    const result = updateShopItem(id, req.body ?? {})
    if (result.error === 'NOT_FOUND') {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    res.json({ item: result.item })
  })

  router.post(
    '/shop/items/:id/preview-image',
    adminMiddleware(jwtSecret),
    upload.single('image'),
    async (req, res) => {
      const id = Number(req.params.id)
      const fileError = validateAdminImageFile(req.file)
      if (fileError) {
        res.status(400).json({ error: fileError })
        return
      }
      try {
        const previewUrl = await saveShopPreviewImage({ itemId: id, file: req.file })
        const result = updateShopItem(id, { preview: previewUrl })
        if (result.error === 'NOT_FOUND') {
          res.status(404).json({ error: 'Item not found' })
          return
        }
        res.json({ item: result.item, previewUrl })
      } catch (err) {
        console.error('[admin] shop preview upload:', err)
        res.status(500).json({ error: 'Upload failed' })
      }
    },
  )

  router.delete('/shop/items/:id', adminMiddleware(jwtSecret), (req, res) => {
    const id = Number(req.params.id)
    if (!deleteShopItem(id)) {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    res.json({ ok: true })
  })

  router.get('/achievements', adminMiddleware(jwtSecret), (_req, res) => {
    res.json({ items: listAdminAchievementDefs() })
  })

  router.post('/achievements', adminMiddleware(jwtSecret), (req, res) => {
    const result = createAchievementDef(req.body ?? {})
    if (result.error === 'INVALID_ID') {
      res.status(400).json({ error: 'ID must be lowercase letters, numbers, underscores (e.g. first_focus).' })
      return
    }
    if (result.error === 'DUPLICATE_ID') {
      res.status(409).json({ error: 'An achievement with this ID already exists.' })
      return
    }
    if (result.error) {
      res.status(400).json({ error: 'Invalid achievement data.' })
      return
    }
    res.status(201).json({ item: result.item })
  })

  router.post(
    '/achievements/with-image',
    adminMiddleware(jwtSecret),
    upload.single('image'),
    async (req, res) => {
      const body = req.body ?? {}
      const fileError = validateAdminImageFile(req.file)
      if (fileError) {
        res.status(400).json({ error: fileError })
        return
      }

      const payload = {
        id: body.id,
        title: body.title,
        description: body.description ?? '',
        icon: body.icon ?? '✨',
        coinReward: body.coinReward,
        xpReward: body.xpReward,
        trigger: body.trigger ?? 'sessions',
        target: body.target ?? 1,
        enabled: body.enabled !== 'false' && body.enabled !== false,
      }

      const created = createAchievementDef(payload)
      if (created.error === 'INVALID_ID') {
        res.status(400).json({ error: 'ID must be lowercase letters, numbers, underscores.' })
        return
      }
      if (created.error === 'DUPLICATE_ID') {
        res.status(409).json({ error: 'An achievement with this ID already exists.' })
        return
      }
      if (created.error) {
        res.status(400).json({ error: 'Invalid achievement data.' })
        return
      }

      try {
        const imageUrl = await saveAchievementImage({ achievementId: created.item.id, file: req.file })
        const updated = updateAchievementDef(created.item.id, { imageUrl })
        res.status(201).json({ item: updated.item ?? created.item })
      } catch (err) {
        deleteAchievementDef(created.item.id)
        console.error('[admin] achievement create upload:', err)
        res.status(500).json({ error: 'Upload failed' })
      }
    },
  )

  router.patch('/achievements/:id', adminMiddleware(jwtSecret), (req, res) => {
    const id = String(req.params.id ?? '').trim()
    const result = updateAchievementDef(id, req.body ?? {})
    if (result.error === 'NOT_FOUND') {
      res.status(404).json({ error: 'Achievement not found' })
      return
    }
    if (result.error) {
      res.status(400).json({ error: 'Invalid achievement data.' })
      return
    }
    res.json({ item: result.item })
  })

  router.post(
    '/achievements/:id/image',
    adminMiddleware(jwtSecret),
    upload.single('image'),
    async (req, res) => {
      const id = String(req.params.id ?? '').trim()
      const fileError = validateAdminImageFile(req.file)
      if (fileError) {
        res.status(400).json({ error: fileError })
        return
      }
      const existing = listAdminAchievementDefs().find((a) => a.id === id)
      if (!existing) {
        res.status(404).json({ error: 'Achievement not found' })
        return
      }
      try {
        const imageUrl = await saveAchievementImage({ achievementId: id, file: req.file })
        const result = updateAchievementDef(id, { imageUrl })
        res.json({ item: result.item, imageUrl })
      } catch (err) {
        console.error('[admin] achievement image upload:', err)
        res.status(500).json({ error: 'Upload failed' })
      }
    },
  )

  router.delete('/achievements/:id', adminMiddleware(jwtSecret), (req, res) => {
    const id = String(req.params.id ?? '').trim()
    if (!deleteAchievementDef(id)) {
      res.status(404).json({ error: 'Achievement not found' })
      return
    }
    res.json({ ok: true })
  })

  router.post('/database/reset', adminMiddleware(jwtSecret), async (req, res) => {
    if (req.body?.confirm !== 'RESET') {
      res.status(400).json({ error: 'Send { "confirm": "RESET" } to wipe the database.' })
      return
    }
    await resetDatabase()
    res.json({ ok: true })
  })

  router.get('/system', adminMiddleware(jwtSecret), async (_req, res) => {
    try {
      res.json({ system: await getAdminSystemInfo() })
    } catch (err) {
      console.error('[admin/system]', err)
      res.status(500).json({ error: 'Failed to load system info' })
    }
  })

  router.post('/uploads/cleanup', adminMiddleware(jwtSecret), async (_req, res) => {
    const result = await cleanupOrphanUploads()
    res.json({ ok: true, ...result })
  })

  return router
}
