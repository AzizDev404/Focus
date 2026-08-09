import { useSyncExternalStore } from 'react'
import { STORAGE_KEYS } from './auth/constants'

export const ADMIN_STORAGE_EVENT = 'tsukiyomi-admin-storage'
export const ADMIN_SESSION_KEY = 'tsukiyomi-admin-session'

export type StoredAdminSession = {
  token: string
  username: string
  savedAt: number
}

function emitAdminStorageChange() {
  window.dispatchEvent(new Event(ADMIN_STORAGE_EVENT))
}

export function readAdminSession(): StoredAdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredAdminSession
      if (parsed?.token?.trim()) return parsed
    }
  } catch {
    /* ignore */
  }
  const legacy = localStorage.getItem(STORAGE_KEYS.adminToken)?.trim()
  if (legacy) {
    return { token: legacy, username: 'admin', savedAt: Date.now() }
  }
  return null
}

export function saveAdminSession(token: string, username: string) {
  const trimmed = token?.trim()
  if (!trimmed) return
  const payload: StoredAdminSession = {
    token: trimmed,
    username: username.trim() || 'admin',
    savedAt: Date.now(),
  }
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(payload))
  localStorage.setItem(STORAGE_KEYS.adminToken, trimmed)
  emitAdminStorageChange()
}

export function getAdminToken() {
  return readAdminSession()?.token ?? null
}

export function setAdminToken(token: string, username = 'admin') {
  saveAdminSession(token, username)
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_SESSION_KEY)
  localStorage.removeItem(STORAGE_KEYS.adminToken)
  emitAdminStorageChange()
}

function subscribeAdminStorage(onStoreChange: () => void) {
  const handler = () => onStoreChange()
  window.addEventListener(ADMIN_STORAGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(ADMIN_STORAGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function useAdminToken() {
  return useSyncExternalStore(subscribeAdminStorage, getAdminToken, getAdminToken)
}
