import { ApiError } from './api'
import { fetchAdminStats } from './adminApi'
import {
  clearAdminToken,
  getAdminToken,
  readAdminSession,
  saveAdminSession,
} from './authStorage'

export function establishAdminSession(token: string, username: string) {
  const trimmed = token?.trim()
  if (!trimmed) return false
  saveAdminSession(trimmed, username)
  return true
}

export function logoutAdmin() {
  clearAdminToken()
}

/** Validate stored admin token; clear if expired or rejected. */
export async function validateAdminSession(): Promise<string | null> {
  const session = readAdminSession()
  const token = session?.token?.trim()
  if (!token) return null
  try {
    await fetchAdminStats(token)
    return token
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      clearAdminToken()
    }
    return null
  }
}

export function restoreAdminSessionFromStorage(): string | null {
  return getAdminToken()?.trim() || null
}
