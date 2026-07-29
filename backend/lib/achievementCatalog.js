import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json')

export const ACHIEVEMENT_TRIGGERS = ['register', 'sessions', 'focusMinutes', 'tasks', 'level']

function readRawDb() {
  if (!fs.existsSync(DB_PATH)) return { achievementDefs: [] }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

export function normalizeAchievementDef(raw, sortOrder = 0) {
  const id = String(raw.id ?? '').trim()
  const trigger = ACHIEVEMENT_TRIGGERS.includes(raw.trigger) ? raw.trigger : 'sessions'
  return {
    id,
    title: String(raw.title ?? '').trim(),
    description: String(raw.description ?? '').trim(),
    icon: String(raw.icon ?? '✨').trim() || '✨',
    imageUrl: raw.imageUrl ? String(raw.imageUrl) : null,
    coinReward: Math.max(0, Number(raw.coinReward ?? 0)),
    xpReward: Math.max(0, Number(raw.xpReward ?? 0)),
    trigger,
    target: Math.max(1, Number(raw.target ?? 1)),
    enabled: raw.enabled !== false,
    sortOrder: Number.isFinite(raw.sortOrder) ? raw.sortOrder : sortOrder,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  }
}

export function listAchievementDefinitions({ includeDisabled = false } = {}) {
  const data = readRawDb()
  const defs = Array.isArray(data.achievementDefs) ? data.achievementDefs : []
  return defs
    .filter((a) => includeDisabled || a.enabled !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.title.localeCompare(b.title))
}

export function achievementById(id) {
  return listAchievementDefinitions({ includeDisabled: true }).find((a) => a.id === id) ?? null
}

export function isValidAchievementId(id) {
  return /^[a-z][a-z0-9_]{0,47}$/.test(id)
}
