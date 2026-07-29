import fs from 'fs'

const s = fs.readFileSync('scripts/main.js', 'utf8')

const searches = ['order=80', 'order=85', 'order=90', 'upgradeModals', 'dash-button","no-style', 'elements.offer', 'percent', 'gift']
for (const term of searches) {
  let idx = 0, n = 0
  while (n < 2) {
    idx = s.indexOf(term, idx + 1)
    if (idx < 0) break
    const slice = s.slice(idx, idx + 500)
    if (slice.includes('svg') || term.includes('order')) {
      console.log(`\n=== ${term} @ ${idx} ===`)
      console.log(slice)
      n++
    }
  }
}
