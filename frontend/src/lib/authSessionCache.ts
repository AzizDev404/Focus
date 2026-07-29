import type { UserProfile } from './auth/types'
import { STORAGE_KEYS } from './auth/constants'

/** Single source of truth: token + profile together. */
export const SESSION_KEY = 'tsukiyomi-session'
const LEGACY_PROFILE_KEY = 'tsukiyomi-profile-cache'

export type StoredSession = {
  token: string
  profile: UserProfile
  savedAt: number
}

function writeTokenKey(token: string) {
  localStorage.setItem(STORAGE_KEYS.userToken, token)
}

export function saveSession(token: string, profile: UserProfile) {
  const trimmed = token?.trim()
  if (!trimmed || !profile?.id) {
    throw new Error('Cannot save session without token and profile')
  }
  const payload: StoredSession = { token: trimmed, profile, savedAt: Date.now() }
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
  writeTokenKey(trimmed)
  localStorage.removeItem(LEGACY_PROFILE_KEY)
}

export function updateSessionProfile(profile: UserProfile) {
  const session = readSessionRaw()
  if (!session?.token) return
  saveSession(session.token, profile)
}

export function readSession(): StoredSession | null {
  migrateAuthStorage()
  return readSessionRaw()
}

function readSessionRaw(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSession
      if (parsed?.token?.trim() && parsed?.profile?.id) return parsed
    }
  } catch {
    /* */
  }
  return null
}

/** Merge legacy keys into tsukiyomi-session and remove duplicates. */
export function migrateAuthStorage() {
  const current = readSessionRaw()
  if (current) {
    writeTokenKey(current.token)
    localStorage.removeItem(LEGACY_PROFILE_KEY)
    return
  }

  const token =
    localStorage.getItem(STORAGE_KEYS.userToken) ??
    localStorage.getItem('tsukiyomi-user-token')

  let profile: UserProfile | null = null
  try {
    const legacy = localStorage.getItem(LEGACY_PROFILE_KEY)
    if (legacy) profile = JSON.parse(legacy) as UserProfile
  } catch {
    /* */
  }

  if (token?.trim() && profile?.id) {
    saveSession(token.trim(), profile)
    return
  }

  if (!token?.trim() && profile) {
    localStorage.removeItem(LEGACY_PROFILE_KEY)
  }
}

export function cacheProfile(profile: UserProfile) {
  updateSessionProfile(profile)
}

export function readCachedProfile(): UserProfile | null {
  return readSession()?.profile ?? null
}

export function clearSessionStorage() {
  try {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(LEGACY_PROFILE_KEY)
    localStorage.removeItem(STORAGE_KEYS.userToken)
    localStorage.removeItem('tsukiyomi-user-token')
  } catch {
    /* */
  }
}

export function clearProfileCache() {
  clearSessionStorage()
}

export function hydrateProfileFromCache(
  setProfile: (profile: UserProfile | null) => void,
  setAuth: (session: { email: string; displayName: string }) => void,
) {
  const session = readSession()
  if (!session) return false
  setProfile(session.profile)
  setAuth({ email: session.profile.email, displayName: session.profile.displayName })
  return true
}
