import { apiGet, apiPatch, apiPost } from './api'
import { getUserToken } from './authStorage'
import type { ShopEvent, ShopItem, UserProfile } from './auth/types'

export async function fetchProfile(token = getUserToken()): Promise<UserProfile | null> {
  if (!token) return null
  // Prefer /api/auth/me — same profile payload, always in sync after login.
  const data = await apiGet<{ user: UserProfile }>('/api/auth/me', token)
  return data.user
}

export async function fetchShopItems() {
  const data = await apiGet<{ items: ShopItem[] }>('/api/shop/items')
  return data.items
}

export async function fetchShopEvents() {
  const data = await apiGet<{ events: ShopEvent[] }>('/api/shop/events')
  return data.events
}

export async function purchaseItem(itemId: number, token = getUserToken()) {
  if (!token) throw new Error('Not signed in')
  const data = await apiPost<{ profile: UserProfile; pricePaid: number }>(
    '/api/shop/purchase',
    { itemId },
    token,
  )
  return data
}

export async function equipItem(itemId: number, token = getUserToken()) {
  if (!token) throw new Error('Not signed in')
  const data = await apiPost<{ profile: UserProfile }>('/api/user/profile/equip', { itemId }, token)
  return data.profile
}

export async function unequipItem(type: string, token = getUserToken()) {
  if (!token) throw new Error('Not signed in')
  const data = await apiPost<{ profile: UserProfile }>(
    '/api/user/profile/unequip',
    { type },
    token,
  )
  return data.profile
}

export async function resetProfileSlot(type: 'background' | 'avatar', token = getUserToken()) {
  if (!token) throw new Error('Not signed in')
  const data = await apiPost<{ profile: UserProfile }>(
    '/api/user/profile/reset-slot',
    { type },
    token,
  )
  return data.profile
}

export async function updateDisplayName(displayName: string, token = getUserToken()) {
  if (!token) throw new Error('Not signed in')
  const data = await apiPatch<{ profile: UserProfile }>(
    '/api/user/profile/display-name',
    { displayName },
    token,
  )
  return data.profile
}

async function uploadProfileImage(
  path: '/api/user/profile/upload-avatar' | '/api/user/profile/upload-background',
  file: File,
  token = getUserToken(),
) {
  if (!token) throw new Error('Not signed in')
  const form = new FormData()
  form.set('image', file)
  const res = await fetch(path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Upload failed')
  return (data as { profile: UserProfile }).profile
}

export async function uploadAvatar(file: File, token = getUserToken()) {
  return uploadProfileImage('/api/user/profile/upload-avatar', file, token)
}

export async function uploadBackground(file: File, token = getUserToken()) {
  return uploadProfileImage('/api/user/profile/upload-background', file, token)
}

export function shopItemById(items: ShopItem[], id: number | null | undefined) {
  if (id == null) return null
  return items.find((i) => i.id === id) ?? null
}

export function itemsByType(items: ShopItem[], type: ShopItem['type']) {
  return items.filter((i) => i.type === type)
}
