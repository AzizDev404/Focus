import jwt from 'jsonwebtoken'
import { findUserById } from './db.js'
import { readAdminToken, readUserAccessToken } from './lib/cookies.js'

function userClaims(user) {
  return {
    sub: String(user.id),
    address: user.address,
    role: 'user',
    ver: user.tokenVersion ?? 0,
  }
}

export function issueAuthTokens(user, secret) {
  const claims = userClaims(user)
  return {
    token: jwt.sign({ ...claims, typ: 'access' }, secret, { expiresIn: '12h' }),
    refreshToken: jwt.sign({ ...claims, typ: 'refresh' }, secret, { expiresIn: '30d' }),
  }
}

export function signUserToken(user, secret) {
  return issueAuthTokens(user, secret).token
}

export function signAdminToken(username, secret) {
  return jwt.sign({ sub: 'admin', username, role: 'admin' }, secret, { expiresIn: '12h' })
}

export function verifyToken(token, secret) {
  try {
    return jwt.verify(token, secret)
  } catch {
    return null
  }
}

export function authUserId(payload) {
  const id = Number(payload?.sub)
  return Number.isFinite(id) && id >= 1 ? id : null
}

export function userMiddleware(secret) {
  return (req, res, next) => {
    const token = readUserAccessToken(req)
    if (!token) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }
    const payload = verifyToken(token, secret)
    if (!payload || payload.role !== 'user' || payload.typ === 'refresh') {
      res.status(401).json({ error: 'Invalid session' })
      return
    }
    const userId = authUserId(payload)
    if (!userId) {
      res.status(401).json({ error: 'Invalid session' })
      return
    }
    const user = findUserById(userId)
    if (!user) {
      res.status(401).json({ error: 'Invalid session' })
      return
    }
    if ((user.tokenVersion ?? 0) !== (payload.ver ?? 0)) {
      res.status(401).json({ error: 'Session expired. Sign in again.' })
      return
    }
    req.auth = { ...payload, sub: userId }
    next()
  }
}

/** Sets req.auth when a valid user token is present; never rejects. */
export function optionalUserMiddleware(secret) {
  return (req, _res, next) => {
    const token = readUserAccessToken(req)
    if (token) {
      const payload = verifyToken(token, secret)
      const userId = authUserId(payload)
      if (payload?.role === 'user' && payload.typ !== 'refresh' && userId) {
        const user = findUserById(userId)
        if (user && (user.tokenVersion ?? 0) === (payload.ver ?? 0)) {
          req.auth = { ...payload, sub: userId }
        }
      }
    }
    next()
  }
}

export function adminMiddleware(secret) {
  return (req, res, next) => {
    const token = readAdminToken(req)
    if (!token) {
      res.status(401).json({ error: 'Admin login required' })
      return
    }
    const payload = verifyToken(token, secret)
    if (!payload || payload.role !== 'admin') {
      res.status(403).json({ error: 'Admin access only' })
      return
    }
    req.admin = payload
    next()
  }
}
