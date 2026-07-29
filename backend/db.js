import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { clearAllUploads } from './lib/uploads.js'
import { evaluateAchievements } from './lib/achievements.js'
import {
  isValidAchievementId,
  normalizeAchievementDef,
} from './lib/achievementCatalog.js'
import { coinRewardForLevelUp, levelFromXp, xpProgress } from './lib/levels.js'
import { defaultEquipped, normalizeProfile, resolvedLevel } from './lib/publicProfile.js'
import { normalizeMail } from './validators/mail.js'
import { isShopEventLive, serializeShopEvent, slugifyEventTitle } from './lib/shopEvents.js'
import { sanitizeChatHtml } from './lib/sanitizeHtml.js'
import { normalizeNotepadDaily, normalizeUserTasks, workspacePayload } from './lib/workspace.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'data', 'db.json')

const emptyDb = () => ({
  users: [],
  shopItems: [],
  shopEvents: [],
  achievementDefs: [],
  chatMessages: [],
  follows: [],
  dmMessages: [],
  nextId: 1,
  nextShopId: 1,
  nextEventId: 1,
  nextChatId: 1,
  nextDmId: 1,
})

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) return emptyDb()
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    const data = JSON.parse(raw)
    if (!Array.isArray(data.users)) return emptyDb()
    const db = {
      users: data.users,
      shopItems: Array.isArray(data.shopItems) ? data.shopItems : [],
      shopEvents: Array.isArray(data.shopEvents) ? data.shopEvents : [],
      achievementDefs: Array.isArray(data.achievementDefs) ? data.achievementDefs : [],
      chatMessages: Array.isArray(data.chatMessages) ? data.chatMessages : [],
      follows: Array.isArray(data.follows) ? data.follows : [],
      dmMessages: Array.isArray(data.dmMessages) ? data.dmMessages : [],
      nextId: Number.isFinite(data.nextId) ? data.nextId : 1,
      nextShopId: Number.isFinite(data.nextShopId) ? data.nextShopId : 1,
      nextEventId: Number.isFinite(data.nextEventId) ? data.nextEventId : 1,
      nextChatId: Number.isFinite(data.nextChatId) ? data.nextChatId : 1,
      nextDmId: Number.isFinite(data.nextDmId) ? data.nextDmId : 1,
    }
    for (const item of db.shopItems) normalizeShopItemRecord(item)
    for (const u of db.users) normalizeProfile(u)
    return db
  } catch {
    return emptyDb()
  }
}

export async function resetDatabase() {
  const clean = emptyDb()
  writeDb(clean)
  await clearAllUploads()
  return clean
}

function writeDb(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8')
}

function userEmail(user) {
  return normalizeMail(user.email ?? user.address ?? '')
}

function applyXpAndLevel(user) {
  const prevLevel = user.level ?? 1
  user.level = levelFromXp(user.xp ?? 0)
  if (user.level > prevLevel) {
    for (let lv = prevLevel + 1; lv <= user.level; lv += 1) {
      user.coins = (user.coins ?? 0) + coinRewardForLevelUp(lv)
    }
  }
}

export function findUserByEmail(email) {
  const db = readDb()
  const target = normalizeMail(email)
  if (!target) return null
  const user = db.users.find((u) => userEmail(u) === target) ?? null
  return user ? normalizeProfile(user) : null
}

/** @deprecated use findUserByEmail */
export function findUserByAddress(address) {
  return findUserByEmail(address)
}

export function findUserById(id) {
  const db = readDb()
  const user = db.users.find((u) => u.id === id) ?? null
  return user ? normalizeProfile(user) : null
}

export function updateUserById(id, mutator) {
  const db = readDb()
  const user = db.users.find((u) => u.id === id)
  if (!user) return null
  normalizeProfile(user)
  mutator(user)
  applyXpAndLevel(user)
  evaluateAchievements(user)
  applyXpAndLevel(user)
  writeDb(db)
  return user
}

export function createUser({
  email,
  passwordHash,
  displayName,
  emailVerified = false,
  googleId = null,
}) {
  const db = readDb()
  const normalizedEmail = normalizeMail(email)
  if (!normalizedEmail) return { error: 'INVALID_EMAIL' }
  if (db.users.some((u) => userEmail(u) === normalizedEmail)) {
    return { error: 'EMAIL_TAKEN' }
  }

  const user = {
    id: db.nextId++,
    email: normalizedEmail,
    address: normalizedEmail,
    passwordHash: passwordHash ?? null,
    displayName: displayName || normalizedEmail,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
    statsHistory: {},
    coins: 0,
    xp: 0,
    level: 1,
    achievements: [],
    inventory: [],
    equipped: defaultEquipped(),
    emailVerified: Boolean(emailVerified),
    googleId,
    pendingVerification: null,
  }
  evaluateAchievements(user, { includeRegister: true })
  applyXpAndLevel(user)
  db.users.push(user)
  writeDb(db)
  return { user }
}

export function updateUserLogin(id) {
  const db = readDb()
  const user = db.users.find((u) => u.id === id)
  if (!user) return null
  user.lastLoginAt = new Date().toISOString()
  writeDb(db)
  return normalizeProfile(user)
}

export function findOrLinkGoogleUser({ email, googleId, displayName, picture }) {
  const db = readDb()
  const normalizedEmail = normalizeMail(email)
  if (!normalizedEmail) return { error: 'INVALID_EMAIL' }

  let user = db.users.find((u) => u.googleId === googleId)
  if (!user) {
    user = db.users.find((u) => userEmail(u) === normalizedEmail)
  }

  if (user) {
    normalizeProfile(user)
    user.googleId = googleId
    user.emailVerified = true
    user.pendingVerification = null
    if (displayName && !user.displayName) user.displayName = displayName
    if (picture && !user.media.avatarUrl) user.media.avatarUrl = picture
    writeDb(db)
    return { user, created: false }
  }

  const created = {
    id: db.nextId++,
    email: normalizedEmail,
    address: normalizedEmail,
    passwordHash: null,
    displayName: displayName || normalizedEmail.split('@')[0],
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
    statsHistory: {},
    coins: 0,
    xp: 0,
    level: 1,
    achievements: [],
    inventory: [],
    equipped: defaultEquipped(),
    emailVerified: true,
    googleId,
    pendingVerification: null,
    media: { avatarUrl: picture ?? null, backgroundUrl: null },
  }
  evaluateAchievements(created, { includeRegister: true })
  applyXpAndLevel(created)
  db.users.push(created)
  writeDb(db)
  return { user: created, created: true }
}

const RESET_TTL_MS = 15 * 60 * 1000
const OTP_TTL_MS = 15 * 60 * 1000

function resetCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function setPendingVerification(userId, code) {
  const db = readDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return null
  const codeHash = await bcrypt.hash(code, 10)
  user.pendingVerification = {
    codeHash,
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    attempts: 0,
  }
  writeDb(db)
  return user
}

export async function verifyPendingCode(email, code) {
  const db = readDb()
  const target = normalizeMail(email)
  const user = db.users.find((u) => userEmail(u) === target)
  if (!user) return { error: 'NOT_FOUND' }
  if (user.emailVerified) return { error: 'ALREADY_VERIFIED' }
  const pending = user.pendingVerification
  if (!pending) return { error: 'NO_PENDING' }

  if (new Date(pending.expiresAt).getTime() < Date.now()) {
    user.pendingVerification = null
    writeDb(db)
    return { error: 'EXPIRED' }
  }
  if ((pending.attempts ?? 0) >= 6) {
    user.pendingVerification = null
    writeDb(db)
    return { error: 'TOO_MANY_ATTEMPTS' }
  }

  const ok = await bcrypt.compare(String(code ?? ''), pending.codeHash)
  if (!ok) {
    pending.attempts = (pending.attempts ?? 0) + 1
    writeDb(db)
    return { error: 'INVALID_CODE' }
  }

  user.emailVerified = true
  user.pendingVerification = null
  writeDb(db)
  return { user: normalizeProfile(user) }
}

export function findPendingByEmail(email) {
  const db = readDb()
  const target = normalizeMail(email)
  const user = db.users.find((u) => userEmail(u) === target)
  if (!user) return null
  return user
}

export function listUserMail(userId) {
  const user = findUserById(userId)
  if (!user) return null
  return [...(user.mailbox ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function markMailRead(userId, mailId) {
  const db = readDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return null
  normalizeProfile(user)
  const mail = user.mailbox.find((m) => m.id === mailId)
  if (!mail) return { error: 'NOT_FOUND' }
  mail.read = true
  writeDb(db)
  return { mail }
}

export async function requestPasswordReset(email, deliver) {
  const db = readDb()
  const target = normalizeMail(email)
  if (!target) return { ok: true }

  const user = db.users.find((u) => userEmail(u) === target)
  if (!user) return { ok: true }

  normalizeProfile(user)
  const code = resetCode()
  const codeHash = await bcrypt.hash(code, 10)
  user.passwordReset = {
    codeHash,
    expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
  }

  user.mailbox.unshift({
    id: user.nextMailId++,
    type: 'password_reset',
    subject: 'Password reset',
    body: `Your reset code is ${code}. It expires in 15 minutes. Open Account on this device and enter the code to set a new password.`,
    read: false,
    createdAt: new Date().toISOString(),
  })

  writeDb(db)

  if (typeof deliver === 'function') {
    await deliver({ user, code })
  }

  return { ok: true }
}

export async function resetPasswordWithCode(email, code, passwordHash) {
  const db = readDb()
  const target = normalizeMail(email)
  if (!target) return { error: 'INVALID' }

  const user = db.users.find((u) => userEmail(u) === target)
  if (!user?.passwordReset) return { error: 'INVALID_CODE' }

  const { codeHash, expiresAt } = user.passwordReset
  if (new Date(expiresAt).getTime() < Date.now()) {
    user.passwordReset = null
    writeDb(db)
    return { error: 'EXPIRED' }
  }

  const ok = await bcrypt.compare(String(code ?? ''), codeHash)
  if (!ok) return { error: 'INVALID_CODE' }

  user.passwordHash = passwordHash
  user.passwordReset = null
  writeDb(db)
  return { user: normalizeProfile(user) }
}

function aggregateStats(statsHistory = {}) {
  let totalFocusSeconds = 0
  let totalBreakSeconds = 0
  let totalSessions = 0
  let totalTasksCompleted = 0
  for (const day of Object.values(statsHistory)) {
    totalFocusSeconds += Number(day?.focusSeconds ?? 0)
    totalBreakSeconds += Number(day?.breakSeconds ?? 0)
    totalSessions += Number(day?.sessions ?? 0)
    totalTasksCompleted += Number(day?.tasksCompleted ?? 0)
  }
  return { totalFocusSeconds, totalBreakSeconds, totalSessions, totalTasksCompleted }
}

export function listUsers() {
  const db = readDb()
  return db.users
    .map((u) => {
      normalizeProfile(u)
      const email = userEmail(u)
      const stats = aggregateStats(u.statsHistory)
      return {
        id: u.id,
        email,
        displayName: u.displayName,
        coins: u.coins,
        level: u.level,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        ...stats,
      }
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function listLeaderboard(limit = 50, sort = 'level') {
  const compare =
    sort === 'focus'
      ? (a, b) => {
          if ((b.totalFocusSeconds ?? 0) !== (a.totalFocusSeconds ?? 0)) {
            return (b.totalFocusSeconds ?? 0) - (a.totalFocusSeconds ?? 0)
          }
          if (b.level !== a.level) return b.level - a.level
          return (b.coins ?? 0) - (a.coins ?? 0)
        }
      : sort === 'coins'
        ? (a, b) => {
            if ((b.coins ?? 0) !== (a.coins ?? 0)) return (b.coins ?? 0) - (a.coins ?? 0)
            if (b.level !== a.level) return b.level - a.level
            return (b.totalFocusSeconds ?? 0) - (a.totalFocusSeconds ?? 0)
          }
        : (a, b) => {
            if (b.level !== a.level) return b.level - a.level
            if ((b.totalFocusSeconds ?? 0) !== (a.totalFocusSeconds ?? 0)) {
              return (b.totalFocusSeconds ?? 0) - (a.totalFocusSeconds ?? 0)
            }
            return (b.coins ?? 0) - (a.coins ?? 0)
          }

  const db = readDb()
  return db.users
    .map((u) => {
      normalizeProfile(u)
      const stats = aggregateStats(u.statsHistory)
      const level = resolvedLevel(u)
      const progress = xpProgress(u.xp ?? 0, level)
      return {
        id: u.id,
        displayName: u.displayName,
        level: progress.level,
        coins: u.coins ?? 0,
        totalFocusSeconds: stats.totalFocusSeconds,
        totalTasksCompleted: stats.totalTasksCompleted,
        xpProgress: progress.progress,
        xpToNext: progress.xpToNext,
        media: {
          avatarUrl: u.media?.avatarUrl ?? null,
          backgroundUrl: u.media?.backgroundUrl ?? null,
        },
        equipped: {
          background: u.equipped?.background ?? null,
          avatar: u.equipped?.avatar ?? null,
          frame: u.equipped?.frame ?? null,
          charm: u.equipped?.charm ?? null,
        },
      }
    })
    .sort(compare)
    .slice(0, Math.max(1, limit))
    .map((u, i) => ({ rank: i + 1, ...u }))
}

export function deleteUser(id) {
  const db = readDb()
  const before = db.users.length
  db.users = db.users.filter((u) => u.id !== id)
  if (db.users.length === before) return false
  writeDb(db)
  return true
}

function resolveInventoryItems(inventoryIds) {
  const db = readDb()
  return (inventoryIds ?? []).map((itemId) => {
    const item = db.shopItems.find((i) => i.id === itemId)
    if (!item) return { id: itemId, name: `Item #${itemId}`, type: 'unknown', preview: '', missing: true }
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      preview: item.preview,
      emoji: item.emoji,
      missing: false,
    }
  })
}

function sanitizeMailFields(subject, body) {
  const cleanSubject = String(subject ?? '').trim()
  const cleanBody = String(body ?? '').trim()
  if (!cleanSubject || !cleanBody) return { error: 'INVALID' }
  if (cleanSubject.length > 120) return { error: 'SUBJECT_TOO_LONG' }
  if (cleanBody.length > 2000) return { error: 'BODY_TOO_LONG' }
  return { subject: cleanSubject, body: cleanBody }
}

export function getAdminUserDetail(id) {
  const user = findUserById(id)
  if (!user) return null
  normalizeProfile(user)
  const stats = aggregateStats(user.statsHistory)
  const inventory = [...(user.inventory ?? [])]
  return {
    id: user.id,
    email: userEmail(user),
    displayName: user.displayName,
    coins: user.coins ?? 0,
    level: user.level ?? 1,
    xp: user.xp ?? 0,
    emailVerified: user.emailVerified !== false,
    googleId: user.googleId ?? null,
    inventory,
    inventoryItems: resolveInventoryItems(inventory),
    equipped: { ...user.equipped },
    media: { ...user.media },
    achievements: user.achievements ?? [],
    mailbox: (user.mailbox ?? []).slice(0, 50),
    statsHistory: user.statsHistory ?? {},
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    ...stats,
  }
}

export function updateAdminUser(id, payload) {
  const user = updateUserById(id, (u) => {
    if (payload.displayName != null) {
      const name = String(payload.displayName).trim()
      if (name.length >= 2 && name.length <= 80) u.displayName = name
    }
    if (payload.coins != null) {
      u.coins = Math.max(0, Math.floor(Number(payload.coins) || 0))
    }
    if (payload.level != null) {
      u.level = Math.max(1, Math.floor(Number(payload.level) || 1))
    }
    if (payload.xp != null) {
      u.xp = Math.max(0, Math.floor(Number(payload.xp) || 0))
    }
    if (payload.emailVerified != null) {
      u.emailVerified = Boolean(payload.emailVerified)
    }
  })
  if (!user) return { error: 'NOT_FOUND' }
  return { user: getAdminUserDetail(user.id) }
}

export function grantUserCoins(id, amount, note = '') {
  const delta = Math.floor(Number(amount))
  if (!Number.isFinite(delta) || delta === 0) return { error: 'INVALID_AMOUNT' }
  const user = updateUserById(id, (u) => {
    normalizeProfile(u)
    u.coins = Math.max(0, (u.coins ?? 0) + delta)
    const body =
      delta > 0
        ? `You received ${delta} coins.${note ? ` ${note}` : ''}`
        : `${Math.abs(delta)} coins were adjusted on your account.${note ? ` ${note}` : ''}`
    u.mailbox.unshift({
      id: u.nextMailId++,
      type: 'admin_grant',
      subject: delta > 0 ? 'Coins granted' : 'Coins adjusted',
      body,
      read: false,
      createdAt: new Date().toISOString(),
    })
  })
  if (!user) return { error: 'NOT_FOUND' }
  return { user: getAdminUserDetail(user.id), granted: delta }
}

export function sendUserMail(userId, { subject, body, type = 'admin_message' }) {
  const mail = sanitizeMailFields(subject, body)
  if (mail.error) return { error: mail.error }
  const user = updateUserById(userId, (u) => {
    normalizeProfile(u)
    u.mailbox.unshift({
      id: u.nextMailId++,
      type: String(type ?? 'admin_message').slice(0, 32),
      subject: mail.subject,
      body: mail.body,
      read: false,
      createdAt: new Date().toISOString(),
    })
    if (u.mailbox.length > 100) u.mailbox.length = 100
  })
  if (!user) return { error: 'NOT_FOUND' }
  return { user: getAdminUserDetail(user.id) }
}

export function grantShopItemToUser(userId, itemId, note = '') {
  const shopItem = findShopItem(itemId)
  if (!shopItem) return { error: 'ITEM_NOT_FOUND' }
  let alreadyOwned = false
  const user = updateUserById(userId, (u) => {
    normalizeProfile(u)
    if (u.inventory.includes(itemId)) {
      alreadyOwned = true
      return
    }
    u.inventory.push(itemId)
    const cleanNote = String(note ?? '').trim().slice(0, 500)
    u.mailbox.unshift({
      id: u.nextMailId++,
      type: 'admin_gift',
      subject: `Gift: ${shopItem.name}`,
      body:
        cleanNote ||
        `You received "${shopItem.name}" (${shopItem.type}) as a gift. Check your Magazine → Owned.`,
      read: false,
      createdAt: new Date().toISOString(),
    })
    if (u.mailbox.length > 100) u.mailbox.length = 100
  })
  if (!user) return { error: 'NOT_FOUND' }
  if (alreadyOwned) return { error: 'ALREADY_OWNED' }
  return { user: getAdminUserDetail(user.id), item: shopItem }
}

export function revokeShopItemFromUser(userId, itemId) {
  const user = updateUserById(userId, (u) => {
    normalizeProfile(u)
    const idx = u.inventory.indexOf(itemId)
    if (idx === -1) return
    u.inventory.splice(idx, 1)
    for (const slot of ['background', 'avatar', 'frame', 'charm']) {
      if (u.equipped[slot] === itemId) u.equipped[slot] = null
    }
  })
  if (!user) return { error: 'NOT_FOUND' }
  return { user: getAdminUserDetail(user.id) }
}

export function getAdminDashboardStats() {
  const db = readDb()
  let totalFocus = 0
  let totalSessions = 0
  let totalTasks = 0
  let totalCoins = 0
  for (const u of db.users) {
    normalizeProfile(u)
    totalCoins += u.coins ?? 0
    const s = aggregateStats(u.statsHistory)
    totalFocus += s.totalFocusSeconds
    totalSessions += s.totalSessions
    totalTasks += s.totalTasksCompleted
  }
  return {
    userCount: db.users.length,
    shopItemCount: db.shopItems.length,
    shopEnabledCount: db.shopItems.filter((i) => i.enabled !== false).length,
    totalCoins,
    totalFocusSeconds: totalFocus,
    totalSessions,
    totalTasksCompleted: totalTasks,
  }
}

export function getDatabaseSummary() {
  const db = readDb()
  let mailboxTotal = 0
  let verifiedUsers = 0
  let googleUsers = 0
  for (const u of db.users) {
    mailboxTotal += (u.mailbox ?? []).length
    if (u.emailVerified) verifiedUsers++
    if (u.googleId) googleUsers++
  }
  let dbSizeBytes = 0
  try {
    dbSizeBytes = fs.statSync(DB_PATH).size
  } catch {
    /* */
  }
  return {
    userCount: db.users.length,
    shopItemCount: db.shopItems.length,
    chatMessageCount: db.chatMessages.length,
    mailboxTotal,
    verifiedUsers,
    googleUsers,
    nextUserId: db.nextId,
    nextShopId: db.nextShopId,
    nextChatId: db.nextChatId,
    dbSizeBytes,
  }
}

function ensureStatsHistory(user) {
  if (!user.statsHistory) user.statsHistory = {}
  return user.statsHistory
}

function afterStatsUpdate(userId) {
  updateUserById(userId, () => {})
}

export function addFocusStats(userId, date, seconds) {
  const db = readDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return false
  const statsHistory = ensureStatsHistory(user)
  const current = statsHistory[date] ?? {
    focusSeconds: 0,
    breakSeconds: 0,
    sessions: 0,
    tasksCompleted: 0,
  }
  statsHistory[date] = {
    ...current,
    focusSeconds: current.focusSeconds + seconds,
    sessions: current.sessions + 1,
  }
  writeDb(db)
  afterStatsUpdate(userId)
  return true
}

export function addBreakStats(userId, date, seconds) {
  const db = readDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return false
  const statsHistory = ensureStatsHistory(user)
  const current = statsHistory[date] ?? {
    focusSeconds: 0,
    breakSeconds: 0,
    sessions: 0,
    tasksCompleted: 0,
  }
  statsHistory[date] = {
    ...current,
    breakSeconds: current.breakSeconds + seconds,
  }
  writeDb(db)
  return true
}

export function addTaskCompleteStats(userId, date) {
  const db = readDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return false
  const statsHistory = ensureStatsHistory(user)
  const current = statsHistory[date] ?? {
    focusSeconds: 0,
    breakSeconds: 0,
    sessions: 0,
    tasksCompleted: 0,
  }
  statsHistory[date] = {
    ...current,
    tasksCompleted: current.tasksCompleted + 1,
  }
  writeDb(db)
  afterStatsUpdate(userId)
  return true
}

// ——— Shop ———

function normalizeShopItemRecord(item) {
  if (!item || typeof item !== 'object') return item
  const eventId =
    item.eventId == null || item.eventId === '' ? null : Number(item.eventId)
  item.eventId = Number.isFinite(eventId) ? eventId : null
  if (item.eventId) item.isEvent = true
  return item
}

function findShopEventRecord(db, id) {
  return db.shopEvents.find((e) => e.id === id) ?? null
}

export function listShopEvents({ includeDisabled = false } = {}) {
  const db = readDb()
  const events = db.shopEvents
    .filter((e) => includeDisabled || e.enabled !== false)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return events.map((event) => {
    const itemCount = db.shopItems.filter((i) => i.eventId === event.id && i.enabled !== false).length
    return serializeShopEvent(event, itemCount)
  })
}

export function findShopEvent(id) {
  const db = readDb()
  const event = findShopEventRecord(db, id)
  if (!event) return null
  const itemCount = db.shopItems.filter((i) => i.eventId === event.id).length
  return serializeShopEvent(event, itemCount)
}

export function createShopEvent(payload) {
  const db = readDb()
  const title = String(payload.title ?? '').trim()
  if (!title || title.length > 80) return { error: 'INVALID_EVENT' }
  const slugRaw = String(payload.slug ?? '').trim() || slugifyEventTitle(title)
  const slug = slugRaw || `event_${db.nextEventId}`
  if (db.shopEvents.some((e) => e.slug === slug)) return { error: 'DUPLICATE_SLUG' }
  const description = String(payload.description ?? '').trim()
  if (description.length > 500) return { error: 'INVALID_EVENT' }
  const event = {
    id: db.nextEventId++,
    slug,
    title,
    description,
    startsAt: payload.startsAt ? String(payload.startsAt) : null,
    endsAt: payload.endsAt ? String(payload.endsAt) : null,
    enabled: payload.enabled !== false,
    createdAt: new Date().toISOString(),
  }
  db.shopEvents.push(event)
  writeDb(db)
  return { event: serializeShopEvent(event, 0) }
}

export function updateShopEvent(id, payload) {
  const db = readDb()
  const event = findShopEventRecord(db, id)
  if (!event) return { error: 'NOT_FOUND' }
  if (payload.title != null) {
    const title = String(payload.title).trim()
    if (!title || title.length > 80) return { error: 'INVALID_EVENT' }
    event.title = title
  }
  if (payload.slug != null) {
    const slug = String(payload.slug).trim() || slugifyEventTitle(event.title)
    if (db.shopEvents.some((e) => e.id !== id && e.slug === slug)) return { error: 'DUPLICATE_SLUG' }
    event.slug = slug
  }
  if (payload.description != null) {
    const description = String(payload.description).trim()
    if (description.length > 500) return { error: 'INVALID_EVENT' }
    event.description = description
  }
  if (payload.startsAt !== undefined) event.startsAt = payload.startsAt ? String(payload.startsAt) : null
  if (payload.endsAt !== undefined) event.endsAt = payload.endsAt ? String(payload.endsAt) : null
  if (payload.enabled != null) event.enabled = Boolean(payload.enabled)
  writeDb(db)
  const itemCount = db.shopItems.filter((i) => i.eventId === event.id).length
  return { event: serializeShopEvent(event, itemCount) }
}

export function deleteShopEvent(id) {
  const db = readDb()
  const before = db.shopEvents.length
  db.shopEvents = db.shopEvents.filter((e) => e.id !== id)
  if (db.shopEvents.length === before) return false
  for (const item of db.shopItems) {
    if (item.eventId === id) {
      item.eventId = null
    }
  }
  writeDb(db)
  return true
}

export function listShopItems({ includeDisabled = false } = {}) {
  const db = readDb()
  return db.shopItems
    .filter((i) => includeDisabled || i.enabled !== false)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function findShopItem(id) {
  const db = readDb()
  return db.shopItems.find((i) => i.id === id) ?? null
}

export function createShopItem(payload) {
  const db = readDb()
  const item = {
    id: db.nextShopId++,
    type: payload.type,
    name: String(payload.name ?? '').trim(),
    description: String(payload.description ?? '').trim(),
    preview: String(payload.preview ?? '#334155'),
    emoji: String(payload.emoji ?? '✨'),
    price: Math.max(0, Number(payload.price ?? 0)),
    discountPercent: Math.min(100, Math.max(0, Number(payload.discountPercent ?? 0))),
    isFree: Boolean(payload.isFree),
    isEvent: Boolean(payload.isEvent),
    eventId:
      payload.eventId == null || payload.eventId === '' ? null : Number(payload.eventId),
    stockLimit: payload.stockLimit == null || payload.stockLimit === '' ? null : Math.max(0, Number(payload.stockLimit)),
    soldCount: 0,
    enabled: payload.enabled !== false,
    createdAt: new Date().toISOString(),
  }
  if (!item.name || item.name.length > 80) {
    return { error: 'INVALID_ITEM' }
  }
  if (item.description.length > 500) {
    return { error: 'INVALID_ITEM' }
  }
  if (!['background', 'avatar', 'frame', 'charm', 'sticker'].includes(item.type)) {
    return { error: 'INVALID_ITEM' }
  }
  if (item.isFree) item.price = 0
  if (item.eventId) {
    const ev = findShopEventRecord(db, item.eventId)
    if (!ev) item.eventId = null
    else item.isEvent = true
  }
  normalizeShopItemRecord(item)
  db.shopItems.push(item)
  writeDb(db)
  return { item }
}

const VISUAL_SHOP_TYPES = new Set(['background', 'avatar', 'frame', 'sticker'])

export function shopItemRequiresUpload(type) {
  return VISUAL_SHOP_TYPES.has(type)
}

export function updateShopItem(id, payload) {
  const db = readDb()
  const item = db.shopItems.find((i) => i.id === id)
  if (!item) return { error: 'NOT_FOUND' }
  if (payload.name != null) item.name = String(payload.name).trim()
  if (payload.description != null) item.description = String(payload.description).trim()
  if (payload.preview != null) item.preview = String(payload.preview)
  if (payload.emoji != null) item.emoji = String(payload.emoji)
  if (payload.price != null) item.price = Math.max(0, Number(payload.price))
  if (payload.discountPercent != null) {
    item.discountPercent = Math.min(100, Math.max(0, Number(payload.discountPercent)))
  }
  if (payload.isFree != null) {
    item.isFree = Boolean(payload.isFree)
    if (item.isFree) item.price = 0
  }
  if (payload.isEvent != null) item.isEvent = Boolean(payload.isEvent)
  if (payload.eventId !== undefined) {
    item.eventId =
      payload.eventId == null || payload.eventId === '' ? null : Number(payload.eventId)
    if (item.eventId && !findShopEventRecord(db, item.eventId)) item.eventId = null
    if (item.eventId) item.isEvent = true
  }
  if (payload.stockLimit !== undefined) {
    item.stockLimit = payload.stockLimit == null || payload.stockLimit === '' ? null : Math.max(0, Number(payload.stockLimit))
  }
  if (payload.enabled != null) item.enabled = Boolean(payload.enabled)
  normalizeShopItemRecord(item)
  writeDb(db)
  return { item }
}

export function deleteShopItem(id) {
  const db = readDb()
  const before = db.shopItems.length
  db.shopItems = db.shopItems.filter((i) => i.id !== id)
  if (db.shopItems.length === before) return false
  writeDb(db)
  return true
}

function effectivePrice(item) {
  if (item.isFree) return 0
  const discount = Math.min(100, Math.max(0, Number(item.discountPercent ?? 0)))
  return Math.round(item.price * (1 - discount / 100))
}

export function purchaseShopItem(userId, itemId) {
  const db = readDb()
  const user = db.users.find((u) => u.id === userId)
  const item = db.shopItems.find((i) => i.id === itemId)
  if (!user || !item) return { error: 'NOT_FOUND' }
  if (item.enabled === false) return { error: 'ITEM_DISABLED' }
  normalizeProfile(user)
  if (user.inventory.includes(itemId)) return { error: 'ALREADY_OWNED' }
  if (item.eventId) {
    const ev = findShopEventRecord(db, item.eventId)
    if (!ev || ev.enabled === false) return { error: 'EVENT_UNAVAILABLE' }
    if (!isShopEventLive(ev)) return { error: 'EVENT_NOT_ACTIVE' }
  }
  if (item.stockLimit != null && item.soldCount >= item.stockLimit) {
    return { error: 'SOLD_OUT' }
  }
  const price = effectivePrice(item)
  if ((user.coins ?? 0) < price) return { error: 'NOT_ENOUGH_COINS' }

  user.coins -= price
  user.inventory.push(itemId)
  item.soldCount = (item.soldCount ?? 0) + 1
  writeDb(db)
  return { user: normalizeProfile(user), item, pricePaid: price }
}

export function equipItem(userId, itemId) {
  const db = readDb()
  const user = db.users.find((u) => u.id === userId)
  const item = db.shopItems.find((i) => i.id === itemId)
  if (!user || !item) return { error: 'NOT_FOUND' }
  normalizeProfile(user)
  if (!user.inventory.includes(itemId)) return { error: 'NOT_OWNED' }
  if (item.type === 'sticker') return { error: 'STICKER_NO_EQUIP' }
  user.equipped[item.type] = itemId
  if (item.type === 'background') user.media.backgroundUrl = null
  if (item.type === 'avatar') user.media.avatarUrl = null
  writeDb(db)
  return { user: normalizeProfile(user) }
}

export function resetProfileSlot(userId, type) {
  const db = readDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return { error: 'NOT_FOUND' }
  normalizeProfile(user)
  if (!['background', 'avatar'].includes(type)) return { error: 'INVALID_TYPE' }
  if (type === 'background') user.media.backgroundUrl = null
  if (type === 'avatar') user.media.avatarUrl = null
  user.equipped[type] = null
  writeDb(db)
  return { user: normalizeProfile(user) }
}

export function unequipItem(userId, type) {
  const db = readDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return { error: 'NOT_FOUND' }
  normalizeProfile(user)
  if (!['background', 'avatar', 'frame', 'charm'].includes(type)) return { error: 'INVALID_TYPE' }
  user.equipped[type] = null
  writeDb(db)
  return { user: normalizeProfile(user) }
}

export function serializeShopItemForApi(item) {
  const db = readDb()
  const out = {
    ...item,
    effectivePrice: effectivePrice(item),
    remaining:
      item.stockLimit == null ? null : Math.max(0, item.stockLimit - (item.soldCount ?? 0)),
  }
  if (item.eventId) {
    const ev = findShopEventRecord(db, item.eventId)
    if (ev) {
      out.event = serializeShopEvent(ev)
    }
  }
  return out
}

export { effectivePrice }

// ——— Community chat ———

const MAX_CHAT_HISTORY = 200

export function listChatMessages({ limit = 50, since = 0 } = {}) {
  const db = readDb()
  const safeLimit = Math.min(MAX_CHAT_HISTORY, Math.max(1, Number(limit) || 50))
  const safeSince = Math.max(0, Number(since) || 0)
  return db.chatMessages
    .filter((m) => (safeSince ? m.id > safeSince : true))
    .slice(-safeLimit)
}

export function broadcastMail({ subject, body, type = 'broadcast' }) {
  const db = readDb()
  const mail = sanitizeMailFields(subject, body)
  if (mail.error) return { error: mail.error }
  const cleanSubject = mail.subject
  const cleanBody = mail.body

  let sent = 0
  for (const user of db.users) {
    normalizeProfile(user)
    user.mailbox.unshift({
      id: user.nextMailId++,
      type,
      subject: cleanSubject,
      body: cleanBody,
      read: false,
      createdAt: new Date().toISOString(),
    })
    sent += 1
  }
  writeDb(db)
  return { sent }
}

export function postChatMessage(userId, rawHtml) {
  const db = readDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return { error: 'NOT_FOUND' }

  const html = sanitizeChatHtml(rawHtml)
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!plain && !html.includes('chat-sticker')) return { error: 'EMPTY' }
  if (html.length > 12000) return { error: 'TOO_LONG' }

  const message = {
    id: db.nextChatId++,
    userId: user.id,
    displayName: user.displayName ?? userEmail(user),
    html,
    text: plain || 'Sticker',
    createdAt: new Date().toISOString(),
  }
  db.chatMessages.push(message)
  if (db.chatMessages.length > MAX_CHAT_HISTORY) {
    db.chatMessages = db.chatMessages.slice(-MAX_CHAT_HISTORY)
  }
  writeDb(db)
  return { message }
}

// ——— Follows & direct messages ———

export function countFollowers(userId) {
  const db = readDb()
  return db.follows.filter((f) => f.followingId === userId).length
}

export function countFollowing(userId) {
  const db = readDb()
  return db.follows.filter((f) => f.followerId === userId).length
}

export function getFollowStatus(viewerId, targetId) {
  return {
    followersCount: countFollowers(targetId),
    followingCount: countFollowing(targetId),
    isFollowing: isFollowing(viewerId, targetId),
    isFollowedBy: isFollowing(targetId, viewerId),
  }
}

function userListFromIds(db, ids) {
  return ids
    .map((id) => {
      const u = db.users.find((x) => x.id === id)
      return u ? { id: u.id, displayName: u.displayName } : null
    })
    .filter(Boolean)
}

export function listFollowers(userId) {
  const db = readDb()
  const ids = db.follows.filter((f) => f.followingId === userId).map((f) => f.followerId)
  return userListFromIds(db, ids)
}

export function listFollowing(userId) {
  const db = readDb()
  const ids = db.follows.filter((f) => f.followerId === userId).map((f) => f.followingId)
  return userListFromIds(db, ids)
}

function isFollowing(followerId, followingId) {
  const db = readDb()
  return db.follows.some((f) => f.followerId === followerId && f.followingId === followingId)
}

export function toggleFollow(followerId, targetId, follow) {
  if (followerId === targetId) return { error: 'SELF' }
  const db = readDb()
  const target = db.users.find((u) => u.id === targetId)
  if (!target) return { error: 'NOT_FOUND' }

  const idx = db.follows.findIndex(
    (f) => f.followerId === followerId && f.followingId === targetId,
  )

  if (follow) {
    if (idx === -1) {
      db.follows.push({
        followerId,
        followingId: targetId,
        createdAt: new Date().toISOString(),
      })
    }
  } else if (idx !== -1) {
    db.follows.splice(idx, 1)
  }

  writeDb(db)
  return getFollowStatus(followerId, targetId)
}

function dmThreadExists(db, a, b) {
  return db.dmMessages.some(
    (m) =>
      (m.fromId === a && m.toId === b) || (m.fromId === b && m.toId === a),
  )
}

function canSendDm(db, senderId, peerId) {
  if (dmThreadExists(db, senderId, peerId)) return true
  return db.follows.some((f) => f.followerId === senderId && f.followingId === peerId)
}

const MAX_DM_HISTORY = 500

export function listDmMessages(userId, peerId, { limit = 80, since = 0 } = {}) {
  const db = readDb()
  const safeLimit = Math.min(MAX_DM_HISTORY, Math.max(1, Number(limit) || 80))
  const safeSince = Math.max(0, Number(since) || 0)
  return db.dmMessages
    .filter(
      (m) =>
        (m.fromId === userId && m.toId === peerId) ||
        (m.fromId === peerId && m.toId === userId),
    )
    .filter((m) => (safeSince ? m.id > safeSince : true))
    .slice(-safeLimit)
    .map((m) => ({
      id: m.id,
      fromId: m.fromId,
      toId: m.toId,
      html: m.html,
      createdAt: m.createdAt,
      isSelf: m.fromId === userId,
    }))
}

export function postDmMessage(fromId, toId, rawHtml) {
  const db = readDb()
  if (fromId === toId) return { error: 'SELF' }
  const sender = db.users.find((u) => u.id === fromId)
  const peer = db.users.find((u) => u.id === toId)
  if (!sender || !peer) return { error: 'NOT_FOUND' }

  if (!canSendDm(db, fromId, toId)) {
    return { error: 'NOT_FOLLOWING' }
  }

  const html = sanitizeChatHtml(rawHtml)
  const plain = html.replace(/<[^>]+>/g, '').trim()
  if (!plain && !html.includes('chat-sticker')) return { error: 'EMPTY' }
  if (html.length > 12000) return { error: 'TOO_LONG' }

  const message = {
    id: db.nextDmId++,
    fromId,
    toId,
    html,
    createdAt: new Date().toISOString(),
  }
  db.dmMessages.push(message)
  if (db.dmMessages.length > MAX_DM_HISTORY * 50) {
    db.dmMessages = db.dmMessages.slice(-MAX_DM_HISTORY * 50)
  }
  writeDb(db)
  return { message }
}

export function getUserWorkspace(userId) {
  const user = findUserById(userId)
  if (!user) return null
  normalizeProfile(user)
  return workspacePayload(user)
}

export function saveUserTasks(userId, tasks) {
  const db = readDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return { error: 'NOT_FOUND' }
  normalizeProfile(user)
  user.tasks = normalizeUserTasks(tasks)
  writeDb(db)
  return { tasks: user.tasks }
}

export function saveUserNotepad(userId, date, html) {
  const db = readDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return { error: 'NOT_FOUND' }
  const day = typeof date === 'string' ? date : new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { error: 'INVALID_DATE' }
  normalizeProfile(user)
  if (!user.notepadDaily) user.notepadDaily = {}
  user.notepadDaily[day] = String(html ?? '').slice(0, 80_000)
  writeDb(db)
  return { date: day, saved: true }
}

export function listDmInbox(userId) {
  const db = readDb()
  const byPeer = new Map()

  for (const m of db.dmMessages) {
    let peerId = null
    if (m.fromId === userId) peerId = m.toId
    else if (m.toId === userId) peerId = m.fromId
    if (!peerId) continue

    const prev = byPeer.get(peerId)
    if (!prev || m.id > prev.lastMessage.id) {
      const peer = db.users.find((u) => u.id === peerId)
      byPeer.set(peerId, {
        peerId,
        displayName: peer?.displayName ?? `Player ${peerId}`,
        lastMessage: {
          id: m.id,
          html: m.html,
          createdAt: m.createdAt,
          isSelf: m.fromId === userId,
        },
      })
    }
  }

  return [...byPeer.values()].sort((a, b) => b.lastMessage.id - a.lastMessage.id)
}

// ——— Achievement definitions ———

export function listAdminAchievementDefs() {
  const db = readDb()
  return [...db.achievementDefs].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.title.localeCompare(b.title),
  )
}

export function findAchievementDef(id) {
  const db = readDb()
  return db.achievementDefs.find((a) => a.id === id) ?? null
}

export function createAchievementDef(payload) {
  const db = readDb()
  const id = String(payload.id ?? '').trim().toLowerCase()
  if (!isValidAchievementId(id)) {
    return { error: 'INVALID_ID' }
  }
  if (db.achievementDefs.some((a) => a.id === id)) {
    return { error: 'DUPLICATE_ID' }
  }
  const title = String(payload.title ?? '').trim()
  if (!title || title.length > 80) return { error: 'INVALID_TITLE' }
  const description = String(payload.description ?? '').trim()
  if (description.length > 300) return { error: 'INVALID_DESCRIPTION' }

  const item = normalizeAchievementDef(
    {
      id,
      title,
      description,
      icon: payload.icon,
      imageUrl: payload.imageUrl ?? null,
      coinReward: payload.coinReward,
      xpReward: payload.xpReward,
      trigger: payload.trigger,
      target: payload.target,
      enabled: payload.enabled !== false,
      sortOrder: db.achievementDefs.length,
    },
    db.achievementDefs.length,
  )
  db.achievementDefs.push(item)
  writeDb(db)
  return { item }
}

export function updateAchievementDef(id, payload) {
  const db = readDb()
  const item = db.achievementDefs.find((a) => a.id === id)
  if (!item) return { error: 'NOT_FOUND' }

  if (payload.title != null) {
    const title = String(payload.title).trim()
    if (!title || title.length > 80) return { error: 'INVALID_TITLE' }
    item.title = title
  }
  if (payload.description != null) {
    const description = String(payload.description).trim()
    if (description.length > 300) return { error: 'INVALID_DESCRIPTION' }
    item.description = description
  }
  if (payload.icon != null) item.icon = String(payload.icon).trim() || '✨'
  if (payload.imageUrl !== undefined) item.imageUrl = payload.imageUrl ? String(payload.imageUrl) : null
  if (payload.coinReward != null) item.coinReward = Math.max(0, Number(payload.coinReward))
  if (payload.xpReward != null) item.xpReward = Math.max(0, Number(payload.xpReward))
  if (payload.trigger != null) {
    if (!['register', 'sessions', 'focusMinutes', 'tasks', 'level'].includes(payload.trigger)) {
      return { error: 'INVALID_TRIGGER' }
    }
    item.trigger = payload.trigger
  }
  if (payload.target != null) item.target = Math.max(1, Number(payload.target))
  if (payload.enabled != null) item.enabled = Boolean(payload.enabled)
  if (payload.sortOrder != null) item.sortOrder = Number(payload.sortOrder)

  writeDb(db)
  return { item }
}

export function deleteAchievementDef(id) {
  const db = readDb()
  const before = db.achievementDefs.length
  db.achievementDefs = db.achievementDefs.filter((a) => a.id !== id)
  if (db.achievementDefs.length === before) return false
  writeDb(db)
  return true
}

