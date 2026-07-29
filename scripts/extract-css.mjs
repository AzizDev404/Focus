import fs from 'fs'
const css = fs.readFileSync('scripts/flocus-main.css', 'utf8')
const terms = ['soundscape', 'sound-player', 'settModal-timer', 'nav.nav-pills', 'theme-grid', 'themes-grid']
for (const t of terms) {
  let idx = 0
  let n = 0
  while ((idx = css.indexOf(t, idx)) >= 0 && n < 2) {
    console.log('\n---', t, '---')
    console.log(css.slice(idx, idx + 900).replace(/\s+/g, ' '))
    idx++
    n++
  }
}
