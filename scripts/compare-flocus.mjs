// Compares features in our app vs the live Flocus bundle.
// Goal: surface any panels/features/strings that exist on app.flocus.com
// but are missing locally, so we can close the gap.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const live = fs.readFileSync(path.join(ROOT, 'scripts', 'flocus-main.js'), 'utf8')

// Display strings we expect to find in the live bundle.
// These act as a fingerprint for each Flocus feature.
const PROBES = {
  Panels: [
    'Tasks',
    'Notepad',
    'Sounds',
    'Music',
    'Stats',
    'Settings',
    'Focus Mode',
    'Ambient Mode',
  ],
  'Sound categories': ['Focus', 'Interior', 'Lifestyle', 'Nature', 'Niche', 'Weather'],
  'Sounds (display names)': [
    'Rain',
    'Ocean',
    'Bustling Café',
    'Airplane Cabin',
    'Exam Hall',
    'Commuter Train',
    'Japanese Library',
    'NYC Morning',
    'Light Rain',
    'Heavy Rain',
    'Thunderstorm',
    'Fireplace',
    'Campfire',
    'Office',
    'Wind',
    'Street Café',
    'Countryside Morning',
    'Deep Sea',
    'Air Conditioner',
    'Room Fan',
    'Summer Night',
    'Central Park',
    'Airport Terminal',
    'Underwater',
    'Birds in Woods',
    'Waterfall',
    'Light Rain on Tent',
    'Laptop Keyboard',
    'Whales',
    'Home Kitchen',
    'Bowling Alley',
    'Record Player Static',
    'Outer Space Rumble',
    'Clock Ticking',
    'Cat Purring',
    'White Noise',
    'Pink Noise',
    'Brown Noise',
    'Waves: Alpha',
    'Waves: Beta',
    'Waves: Delta',
    'Waves: Gamma',
    'Waves: Theta',
  ],
  'Settings tabs': [
    'Home Theme',
    'Focus Theme',
    'Ambient Theme',
    'Clock',
    'Focus Timer',
    'Display',
    'Notifications',
    'Sounds',
    'Stats',
    'Account',
    'Extras',
    'Reminders',
    'Onboarding',
  ],
  'Pomodoro & alerts': [
    'Pomodoro',
    'Flip Timer',
    'Show seconds',
    'Static session tally',
    'Dynamic tally',
    'Auto start',
    'Long break',
    'Short break',
    'Alert sound',
    'Alert volume',
  ],
  'Themes filters': ['World', 'Gradient', 'Animated', 'Solid Color', 'Scenic', 'Urban', 'Nature', 'Interior', 'Abstract'],
  'Plus features': ['Plus', 'Upgrade'],
  'Onboarding / promo': ['Welcome', 'Get started', 'Try Plus'],
  'Music sources': ['Spotify', 'YouTube', 'Lofi'],
}

const localPaths = ['src', 'index.html'].flatMap((p) => walk(path.join(ROOT, p)))
const localContent = localPaths
  .filter((f) => /\.(ts|tsx|js|mjs|css|html)$/.test(f))
  .map((f) => fs.readFileSync(f, 'utf8'))
  .join('\n')

function walk(p) {
  const stat = fs.statSync(p)
  if (stat.isFile()) return [p]
  return fs.readdirSync(p).flatMap((c) => walk(path.join(p, c)))
}

function fingerprint(content, label, list) {
  console.log(`\n## ${label}`)
  for (const probe of list) {
    const inLive = content.includes(probe)
    const inLocal = localContent.includes(probe)
    const tagLive = inLive ? 'flocus✓' : 'flocus✗'
    const tagLocal = inLocal ? 'local✓' : 'local✗'
    const diff = inLive && !inLocal ? '   <-- MISSING locally' : inLocal && !inLive ? '   (extra locally)' : ''
    console.log(`  [${tagLive}] [${tagLocal}] "${probe}"${diff}`)
  }
}

for (const [label, list] of Object.entries(PROBES)) {
  fingerprint(live, label, list)
}
