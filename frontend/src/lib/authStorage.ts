import { useSyncExternalStore } from 'react'
import { STORAGE_KEYS } from './auth/constants'
import { readSession, saveSession, clearSessionStorage } from './authSessionCache'
import type { UserProfile } from './auth/types'

export const AUTH_STORAGE_EVENT = 'tsukiyomi-auth-storage'

export function emitUserStorageChange() {
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT))
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
