// Accept any RFC-ish email. We deliberately do NOT lock users to a specific
// domain — Gmail, Outlook, ProtonMail, custom domains all work.
const MAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

export function normalizeMail(raw) {
  return String(raw ?? '').trim().toLowerCase()
}

export function normalizeFullName(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ')
}

export function validateMail(raw) {
  const email = normalizeMail(raw)
  if (!email) return { ok: false, error: 'Email address is required.' }
  if (email.length > 254) return { ok: false, error: 'Email is too long.' }
  if (!MAIL_RE.test(email)) return { ok: false, error: 'Enter a valid email address.' }
  return { ok: true, email }
}

export function validateFullName(raw) {
  const name = normalizeFullName(raw)
  if (name.length < 2) return { ok: false, error: 'Full name is required (min 2 characters).' }
  if (name.length > 80) return { ok: false, error: 'Full name is too long.' }
  return { ok: true, name }
}

export function validatePassword(raw) {
  const password = String(raw ?? '')
  if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
  if (password.length > 128) return { ok: false, error: 'Password is too long.' }
  return { ok: true, password }
}

export function isValidDateKey(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
}
