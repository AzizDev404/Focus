import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const SQLITE_PATH = path.join(DATA_DIR, 'tsukiyomi.sqlite')
const LEGACY_JSON = path.join(DATA_DIR, 'db.json')

let sqlite = null
let sqliteUnavailable = false

function sqliteApi() {
  if (sqliteUnavailable) return null
  try {
    if (typeof process.getBuiltinModule === 'function') {
      return process.getBuiltinModule('node:sqlite')
    }
  } catch {
    sqliteUnavailable = true
  }
  return null
}

function openSqlite() {
  if (sqlite) return sqlite
  const api = sqliteApi()
  if (!api?.DatabaseSync) {
    sqliteUnavailable = true
    return null
  }
  fs.mkdirSync(DATA_DIR, { recursive: true })
  sqlite = new api.DatabaseSync(SQLITE_PATH)
  sqlite.exec('PRAGMA journal_mode = WAL')
  sqlite.exec('PRAGMA synchronous = NORMAL')
  sqlite.exec('PRAGMA busy_timeout = 5000')
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS snapshot (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)
  return sqlite
}

function readJsonFile() {
  if (!fs.existsSync(LEGACY_JSON)) return null
  const data = JSON.parse(fs.readFileSync(LEGACY_JSON, 'utf8'))
  return Array.isArray(data?.users) ? data : null
}

function writeJsonFile(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const payload = JSON.stringify(data, null, 2)
  const tmp = `${LEGACY_JSON}.${process.pid}.tmp`
  fs.writeFileSync(tmp, payload, 'utf8')
  try {
    fs.renameSync(tmp, LEGACY_JSON)
  } catch {
    fs.copyFileSync(tmp, LEGACY_JSON)
    fs.unlinkSync(tmp)
  }
}

function rowPayload(db) {
  const row = db.prepare('SELECT payload FROM snapshot WHERE id = 1').get()
  return row?.payload ?? null
}

export function peekSnapshot() {
  try {
    const db = openSqlite()
    if (db) {
      const raw = rowPayload(db)
      if (raw) return JSON.parse(raw)
    }
  } catch {
    /* */
  }
  try {
    return readJsonFile()
  } catch {
    return null
  }
}

export function loadSnapshot(empty) {
  const fallback = () => {
    const fromJson = readJsonFile()
    return fromJson ?? empty()
  }

  try {
    const db = openSqlite()
    if (db) {
      const existing = rowPayload(db)
      if (existing) {
        const data = JSON.parse(existing)
        if (Array.isArray(data.users)) return data
      }
      const migrated = fallback()
      saveSnapshot(migrated)
      return migrated
    }
  } catch {
    sqliteUnavailable = true
    sqlite = null
  }
  return fallback()
}

export function saveSnapshot(data) {
  const db = openSqlite()
  if (db) {
    const payload = JSON.stringify(data)
    const updatedAt = new Date().toISOString()
    db.exec('BEGIN IMMEDIATE')
    try {
      db.prepare(
        `INSERT INTO snapshot (id, payload, updated_at) VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
      ).run(payload, updatedAt)
      db.exec('COMMIT')
    } catch (err) {
      try {
        db.exec('ROLLBACK')
      } catch {
        /* */
      }
      throw err
    }
    return
  }
  writeJsonFile(data)
}

export function resetSnapshot(data) {
  saveSnapshot(data)
}

export function snapshotByteSize() {
  try {
    if (openSqlite() && fs.existsSync(SQLITE_PATH)) return fs.statSync(SQLITE_PATH).size
    if (fs.existsSync(LEGACY_JSON)) return fs.statSync(LEGACY_JSON).size
  } catch {
    /* */
  }
  return 0
}

export function snapshotFilePath() {
  return openSqlite() ? SQLITE_PATH : LEGACY_JSON
}
