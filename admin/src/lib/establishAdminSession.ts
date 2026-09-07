import { ApiError } from './api'
import { fetchAdminStats } from './adminApi'
import { apiPost } from './api'
import {
  clearAdminToken,
  COOKIE_SESSION,
  getAdminToken,
  saveAdminSession,
} from './authStorage'

export function establishAdminSession(_token: string | null | undefined, username: string) {
  const name = username?.trim()
  if (!name) return false
  saveAdminSession(null, name)
  return true
}

export function logoutAdmin() {
  void apiPost('/api/admin/logout', {}).catch(() => {})
  clearAdminToken()
}

/** Validate cookie session; clear if expired or rejected. */
export async function validateAdminSession(): Promise<string | null> {
  if (!getAdminToken()) return null
  try {
    await fetchAdminStats(COOKIE_SESSION)
    return COOKIE_SESSION
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      clearAdminToken()
      return null
    }
    return COOKIE_SESSION
  }
}

export function restoreAdminSessionFromStorage(): string | null {
  return getAdminToken()
}
