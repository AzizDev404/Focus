// Generated from data manifest — see scripts/generate-data.js
import type { Theme } from '../types'
import { PERSONAL_PICS } from './picManifest'

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
  sourceFile: string
}

export const SOUNDS: SoundDef[] = []

export const THEMES: Theme[] = [
  {
    "id": "black",
    "name": "Black",
    "type": "solid",
    "plus": false,
    "gradient": "#0a0a0a",
    "animated": false,
    "environment": "abstract",
    "brightness": "dark",
    "sourceFile": "Black.jpg"
  },
  {
    "id": "white",
    "name": "White",
    "type": "solid",
    "plus": false,
    "gradient": "#f5f5f0",
    "animated": false,
    "environment": "abstract",
    "brightness": "light",
    "sourceFile": "White.jpg"
  },
  // One theme per personal photo. Each entry exposes both a landscape
  // (`image`) and portrait (`mobileImage`) URL — Background.tsx picks
  // whichever fits the current viewport.
  ...PERSONAL_PICS.map<Theme>((pic) => ({
    id: `pic-${pic.id}`,
    name: pic.name,
    type: 'world' as const,
    plus: false,
    animated: false,
    environment: 'scenic',
    brightness: 'light' as const,
    image: pic.desktop ?? pic.mobile ?? undefined,
    mobileImage: pic.mobile ?? pic.desktop ?? undefined,
  })),
]

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
  { id: 'picks', name: 'Tsukiyomi Picks', emoji: '🌙', description: 'A curated mix for work and relaxation.', spotifyId: '37i9dQZF1DX8NTey1Pt11a' },
  { id: 'piano', name: 'Relaxing Piano', emoji: '🎹', description: 'Gentle piano for a peaceful backdrop.', spotifyId: '37i9dQZF1DX4sWSpwq3LiO' },
  { id: 'vgm', name: 'Video Game Music', emoji: '👾', description: 'Chill nostalgic tracks from games.', spotifyId: '37i9dQZF1DX3OGO9Pq5HXm' },
  { id: 'jazzhop', name: 'Jazzhop', emoji: '🎷', description: 'Smooth grooves no matter what your mood.', spotifyId: '37i9dQZF1DWWQR3ui11tip' },
  { id: 'holiday', name: 'Holiday Lofi', emoji: '🎄', description: 'Festive beats for the holiday spirit.', spotifyId: '37i9dQZF1DX9uKN11c7J6k' },
]
