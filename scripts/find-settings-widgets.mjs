import fs from 'fs'

const s = fs.readFileSync('scripts/main.js', 'utf8')
for (const term of ['Focus Timer', 'settModal-clock', 'settModal-stats', 'settModal-quotes', 'settModal-extras', 'settModal-account', 'Clock</button>', 'Stats</button>']) {
  const i = s.indexOf(term)
  console.log(term, i)
}
