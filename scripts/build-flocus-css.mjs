import fs from 'fs'

let css = fs.readFileSync('scripts/flocus-main.css', 'utf8')
css = css.replaceAll('/resources/fonts/', '/fonts/')
const map = {
  'a8d7e850394f33cfb38d.woff2': 'degular-bold.woff2',
  '058438b44b35420114ac.woff2': 'degular-semibold.woff2',
  '11783d6e291288bd5095.woff2': 'inter.woff2',
}
for (const [hash, name] of Object.entries(map)) {
  css = css.replaceAll(hash, name)
}
fs.writeFileSync('src/styles/flocus-native.css', css)
console.log('flocus-native.css', css.length, 'bytes')
