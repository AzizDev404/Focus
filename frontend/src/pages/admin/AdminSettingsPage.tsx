import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  Check,
  Coins,
  HardDrive,
  Mail,
  RefreshCcw,
  Shield,
  ShoppingBag,
  Timer,
  Users,
  X,
  Zap,
} from '../../components/icons'
import {
  ApiError,
  cleanupAdminUploads,
  fetchAdminSystem,
  resetAdminDatabase,
  type AdminSystemInfo,
} from '../../lib/adminApi'

type Props = { token: string; onSessionExpired?: () => void }

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatUptime(sec: number) {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (d) return `${d}d ${h}h`
  if (h) return `${h}h ${m}m`
  return `${m}m`
}

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h) return `${h}h ${m}m`
  if (m) return `${m}m`
  return `${sec}s`
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`adm-status-badge${ok ? ' is-ok' : ' is-warn'}`}>
      {ok ? <Check size={13} strokeWidth={2.5} aria-hidden /> : <X size={13} strokeWidth={2.5} aria-hidden />}
      {label}
    </span>
  )
}

export function AdminSettingsPage({ token, onSessionExpired }: Props) {
  const [system, setSystem] = useState<AdminSystemInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resetBusy, setResetBusy] = useState(false)
  const [cleanupBusy, setCleanupBusy] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setSystem(await fetchAdminSystem(token))
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError('API endpoint missing — restart the server: npm run dev')
        } else if (err.status === 401 || err.status === 403) {
          setError('Session expired — log out and sign in again.')
          onSessionExpired?.()
        } else {
          setError(err.message)
        }
      } else {
        setError('Cannot reach API — run npm run dev and refresh.')
      }
    } finally {
      setLoading(false)
    }
  }, [token, onSessionExpired])

  useEffect(() => {
    void load()
  }, [load])

  const onResetDatabase = async () => {
    const ok = window.confirm(
      'Permanently delete ALL users, shop items, chat messages, and uploaded images?',
    )
    if (!ok) return
    const typed = window.prompt('Type RESET to confirm:')
    if (typed !== 'RESET') return
    setResetBusy(true)
    setActionMsg('')
    try {
      await resetAdminDatabase(token)
      setActionMsg('Database wiped. Users and uploads removed.')
      await load()
    } catch (err) {
      setActionMsg(err instanceof ApiError ? err.message : 'Reset failed')
    } finally {
      setResetBusy(false)
    }
  }

  const onCleanupUploads = async () => {
    setCleanupBusy(true)
    setActionMsg('')
    try {
      const result = await cleanupAdminUploads(token)
      const removed = result.removedUserFiles + result.removedShopFiles
      setActionMsg(
        removed
          ? `Removed ${removed} orphan file${removed === 1 ? '' : 's'}. Storage now ${formatBytes(result.storage.totalBytes)}.`
          : 'No orphan files found — storage is clean.',
      )
      await load()
    } catch (err) {
      setActionMsg(err instanceof ApiError ? err.message : 'Cleanup failed')
    } finally {
      setCleanupBusy(false)
    }
  }

  const db = system?.database
  const up = system?.uploads
  const stats = system?.stats

  const integrations = system?.integrations ?? {
    googleOAuth: false,
    smtpEmail: false,
    emailVerification: false,
    jwtSecretConfigured: false,
    adminFromEnv: false,
  }

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <h1>Settings</h1>
          <p className="adm-muted">System health, storage, integrations, and maintenance tools.</p>
        </div>
        <button type="button" className="adm-btn" disabled={loading} onClick={() => void load()}>
          <RefreshCcw size={14} aria-hidden /> Refresh
        </button>
      </header>

      {error ? <p className="adm-banner adm-banner--error">{error}</p> : null}
      {actionMsg ? <p className="adm-banner adm-banner--ok">{actionMsg}</p> : null}

      {loading && !system ? <p className="adm-muted">Loading system info…</p> : null}

      {system ? (
        <>
          <section className="adm-settings-grid">
            <article className="adm-card adm-settings-card">
              <h2>
                <Activity size={18} aria-hidden /> Server
              </h2>
              <ul className="adm-meta-list">
                <li>
                  <span>Environment</span>
                  <StatusBadge
                    ok={system.server.environment === 'production'}
                    label={system.server.environment}
                  />
                </li>
                <li>
                  <span>API uptime</span>
                  <strong>{formatUptime(system.server.uptimeSeconds)}</strong>
                </li>
                <li>
                  <span>Node</span>
                  <code>{system.server.nodeVersion}</code>
                </li>
                <li>
                  <span>API port</span>
                  <code>{system.server.port}</code>
                </li>
                <li>
                  <span>Static app</span>
                  <StatusBadge ok={system.server.serveStatic} label={system.server.serveStatic ? 'enabled' : 'off'} />
                </li>
              </ul>
            </article>

            <article className="adm-card adm-settings-card">
              <h2>
                <Shield size={18} aria-hidden /> Integrations
              </h2>
              <ul className="adm-settings-checklist">
                <li className={integrations.googleOAuth ? 'is-ok' : 'is-warn'}>
                  {integrations.googleOAuth ? <Check size={15} aria-hidden /> : <X size={15} aria-hidden />}
                  <div>
                    <strong>Google Sign-In</strong>
                    <small>{integrations.googleOAuth ? 'GOOGLE_CLIENT_ID set' : 'Not configured — add to .env'}</small>
                  </div>
                </li>
                <li className={integrations.smtpEmail ? 'is-ok' : 'is-warn'}>
                  {integrations.smtpEmail ? <Check size={15} aria-hidden /> : <X size={15} aria-hidden />}
                  <div>
                    <strong>Email / OTP</strong>
                    <small>
                      {integrations.smtpEmail
                        ? 'SMTP configured'
                        : 'Dev mode — codes logged to API console'}
                    </small>
                  </div>
                </li>
                <li className={integrations.emailVerification ? 'is-ok' : ''}>
                  <Mail size={15} aria-hidden />
                  <div>
                    <strong>Email verification</strong>
                    <small>{integrations.emailVerification ? 'Required for new accounts' : 'Optional in dev'}</small>
                  </div>
                </li>
                <li className={integrations.jwtSecretConfigured ? 'is-ok' : 'is-warn'}>
                  {integrations.jwtSecretConfigured ? <Check size={15} aria-hidden /> : <X size={15} aria-hidden />}
                  <div>
                    <strong>JWT secret</strong>
                    <small>{integrations.jwtSecretConfigured ? 'Secure secret set' : 'Using dev default — change for prod'}</small>
                  </div>
                </li>
                <li className={integrations.adminFromEnv ? 'is-ok' : 'is-warn'}>
                  {integrations.adminFromEnv ? <Check size={15} aria-hidden /> : <X size={15} aria-hidden />}
                  <div>
                    <strong>Admin credentials</strong>
                    <small>
                      {integrations.adminFromEnv
                        ? 'Loaded from .env'
                        : 'Using defaults — set ADMIN_USERNAME / ADMIN_PASSWORD'}
                    </small>
                  </div>
                </li>
              </ul>
            </article>
          </section>

          <section className="adm-card adm-settings-card">
            <h2>
              <Users size={18} aria-hidden /> Database snapshot
            </h2>
            <div className="adm-settings-stat-row">
              <div className="adm-settings-stat">
                <Users size={16} aria-hidden />
                <span>{db?.userCount ?? 0} users</span>
                <small>{db?.verifiedUsers ?? 0} verified · {db?.googleUsers ?? 0} Google</small>
              </div>
              <div className="adm-settings-stat">
                <ShoppingBag size={16} aria-hidden />
                <span>{db?.shopItemCount ?? 0} shop items</span>
                <small>{stats?.shopEnabledCount ?? 0} live in magazine</small>
              </div>
              <div className="adm-settings-stat">
                <Mail size={16} aria-hidden />
                <span>{db?.mailboxTotal ?? 0} inbox msgs</span>
                <small>{db?.chatMessageCount ?? 0} global chat msgs</small>
              </div>
              <div className="adm-settings-stat">
                <Coins size={16} aria-hidden />
                <span>{(stats?.totalCoins ?? 0).toLocaleString()} coins</span>
                <small>in user wallets</small>
              </div>
              <div className="adm-settings-stat">
                <Timer size={16} aria-hidden />
                <span>{formatDuration(stats?.totalFocusSeconds ?? 0)}</span>
                <small>{stats?.totalSessions ?? 0} sessions · {stats?.totalTasksCompleted ?? 0} tasks</small>
              </div>
            </div>
            <ul className="adm-meta-list adm-meta-list--compact">
              <li>
                <span>DB file size</span>
                <strong>{formatBytes(db?.dbSizeBytes ?? 0)}</strong>
              </li>
              <li>
                <span>Next IDs</span>
                <code>
                  user #{db?.nextUserId} · shop #{db?.nextShopId} · chat #{db?.nextChatId}
                </code>
              </li>
            </ul>
            <div className="adm-settings-actions">
              <Link to="/admin/users" className="adm-btn adm-btn--sm">
                Manage users
              </Link>
              <Link to="/admin/magazine" className="adm-btn adm-btn--sm">
                Manage magazine
              </Link>
              <a href="/app" className="adm-btn adm-btn--sm adm-btn--ghost">
                Open Focus app
              </a>
            </div>
          </section>

          <section className="adm-settings-grid">
            <article className="adm-card adm-settings-card">
              <h2>
                <HardDrive size={18} aria-hidden /> Upload storage
              </h2>
              <ul className="adm-meta-list">
                <li>
                  <span>User avatars & backgrounds</span>
                  <strong>{up?.userFiles ?? 0} files</strong>
                </li>
                <li>
                  <span>Magazine assets</span>
                  <strong>{up?.shopFiles ?? 0} files</strong>
                </li>
                <li>
                  <span>Total disk usage</span>
                  <strong>{formatBytes(up?.totalBytes ?? 0)}</strong>
                </li>
              </ul>
              <p className="adm-muted adm-settings-hint">
                Removes images not linked to any user profile or shop item (safe cleanup).
              </p>
              <button
                type="button"
                className="adm-btn adm-btn--accent"
                disabled={cleanupBusy}
                onClick={() => void onCleanupUploads()}
              >
                <Zap size={14} aria-hidden />
                {cleanupBusy ? 'Cleaning…' : 'Clean orphan uploads'}
              </button>
            </article>

            <article className="adm-card adm-settings-card adm-settings-card--danger">
              <h2>
                <AlertCircle size={18} aria-hidden /> Danger zone
              </h2>
              <p className="adm-muted">
                Full database reset — deletes all users, shop, chat, and every uploaded image. Users
                must register again.
              </p>
              <button
                type="button"
                className="adm-btn adm-btn--danger"
                disabled={resetBusy}
                onClick={() => void onResetDatabase()}
              >
                {resetBusy ? 'Resetting…' : 'Reset entire database'}
              </button>
            </article>
          </section>
        </>
      ) : null}
    </div>
  )
}
