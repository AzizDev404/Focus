import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import {
  createUser,
  findOrLinkGoogleUser,
  findPendingByEmail,
  findUserByEmail,
  findUserById,
  requestPasswordReset,
  resetPasswordWithCode,
  setPendingVerification,
  updateUserLogin,
  verifyPendingCode,
} from '../db.js'
import { publicProfile } from '../lib/publicProfile.js'
import {
  validateFullName,
  validateMail,
  validatePassword,
} from '../validators/mail.js'
import { otpTemplate, sendMail } from '../lib/mailer.js'
import { signUserToken, userMiddleware } from '../auth.js'
import { config } from '../config.js'

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function dispatchOtp(user, code) {
  const tpl = otpTemplate({ code, displayName: user.displayName })
  const result = await sendMail({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text })
  if (!result.delivered && !result.dev) {
    const err = new Error(result.error || 'Could not send email')
    err.code = 'MAIL_FAILED'
    throw err
  }
  return result
}

export function createAuthRouter({ jwtSecret }) {
  const router = Router()
  const googleClient = config.googleClientId
    ? new OAuth2Client(config.googleClientId)
    : null

  router.post('/register', async (req, res) => {
    const nameCheck = validateFullName(req.body?.name ?? req.body?.displayName)
    if (!nameCheck.ok) {
      res.status(400).json({ error: nameCheck.error })
      return
    }
    const mailCheck = validateMail(req.body?.email)
    if (!mailCheck.ok) {
      res.status(400).json({ error: mailCheck.error })
      return
    }
    const passCheck = validatePassword(req.body?.password)
    if (!passCheck.ok) {
      res.status(400).json({ error: passCheck.error })
      return
    }

    const passwordHash = await bcrypt.hash(passCheck.password, 10)
    const result = createUser({
      email: mailCheck.email,
      passwordHash,
      displayName: nameCheck.name,
      emailVerified: !config.requireEmailVerification,
    })

    if (result.error === 'EMAIL_TAKEN') {
      res.status(409).json({ error: 'This email is already in use.' })
      return
    }

    if (config.requireEmailVerification) {
      const code = generateOtp()
      await setPendingVerification(result.user.id, code)
      try {
        await dispatchOtp(result.user, code)
      } catch (err) {
        console.error('[auth/register] OTP mail failed:', err.message)
        res.status(503).json({
          error: 'Could not send verification email. Check SMTP settings or try again.',
        })
        return
      }
      res.status(202).json({
        status: 'verification_required',
        email: result.user.email,
        message: `We sent a 6-digit code to ${result.user.email}. Enter it to finish creating your account.`,
      })
      return
    }

    const token = signUserToken(result.user, jwtSecret)
    res.status(201).json({ token, user: publicProfile(result.user) })
  })

  router.post('/verify-email', async (req, res) => {
    const mailCheck = validateMail(req.body?.email)
    if (!mailCheck.ok) {
      res.status(400).json({ error: mailCheck.error })
      return
    }
    const code = String(req.body?.code ?? '').trim()
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({ error: 'Enter the 6-digit code from your email.' })
      return
    }

    const result = await verifyPendingCode(mailCheck.email, code)
    if (result.error === 'NOT_FOUND') {
      res.status(404).json({ error: 'No account found for that email.' })
      return
    }
    if (result.error === 'ALREADY_VERIFIED') {
      res.status(409).json({
        status: 'already_verified',
        email: mailCheck.email,
        error: 'Email already verified. Sign in with your password.',
      })
      return
    }
    if (result.error === 'NO_PENDING' || result.error === 'EXPIRED') {
      const user = findPendingByEmail(mailCheck.email)
      if (user && !user.emailVerified) {
        const freshCode = generateOtp()
        await setPendingVerification(user.id, freshCode)
        try {
          await dispatchOtp(user, freshCode)
          res.status(400).json({
            status: 'resent',
            email: user.email,
            error: 'Previous code expired. We sent a new 6-digit code to your email.',
          })
        } catch (err) {
          console.error('[auth/verify-email] resend failed:', err.message)
          res.status(503).json({ error: 'Could not send a new code. Try Resend.' })
        }
        return
      }
      res.status(400).json({
        error: result.error === 'EXPIRED' ? 'Code expired. Request a new one.' : 'No verification pending. Request a new code.',
      })
      return
    }
    if (result.error === 'TOO_MANY_ATTEMPTS') {
      res.status(429).json({ error: 'Too many attempts. Request a new code.' })
      return
    }
    if (result.error === 'INVALID_CODE') {
      res.status(400).json({ error: 'Wrong code. Use the latest email — not a password-reset code.' })
      return
    }

    updateUserLogin(result.user.id)
    const token = signUserToken(result.user, jwtSecret)
    res.json({ token, user: publicProfile(result.user) })
  })

  router.post('/resend-otp', async (req, res) => {
    const mailCheck = validateMail(req.body?.email)
    if (!mailCheck.ok) {
      res.status(400).json({ error: mailCheck.error })
      return
    }
    const user = findPendingByEmail(mailCheck.email)
    if (!user) {
      res.json({ ok: true })
      return
    }
    if (user.emailVerified) {
      res.json({ ok: true, status: 'already_verified', email: user.email })
      return
    }
    const code = generateOtp()
    await setPendingVerification(user.id, code)
    try {
      await dispatchOtp(user, code)
    } catch (err) {
      console.error('[auth/resend-otp] mail failed:', err.message)
      res.status(503).json({ error: 'Could not send email. Try again shortly.' })
      return
    }
    res.json({ ok: true })
  })

  router.post('/login', async (req, res) => {
    const mailCheck = validateMail(req.body?.email ?? req.body?.address)
    if (!mailCheck.ok) {
      res.status(400).json({ error: mailCheck.error })
      return
    }
    const passCheck = validatePassword(req.body?.password)
    if (!passCheck.ok) {
      res.status(400).json({ error: passCheck.error })
      return
    }

    const user = findUserByEmail(mailCheck.email)
    if (!user) {
      res.status(401).json({ error: 'Wrong email or password.' })
      return
    }
    if (!user.passwordHash) {
      res.status(401).json({
        error: 'This account uses Google Sign-In. Continue with Google.',
      })
      return
    }
    if (!(await bcrypt.compare(passCheck.password, user.passwordHash))) {
      res.status(401).json({ error: 'Wrong email or password.' })
      return
    }
    if (user.emailVerified === false) {
      const code = generateOtp()
      await setPendingVerification(user.id, code)
      try {
        await dispatchOtp(user, code)
      } catch (err) {
        console.error('[auth/login] OTP mail failed:', err.message)
        res.status(503).json({
          error: 'Could not send verification email. Check SMTP settings or try again.',
        })
        return
      }
      res.status(403).json({
        status: 'verification_required',
        email: user.email,
        error: `Verify your email first. We sent a new code to ${user.email}.`,
      })
      return
    }

    updateUserLogin(user.id)
    const fresh = findUserById(user.id)
    const token = signUserToken(fresh, jwtSecret)
    res.json({ token, user: publicProfile(fresh) })
  })

  router.post('/google', async (req, res) => {
    if (!googleClient) {
      res.status(503).json({
        error: 'Google Sign-In is not configured on this server.',
      })
      return
    }
    const credential = String(req.body?.credential ?? '').trim()
    if (!credential) {
      res.status(400).json({ error: 'Missing Google credential.' })
      return
    }

    let payload
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: config.googleClientId,
      })
      payload = ticket.getPayload()
    } catch (err) {
      console.warn('[auth/google] verify failed:', err.message)
      res.status(401).json({ error: 'Could not verify Google identity.' })
      return
    }

    if (!payload?.email || !payload.sub) {
      res.status(400).json({ error: 'Google account is missing an email.' })
      return
    }
    if (payload.email_verified === false) {
      res.status(403).json({ error: 'Your Google email is not verified.' })
      return
    }

    const result = findOrLinkGoogleUser({
      email: payload.email,
      googleId: payload.sub,
      displayName: payload.name || payload.given_name || payload.email.split('@')[0],
      picture: payload.picture ?? null,
    })

    if (result.error) {
      res.status(400).json({ error: 'Could not sign you in with Google.' })
      return
    }

    updateUserLogin(result.user.id)
    const fresh = findUserById(result.user.id)
    const token = signUserToken(fresh, jwtSecret)
    res.json({ token, user: publicProfile(fresh), created: Boolean(result.created) })
  })

  router.get('/me', userMiddleware(jwtSecret), (req, res) => {
    const user = findUserById(req.auth.sub)
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }
    res.json({ user: publicProfile(user) })
  })

  router.get('/config', (_req, res) => {
    res.json({
      googleEnabled: Boolean(config.googleClientId),
      googleClientId: config.googleClientId || null,
      requireEmailVerification: config.requireEmailVerification,
      devMailMode: !config.smtp.host || !config.smtp.user,
    })
  })

  router.post('/forgot-password', async (req, res) => {
    const mailCheck = validateMail(req.body?.email)
    if (!mailCheck.ok) {
      res.status(400).json({ error: mailCheck.error })
      return
    }
    try {
      await requestPasswordReset(mailCheck.email, async ({ user, code }) => {
        const tpl = otpTemplate({ code, displayName: user.displayName })
        const result = await sendMail({
          to: user.email,
          subject: `Reset your ${config.appName} password — ${code}`,
          html: tpl.html.replace('Use this code to finish signing in', 'Use this code to reset your password'),
          text: tpl.text.replace('verification code', 'password reset code'),
        })
        if (!result.delivered && !result.dev) {
          throw new Error(result.error || 'Mail failed')
        }
      })
    } catch (err) {
      console.error('[auth/forgot-password]', err.message)
      res.status(503).json({ error: 'Could not send reset email. Try again shortly.' })
      return
    }
    res.json({
      message: 'If this account exists, a reset code was emailed to you.',
    })
  })

  router.post('/reset-password', async (req, res) => {
    const mailCheck = validateMail(req.body?.email)
    if (!mailCheck.ok) {
      res.status(400).json({ error: mailCheck.error })
      return
    }
    const passCheck = validatePassword(req.body?.password)
    if (!passCheck.ok) {
      res.status(400).json({ error: passCheck.error })
      return
    }
    const code = String(req.body?.code ?? '').trim()
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({ error: 'Enter the 6-digit code from your email.' })
      return
    }

    const passwordHash = await bcrypt.hash(passCheck.password, 10)
    const result = await resetPasswordWithCode(mailCheck.email, code, passwordHash)
    if (result.error === 'EXPIRED') {
      res.status(400).json({ error: 'This code expired. Request a new reset.' })
      return
    }
    if (result.error === 'INVALID_CODE') {
      res.status(400).json({ error: 'Wrong code. Check your email.' })
      return
    }

    res.json({ message: 'Password updated. You can sign in now.' })
  })

  return router
}
