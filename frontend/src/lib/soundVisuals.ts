const CATEGORY_GRADIENTS: Record<string, string> = {
  focus: 'linear-gradient(145deg, #4c1d95 0%, #7432FF 55%, #a78bfa 100%)',
  interior: 'linear-gradient(145deg, #78350f 0%, #b45309 55%, #fcd34d 100%)',
  lifestyle: 'linear-gradient(145deg, #831843 0%, #db2777 55%, #fbcfe8 100%)',
  nature: 'linear-gradient(145deg, #14532d 0%, #15803d 55%, #86efac 100%)',
  niche: 'linear-gradient(145deg, #312e81 0%, #4338ca 55%, #8b48ff 100%)',
  weather: 'linear-gradient(145deg, #0c4a6e 0%, #0284c7 55%, #bae6fd 100%)',
  all: 'linear-gradient(145deg, #374151 0%, #6b7280 55%, #d1d5db 100%)',
}

import type { CSSProperties } from 'react'

export function soundIconStyle(category: string, soundId: string): CSSProperties {
  const hash = soundId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const hueShift = (hash % 40) - 20
  const base = CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.all
  return {
    background: base,
    filter: hueShift ? `hue-rotate(${hueShift}deg)` : undefined,
    borderRadius: '0.65rem',
    width: '3rem',
    height: '3rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
  }
}
