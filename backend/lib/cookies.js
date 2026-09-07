import { config } from '../config.js'

export const COOKIE_AT = 'tsk_at'
export const COOKIE_RT = 'tsk_rt'
export const COOKIE_ADMIN = 'tsk_admin'

export function parseCookies(req) {
  const out = {}
  const header = req.headers?.cookie
  if (!header || typeof header !== 'string') return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (!key) continue
    try {
      out[key] = decodeURIComponent(value)
    } catch {
      out[key] = value
    }
  }
  return out
}

function serialize(name, value, { maxAge, secure }) {
  let line = `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax`
  if (Number.isFinite(maxAge)) line += `; Max-Age=${Math.max(0, maxAge)}`
  if (secure) line += '; Secure'
  return line
}

function secureCookies() {
  return config.isProd
}

export function appendCookies(res, lines) {
  const prev = res.getHeader('Set-Cookie')
  const list = prev ? (Array.isArray(prev) ? prev : [String(prev)]) : []
  res.setHeader('Set-Cookie', [...list, ...lines])
}

export function setUserAuthCookies(res, { token, refreshToken }) {
  const secure = secureCookies()
  appendCookies(res, [
    serialize(COOKIE_AT, token, { maxAge: 12 * 60 * 60, secure }),
    serialize(COOKIE_RT, refreshToken, { maxAge: 30 * 24 * 60 * 60, secure }),
  ])
}

export function clearUserAuthCookies(res) {
  const secure = secureCookies()
  appendCookies(res, [
    serialize(COOKIE_AT, '', { maxAge: 0, secure }),
    serialize(COOKIE_RT, '', { maxAge: 0, secure }),
  ])
}

export function setAdminAuthCookie(res, token) {
  appendCookies(res, [serialize(COOKIE_ADMIN, token, { maxAge: 12 * 60 * 60, secure: secureCookies() })])
}

export function clearAdminAuthCookie(res) {
  appendCookies(res, [serialize(COOKIE_ADMIN, '', { maxAge: 0, secure: secureCookies() })])
}

export function readBearer(req) {
  const header = req.headers?.authorization
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    const token = header.slice(7).trim()
    if (token && token !== 'cookie') return token
  }
  return null
}

export function readUserAccessToken(req) {
  const cookies = parseCookies(req)
  return cookies[COOKIE_AT] || readBearer(req)
}

export function readUserRefreshToken(req) {
  const fromBody = String(req.body?.refreshToken ?? '').trim()
  if (fromBody) return fromBody
  return parseCookies(req)[COOKIE_RT] || null
}

export function readAdminToken(req) {
  return parseCookies(req)[COOKIE_ADMIN] || readBearer(req)
}
