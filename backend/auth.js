import jwt from 'jsonwebtoken'

export function signUserToken(user, secret) {
  return jwt.sign(
    { sub: user.id, address: user.address, role: 'user' },
    secret,
    { expiresIn: '30d' },
  )
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

export function userMiddleware(secret) {
  return (req, res, next) => {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }
    const payload = verifyToken(token, secret)
    if (!payload || payload.role !== 'user') {
      res.status(401).json({ error: 'Invalid session' })
      return
    }
    req.auth = payload
    next()
  }
}

/** Sets req.auth when a valid user token is present; never rejects. */
export function optionalUserMiddleware(secret) {
  return (req, _res, next) => {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null
    if (token) {
      const payload = verifyToken(token, secret)
      if (payload?.role === 'user') req.auth = payload
    }
    next()
  }
}

export function adminMiddleware(secret) {
  return (req, res, next) => {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null
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
