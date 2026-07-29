import { useSyncExternalStore } from 'react'
import { STORAGE_KEYS } from './auth/constants'
import { readSession, saveSession, clearSessionStorage } from './authSessionCache'
import type { UserProfile } from './auth/types'

export const AUTH_STORAGE_EVENT = 'tsukiyomi-auth-storage'
export const ADMIN_STORAGE_EVENT = 'tsukiyomi-admin-storage'

export function emitUserStorageChange() {
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT))
}

function emitAdminStorageChange() {
  window.dispatchEvent(new Event(ADMIN_STORAGE_EVENT))
}

export function getUserToken() {
  const session = readSession()
  if (session?.token) return session.token
  return (
    localStorage.getItem(STORAGE_KEYS.userToken) ??
    localStorage.getItem('tsukiyomi-user-token')
  )
}

export function setUserToken(token: string, profile?: UserProfile | null) {
  const trimmed = token?.trim()
  if (!trimmed) return
  if (profile?.id) {
    saveSession(trimmed, profile)
  } else {
    localStorage.setItem(STORAGE_KEYS.userToken, trimmed)
    localStorage.removeItem('tsukiyomi-user-token')
  }
  emitUserStorageChange()
}

export function clearUserToken() {
  clearSessionStorage()
  emitUserStorageChange()
}

function subscribeUserStorage(onStoreChange: () => void) {
  const handler = () => onStoreChange()
  window.addEventListener(AUTH_STORAGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(AUTH_STORAGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function useUserToken() {
  return useSyncExternalStore(subscribeUserStorage, getUserToken, getUserToken)
}

export const ADMIN_SESSION_KEY = 'tsukiyomi-admin-session'

export type StoredAdminSession = {
  token: string
  username: string
  savedAt: number
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
