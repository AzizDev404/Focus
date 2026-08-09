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

export async function apiPost<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Cannot reach API — run npm run dev', 0, {})
  }
  return parseJson(res) as Promise<T>
}

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { headers })
  } catch {
    throw new ApiError('Cannot reach API — run npm run dev', 0, {})
  }
  return parseJson(res) as Promise<T>
}

export async function apiPatch<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })
  return parseJson(res) as Promise<T>
}

export async function apiDelete<T>(path: string, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers })
  return parseJson(res) as Promise<T>
}
