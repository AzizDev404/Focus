import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'
import { createAuthRouter } from './routes/auth.js'
import { createAdminRouter } from './routes/admin.js'
import { createStatsRouter } from './routes/stats.js'
import { createProfileRouter } from './routes/profile.js'
import { createShopRouter } from './routes/shop.js'
import { createMailRouter } from './routes/mail.js'
import { createLeaderboardRouter } from './routes/leaderboard.js'
import { createUsersRouter } from './routes/users.js'
import { createSocialRouter } from './routes/social.js'
import { createDmRouter } from './routes/dm.js'
import { createWorkspaceRouter } from './routes/workspace.js'
import { createChatRouter } from './routes/chat.js'
import { securityHeaders, uploadStaticHeaders } from './lib/httpSecurity.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function corsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true)
    return
  }
  if (config.corsOrigins.includes(origin)) {
    callback(null, true)
    return
  }
  if (!config.isProd && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    callback(null, true)
    return
  }
  callback(null, false)
}

function spaHtmlHeaders(res, filePath) {
  if (filePath.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache')
  }
}

export function createApp() {
  const app = express()
  app.use(securityHeaders)
  app.use(cors({ origin: corsOrigin, credentials: true }))
  app.use(express.json({ limit: '256kb' }))
  app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'), {
      maxAge: '1d',
      etag: true,
      lastModified: true,
      setHeaders: uploadStaticHeaders,
    }),
  )

  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist')
  const adminDist = path.join(__dirname, '..', 'admin', 'dist')
  if (config.serveStatic && config.isProd) {
    app.use(
      '/admin',
      express.static(adminDist, {
        maxAge: '1h',
        etag: true,
        index: false,
        setHeaders: spaHtmlHeaders,
      }),
    )
    app.use(
      express.static(frontendDist, {
        maxAge: '1h',
        etag: true,
        index: false,
        setHeaders: spaHtmlHeaders,
      }),
    )
  }

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'tsukiyomi-focus-api' })
  })

  app.use(
    '/api/auth',
    createAuthRouter({ jwtSecret: config.jwtSecret }),
  )
  app.use(
    '/api/user/stats',
    createStatsRouter({ jwtSecret: config.jwtSecret }),
  )
  app.use(
    '/api/user/profile',
    createProfileRouter({ jwtSecret: config.jwtSecret }),
  )
  app.use(
    '/api/shop',
    createShopRouter({ jwtSecret: config.jwtSecret }),
  )
  app.use(
    '/api/user/mail',
    createMailRouter({ jwtSecret: config.jwtSecret }),
  )
  app.use('/api/leaderboard', createLeaderboardRouter())
  app.use('/api/users', createUsersRouter({ jwtSecret: config.jwtSecret }))
  app.use('/api/social', createSocialRouter({ jwtSecret: config.jwtSecret }))
  app.use('/api/dm', createDmRouter({ jwtSecret: config.jwtSecret }))
  app.use(
    '/api/user/workspace',
    createWorkspaceRouter({ jwtSecret: config.jwtSecret }),
  )
  app.use('/api/chat', createChatRouter({ jwtSecret: config.jwtSecret }))
  app.use(
    '/api/admin',
    createAdminRouter({
      jwtSecret: config.jwtSecret,
      adminUsername: config.adminUsername,
      adminPassword: config.adminPassword,
    }),
  )

  if (config.serveStatic && config.isProd) {
    app.get('/', (_req, res) => {
      res.redirect(302, '/app')
    })
    app.get(/^\/admin(\/.*)?$/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache')
      res.sendFile(path.join(adminDist, 'index.html'))
    })
    app.get(/^\/app(\/.*)?$/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache')
      res.sendFile(path.join(frontendDist, 'index.html'))
    })
  }

  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Invalid JSON in request body' })
      return
    }
    if (err?.type === 'entity.too.large') {
      res.status(413).json({ error: 'Request body is too large' })
      return
    }
    if (err?.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File is too large' })
      return
    }
    console.error(err)
    res.status(err.statusCode && err.statusCode < 500 ? err.statusCode : 500).json({
      error: err.expose && err.message ? err.message : 'Internal server error',
    })
  })

  return app
}
