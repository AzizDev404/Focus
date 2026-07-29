import nodemailer from 'nodemailer'
import { config } from '../config.js'

let transporter = null

function buildTransporter() {
  if (!config.smtp.host || !config.smtp.user) return null
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
    tls: {
      minVersion: 'TLSv1.2',
    },
  })
}

export function resetMailTransporter() {
  transporter = null
}

function getTransporter() {
  if (transporter === null) transporter = buildTransporter()
  return transporter
}

/**
 * Sends an email. If no SMTP credentials are configured the message is
 * logged to the API console — useful in development so OTP codes are still
 * easy to read.
 */
export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter()
  const safeText = text ?? html?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ?? ''

  if (!t) {
    console.log('\n────────── MAIL (dev / no SMTP) ──────────')
    console.log('To:     ', to)
    console.log('Subject:', subject)
    console.log('Body:   ', safeText)
    console.log('──────────────────────────────────────────\n')
    return { delivered: false, dev: true }
  }

  try {
    const info = await t.sendMail({
      from: config.mailFrom,
      to,
      subject,
      text: safeText,
      html,
    })
    return { delivered: true, messageId: info.messageId }
  } catch (err) {
    console.error('[mailer] Failed to send mail:', err.message)
    if (!config.isProd) {
      console.log('To:', to, 'Subject:', subject, '\nBody:', safeText)
    }
    return { delivered: false, error: err.message }
  }
}

const BRAND_COLOR = '#7432FF'

export function otpTemplate({ code, displayName }) {
  const greeting = displayName ? `Hey ${displayName},` : 'Hey,'
  const subject = `${config.appName} — your verification code is ${code}`
  const text = `${greeting}\n\nYour verification code is ${code}. It expires in 15 minutes.\n\nIf you didn't request this, you can ignore this email.\n\n— ${config.appName}`
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#0c0c12;color:#f4f4f5;font-family:Inter,system-ui,sans-serif;">
    <div style="max-width:420px;margin:0 auto;background:#15171c;border:1px solid rgba(255,255,255,.06);border-radius:14px;overflow:hidden;">
      <div style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,.05);">
        <strong style="font-size:18px;letter-spacing:-0.01em;">${config.appName}</strong>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 8px;color:#cbd5e1;">${greeting}</p>
        <p style="margin:0 0 24px;color:#cbd5e1;">Use this code to finish signing in:</p>
        <div style="font-family:ui-monospace,monospace;font-size:28px;letter-spacing:.4em;font-weight:700;color:${BRAND_COLOR};text-align:center;padding:14px;border-radius:10px;background:rgba(116,50,255,.12);border:1px solid rgba(116,50,255,.3);">${code}</div>
        <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;">The code expires in 15 minutes. If you didn’t request this, you can safely ignore it.</p>
      </div>
    </div>
    <p style="text-align:center;margin-top:18px;color:#52525b;font-size:12px;">© ${new Date().getFullYear()} ${config.appName}</p>
  </body>
</html>`
  return { subject, text, html }
}
