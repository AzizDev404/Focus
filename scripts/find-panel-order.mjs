import fs from 'fs'

const s = fs.readFileSync('scripts/main.js', 'utf8')
const re = /addSettingsPanel\(\s*"([^"]+)"/g
let m
while ((m = re.exec(s)) !== null) console.log(m[1])
