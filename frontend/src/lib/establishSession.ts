import type { UserProfile } from './auth/types'
import { profileToSession } from './auth/session'
import {
  clearSessionStorage,
  migrateAuthStorage,
  readSession,
  saveSession,
} from './authSessionCache'
import { emitUserStorageChange, getUserToken } from './authStorage'
import { useFlocusStore } from '../store/useFlocusStore'

/** Save token + profile together so they never get out of sync. */
export function establishUserSession(token: string, profile: UserProfile) {
  const trimmed = token?.trim()
  if (!trimmed) {
    console.error('[auth] establishUserSession: missing token')
    return false
  }
  saveSession(trimmed, profile)
  const store = useFlocusStore.getState()
  store.setProfile(profile)
  store.setAuth(profileToSession(profile))
  store.completeOnboarding()
  emitUserStorageChange()
  return true
}

export function openProfileSettings() {
  const store = useFlocusStore.getState()
  store.setSettingsTab('profile')
  store.setPanel('settings')
  store.setAuthModalOpen(false)
}

export function completeAuthSuccess(token: string, profile: UserProfile) {
  if (!establishUserSession(token, profile)) return
  openProfileSettings()
}

export function logoutUser() {
  clearSessionStorage()
  emitUserStorageChange()
  useFlocusStore.getState().clearAuth()
}

export function restoreSessionFromStorage() {
  const session = readSession()
  if (!session) {
    scrubStaleSession()
    return false
  }

  const store = useFlocusStore.getState()
  if (!store.profile?.id) {
    store.setProfile(session.profile)
    store.setAuth(profileToSession(session.profile))
  }
  return true
}

/** Remove orphaned profile cache from old builds (no token). */
export function scrubStaleSession() {
  migrateAuthStorage()
  if (!readSession()) {
    const legacy = localStorage.getItem('tsukiyomi-profile-cache')
    if (legacy && !getUserToken()) {
      localStorage.removeItem('tsukiyomi-profile-cache')
    }
  }
}

export function isUserSignedIn() {
  const session = readSession()
  return Boolean(session?.token && session?.profile?.id)
}
