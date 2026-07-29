import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from '../icons'
import { apiGet, apiPost, ApiError } from '../../lib/api'
import { loadGoogleIdentity } from '../../lib/auth/googleSignIn'
import type { AuthConfig, AuthModalTab, UserProfile } from '../../lib/auth/types'
import { completeAuthSuccess } from '../../lib/establishSession'
import { validateFullName, validateMail, validatePassword } from '../../lib/auth/validation'
import { useFlocusStore } from '../../store/useFlocusStore'
import { AuthInput, PasswordInput } from './AuthField'

const SAVED_MAIL_KEY = 'tsukiyomi-saved-mail'

type AuthView = 'login' | 'register' | 'verify' | 'forgot' | 'reset' | 'success'

type Props = {
  initialTab?: AuthModalTab
  onSuccess?: () => void
}

type AuthSuccess = { token: string; user: UserProfile }

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.16 },
}

export function AccountAuthPanel({ initialTab = 'login', onSuccess }: Props) {
  const accent = useFlocusStore((s) => s.settings.accentColor) || '#7432FF'

  const initialView: AuthView =
    initialTab === 'verify' ? 'verify' : initialTab === 'reset' ? 'reset' : (initialTab as AuthView)

  const [view, setView] = useState<AuthView>(initialView)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [successName, setSuccessName] = useState('')
  const [config, setConfig] = useState<AuthConfig | null>(null)
  const googleHostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_MAIL_KEY)
      if (saved) setEmail(saved)
    } catch {
      /* */
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    apiGet<AuthConfig>('/api/auth/config')
      .then((cfg) => {
        if (!cancelled) setConfig(cfg)
      })
      .catch(() => {
        if (!cancelled) setConfig({ googleEnabled: false, googleClientId: null, requireEmailVerification: false, devMailMode: false })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const go = useCallback((next: AuthView) => {
    setView(next)
    setError('')
    if (['forgot', 'verify', 'reset'].includes(next)) setPassword('')
    if (next === 'login' || next === 'register') {
      setCode('')
      setInfo('')
    }
  }, [])

  const finish = useCallback(
    (token: string, profile: UserProfile) => {
      if (!token?.trim()) {
        setError('Server did not return a session token. Try again.')
        return
      }
      try {
        localStorage.setItem(SAVED_MAIL_KEY, profile.email)
      } catch {
        /* */
      }
      setSuccessName(profile.displayName || profile.email.split('@')[0])
      setView('success')
      completeAuthSuccess(token, profile)
      onSuccess?.()
    },
    [onSuccess],
  )

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setError('')
      setBusy(true)
      try {
        const data = await apiPost<AuthSuccess>('/api/auth/google', { credential })
        finish(data.token, data.user)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Google sign-in failed.')
      } finally {
        setBusy(false)
      }
    },
    [finish],
  )

  useEffect(() => {
    if (!config?.googleEnabled || !config.googleClientId) return
    if (view !== 'login' && view !== 'register') return

    let cancelled = false
    loadGoogleIdentity()
      .then(() => {
        if (cancelled) return
        const id = window.google?.accounts?.id
        if (!id || !googleHostRef.current) return
        id.initialize({
          client_id: config.googleClientId!,
          callback: (resp) => {
            if (resp?.credential) void handleGoogleCredential(resp.credential)
          },
          ux_mode: 'popup',
          context: view === 'register' ? 'signup' : 'signin',
          auto_select: false,
        })
        googleHostRef.current.innerHTML = ''
        id.renderButton(googleHostRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: view === 'register' ? 'signup_with' : 'continue_with',
          shape: 'pill',
          width: 300,
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [config, view, handleGoogleCredential])

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const nameCheck = validateFullName(name)
    if (!nameCheck.ok) return setError(nameCheck.error)
    const mailCheck = validateMail(email)
    if (!mailCheck.ok) return setError(mailCheck.error)
    const passCheck = validatePassword(password.trim())
    if (!passCheck.ok) return setError(passCheck.error)

    setBusy(true)
    try {
      const data = await apiPost<AuthSuccess & { status?: string; message?: string }>(
        '/api/auth/register',
        { name: nameCheck.name, email: mailCheck.email, password: passCheck.password },
      )
      if (data.status === 'verification_required') {
        setEmail(mailCheck.email)
        setInfo(data.message ?? `Code sent to ${mailCheck.email}`)
        go('verify')
        return
      }
      if (data.token && data.user) finish(data.token, data.user)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setInfo(`Enter the code sent to ${mailCheck.email}`)
        go('verify')
        return
      }
      setError(err instanceof ApiError ? err.message : 'Could not create account.')
    } finally {
      setBusy(false)
    }
  }

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const mailCheck = validateMail(email)
    if (!mailCheck.ok) return setError(mailCheck.error)
    const passCheck = validatePassword(password.trim())
    if (!passCheck.ok) return setError(passCheck.error)

    setBusy(true)
    try {
      const data = await apiPost<AuthSuccess>('/api/auth/login', {
        email: mailCheck.email,
        password: passCheck.password,
      })
      finish(data.token, data.user)
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as { status?: string; email?: string }
        if (err.status === 403 && data.status === 'verification_required') {
          setEmail(data.email ?? mailCheck.email)
          setInfo(err.message)
          go('verify')
          return
        }
        setError(err.message)
      } else {
        setError('Could not sign in.')
      }
    } finally {
      setBusy(false)
    }
  }

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const mailCheck = validateMail(email)
    if (!mailCheck.ok) return setError(mailCheck.error)
    const digits = code.trim()
    if (!/^\d{6}$/.test(digits)) return setError('Enter the 6-digit code.')

    setBusy(true)
    try {
      const data = await apiPost<AuthSuccess>('/api/auth/verify-email', {
        email: mailCheck.email,
        code: digits,
      })
      finish(data.token, data.user)
    } catch (err) {
      if (err instanceof ApiError) {
        const status = (err.data as { status?: string })?.status
        if (status === 'already_verified') {
          setInfo('Already verified — sign in with your password.')
          go('login')
          return
        }
        if (status === 'resent') {
          setInfo(err.message)
          return
        }
        setError(err.message)
      } else {
        setError('Verification failed.')
      }
    } finally {
      setBusy(false)
    }
  }

  const onResend = async () => {
    setError('')
    const mailCheck = validateMail(email)
    if (!mailCheck.ok) return setError(mailCheck.error)
    setBusy(true)
    try {
      const data = await apiPost<{ ok: boolean; status?: string }>('/api/auth/resend-otp', {
        email: mailCheck.email,
      })
      if (data.status === 'already_verified') {
        setInfo('Already verified — sign in with password.')
        go('login')
        return
      }
      setInfo(`New code sent to ${mailCheck.email}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend.')
    } finally {
      setBusy(false)
    }
  }

  const onForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const mailCheck = validateMail(email)
    if (!mailCheck.ok) return setError(mailCheck.error)
    setBusy(true)
    try {
      await apiPost('/api/auth/forgot-password', { email: mailCheck.email })
      setInfo(`Reset code sent to ${mailCheck.email}`)
      go('reset')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send email.')
    } finally {
      setBusy(false)
    }
  }

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const mailCheck = validateMail(email)
    if (!mailCheck.ok) return setError(mailCheck.error)
    const passCheck = validatePassword(password.trim())
    if (!passCheck.ok) return setError(passCheck.error)
    if (!/^\d{6}$/.test(code.trim())) return setError('Enter the 6-digit code.')

    setBusy(true)
    try {
      await apiPost('/api/auth/reset-password', {
        email: mailCheck.email,
        code: code.trim(),
        password: passCheck.password,
      })
      setPassword('')
      setCode('')
      setInfo('Password updated — sign in now.')
      go('login')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reset failed.')
    } finally {
      setBusy(false)
    }
  }

  const title =
    view === 'register'
      ? 'Create account'
      : view === 'login'
        ? 'Sign in'
        : view === 'verify'
          ? 'Verify email'
          : view === 'forgot'
            ? 'Reset password'
            : view === 'reset'
              ? 'New password'
              : 'Welcome'

  const subtitle =
    view === 'register'
      ? 'Save progress, coins & shop items.'
      : view === 'login'
        ? 'Sync your focus sessions.'
        : view === 'verify'
          ? info || `Enter the code sent to ${email || 'your email'}.`
          : view === 'forgot'
            ? 'We email you a 6-digit code.'
            : view === 'reset'
              ? 'Code + new password.'
              : `Signed in as ${successName}`

  const showOAuth = config?.googleEnabled && (view === 'login' || view === 'register')
  const showTabs = view === 'login' || view === 'register'

  return (
    <div className="account-auth account-auth--modern" style={{ '--auth-accent': accent } as React.CSSProperties}>
      {view !== 'success' && (
        <header className="account-auth-head">
          <h2 className="account-auth-title">{title}</h2>
          <p className="account-auth-sub">{subtitle}</p>
        </header>
      )}

      {showTabs && (
        <div className="account-auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'login'}
            className={`account-auth-tab${view === 'login' ? ' is-active' : ''}`}
            onClick={() => go('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'register'}
            className={`account-auth-tab${view === 'register' ? ' is-active' : ''}`}
            onClick={() => go('register')}
          >
            Sign up
          </button>
        </div>
      )}

      {showOAuth && (
        <div className="account-auth-oauth">
          <div ref={googleHostRef} className="account-auth-google" />
        </div>
      )}

      {error ? <p className="account-auth-banner account-auth-banner--error">{error}</p> : null}
      {info && view !== 'verify' ? (
        <p className="account-auth-banner account-auth-banner--info">{info}</p>
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        {view === 'success' && (
          <motion.div key="success" className="account-auth-success" {...fade}>
            <div className="account-auth-success-icon">
              <Check size={28} strokeWidth={2.5} />
            </div>
            <h3>You're in!</h3>
            <p>{successName} · profile synced</p>
          </motion.div>
        )}

        {view === 'login' && (
          <motion.form key="login" className="account-auth-form" onSubmit={onLogin} noValidate {...fade}>
            <AuthInput
              id="loginEmail"
              type="email"
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
            <PasswordInput
              id="loginPass"
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button type="submit" className="account-auth-submit" disabled={busy}>
              {busy ? '…' : 'Sign in'}
            </button>
            <div className="account-auth-foot">
              <button type="button" onClick={() => go('forgot')}>
                Forgot password
              </button>
              <button type="button" onClick={() => go('verify')}>
                Have a code?
              </button>
            </div>
          </motion.form>
        )}

        {view === 'register' && (
          <motion.form key="register" className="account-auth-form" onSubmit={onRegister} noValidate {...fade}>
            <AuthInput
              id="accountName"
              placeholder="Your name"
              aria-label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
            <AuthInput
              id="accountEmail"
              type="email"
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <PasswordInput
              id="accountPass"
              placeholder="Password (6+ chars)"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button type="submit" className="account-auth-submit" disabled={busy}>
              {busy ? '…' : 'Create account'}
            </button>
          </motion.form>
        )}

        {view === 'verify' && (
          <motion.form key="verify" className="account-auth-form" onSubmit={onVerify} noValidate {...fade}>
            {config?.devMailMode ? (
              <p className="account-auth-dev-hint">Dev mode: check API terminal for the code if email is slow.</p>
            ) : null}
            <AuthInput
              id="verifyEmail"
              type="email"
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <AuthInput
              id="verifyCode"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="000000"
              aria-label="Verification code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoComplete="one-time-code"
              className="account-auth-input--otp"
              required
            />
            <button type="submit" className="account-auth-submit" disabled={busy}>
              {busy ? '…' : 'Verify'}
            </button>
            <div className="account-auth-foot account-auth-foot--center">
              <button type="button" onClick={() => void onResend()} disabled={busy}>
                Resend code
              </button>
              <button type="button" onClick={() => go('login')}>
                Back
              </button>
            </div>
          </motion.form>
        )}

        {view === 'forgot' && (
          <motion.form key="forgot" className="account-auth-form" onSubmit={onForgot} noValidate {...fade}>
            <AuthInput
              id="forgotEmail"
              type="email"
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <button type="submit" className="account-auth-submit" disabled={busy}>
              {busy ? '…' : 'Send code'}
            </button>
            <div className="account-auth-foot account-auth-foot--center">
              <button type="button" onClick={() => go('login')}>
                Back
              </button>
            </div>
          </motion.form>
        )}

        {view === 'reset' && (
          <motion.form key="reset" className="account-auth-form" onSubmit={onReset} noValidate {...fade}>
            <AuthInput
              id="resetCode"
              inputMode="numeric"
              maxLength={6}
              placeholder="Reset code"
              aria-label="Reset code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="account-auth-input--otp"
              required
            />
            <PasswordInput
              id="resetPass"
              placeholder="New password"
              aria-label="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button type="submit" className="account-auth-submit" disabled={busy}>
              {busy ? '…' : 'Update password'}
            </button>
            <div className="account-auth-foot account-auth-foot--center">
              <button type="button" onClick={() => go('login')}>
                Back to sign in
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AuthModal() {
  const open = useFlocusStore((s) => s.authModalOpen)
  const tab = useFlocusStore((s) => s.authModalTab)
  const setAuthModalOpen = useFlocusStore((s) => s.setAuthModalOpen)
  const accent = useFlocusStore((s) => s.settings.accentColor) || '#7432FF'

  if (!open) return null

  return (
    <div
      className="auth-modal-backdrop"
      onClick={() => setAuthModalOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setAuthModalOpen(false)}
      role="presentation"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        className="auth-modal-card auth-modal-card--modern"
        style={{ '--auth-accent': accent } as React.CSSProperties}
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="auth-modal-close" aria-label="Close" onClick={() => setAuthModalOpen(false)}>
          ×
        </button>
        <AccountAuthPanel initialTab={tab} />
      </motion.div>
    </div>
  )
}
