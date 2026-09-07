import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const isProd = process.env.NODE_ENV === 'production'

function parseCorsOrigins() {
  return String(process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || (isProd ? '' : 'dev-change-me-in-production'),
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || (isProd ? '' : 'admin123'),
  corsOrigins: parseCorsOrigins(),
  // Google OAuth — optional, only required if you enable Google Sign-In
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  // Email / SMTP — used for OTP and password-reset codes. If unset, codes
  // are logged to the API console (development only).
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    secure: process.env.SMTP_SECURE === 'true',
  },
  mailFrom: process.env.MAIL_FROM || 'Focus by Tsukiyomi <no-reply@tsukiyomi.focus>',
  appName: process.env.APP_NAME || 'Focus by Tsukiyomi',
  serveStatic: process.env.SERVE_STATIC !== 'false',
  trustProxy: process.env.TRUST_PROXY === 'true',
  isProd,
}

const smtpConfigured = Boolean(config.smtp.host && config.smtp.user)

// Self-host: production without SMTP should still allow sign-up.
// Force verification only when SMTP is configured, or when explicitly requested.
config.requireEmailVerification =
  process.env.REQUIRE_EMAIL_VERIFICATION === 'true' ||
  (isProd && process.env.REQUIRE_EMAIL_VERIFICATION !== 'false' && smtpConfigured)

if (config.requireEmailVerification && !smtpConfigured) {
  console.warn(
    '[config] Email verification is on but SMTP is not set. OTP codes will print in the API log. Set SMTP_* or REQUIRE_EMAIL_VERIFICATION=false.',
  )
}

if (isProd) {
  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    throw new Error('[config] JWT_SECRET must be at least 32 characters in production.')
  }
  if (!process.env.ADMIN_USERNAME || process.env.ADMIN_USERNAME === 'admin') {
    throw new Error('[config] ADMIN_USERNAME must be changed from default in production.')
  }
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12 || process.env.ADMIN_PASSWORD === 'admin') {
    throw new Error('[config] ADMIN_PASSWORD must be at least 12 characters in production.')
  }
}
