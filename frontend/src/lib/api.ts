import { clearSessionStorage, saveSession } from './authSessionCache'
import { COOKIE_SESSION, emitUserStorageChange, getUserToken } from './authStorage'
import type { UserProfile } from './auth/types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

const SKIP_REFRESH =
  /\/api\/auth\/(login|register|refresh|logout|forgot-password|reset-password|verify-email|resend-otp|google|config)(\?|$)/

export class ApiError extends Error {
  status: number
  data: Record<string, unknown>
  constructor(message: string, status: number, data: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.data = data
  }
}

let refreshInFlight: Promise<boolean> | null = null

function bearerHeader(token?: string | null) {
  if (!token || token === COOKIE_SESSION) return null
  return token
}

async function tryRefreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: '{}',
      })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          clearSessionStorage()
          emitUserStorageChange()
        }
        return false
      }
      const data = (await res.json()) as { user?: UserProfile }
      if (data.user?.id) {
        saveSession(null, data.user)
        emitUserStorageChange()
      }
      return true
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

async function parseJson(res: Response) {
  const text = await res.text()
  let data: Record<string, unknown> = {}
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>
    } catch {
      if (!res.ok) {
        const hint =
          res.status === 404
            ? 'API endpoint not found — restart with npm run dev'
            : res.status === 401
              ? 'Not authenticated — sign in again'
              : res.status === 403
                ? 'Access denied — use admin login'
                : res.status >= 500
                  ? 'Server error — check API terminal'
                  : text.slice(0, 120) || 'Request failed'
        throw new ApiError(hint, res.status, {})
      }
    }
  }
  if (!res.ok) {
    throw new ApiError(
      typeof data.error === 'string'
        ? data.error
        : typeof data.message === 'string'
          ? data.message
          : res.status === 404
            ? 'API endpoint not found — restart with npm run dev'
            : res.status === 401
              ? 'Not authenticated — sign in again'
              : res.status === 403
                ? 'Access denied — use admin login'
                : 'Request failed',
      res.status,
      data,
    )
  }
  return data
}

async function apiFetch(path: string, init: RequestInit, token?: string | null): Promise<Response> {
  const headers = new Headers(init.headers)
  const bearer = bearerHeader(token)
  if (bearer) headers.set('Authorization', `Bearer ${bearer}`)
  const opts: RequestInit = { ...init, headers, credentials: 'include' }
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, opts)
  } catch {
    throw new ApiError('Cannot reach API — run npm run dev', 0, {})
  }
  if (res.status === 401 && !SKIP_REFRESH.test(path)) {
    const ok = await tryRefreshSession()
    if (ok) {
      try {
        res = await fetch(`${API_BASE}${path}`, opts)
      } catch {
        throw new ApiError('Cannot reach API — run npm run dev', 0, {})
      }
    }
  }
  return res
}

export async function apiPost<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const res = await apiFetch(
    path,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    token ?? getUserToken(),
  )
  return parseJson(res) as Promise<T>
}

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  const res = await apiFetch(path, { method: 'GET' }, token ?? getUserToken())
  return parseJson(res) as Promise<T>
}

export async function apiPut<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const res = await apiFetch(
    path,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    token ?? getUserToken(),
  )
  return parseJson(res) as Promise<T>
}

export async function apiPatch<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const res = await apiFetch(
    path,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    token ?? getUserToken(),
  )
  return parseJson(res) as Promise<T>
}

export async function apiDelete<T>(path: string, token?: string | null): Promise<T> {
  const res = await apiFetch(path, { method: 'DELETE' }, token ?? getUserToken())
  return parseJson(res) as Promise<T>
}
