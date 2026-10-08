import type { ClockFont, QuoteFont } from '../types'

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

/* =========================================================
 *  QUOTE FONTS
 * ========================================================= */

export interface QuoteFontDefinition {
  id: QuoteFont
  label: string
  /** Value for `document.body` attribute `data-quote-font`. */
  dataFont: string
  fontFamily: string
  fontWeight: number | string
  letterSpacing: string
  fontStyle?: 'normal' | 'italic'
}

export const QUOTE_FONT_DEFINITIONS: Record<QuoteFont, QuoteFontDefinition> = {
  default: {
    id: 'default',
    label: 'Elegant Sans',
    dataFont: 'Default',
    fontFamily: "'Inter', 'Degular', system-ui, sans-serif",
    fontWeight: 400,
    letterSpacing: '0.005em',
  },
  'minimal-wide': {
    id: 'minimal-wide',
    label: 'Serif Wide',
    dataFont: 'Minimal Wide',
    fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
    fontWeight: 400,
    letterSpacing: '0.02em',
    fontStyle: 'italic',
  },
  handwritten: {
    id: 'handwritten',
    label: 'Handwritten',
    dataFont: 'Handwritten',
    fontFamily: "'Gaegu', 'Caveat', cursive",
    fontWeight: 500,
    letterSpacing: '0.01em',
  },
  pixel: {
    id: 'pixel',
    label: 'Pixel Serif',
    dataFont: 'Pixel',
    fontFamily: "'VT323', 'Press Start 2P', monospace",
    fontWeight: 400,
    letterSpacing: '0.01em',
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    dataFont: 'Custom',
    fontFamily: "'CustomQuote', 'Inter', sans-serif",
    fontWeight: 400,
    letterSpacing: '0',
  },
}

export const QUOTE_FONT_PICKER_IDS = [
  'default',
  'minimal-wide',
  'handwritten',
  'pixel',
] as const satisfies readonly QuoteFont[]

export function getQuoteFontDefinition(quoteFont: QuoteFont): QuoteFontDefinition {
  return QUOTE_FONT_DEFINITIONS[quoteFont] ?? QUOTE_FONT_DEFINITIONS.default
}

export function quoteFontDataAttr(quoteFont: QuoteFont): string {
  return getQuoteFontDefinition(quoteFont).dataFont
}

export function normalizeQuoteFont(value: unknown): QuoteFont {
  if (value && typeof value === 'string' && value in QUOTE_FONT_DEFINITIONS) {
    return value as QuoteFont
  }
  return 'default'
}

/** Google Fonts bundle — covers both clock + quote font families. */
export const CLOCK_FONTS_GOOGLE_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Gaegu:wght@400;700&family=Inter:wght@100..900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Press+Start+2P&family=VT323&display=swap'

export function pipClockFontCss(clockFont: ClockFont): string {
  const f = getClockFontDefinition(clockFont)
  return `
    font-family: ${f.fontFamily};
    font-weight: ${f.fontWeight};
    letter-spacing: ${f.letterSpacing};
  `
}

function cssQuoted(value: string) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export function customClockFontFaceRule(name: string, url: string): string | null {
  const family = String(name ?? '').trim()
  const src = String(url ?? '').trim()
  if (!/^[A-Za-z0-9 _-]{1,64}$/.test(family)) return null
  if (
    !/^(data:font\/|data:application\/(font|octet-stream)|https?:|blob:)/i.test(src) &&
    !src.startsWith('/')
  ) {
    return null
  }
  if (src.includes(')') || src.includes(';')) return null
  return `@font-face { font-family: "${cssQuoted(family)}"; src: url("${cssQuoted(src)}"); font-weight: normal; font-style: normal; }`
}

/** @alias same validator for quote fonts */
export const customQuoteFontFaceRule = customClockFontFaceRule
