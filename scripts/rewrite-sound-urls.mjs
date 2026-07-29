// Rewrites sound URLs in src/data/catalog.ts from any remote URL to local
// /sounds/<id>.mp4 paths. Re-run after editing the catalog or sounds folder.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CATALOG = path.join(ROOT, 'src', 'data', 'catalog.ts')
const SOUNDS_DIR = path.join(ROOT, 'public', 'sounds')

const src = fs.readFileSync(CATALOG, 'utf8')

// Match every block of the SOUNDS array: {... "id": "<id>" ... "url": "<old>" ...}
const blockRe = /(\{[^{}]*?"id"\s*:\s*"([^"]+)"[^{}]*?)"url"\s*:\s*"[^"]+"([^{}]*?\})/g

let rewrites = 0
let missing = 0
const out = src.replace(blockRe, (m, before, id, after) => {
  const dest = path.join(SOUNDS_DIR, `${id}.mp4`)
  if (!fs.existsSync(dest)) {
    missing++
    process.stdout.write(`  skip ${id} (no local file)\n`)
    return m
  }
  rewrites++
  return `${before}"url": "/sounds/${id}.mp4"${after}`
})

if (out === src) {
  console.log('No rewrites needed.')
} else {
  fs.writeFileSync(CATALOG, out)
  console.log(`Rewrote ${rewrites} URL(s) to /sounds/<id>.mp4`)
  if (missing) console.log(`Skipped ${missing} (no matching local file).`)
}
