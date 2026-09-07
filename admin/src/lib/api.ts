const API_BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  status: number
  data: Record<string, unknown>
  constructor(message: string, status: number, data: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.data = data
  }
}

function bearer(token?: string | null) {
  if (!token || token === 'cookie') return null
  return token
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

async function request(path: string, init: RequestInit, token?: string | null) {
  const headers = new Headers(init.headers)
  const auth = bearer(token)
  if (auth) headers.set('Authorization', `Bearer ${auth}`)
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' })
  } catch {
    throw new ApiError('Cannot reach API — run npm run dev', 0, {})
  }
  return parseJson(res)
}

export async function apiPost<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  return request(
    path,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    token,
  ) as Promise<T>
}

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  return request(path, { method: 'GET' }, token) as Promise<T>
}

export async function apiPatch<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  return request(
    path,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    token,
  ) as Promise<T>
}

export async function apiDelete<T>(path: string, token?: string | null): Promise<T> {
  return request(path, { method: 'DELETE' }, token) as Promise<T>
}
