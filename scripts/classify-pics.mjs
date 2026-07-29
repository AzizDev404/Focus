// Reads every PNG/JPG in public/resources/ (or public/pic/ if already moved),
// detects each image's dimensions from its header bytes, classifies it as
// "desktop" (landscape) or "mobile" (portrait), then moves the file to
// public/pic/<desktop|mobile>/. Non-image files (e.g. plus-badge.svg) move
// to public/pic/ root. Filenames are preserved.
//
// Heuristics, in priority order:
//   1. Filename ends with "H" / "h" (before extension) → desktop
//   2. Filename ends with "V" / "v" (before extension) → mobile
//   3. Aspect ratio: width >= height → desktop, else → mobile

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SOURCE_CANDIDATES = [path.join(ROOT, 'public', 'resources'), path.join(ROOT, 'public', 'pic')]
const SOURCE = SOURCE_CANDIDATES.find((p) => fs.existsSync(p))
if (!SOURCE) {
  console.error('No source folder found (public/resources or public/pic).')
  process.exit(1)
}
const TARGET = path.join(ROOT, 'public', 'pic')
const DESKTOP_DIR = path.join(TARGET, 'desktop')
const MOBILE_DIR = path.join(TARGET, 'mobile')
fs.mkdirSync(DESKTOP_DIR, { recursive: true })
fs.mkdirSync(MOBILE_DIR, { recursive: true })

function readPngDims(buf) {
  if (buf.length < 24) return null
  const sig = buf.slice(0, 8)
  if (
    sig[0] !== 0x89 ||
    sig[1] !== 0x50 ||
    sig[2] !== 0x4e ||
    sig[3] !== 0x47 ||
    sig[4] !== 0x0d ||
    sig[5] !== 0x0a ||
    sig[6] !== 0x1a ||
    sig[7] !== 0x0a
  ) {
    return null
  }
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  return { width, height }
}

function readJpgDims(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null
  let i = 2
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null
    while (buf[i] === 0xff) i++
    const marker = buf[i]
    i++
    if (marker === 0xd8 || marker === 0xd9) continue
    if (marker === 0xda) return null // start of scan, no dims found
    const segLen = buf.readUInt16BE(i)
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    if (isSof) {
      const height = buf.readUInt16BE(i + 3)
      const width = buf.readUInt16BE(i + 5)
      return { width, height }
    }
    i += segLen
  }
  return null
}

function readDims(file) {
  const ext = path.extname(file).toLowerCase()
  const buf = fs.readFileSync(file)
  if (ext === '.png') return readPngDims(buf)
  if (ext === '.jpg' || ext === '.jpeg') return readJpgDims(buf)
  return null
}

function classify(file) {
  const ext = path.extname(file).toLowerCase()
  const base = path.basename(file, ext)
  // Filename suffix hints
  if (/H$/i.test(base) && !/V$/i.test(base)) {
    if (base.endsWith('H') || base.endsWith('h')) return { bucket: 'desktop', reason: 'name ends with H' }
  }
  if (/V$/i.test(base)) return { bucket: 'mobile', reason: 'name ends with V' }
  // Dimensions
  if (ext === '.svg') return { bucket: 'root', reason: 'svg asset (kept at /pic root)' }
  const dims = readDims(file)
  if (!dims) return { bucket: 'desktop', reason: 'unknown dims, default desktop' }
  if (dims.width >= dims.height) return { bucket: 'desktop', reason: `${dims.width}×${dims.height} landscape` }
  return { bucket: 'mobile', reason: `${dims.width}×${dims.height} portrait` }
}

const files = fs.readdirSync(SOURCE).filter((f) => fs.statSync(path.join(SOURCE, f)).isFile())
const summary = { desktop: [], mobile: [], root: [] }
let moved = 0
for (const name of files) {
  const src = path.join(SOURCE, name)
  const { bucket, reason } = classify(src)
  const destDir = bucket === 'desktop' ? DESKTOP_DIR : bucket === 'mobile' ? MOBILE_DIR : TARGET
  const dest = path.join(destDir, name)
  // If source == dest (e.g. running on already-moved tree), skip
  if (src === dest) {
    summary[bucket].push(`= ${name}  [${reason}]`)
    continue
  }
  fs.mkdirSync(destDir, { recursive: true })
  fs.renameSync(src, dest)
  moved++
  summary[bucket].push(`+ ${name}  [${reason}]`)
}

console.log(`Moved ${moved} file(s) from ${path.relative(ROOT, SOURCE)}.\n`)
console.log(`Desktop (${summary.desktop.length}):`)
for (const line of summary.desktop) console.log('  ' + line)
console.log(`\nMobile (${summary.mobile.length}):`)
for (const line of summary.mobile) console.log('  ' + line)
if (summary.root.length) {
  console.log(`\n/pic root (${summary.root.length}):`)
  for (const line of summary.root) console.log('  ' + line)
}

// Remove source folder if it was public/resources and is now empty
const sourceLeftover = fs.readdirSync(SOURCE)
if (
  SOURCE.endsWith('resources') &&
  sourceLeftover.length === 0
) {
  fs.rmdirSync(SOURCE)
  console.log(`\nRemoved empty folder: ${path.relative(ROOT, SOURCE)}`)
}
