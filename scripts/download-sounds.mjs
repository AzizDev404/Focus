// Downloads all ambient sound files from Flocus's own CDN
// (resources/sounds/ambient/*.mp4) and saves them as public/sounds/<id>.mp4
// so the React app can serve them locally with no runtime dependency on
// app.flocus.com or pixabay (which blocks hotlinks with 403).
//
// Input:  scripts/sound-url-map.json  ({ "<sound-id>": "https://...mp4", ... })
// Output: public/sounds/<sound-id>.mp4 for every entry.
//
// Re-run anytime to refresh:  node scripts/download-sounds.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import https from 'node:https'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const MAP = path.join(ROOT, 'scripts', 'sound-url-map.json')
const OUT_DIR = path.join(ROOT, 'public', 'sounds')

fs.mkdirSync(OUT_DIR, { recursive: true })

if (!fs.existsSync(MAP)) {
  console.error(`Missing ${MAP}. Generate it from app.flocus.com first.`)
  process.exit(1)
}
const map = JSON.parse(fs.readFileSync(MAP, 'utf8'))
const entries = Object.entries(map)
console.log(`Found ${entries.length} sound URLs to download.`)

function fetchToFile(url, dest, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const opts = {
      method: 'GET',
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: '*/*',
        Referer: 'https://app.flocus.com/',
      },
    }
    const req = https.request(opts, (res) => {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        if (redirectsLeft <= 0) return reject(new Error(`Too many redirects for ${url}`))
        res.resume()
        const next = new URL(res.headers.location, url).toString()
        return fetchToFile(next, dest, redirectsLeft - 1).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const tmp = dest + '.partial'
      const out = fs.createWriteStream(tmp)
      res.pipe(out)
      out.on('finish', () => {
        out.close(() => {
          fs.renameSync(tmp, dest)
          resolve()
        })
      })
      out.on('error', (err) => {
        try {
          fs.unlinkSync(tmp)
        } catch {}
        reject(err)
      })
    })
    req.on('error', reject)
    req.setTimeout(60_000, () => {
      req.destroy(new Error('timeout'))
    })
    req.end()
  })
}

const cache = new Map()
let okCount = 0
let failCount = 0
const failures = []

for (const [id, url] of entries) {
  const dest = path.join(OUT_DIR, `${id}.mp4`)
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1024) {
    okCount++
    process.stdout.write(`= ${id} (cached, ${fs.statSync(dest).size} bytes)\n`)
    continue
  }
  try {
    if (cache.has(url)) {
      const firstPath = await cache.get(url)
      fs.copyFileSync(firstPath, dest)
      okCount++
      process.stdout.write(`+ ${id} (copied from dedup)\n`)
    } else {
      const p = (async () => {
        await fetchToFile(url, dest)
        return dest
      })()
      cache.set(url, p)
      await p
      const size = fs.statSync(dest).size
      okCount++
      process.stdout.write(`+ ${id} (downloaded, ${(size / 1024).toFixed(1)} KB)\n`)
    }
  } catch (err) {
    failCount++
    failures.push({ id, url, error: String(err) })
    process.stdout.write(`! ${id} FAILED: ${err}\n`)
  }
}

console.log(`\nDone. ${okCount} ok, ${failCount} failed.`)
if (failures.length) {
  console.log('Failures:')
  for (const f of failures) console.log(`  - ${f.id}: ${f.error}`)
  process.exitCode = 1
}
