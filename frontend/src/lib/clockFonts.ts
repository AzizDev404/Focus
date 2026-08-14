import type { ClockFont } from '../types'

export interface ClockFontDefinition {
  id: ClockFont
  label: string
  /** Value for `document.body` attribute `data-font`. */
  dataFont: string
  fontFamily: string
  fontWeight: number | string
  letterSpacing: string
}

export const CLOCK_FONT_DEFINITIONS: Record<ClockFont, ClockFontDefinition> = {
  default: {
    id: 'default',
    label: 'Default',
    dataFont: 'Default',
    fontFamily: "'Degular Bold', 'Inter', sans-serif",
    fontWeight: 700,
    letterSpacing: '-0.04em',
  },
  'minimal-wide': {
    id: 'minimal-wide',
    label: 'Minimal Wide',
    dataFont: 'Minimal Wide',
    fontFamily: "'Helvetica Neue LT Std', 'Inter', sans-serif",
    fontWeight: 750,
    letterSpacing: '-0.02em',
  },
  handwritten: {
    id: 'handwritten',
    label: 'Handwritten',
    dataFont: 'Handwritten',
    fontFamily: "'Gaegu', cursive",
    fontWeight: 700,
    letterSpacing: '0',
  },
  pixel: {
    id: 'pixel',
    label: 'Pixel',
    dataFont: 'Pixel',
    fontFamily: "'Press Start 2P', monospace",
    fontWeight: 400,
    letterSpacing: '0.04em',
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    dataFont: 'Custom',
    // Default fallback — uploaded fonts will be injected under the name
    // 'CustomClock' (or similar) so this entry acts as a sensible fallback.
    fontFamily: "'CustomClock', 'Inter', sans-serif",
    fontWeight: 400,
    letterSpacing: '0',
  },
}

/** Fonts shown in Settings → Clock & timer style (order preserved). */
export const CLOCK_FONT_PICKER_IDS = [
  'default',
  'handwritten',
  'pixel',
] as const satisfies readonly ClockFont[]

export function getClockFontDefinition(clockFont: ClockFont): ClockFontDefinition {
  return CLOCK_FONT_DEFINITIONS[clockFont] ?? CLOCK_FONT_DEFINITIONS.default
}

export function clockFontDataAttr(clockFont: ClockFont): string {
  return getClockFontDefinition(clockFont).dataFont
}

/** Map legacy persisted values after removing Minimal Light. */
export function normalizeClockFont(value: unknown): ClockFont {
  if (value === 'minimal-light') return 'pixel'
  if (value && typeof value === 'string' && value in CLOCK_FONT_DEFINITIONS) {
    return value as ClockFont
  }
  return 'default'
}

/** Google Fonts bundle for PiP / isolated documents (no access to index.html links). */
export const CLOCK_FONTS_GOOGLE_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Inter:wght@100..900&family=Press+Start+2P&display=swap'

export function pipClockFontCss(clockFont: ClockFont): string {
  const f = getClockFontDefinition(clockFont)
  return `
    font-family: ${f.fontFamily};
    font-weight: ${f.fontWeight};
    letter-spacing: ${f.letterSpacing};
  `
}
