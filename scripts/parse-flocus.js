import fs from 'fs'

const s = fs.readFileSync('scripts/main.js', 'utf8')

const assets = [...new Set(s.match(/\.\/[A-Za-z0-9_]+\.(jpg|webp|mp4|webm)/g) || [])].sort()
fs.writeFileSync('scripts/assets-list.json', JSON.stringify(assets, null, 2))

const themeBlock = s.match(/1119:\(e,t,a\)=>\{var s=\{([^}]+)\}/)
if (themeBlock) {
  const entries = [...themeBlock[1].matchAll(/"\.\/([^"]+)":(\d+)/g)].map((x) => ({
    file: x[1],
    chunk: x[2],
  }))
  fs.writeFileSync('scripts/theme-map.json', JSON.stringify(entries, null, 2))
  console.log('theme files:', entries.length)
}

const soundBlock = s.match(/soundscape|soundscape|SoundDef|sounds:\[/gi)
console.log('sound refs:', soundBlock?.length ?? 0)

// Try chunk file URLs
const chunks = [...new Set(s.match(/\d+\.[a-f0-9]+\.(js|css)/g) || [])]
console.log('chunks in main:', chunks.slice(0, 10))

// Extract theme metadata patterns
const labels = [...s.matchAll(/label:"([^"]+)"/g)].map((x) => x[1])
const uniqueLabels = [...new Set(labels)]
fs.writeFileSync('scripts/labels.json', JSON.stringify(uniqueLabels.sort(), null, 2))
console.log('labels:', uniqueLabels.length)
