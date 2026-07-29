import fs from 'fs'

const s = fs.readFileSync('scripts/main.js', 'utf8')
const whatsNew = s.lastIndexOf("What's New")
console.log('whatsNew', whatsNew)
if (whatsNew > 0) console.log(s.slice(whatsNew - 4500, whatsNew + 1200))

const homeTheme = s.indexOf('settModal-homeTheme-tab')
console.log('homeTheme', homeTheme)
if (homeTheme > 0) console.log(s.slice(homeTheme - 2000, homeTheme + 500))

const css = fs.readFileSync('scripts/flocus-main.css', 'utf8')
const keys = [
  'settings-group',
  'settings-header',
  'theme-tile',
  'themes-grid',
  '#settModal-tabContent',
  'nav-link.active',
]
for (const k of keys) {
  const i = css.indexOf(k)
  if (i < 0) continue
  console.log('\n---', k, '---\n', css.slice(i, i + 600).replace(/\s+/g, ' '))
}
