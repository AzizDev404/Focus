import { Router } from 'express'
import {
  findShopItem,
  listShopEvents,
  listShopItems,
  purchaseShopItem,
  serializeShopItemForApi,
} from '../db.js'
import { publicProfile } from '../lib/publicProfile.js'
import { userMiddleware } from '../auth.js'

export function createShopRouter({ jwtSecret }) {
  const router = Router()

  router.get('/events', (_req, res) => {
    res.json({ events: listShopEvents() })
  })

  router.get('/items', (_req, res) => {
    const items = listShopItems().map((item) => serializeShopItemForApi(item))
    res.json({ items })
  })

  router.get('/items/:id', (req, res) => {
    const item = findShopItem(Number(req.params.id))
    if (!item || item.enabled === false) {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    res.json({ item: serializeShopItemForApi(item) })
  })

  router.post('/purchase', userMiddleware(jwtSecret), (req, res) => {
    const itemId = Number(req.body?.itemId)
    if (!Number.isFinite(itemId)) {
      res.status(400).json({ error: 'Invalid item id' })
      return
    }
    const result = purchaseShopItem(req.auth.sub, itemId)
    const messages = {
      NOT_FOUND: 'Item not found',
      ITEM_DISABLED: 'This item is not available',
      ALREADY_OWNED: 'You already own this item',
      SOLD_OUT: 'This limited item is sold out',
      NOT_ENOUGH_COINS: 'Not enough coins',
      EVENT_UNAVAILABLE: 'This event is no longer available',
      EVENT_NOT_ACTIVE: 'This event is not active right now',
    }
    if (result.error) {
      res.status(result.error === 'NOT_ENOUGH_COINS' ? 402 : 400).json({ error: messages[result.error] ?? 'Purchase failed' })
      return
    }
    res.json({
      profile: publicProfile(result.user),
      item: result.item,
      pricePaid: result.pricePaid,
    })
  })

  return router
}
