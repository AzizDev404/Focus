import fs from 'fs'

const s = fs.readFileSync('scripts/main.js', 'utf8')
const marker = 'id="offcanvas" aria-labelledby="offcanvasLabel"'
const start = s.indexOf(marker)
if (start < 0) {
  console.error('marker not found')
  process.exit(1)
}
const chunk = s.slice(start - 200, start + 25000)
const unescaped = chunk.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"')
fs.writeFileSync('scripts/flocus-settings-template.txt', unescaped)
console.log('wrote', unescaped.length, 'chars')
