import { config } from '../config.js'
import { getAdminDashboardStats, getDatabaseSummary } from '../db.js'
import { getUploadStorageStats } from './uploads.js'

const startedAt = Date.now()

export async function getAdminSystemInfo() {
  const stats = getAdminDashboardStats()
  const database = getDatabaseSummary()
  const uploads = await getUploadStorageStats()
  const smtpConfigured = Boolean(config.smtp.host && config.smtp.user && config.smtp.pass)

  return {
    server: {
      environment: config.isProd ? 'production' : 'development',
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      port: config.port,
      serveStatic: config.serveStatic,
      appName: config.appName,
      startedAt: new Date(startedAt).toISOString(),
    },
    integrations: {
      googleOAuth: Boolean(config.googleClientId),
      smtpEmail: smtpConfigured,
      emailVerification: config.requireEmailVerification,
      jwtSecretConfigured: Boolean(
        config.jwtSecret && config.jwtSecret !== 'dev-change-me-in-production',
      ),
      adminFromEnv: Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD),
    },
    stats,
    database,
    uploads,
  }
}
