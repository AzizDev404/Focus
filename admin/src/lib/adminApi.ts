import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from './api'
import type { AdminUser, ShopEvent, ShopItem } from './auth/types'

export type AdminStats = {
  userCount: number
  shopItemCount: number
  shopEnabledCount: number
  totalCoins: number
  totalFocusSeconds: number
  totalSessions: number
  totalTasksCompleted: number
}

export type AdminInventoryItem = {
  id: number
  name: string
  type: string
  preview: string
  emoji?: string
  missing?: boolean
}

export type AdminUserDetail = AdminUser & {
  xp: number
  emailVerified: boolean
  googleId: string | null
  inventory: number[]
  inventoryItems: AdminInventoryItem[]
  equipped: Record<string, number | null>
  media: { avatarUrl: string | null; backgroundUrl: string | null }
  achievements: { id: string; unlockedAt: string | null }[]
  mailbox: { id: number; type?: string; subject: string; body: string; read: boolean; createdAt: string }[]
  statsHistory: Record<
    string,
    { focusSeconds: number; breakSeconds: number; sessions: number; tasksCompleted: number }
  >
}

export async function adminLogin(username: string, password: string) {
  return apiPost<{ token: string; username: string }>('/api/admin/login', { username, password })
}

export async function fetchAdminStats(token: string) {
  const data = await apiGet<{ stats: AdminStats }>('/api/admin/stats', token)
  return data.stats
}

export async function fetchAdminUsers(token: string) {
  const data = await apiGet<{ users: AdminUser[]; total: number }>('/api/admin/users', token)
  return data.users
}

export async function fetchAdminUser(id: number, token: string) {
  const data = await apiGet<{ user: AdminUserDetail }>(`/api/admin/users/${id}`, token)
  return data.user
}

export async function updateAdminUser(
  id: number,
  body: Partial<{ displayName: string; coins: number; level: number; xp: number; emailVerified: boolean }>,
  token: string,
) {
  const data = await apiPatch<{ user: AdminUserDetail }>(`/api/admin/users/${id}`, body, token)
  return data.user
}

export async function grantCoins(id: number, amount: number, note: string, token: string) {
  const data = await apiPost<{ user: AdminUserDetail; granted: number }>(
    `/api/admin/users/${id}/coins`,
    { amount, note },
    token,
  )
  return data
}

export async function deleteAdminUser(id: number, token: string) {
  await apiDelete(`/api/admin/users/${id}`, token)
}

export async function sendUserMail(
  id: number,
  body: { subject: string; body: string },
  token: string,
) {
  const data = await apiPost<{ user: AdminUserDetail }>(`/api/admin/users/${id}/mail`, body, token)
  return data.user
}

export async function grantShopItem(
  userId: number,
  itemId: number,
  note: string,
  token: string,
) {
  const data = await apiPost<{ user: AdminUserDetail; item: ShopItem }>(
    `/api/admin/users/${userId}/gift`,
    { itemId, note },
    token,
  )
  return data
}

export async function revokeShopItem(userId: number, itemId: number, token: string) {
  const data = await apiDelete<{ user: AdminUserDetail }>(
    `/api/admin/users/${userId}/inventory/${itemId}`,
    token,
  )
  return data.user
}

export async function fetchAdminShopItems(token: string) {
  const data = await apiGet<{ items: ShopItem[] }>('/api/admin/shop/items', token)
  return data.items
}

export async function fetchAdminShopEvents(token: string) {
  const data = await apiGet<{ events: ShopEvent[] }>('/api/admin/shop/events', token)
  return data.events
}

export async function createAdminShopEvent(body: Record<string, unknown>, token: string) {
  const data = await apiPost<{ event: ShopEvent }>('/api/admin/shop/events', body, token)
  return data.event
}

export async function updateAdminShopEvent(id: number, body: Record<string, unknown>, token: string) {
  const data = await apiPatch<{ event: ShopEvent }>(`/api/admin/shop/events/${id}`, body, token)
  return data.event
}

export async function deleteAdminShopEvent(id: number, token: string) {
  await apiDelete(`/api/admin/shop/events/${id}`, token)
}

export async function createAdminShopItem(body: Record<string, unknown>, token: string) {
  const data = await apiPost<{ item: ShopItem }>('/api/admin/shop/items', body, token)
  return data.item
}

export async function updateAdminShopItem(id: number, body: Record<string, unknown>, token: string) {
  const data = await apiPatch<{ item: ShopItem }>(`/api/admin/shop/items/${id}`, body, token)
  return data.item
}

export async function deleteAdminShopItem(id: number, token: string) {
  await apiDelete(`/api/admin/shop/items/${id}`, token)
}

export async function resetAdminDatabase(token: string) {
  return apiPost<{ ok: boolean }>('/api/admin/database/reset', { confirm: 'RESET' }, token)
}

export type AdminSystemInfo = {
  server: {
    environment: 'production' | 'development'
    nodeVersion: string
    uptimeSeconds: number
    port: number
    serveStatic: boolean
    appName: string
    startedAt: string
  }
  integrations: {
    googleOAuth: boolean
    smtpEmail: boolean
    emailVerification: boolean
    jwtSecretConfigured: boolean
    adminFromEnv: boolean
  }
  stats: AdminStats
  database: {
    userCount: number
    shopItemCount: number
    chatMessageCount: number
    mailboxTotal: number
    verifiedUsers: number
    googleUsers: number
    nextUserId: number
    nextShopId: number
    nextChatId: number
    dbSizeBytes: number
  }
  uploads: {
    userFiles: number
    shopFiles: number
    totalBytes: number
  }
}

function fallbackSystemInfo(stats: AdminStats): AdminSystemInfo {
  return {
    server: {
      environment: import.meta.env.PROD ? 'production' : 'development',
      nodeVersion: '—',
      uptimeSeconds: 0,
      port: 3001,
      serveStatic: true,
      appName: 'Focus by Tsukiyomi',
      startedAt: new Date().toISOString(),
    },
    integrations: {
      googleOAuth: false,
      smtpEmail: false,
      emailVerification: false,
      jwtSecretConfigured: false,
      adminFromEnv: false,
    },
    stats,
    database: {
      userCount: stats.userCount,
      shopItemCount: stats.shopItemCount,
      chatMessageCount: 0,
      mailboxTotal: 0,
      verifiedUsers: 0,
      googleUsers: 0,
      nextUserId: stats.userCount + 1,
      nextShopId: stats.shopItemCount + 1,
      nextChatId: 1,
      dbSizeBytes: 0,
    },
    uploads: { userFiles: 0, shopFiles: 0, totalBytes: 0 },
  }
}

export async function fetchAdminSystem(token: string) {
  try {
    const data = await apiGet<{ system: AdminSystemInfo }>('/api/admin/system', token)
    if (!data.system) throw new ApiError('Invalid system response', 500, {})
    return data.system
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) throw err
    const stats = await fetchAdminStats(token)
    if (err instanceof ApiError && err.status === 404) {
      return fallbackSystemInfo(stats)
    }
    throw err
  }
}

export async function cleanupAdminUploads(token: string) {
  return apiPost<{
    ok: boolean
    removedUserFiles: number
    removedShopFiles: number
    storage: AdminSystemInfo['uploads']
  }>('/api/admin/uploads/cleanup', {}, token)
}

export async function uploadShopPreview(id: number, file: File, token: string) {
  const form = new FormData()
  form.set('image', file)
  const res = await fetch(`/api/admin/shop/items/${id}/preview-image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(typeof data.error === 'string' ? data.error : 'Upload failed', res.status, data)
  }
  return data as { item: ShopItem; previewUrl: string }
}

export type CreateShopItemForm = {
  type: string
  name: string
  description: string
  price: number
  discountPercent: number
  useDiscount: boolean
  isFree: boolean
  isEvent: boolean
  eventId: string
  stockLimit: string
  enabled: boolean
  image: File | null
}

export async function createShopItemWithImage(form: CreateShopItemForm, token: string) {
  const body = new FormData()
  body.set('type', form.type)
  body.set('name', form.name.trim())
  body.set('description', form.description.trim())
  body.set('price', String(form.isFree ? 0 : form.price))
  body.set('discountPercent', String(form.useDiscount ? form.discountPercent : 0))
  body.set('useDiscount', String(form.useDiscount))
  body.set('isFree', String(form.isFree))
  body.set('isEvent', String(form.isEvent))
  body.set('enabled', String(form.enabled))
  if (form.eventId !== '' && form.eventId !== 'none') body.set('eventId', form.eventId)
  if (form.stockLimit !== '') body.set('stockLimit', form.stockLimit)
  if (form.image) body.set('image', form.image)

  const res = await fetch('/api/admin/shop/items/with-image', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(typeof data.error === 'string' ? data.error : 'Create failed', res.status, data)
  }
  return data.item as ShopItem
}

export type AchievementDefinition = {
  id: string
  title: string
  description: string
  icon: string
  imageUrl: string | null
  coinReward: number
  xpReward: number
  trigger: 'register' | 'sessions' | 'focusMinutes' | 'tasks' | 'level'
  target: number
  enabled: boolean
  sortOrder: number
  createdAt: string
}

export async function fetchAdminAchievements(token: string) {
  const data = await apiGet<{ items: AchievementDefinition[] }>('/api/admin/achievements', token)
  return data.items
}

export async function createAdminAchievement(body: Record<string, unknown>, token: string) {
  const data = await apiPost<{ item: AchievementDefinition }>('/api/admin/achievements', body, token)
  return data.item
}

export async function updateAdminAchievement(
  id: string,
  body: Record<string, unknown>,
  token: string,
) {
  const data = await apiPatch<{ item: AchievementDefinition }>(`/api/admin/achievements/${id}`, body, token)
  return data.item
}

export async function deleteAdminAchievement(id: string, token: string) {
  await apiDelete(`/api/admin/achievements/${id}`, token)
}

export async function uploadAchievementImage(id: string, file: File, token: string) {
  const form = new FormData()
  form.set('image', file)
  const res = await fetch(`/api/admin/achievements/${id}/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(typeof data.error === 'string' ? data.error : 'Upload failed', res.status, data)
  }
  return data as { item: AchievementDefinition; imageUrl: string }
}

export type CreateAchievementForm = {
  id: string
  title: string
  description: string
  icon: string
  coinReward: number
  xpReward: number
  trigger: string
  target: number
  enabled: boolean
  image: File | null
}

export async function createAchievementWithImage(form: CreateAchievementForm, token: string) {
  const body = new FormData()
  body.set('id', form.id.trim().toLowerCase())
  body.set('title', form.title.trim())
  body.set('description', form.description.trim())
  body.set('icon', form.icon.trim() || '✨')
  body.set('coinReward', String(form.coinReward))
  body.set('xpReward', String(form.xpReward))
  body.set('trigger', form.trigger)
  body.set('target', String(form.target))
  body.set('enabled', String(form.enabled))
  if (form.image) body.set('image', form.image)

  const res = await fetch('/api/admin/achievements/with-image', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(typeof data.error === 'string' ? data.error : 'Create failed', res.status, data)
  }
  return data.item as AchievementDefinition
}

export { ApiError }
