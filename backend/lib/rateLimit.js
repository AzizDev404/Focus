const buckets = new Map()

function prune(now) {
  if (buckets.size < 4000) return
  for (const [key, bucket] of buckets) {
    if (now - bucket.start > bucket.windowMs * 2) buckets.delete(key)
  }
}

export function clientIp(req) {
  if (process.env.TRUST_PROXY === 'true') {
    const xf = req.headers['x-forwarded-for']
    if (typeof xf === 'string' && xf.trim()) return xf.split(',')[0].trim()
  }
  return req.socket?.remoteAddress || 'unknown'
}

/** In-memory limiter. Fine for a single Node process. */
export function rateLimit({ windowMs, max, name, keyFn }) {
  return (req, res, next) => {
    const now = Date.now()
    prune(now)
    const id = typeof keyFn === 'function' ? keyFn(req) : clientIp(req)
    const key = `${name}:${id}`
    let bucket = buckets.get(key)
    if (!bucket || now - bucket.start >= windowMs) {
      bucket = { start: now, count: 0, windowMs }
      buckets.set(key, bucket)
    }
    bucket.count += 1
    if (bucket.count > max) {
      res.status(429).json({ error: 'Too many requests. Try again shortly.' })
      return
    }
    next()
  }
}
