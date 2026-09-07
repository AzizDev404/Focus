import type { UserProfile } from './auth/types'
import { STORAGE_KEYS } from './auth/constants'

/** Profile cache only — JWTs live in httpOnly cookies. */
export const SESSION_KEY = 'tsukiyomi-session'
const LEGACY_PROFILE_KEY = 'tsukiyomi-profile-cache'

export type StoredSession = {
  token?: string
  refreshToken?: string
  profile: UserProfile
  savedAt: number
}

function stripLegacyTokens() {
  localStorage.removeItem(STORAGE_KEYS.userToken)
  localStorage.removeItem('tsukiyomi-user-token')
}

export function saveSession(_token: string | null | undefined, profile: UserProfile, _refreshToken?: string | null) {
  if (!profile?.id) {
    throw new Error('Cannot save session without profile')
  }
  const payload: StoredSession = {
    profile,
    savedAt: Date.now(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
  stripLegacyTokens()
  localStorage.removeItem(LEGACY_PROFILE_KEY)
}

export function updateSessionProfile(profile: UserProfile) {
  if (!profile?.id) return
  saveSession(null, profile)
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
      if (parsed?.profile?.id) return parsed
    }
  } catch {
    /* */
  }
  return null
}

/** Merge legacy keys into tsukiyomi-session. Tokens are dropped (cookies replace them). */
export function migrateAuthStorage() {
  const current = readSessionRaw()
  if (current?.profile?.id) {
    stripLegacyTokens()
    localStorage.removeItem(LEGACY_PROFILE_KEY)
    return
  }

  let profile: UserProfile | null = null
  try {
    const legacy = localStorage.getItem(LEGACY_PROFILE_KEY)
    if (legacy) profile = JSON.parse(legacy) as UserProfile
  } catch {
    /* */
  }

  if (profile?.id) {
    saveSession(null, profile)
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
    stripLegacyTokens()
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
