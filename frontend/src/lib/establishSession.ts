import type { UserProfile } from './auth/types'
import { profileToSession } from './auth/session'
import {
  clearSessionStorage,
  migrateAuthStorage,
  readSession,
  saveSession,
} from './authSessionCache'
import { emitUserStorageChange } from './authStorage'
import { apiPost } from './api'
import { useFlocusStore } from '../store/useFlocusStore'

export function establishUserSession(_token: string | null | undefined, profile: UserProfile) {
  if (!profile?.id) {
    console.error('[auth] establishUserSession: missing profile')
    return false
  }
  saveSession(null, profile)
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

export function completeAuthSuccess(token: string | null | undefined, profile: UserProfile) {
  if (!establishUserSession(token, profile)) return
  openProfileSettings()
}

export function logoutUser() {
  void apiPost('/api/auth/logout', {}).catch(() => {
    /* cookie clear is best-effort */
  })
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

export function scrubStaleSession() {
  migrateAuthStorage()
  if (!readSession()) {
    try {
      localStorage.removeItem('tsukiyomi-profile-cache')
    } catch {
      /* */
    }
  }
}

export function isUserSignedIn() {
  const session = readSession()
  return Boolean(session?.profile?.id)
}
