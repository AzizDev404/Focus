const MAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

export function normalizeMail(raw: string) {
  return raw.trim().toLowerCase()
}

export function validateMail(raw: string): { ok: true; email: string } | { ok: false; error: string } {
  const email = normalizeMail(raw)
  if (!email) return { ok: false, error: 'Email address is required.' }
  if (email.length > 254) return { ok: false, error: 'Email is too long.' }
  if (!MAIL_RE.test(email)) return { ok: false, error: 'Enter a valid email address.' }
  return { ok: true, email }
}

export function validateFullName(raw: string): { ok: true; name: string } | { ok: false; error: string } {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (name.length < 2) return { ok: false, error: 'Enter your full name.' }
  if (name.length > 80) return { ok: false, error: 'Name is too long.' }
  return { ok: true, name }
}

export function validatePassword(raw: string): { ok: true; password: string } | { ok: false; error: string } {
  if (raw.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
  if (raw.length > 128) return { ok: false, error: 'Password is too long.' }
  return { ok: true, password: raw }
}
