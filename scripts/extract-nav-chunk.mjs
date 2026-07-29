import fs from 'fs'

const s = fs.readFileSync('scripts/main.js', 'utf8')
const i = s.indexOf('Focus Timer')
console.log(s.slice(i - 1500, i + 8000).replace(/\\n/g, '\n').replace(/\\'/g, "'"))
