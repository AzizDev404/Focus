import fs from 'fs'

const s = fs.readFileSync('scripts/main.js', 'utf8')
const names = ['Pomodoro Timer', 'Clock', 'Account', 'Stats', 'Extras']
for (const name of names) {
  const needle = `addSettingsPanel("${name}"`
  const i = s.indexOf(needle)
  if (i < 0) {
    console.log('NOT', name)
    continue
  }
  const svgStart = s.indexOf('<svg', i)
  const svgEnd = s.indexOf('</svg>', svgStart) + 6
  console.log('\n===', name, '===\n')
  console.log(s.slice(svgStart, svgEnd))
}
