import fs from 'node:fs'
import path from 'node:path'

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function dim(file) {
  const buf = fs.readFileSync(file)
  if (buf.slice(0, 8).equals(PNG_SIG)) {
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)]
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i < buf.length) {
      if (buf[i] !== 0xff) break
      const marker = buf[i + 1]
      const size = buf.readUInt16BE(i + 2)
      if (marker >= 0xc0 && marker <= 0xc3) {
        return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)]
      }
      i += 2 + size
    }
  }
  return [-1, -1]
}

const rows = []
for (const dir of ['desktop', 'mobile']) {
  const folder = path.join('public', 'pic', dir)
  for (const f of fs.readdirSync(folder)) {
    if (!/\.(jpe?g|png)$/i.test(f)) continue
    const file = path.join(folder, f)
    const [w, h] = dim(file)
    rows.push({
      file: file.replace(/\\/g, '/'),
      w,
      h,
      ratio: w > 0 ? (w / h).toFixed(2) : '?',
      orient: w > h ? 'L' : 'P',
    })
  }
}
rows.sort((a, b) => a.file.localeCompare(b.file))
const wrong = []
for (const r of rows) {
  const inDesktop = r.file.includes('/desktop/')
  const expectedOrient = inDesktop ? 'L' : 'P'
  const tag = r.orient === expectedOrient ? '  ' : '!!'
  if (r.orient !== expectedOrient) wrong.push(r.file)
  console.log(`${tag} ${r.file.padEnd(60)} ${`${r.w}x${r.h}`.padEnd(14)} r=${r.ratio} ${r.orient}`)
}
console.log()
console.log(`Total: ${rows.length}, misclassified: ${wrong.length}`)
for (const f of wrong) console.log('  ✗', f)
