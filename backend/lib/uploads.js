import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DATA_DB_PATH = path.join(ROOT, 'data', 'db.json')
const UPLOAD_ROOT = path.join(ROOT, 'uploads', 'users')
const SHOP_UPLOAD_ROOT = path.join(ROOT, 'uploads', 'shop')
const ACHIEVEMENT_UPLOAD_ROOT = path.join(ROOT, 'uploads', 'achievements')

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export function uploadsRoot() {
  return UPLOAD_ROOT
}

export function validateImageFile(file) {
  if (!file) return 'Image is required.'
  if (!ALLOWED_MIME.has(file.mimetype)) return 'Only JPG, PNG or WEBP images are allowed.'
  if (file.size > 5 * 1024 * 1024) return 'Image must be smaller than 5MB.'
  return null
}

/** Admin uploads — no size cap (still MIME-checked). */
export function validateAdminImageFile(file) {
  if (!file) return 'Image is required.'
  if (!ALLOWED_MIME.has(file.mimetype)) return 'Only JPG, PNG or WEBP images are allowed.'
  return null
}

async function removeIfExists(filePath) {
  if (!filePath) return
  try {
    await fs.unlink(filePath)
  } catch {
    /* */
  }
}

async function removeMatchingPrefix(dir, prefix) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    await Promise.all(
      entries
        .filter((e) => e.isFile() && e.name.startsWith(prefix))
        .map((e) => removeIfExists(path.join(dir, e.name))),
    )
  } catch {
    /* */
  }
}

export async function saveAchievementImage({ achievementId, file }) {
  const ext = EXT_BY_MIME[file.mimetype]
  await fs.mkdir(ACHIEVEMENT_UPLOAD_ROOT, { recursive: true })
  await removeMatchingPrefix(ACHIEVEMENT_UPLOAD_ROOT, `${achievementId}-`)
  const filename = `${achievementId}-${Date.now()}${ext}`
  const absPath = path.join(ACHIEVEMENT_UPLOAD_ROOT, filename)
  await fs.writeFile(absPath, file.buffer)
  return `/uploads/achievements/${filename}`
}

export async function saveShopPreviewImage({ itemId, file }) {
  const ext = EXT_BY_MIME[file.mimetype]
  await fs.mkdir(SHOP_UPLOAD_ROOT, { recursive: true })
  await removeMatchingPrefix(SHOP_UPLOAD_ROOT, `item-${itemId}-`)
  const filename = `item-${itemId}-${Date.now()}${ext}`
  const absPath = path.join(SHOP_UPLOAD_ROOT, filename)
  await fs.writeFile(absPath, file.buffer)
  return `/uploads/shop/${filename}`
}

export async function saveUserImage({ userId, slot, file }) {
  const ext = EXT_BY_MIME[file.mimetype]
  const dir = path.join(UPLOAD_ROOT, String(userId))
  await fs.mkdir(dir, { recursive: true })
  await removeMatchingPrefix(dir, `${slot}-`)
  const filename = `${slot}-${Date.now()}${ext}`
  const absPath = path.join(dir, filename)
  await fs.writeFile(absPath, file.buffer)
  return `/uploads/users/${userId}/${filename}`
}

async function collectActiveUploads() {
  try {
    const raw = await fs.readFile(DATA_DB_PATH, 'utf8')
    const db = JSON.parse(raw)
    const active = new Set()
    for (const user of db.users ?? []) {
      const media = user?.media ?? {}
      for (const p of [media.avatarUrl, media.backgroundUrl]) {
        if (typeof p === 'string' && p.startsWith('/uploads/users/')) active.add(p)
      }
    }
    for (const item of db.shopItems ?? []) {
      if (typeof item.preview === 'string' && item.preview.startsWith('/uploads/shop/')) {
        active.add(item.preview)
      }
    }
    for (const ach of db.achievementDefs ?? []) {
      if (typeof ach.imageUrl === 'string' && ach.imageUrl.startsWith('/uploads/achievements/')) {
        active.add(ach.imageUrl)
      }
    }
    return active
  } catch {
    return new Set()
  }
}

async function walkUploadDir(dir) {
  let files = 0
  let bytes = 0
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const nested = await walkUploadDir(abs)
        files += nested.files
        bytes += nested.bytes
      } else if (entry.isFile()) {
        const stat = await fs.stat(abs)
        files += 1
        bytes += stat.size
      }
    }
  } catch {
    /* */
  }
  return { files, bytes }
}

export async function getUploadStorageStats() {
  const users = await walkUploadDir(UPLOAD_ROOT)
  const shop = await walkUploadDir(SHOP_UPLOAD_ROOT)
  const achievements = await walkUploadDir(ACHIEVEMENT_UPLOAD_ROOT)
  return {
    userFiles: users.files,
    shopFiles: shop.files,
    achievementFiles: achievements.files,
    totalBytes: users.bytes + shop.bytes + achievements.bytes,
  }
}

export async function cleanupOrphanUploads() {
  const active = await collectActiveUploads()
  let removedUserFiles = 0
  let removedShopFiles = 0
  try {
    const userDirs = await fs.readdir(UPLOAD_ROOT, { withFileTypes: true })
    for (const dir of userDirs) {
      if (!dir.isDirectory()) continue
      const absDir = path.join(UPLOAD_ROOT, dir.name)
      const files = await fs.readdir(absDir, { withFileTypes: true })
      for (const f of files) {
        if (!f.isFile()) continue
        const rel = `/uploads/users/${dir.name}/${f.name}`
        if (!active.has(rel)) {
          await removeIfExists(path.join(absDir, f.name))
          removedUserFiles += 1
        }
      }
      const left = await fs.readdir(absDir)
      if (!left.length) await fs.rmdir(absDir).catch(() => {})
    }
  } catch {
    /* */
  }
  try {
    const files = await fs.readdir(SHOP_UPLOAD_ROOT, { withFileTypes: true })
    for (const f of files) {
      if (!f.isFile()) continue
      const rel = `/uploads/shop/${f.name}`
      if (!active.has(rel)) {
        await removeIfExists(path.join(SHOP_UPLOAD_ROOT, f.name))
        removedShopFiles += 1
      }
    }
  } catch {
    /* */
  }
  const storage = await getUploadStorageStats()
  return { removedUserFiles, removedShopFiles, storage }
}

export async function clearAllUploads() {
  for (const root of [UPLOAD_ROOT, SHOP_UPLOAD_ROOT, ACHIEVEMENT_UPLOAD_ROOT]) {
    try {
      await fs.rm(root, { recursive: true, force: true })
    } catch {
      /* */
    }
  }
}

export function startUploadCleanupScheduler() {
  void cleanupOrphanUploads()
  return setInterval(() => {
    void cleanupOrphanUploads()
  }, 1000 * 60 * 30)
}
