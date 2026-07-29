/**
 * Generates src/data/catalog.ts from Flocus bundle extraction.
 * Run: node scripts/generate-data.js
 */
import fs from 'fs'

const UNSPLASH = {
  AquariumTunnel: 'photo-1559827260-407dc96809b3',
  Arcade: 'photo-1511512578047-dfb367046420',
  AustrianAlps: 'photo-1506905925346-21bda4d32df4',
  AutumnPark: 'photo-1441974231531-c6227db76b6e',
  BeachSunset: 'photo-1507525428034-b723cf961d3e',
  BrooklynBridge: 'photo-1496442226666-8d4d0e62e6e9',
  ButterflyConservatory: 'photo-1518531937837-84b3695fb769',
  CafeJenesais: 'photo-1554118811-1e0d58224f24',
  CapriSummer: 'photo-1530520660222-472a807f7929',
  CherryBlossom: 'photo-1522383225653-ed111181a951',
  CoastalBreeze: 'photo-1505142468610-359e7d316be0',
  CottonCandySky: 'photo-1534088568595-a066be17153f',
  CountrysideMorning: 'photo-1464822759023-fed622ff2c0b',
  CountrysideNight: 'photo-1419242902214-272b3b66fd7a',
  CozyFireplace: 'photo-1518495973542-4542c06a5843',
  CozyKitchen: 'photo-1556910103-1c02745aae4d',
  DarkAcademiaLibrary: 'photo-1507842217343-583bb7270b66',
  Driving: 'photo-1449965408869-eaa3f722e40d',
  DuneNight: 'photo-1509316781159-3a67f3540a1b',
  DuneSunrise: 'photo-1470071459604-3b5ec3a7fe05',
  DuskPeak: 'photo-1469474968028-56623f04e105',
  Eras: 'photo-1493246504259-6e8f5bb96227',
  FirstClass: 'photo-1436491865332-7a61a109cc05',
  FlocusHollow: 'photo-1518173946627-2f4edb0aeef6',
  Forest: 'photo-1448375240586-882707db999b',
  ForestRetreat: 'photo-1441974231531-c6227db76b6e',
  FujiConvenience: 'photo-1542051841857-5f90071e7989',
  GoldenGateFog: 'photo-1501594907352-04cda38b714c',
  HolidayStreet: 'photo-1512389142860-9c449e58b814',
  LakeComoPath: 'photo-1523906834658-1559a305ff4f',
  LavenderField: 'photo-1499002237860-647251719196',
  LofiCafe: 'photo-1495474472287-4d71bcdd2085',
  LofiClouds: 'photo-1506905925346-21bda4d32df4',
  MinimalistDesert: 'photo-1509316781159-3a67f3540a1b',
  MorningLibrary: 'photo-1481620774760-56d93e4aa6de',
  MorningSakura: 'photo-1522383225653-ed111181a951',
  NightLofiBedroom: 'photo-1522771739844-6a9f6d5f14af',
  OuterSpace: 'photo-1419242902214-272b3b66fd7a',
  PumpkinPatch: 'photo-1509557964664-c5e7bfc9e8b0',
  RainyNYCEvening: 'photo-1496568816309-87b88bfa5966',
  SafariSunset: 'photo-1516426122078-c23e76319801',
  SakuraBedroom: 'photo-1522771739844-6a9f6d5f14af',
  SeoulNightCafe: 'photo-1555396273-367ea4eb4db5',
  SunshinePlaza: 'photo-1449824913935-59a10b8d2000',
  Superbloom: 'photo-1499002237860-647251719196',
  TokyoCommute: 'photo-1540959733332-eab4deabeeaf',
  TotoForest: 'photo-1448375240586-882707db999b',
  TropicalRiver: 'photo-1439066615861-d1af74d74000',
  TuscanVillage: 'photo-1523906834658-1559a305ff4f',
  UnderwaterReef: 'photo-1559827260-407dc96809b3',
  WesternTown: 'photo-1509316781159-3a67f3540a1b',
  WinterCabin: 'photo-1518173946627-2f4edb0aeef6',
  Bedroom: 'photo-1522771739844-6a9f6d5f14af',
  Fireplace: 'photo-1518495973542-4542c06a5843',
}

const GRADIENTS = {
  AuraTwilight: 'linear-gradient(135deg, #1a1a2e 0%, #4a1942 40%, #c84b6a 100%)',
  AuraHeart: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
  AuraHeartDarkPurple: 'linear-gradient(160deg, #2d1b4e 0%, #5b247a 50%, #8e44ad 100%)',
  AuraHeartLightPink: 'linear-gradient(160deg, #ffc3d4 0%, #ff8fab 100%)',
  AuraHeartLightPurple: 'linear-gradient(160deg, #e0c3fc 0%, #8ec5fc 100%)',
  Flare: 'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)',
  FlareBlue: 'linear-gradient(135deg, #0c1445 0%, #3d5af1 50%, #22d3ee 100%)',
  FlarePink: 'linear-gradient(135deg, #2d1b4e 0%, #e056fd 50%, #f78fb3 100%)',
  FlareRainbow: 'linear-gradient(90deg, #ff6b6b, #feca57, #1dd1a1, #54a0ff, #5f27cd)',
  FlareDark: 'linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  HeatMap: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
  GrainyGradient: 'linear-gradient(180deg, #434343 0%, #000000 100%)',
  Black: '#0a0a0a',
  White: '#f5f5f0',
  animatedflocusviolet: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  animatedpastellofi: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  animatedsakura: 'linear-gradient(160deg, #ffd1dc 0%, #ffb7c5 50%, #ff8fab 100%)',
  animated: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'loficafe-animated': 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',
}

const FREE_THEMES = new Set([
  'flocus-violet', 'pastel-lofi', 'sakura', 'minimalist-black', 'minimalist-white',
  'lofi-cafe', 'rainy-nyc-evening', 'cozy-fireplace', 'forest-retreat', 'beach-sunset',
])

const FREE_SOUNDS = new Set(['rain', 'ocean', 'cafe', 'airplane', 'exam'])

const PIXABAY = {
  rain: 'https://cdn.pixabay.com/audio/2022/03/24/audio_96b78d4f8b.mp3',
  ocean: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  cafe: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8cb0e39433.mp3',
  airplane: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1538c.mp3',
  exam: 'https://cdn.pixabay.com/audio/2022/03/10/audio_8cb0e39433.mp3',
  commuter: 'https://cdn.pixabay.com/audio/2022/03/09/audio_3a96ac1f8b.mp3',
  'japanese-library': 'https://cdn.pixabay.com/audio/2022/03/09/audio_3a96ac1f8b.mp3',
  'nyc-morning': 'https://cdn.pixabay.com/audio/2022/03/15/audio_8cb0e39433.mp3',
  'light-rain': 'https://cdn.pixabay.com/audio/2022/03/24/audio_96b78d4f8b.mp3',
  'heavy-rain': 'https://cdn.pixabay.com/audio/2022/03/24/audio_c8c8a96adf.mp3',
  thunderstorm: 'https://cdn.pixabay.com/audio/2022/03/24/audio_c8c8a96adf.mp3',
  fireplace: 'https://cdn.pixabay.com/audio/2022/10/25/audio_2f4d649f18.mp3',
  campfire: 'https://cdn.pixabay.com/audio/2022/10/25/audio_2f4d649f18.mp3',
  office: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8cb0e39433.mp3',
  wind: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a96adf.mp3',
  'street-cafe': 'https://cdn.pixabay.com/audio/2022/03/15/audio_8cb0e39433.mp3',
  'countryside-morning-sound': 'https://cdn.pixabay.com/audio/2022/03/09/audio_3a96ac1f8b.mp3',
  birds: 'https://cdn.pixabay.com/audio/2022/03/09/audio_3a96ac1f8b.mp3',
  keyboard: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa1c82.mp3',
  'cat-purr': 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13b3c9e.mp3',
  waterfall: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  whales: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  clock: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa1c82.mp3',
}

function slug(s) {
  return s.replace(/\.(jpg|mp4)$/i, '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

function titleCase(base) {
  return base
    .replace(/\.(jpg|mp4)$/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/Nyc/g, 'NYC')
    .replace(/Lofi/g, 'Lofi')
}

const themeMap = JSON.parse(fs.readFileSync('scripts/theme-map.json', 'utf8'))
const soundsRaw = JSON.parse(fs.readFileSync('src/data/flocus-sounds.generated.json', 'utf8'))

const themes = themeMap.map((t) => {
  const base = t.file.replace(/\.jpg$/i, '')
  const id = slug(t.file)
  const isGradient = GRADIENTS[base] || base.startsWith('Flare') || base.startsWith('Aura') || ['Black', 'White', 'HeatMap', 'GrainyGradient'].includes(base) || base.startsWith('animated')
  const isAnimated = base.toLowerCase().includes('animated') || base === 'LofiCafe' || base === 'LofiClouds' || base === 'Fireplace'
  let type = 'world'
  if (isGradient) type = 'gradient'
  if (isAnimated && !isGradient) type = 'animated'

  const unsplash = UNSPLASH[base]
  const gradient = GRADIENTS[base]
  const image = unsplash ? `https://images.unsplash.com/${unsplash}?w=1920&q=85&auto=format` : undefined

  return {
    id,
    name: titleCase(base),
    type,
    plus: false,
    gradient,
    image,
    animated: type === 'animated',
    environment: type === 'world' ? 'scenic' : type === 'gradient' ? 'abstract' : 'interior',
    brightness: ['Black', 'DarkAcademiaLibrary', 'NightLofiBedroom', 'RainyNYCEvening', 'DuneNight', 'OuterSpace'].includes(base) ? 'dark' : 'light',
    flocusFile: t.file,
  }
})

const sounds = soundsRaw.map((s) => ({
  ...s,
  plus: false,
  kind: ['white-noise', 'pink-noise', 'brown-noise'].includes(s.id)
    ? s.id.replace('-', '_').replace('noise', 'noise') 
    : s.id.startsWith('binaural')
      ? s.id
      : 'url',
  url: PIXABAY[s.id],
}))

// fix noise kinds
for (const s of sounds) {
  if (s.id === 'white-noise') s.kind = 'noise-white'
  if (s.id === 'pink-noise') s.kind = 'noise-pink'
  if (s.id === 'brown-noise') s.kind = 'noise-brown'
  if (s.id.startsWith('binaural')) s.kind = `binaural-${s.id.split('-')[1]}`
  if (!s.url && !s.kind.startsWith('noise') && !s.kind.startsWith('binaural')) {
    s.url = PIXABAY.rain // fallback loop
  }
}

const out = `// AUTO-GENERATED from Flocus bundle — node scripts/generate-data.js
import type { Theme } from '../types'

export const FLOCUS_PRIMARY = '#7432FF'

export const SOUND_CATEGORIES = ['all', 'focus', 'interior', 'lifestyle', 'nature', 'niche', 'weather'] as const

export interface SoundDef {
  id: string
  name: string
  emoji: string
  category: 'focus' | 'interior' | 'lifestyle' | 'nature' | 'niche' | 'weather'
  plus: boolean
  kind: string
  url?: string
  file?: string
  flocusFile: string
}

export const SOUNDS: SoundDef[] = ${JSON.stringify(sounds.map(s => ({...s, flocusFile: s.file})), null, 2)}

export const THEMES: Theme[] = ${JSON.stringify(themes, null, 2)}

export function getTheme(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id)
}

export function getSound(id: string): SoundDef | undefined {
  return SOUNDS.find((s) => s.id === id)
}

export const STATIC_TALLIES = [
  { id: 'dots', icon: '●', label: 'Dots' },
  { id: 'hearts', icon: '♥', label: 'Hearts' },
  { id: 'stars', icon: '★', label: 'Stars' },
  { id: 'tomato', icon: '🍅', label: 'Tomatoes' },
  { id: 'bolt', icon: '⚡', label: 'Bolts' },
  { id: 'graduation', icon: '🎓', label: 'Graduation' },
  { id: 'snowflake', icon: '❄️', label: 'Snowflake' },
  { id: 'snowman', icon: '☃️', label: 'Snowman' },
  { id: 'xmas', icon: '🎄', label: 'Christmas Tree' },
]

export const DYNAMIC_TALLIES = [
  { id: 'growing-tree', label: 'Growing Tree', stages: ['🌱', '🌿', '🌳', '🌳'] },
  { id: 'flower-bloom', label: 'Flower Bloom', stages: ['🌱', '🌷', '🌸', '🌺'] },
  { id: 'study-grind', label: 'Study Grind', stages: ['📖', '📚', '🎓', '🏆'] },
  { id: 'going-to-space', label: 'Going To Space', stages: ['🌍', '🚀', '🛸', '🌌'] },
  { id: 'nyc-vacation', label: 'NYC Vacation', stages: ['✈️', '🗽', '🌃', '🎉'] },
  { id: 'tokyo-vacation', label: 'Tokyo Vacation', stages: ['✈️', '🗼', '🌸', '🎊'] },
  { id: 'beach-vacation', label: 'Beach Vacation', stages: ['✈️', '🏖️', '🌊', '🌅'] },
  { id: 'mountain-climb', label: 'Mountain Climb', stages: ['🥾', '⛰️', '🏔️', '🚩'] },
  { id: 'self-care', label: 'Self Care Evening', stages: ['🛁', '🧖', '💆', '✨'] },
  { id: 'meal-prep', label: 'Meal Prep', stages: ['🥕', '🍳', '🍱', '😋'] },
  { id: 'rain-rainbow', label: 'Rain to Rainbow', stages: ['🌧️', '🌦️', '🌈', '☀️'] },
  { id: 'stem', label: 'STEM', stages: ['🔬', '⚗️', '🧬', '🚀'] },
  { id: 'medical', label: 'Medical', stages: ['📋', '💊', '🩺', '❤️‍🩹'] },
  { id: 'law', label: 'Law', stages: ['📜', '⚖️', '👨‍⚖️', '🏛️'] },
  { id: 'art', label: 'Art', stages: ['🖌️', '🎨', '🖼️', '✨'] },
]

export const ALERT_SOUNDS = [
  { id: 'sparkle', label: '✨ Sparkle', freq: 880 },
  { id: 'train', label: '🚈 Train Arrival', freq: 440 },
  { id: 'commuter', label: '🚉 Commuter Jingle', freq: 523 },
  { id: 'gameshow', label: '🎲 Game Show', freq: 659 },
  { id: 'airport', label: '🛫 Airport', freq: 392 },
  { id: 'soft', label: '☁️ Soft', freq: 330 },
  { id: 'chime', label: '🔔 Chime', freq: 880 },
  { id: 'piano', label: '🎹 Piano', freq: 523 },
  { id: 'success', label: '🏆 Success', freq: 784 },
  { id: 'levelup', label: '👾 Level Up', freq: 988 },
  { id: 'applause', label: '👏 Applause', freq: 440 },
  { id: 'none', label: '🔕 No Alert', freq: 0 },
]

export const CURATED_PLAYLISTS = [
  { id: 'lofi', name: 'Lofi', emoji: '🎧', description: 'Easygoing beats for both focus and downtime.', spotifyId: '37i9dQZF1DWWQR3ui11tip' },
  { id: 'rainy-lofi', name: 'Rainy Day Lofi', emoji: '☔️', description: 'Drizzly beats for cozy reflections.', spotifyId: '37i9dQZF1DWY4lFlS4Pnso' },
  { id: 'paris', name: 'Paris Café', emoji: '🥐', description: 'Charming sounds from streets of Paris.', spotifyId: '37i9dQZF1DX9uKN11c7J6k' },
  { id: 'picks', name: 'Flocus Picks', emoji: '🥐', description: 'A curated mix for work and relaxation.', spotifyId: '37i9dQZF1DX8NTey1Pt11a' },
  { id: 'piano', name: 'Relaxing Piano', emoji: '🎹', description: 'Gentle piano for a peaceful backdrop.', spotifyId: '37i9dQZF1DX4sWSpwq3LiO' },
  { id: 'vgm', name: 'Video Game Music', emoji: '👾', description: 'Chill nostalgic tracks from games.', spotifyId: '37i9dQZF1DX3OGO9Pq5HXm' },
  { id: 'jazzhop', name: 'Jazzhop', emoji: '🎷', description: 'Smooth grooves no matter what your mood.', spotifyId: '37i9dQZF1DWWQR3ui11tip' },
  { id: 'holiday', name: 'Holiday Lofi', emoji: '🎄', description: 'Festive beats for the holiday spirit.', spotifyId: '37i9dQZF1DX9uKN11c7J6k' },
]
`

fs.writeFileSync('src/data/catalog.ts', out)
console.log('Wrote catalog.ts —', themes.length, 'themes,', sounds.length, 'sounds')
