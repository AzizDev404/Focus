import { useSyncExternalStore } from 'react'
import { STORAGE_KEYS } from './auth/constants'

export const ADMIN_STORAGE_EVENT = 'tsukiyomi-admin-storage'
export const ADMIN_SESSION_KEY = 'tsukiyomi-admin-session'
export const COOKIE_SESSION = 'cookie'

export type StoredAdminSession = {
  token?: string
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
      if (parsed?.username?.trim()) return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}

export function saveAdminSession(_token: string | null | undefined, username: string) {
  const name = username.trim() || 'admin'
  const payload: StoredAdminSession = {
    username: name,
    savedAt: Date.now(),
  }
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(payload))
  localStorage.removeItem(STORAGE_KEYS.adminToken)
  emitAdminStorageChange()
}

export function getAdminToken() {
  if (readAdminSession()?.username) return COOKIE_SESSION
  return null
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
