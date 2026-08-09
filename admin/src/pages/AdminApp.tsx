import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { adminLogin } from '../lib/adminApi'
import { setAdminToken, useAdminToken } from '../lib/authStorage'
import {
  establishAdminSession,
  logoutAdmin,
  validateAdminSession,
} from '../lib/establishAdminSession'
import { AdminLayout } from './AdminLayout'
import { AdminDashboard } from './AdminDashboard'
import { AdminUsersPage } from './AdminUsersPage'
import { AdminAchievementsPage } from './AdminAchievementsPage'
import { AdminMagazinePage } from './AdminMagazinePage'
import { AdminSettingsPage } from './AdminSettingsPage'
import { Shield, Sparkles } from '../components/icons'
import { AdminTextInput } from '../components/admin/ui/AdminTextInput'
import { FOCUS_APP_URL } from '../lib/appLinks'
import '../styles/admin.css'
import '../styles/admin-radix.css'

type LoginProps = {
  onSuccess: (token: string, username: string) => void
}

function AdminLogin({ onSuccess }: LoginProps) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = await adminLogin(username.trim(), password)
      if (!establishAdminSession(data.token, data.username)) {
        setError('Could not save admin session.')
        return
      }
      onSuccess(data.token, data.username)
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      if (msg.includes('fetch') || msg.includes('Failed') || msg.includes('Cannot reach')) {
        setError('API server is not running. Run: npm run dev')
      } else {
        setError(msg === 'Invalid admin credentials.' ? 'Wrong username or password.' : msg)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="adm-login-page">
      <div className="adm-login-visual" aria-hidden>
        <div className="adm-login-glow" />
        <div className="adm-login-brand-large">
          <span className="adm-login-mark">月</span>
          <h2>Focus Admin</h2>
          <p>Users · Magazine · Analytics</p>
        </div>
      </div>
      <div className="adm-login-panel">
        <div className="adm-login-card">
          <div className="adm-login-card-head">
            <Shield size={22} strokeWidth={1.5} className="adm-login-icon" aria-hidden />
            <div>
              <p className="adm-eyebrow">Tsukiyomi</p>
              <h1>Sign in</h1>
            </div>
          </div>
          <p className="adm-muted">Use your admin credentials to access the console.</p>
          {import.meta.env.DEV ? (
            <p className="adm-login-hint">
              Dev login: <strong>admin</strong> / <strong>admin123</strong> — open{' '}
              <a href="/login">/login</a>
            </p>
          ) : null}
          <form className="adm-form adm-form--login" onSubmit={onSubmit}>
            <label>
              Username
              <AdminTextInput
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="admin"
                required
              />
            </label>
            <label>
              Password
              <AdminTextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Password"
                required
              />
            </label>
            {error ? (
              <p className="adm-banner adm-banner--error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="adm-btn adm-btn--primary adm-btn--lg" disabled={busy}>
              <Sparkles size={16} aria-hidden />
              {busy ? 'Signing in…' : 'Enter admin panel'}

            </button>
          </form>
          <a href={FOCUS_APP_URL} className="adm-link-back">
            ← Back to Focus app
          </a>
        </div>
      </div>
    </div>
  )
}

export function AdminApp() {
  const storedToken = useAdminToken()
  const [token, setToken] = useState<string | null>(() => storedToken?.trim() || null)
  const [booting, setBooting] = useState(() => Boolean(storedToken?.trim()))

  useEffect(() => {
    const next = storedToken?.trim() || null
    setToken(next)
  }, [storedToken])

  useEffect(() => {
    if (!booting) return
    let cancelled = false
    void validateAdminSession().then((valid) => {
      if (cancelled) return
      setToken(valid)
      setBooting(false)
    })
    return () => {
      cancelled = true
    }
  }, [booting])

  const logout = useCallback(() => {
    logoutAdmin()
    setToken(null)
    setBooting(false)
  }, [])

  const onLoginSuccess = useCallback((t: string, username: string) => {
    setAdminToken(t, username)
    setToken(t.trim())
    setBooting(false)
  }, [])

  if (booting) {
    return (
      <div className="adm-login-page adm-login-page--boot">
        <p className="adm-muted">Checking admin session…</p>
      </div>
    )
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<AdminLogin onSuccess={onLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <AdminLayout onLogout={logout}>
      <Routes>
        <Route index element={<AdminDashboard token={token} />} />
        <Route path="users" element={<AdminUsersPage token={token} />} />
        <Route path="magazine" element={<AdminMagazinePage token={token} />} />
        <Route path="achievements" element={<AdminAchievementsPage token={token} />} />
        <Route path="settings" element={<AdminSettingsPage token={token} onSessionExpired={logout} />} />
        <Route path="login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminLayout>
  )
}
