import { useSyncExternalStore } from 'react'
import { readSession, saveSession, clearSessionStorage } from './authSessionCache'
import type { UserProfile } from './auth/types'

export const AUTH_STORAGE_EVENT = 'tsukiyomi-auth-storage'

/** Placeholder so callers can detect a cookie session without storing a JWT. */
export const COOKIE_SESSION = 'cookie'

export function emitUserStorageChange() {
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT))
}

export function getUserToken() {
  if (readSession()?.profile?.id) return COOKIE_SESSION
  return null
}

export function setUserToken(_token: string, profile?: UserProfile | null) {
  if (profile?.id) {
    saveSession(null, profile)
    emitUserStorageChange()
  }
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
