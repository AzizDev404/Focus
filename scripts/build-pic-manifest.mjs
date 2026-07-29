// Scans public/pic/desktop/ and public/pic/mobile/, pairs each landscape
// file with its portrait counterpart (or stand-alone), then writes
// src/data/picManifest.ts as a list of personal-theme entries.
//
// Pairing strategy:
//   1. Strip orientation suffix (H/V/h/v) and extension → "stem"
//   2. Files that share a stem are paired desktop+mobile
//   3. Numbered IMG_XXXX pairs (e.g. IMG_1008 / IMG_1009) are matched by
//      nearest-neighbour within the same numeric run (max delta = 2)
//   4. Leftovers become single-orientation themes (still selectable)
//
// Theme name derivation:
//   - IMG_XXXX     → "Photo XXXX"
//   - "darkClouds" → "Dark Clouds"
//   - Otherwise the stem with words capitalised
//
// Re-run anytime files are added/removed:
//   node scripts/build-pic-manifest.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function listImages(dir) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
    .sort()
}

function stripExt(name) {
  return name.replace(/\.[^.]+$/, '')
}

// "IMG_1008" / "darkCloudsH" / "12" / "samuraiV" → original-case scene stem
function stemOf(filename) {
  let base = stripExt(filename).trim()
  base = base.replace(/\s*\(\d+\)\s*$/, '') // strip trailing " (2)"
  base = base.replace(/[Hh]$/, '').replace(/[Vv]$/, '') // strip orientation suffix
  return base
}

// Lower-cased version used as a Map key.
function stemKey(filename) {
  return stemOf(filename).toLowerCase()
}

// IMG_1008 → 1008; pure "12" → 12; otherwise null
function numberOf(filename) {
  const stem = stemOf(filename)
  const m = stem.match(/^IMG[_-]?(\d+)/i)
  if (m) return Number(m[1])
  if (/^\d+$/.test(stem)) return Number(stem)
  return null
}

function prettify(stem) {
  // IMG number → "Photo NNNN"
  const imgMatch = stem.match(/^img[_-]?(\d+)/i)
  if (imgMatch) return `Photo ${imgMatch[1]}`
  // pure numeric → "Photo N"
  if (/^\d+$/.test(stem)) return `Photo ${stem}`
  // Strip leading underscores / hyphens
  let s = stem.replace(/^[_-]+/, '')
  // Insert space before camelCase capitals (preserves Dark Clouds, Game Of Obstacles…)
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2')
  // Replace separators with spaces
  s = s.replace(/[_-]+/g, ' ')
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim()
  // Title-case each word
  const words = s
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .filter(Boolean)
  // Keep names readable: trim AI-generated long descriptive filenames
  // to the first 2 meaningful words.
  if (words.length > 4 || words.join(' ').length > 24) {
    return words.slice(0, 2).join(' ')
  }
  return words.join(' ')
}

function slugify(stem) {
  return stem
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60) || 'photo'
}

function encodePath(prefix, filename) {
  return prefix + encodeURIComponent(filename)
}

const desktopFiles = listImages(path.join(ROOT, 'public', 'pic', 'desktop'))
const mobileFiles = listImages(path.join(ROOT, 'public', 'pic', 'mobile'))

const mobileByStem = new Map()
for (const f of mobileFiles) mobileByStem.set(stemKey(f), f)

const usedMobile = new Set()
const pairs = []

// Pass 1 — exact stem (case-insensitive) match
for (const desktop of desktopFiles) {
  const key = stemKey(desktop)
  const mobile = mobileByStem.get(key)
  if (mobile && !usedMobile.has(mobile)) {
    usedMobile.add(mobile)
    pairs.push({ stem: stemOf(desktop), desktop, mobile })
  } else {
    pairs.push({ stem: stemOf(desktop), desktop, mobile: undefined })
  }
}

// Pass 2 — pair unmatched landscape with nearest-numeric portrait.
// Sort both lists by number; greedily match each unpaired desktop with the
// closest unpaired mobile (no distance cap — we'd rather pair them than have
// loose halves).
const unpairedDesktop = pairs
  .map((p, i) => ({ i, n: p.desktop ? numberOf(p.desktop) : null }))
  .filter((x) => x.n != null && pairs[x.i].mobile == null)
  .sort((a, b) => a.n - b.n)

const unpairedMobile = mobileFiles
  .filter((f) => !usedMobile.has(f))
  .map((f) => ({ f, n: numberOf(f) }))
  .filter((x) => x.n != null)
  .sort((a, b) => a.n - b.n)

for (const d of unpairedDesktop) {
  if (unpairedMobile.length === 0) break
  let bestIdx = 0
  let bestDist = Math.abs(unpairedMobile[0].n - d.n)
  for (let i = 1; i < unpairedMobile.length; i += 1) {
    const dist = Math.abs(unpairedMobile[i].n - d.n)
    if (dist < bestDist) {
      bestDist = dist
      bestIdx = i
    }
  }
  const m = unpairedMobile[bestIdx]
  pairs[d.i].mobile = m.f
  usedMobile.add(m.f)
  unpairedMobile.splice(bestIdx, 1)
}

// Any mobile files that didn't get paired → stand-alone portrait themes
for (const m of mobileFiles) {
  if (usedMobile.has(m)) continue
  pairs.push({ stem: stemOf(m), desktop: undefined, mobile: m })
}

// Dedup ids
const seenIds = new Set()
const entries = pairs.map(({ stem, desktop, mobile }) => {
  const name = prettify(stem)
  let id = slugify(stem)
  let i = 2
  while (seenIds.has(id)) id = `${slugify(stem)}-${i++}`
  seenIds.add(id)
  return {
    id,
    name,
    desktop: desktop ? encodePath('/pic/desktop/', desktop) : null,
    mobile: mobile ? encodePath('/pic/mobile/', mobile) : null,
  }
})

// Stable order: alphabetical by name
entries.sort((a, b) => a.name.localeCompare(b.name))

const out = `// AUTO-GENERATED — node scripts/build-pic-manifest.mjs
// Personal background images served from public/pic/<desktop|mobile>/.
// Each entry becomes its own theme in the Theme Library; the renderer
// picks the desktop or mobile URL based on the viewport width.

export interface PersonalPic {
  /** Stable theme id, used by useFlocusStore.settings.theme* */
  id: string
  /** Human-readable label shown under the swatch */
  name: string
  /** Landscape image URL — preferred on viewports ≥ 768px wide */
  desktop: string | null
  /** Portrait image URL — preferred on viewports < 768px wide */
  mobile: string | null
}

export const PERSONAL_PICS: readonly PersonalPic[] = ${JSON.stringify(entries, null, 2)}

export const PIC_DESKTOP: readonly string[] = PERSONAL_PICS
  .map((p) => p.desktop)
  .filter((url): url is string => url !== null)

export const PIC_MOBILE: readonly string[] = PERSONAL_PICS
  .map((p) => p.mobile)
  .filter((url): url is string => url !== null)

export const HAS_PERSONAL_PICS = PERSONAL_PICS.length > 0
`

const dest = path.join(ROOT, 'src', 'data', 'picManifest.ts')
fs.writeFileSync(dest, out)
console.log(
  `Wrote ${path.relative(ROOT, dest)} — ${entries.length} personal-pic theme(s) ` +
    `(${entries.filter((e) => e.desktop && e.mobile).length} paired, ` +
    `${entries.filter((e) => e.desktop && !e.mobile).length} desktop-only, ` +
    `${entries.filter((e) => !e.desktop && e.mobile).length} mobile-only).`,
)
