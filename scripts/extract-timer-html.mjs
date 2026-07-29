import fs from 'fs'

const s = fs.readFileSync('scripts/main.js', 'utf8')
const i = s.indexOf('generateSettingsPanelHtml')
console.log(s.slice(i, i + 6000).replace(/\\n/g, '\n').replace(/\\t/g, '\t'))
