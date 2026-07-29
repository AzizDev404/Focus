import fs from 'fs'

const s = fs.readFileSync('scripts/main.js', 'utf8')
const re = /id="settModal-[^"]+-tab"/g
const ids = [...new Set([...s.matchAll(re)].map((x) => x[0]))]
ids.sort()
ids.forEach((x) => console.log(x))
