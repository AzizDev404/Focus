/** Allow safe subset for DM / social notes (not Telegram-style). */

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'h1',
  'h2',
  'h3',
  'blockquote',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'span',
  'img',
])

const STRIP_TAGS = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi

export function sanitizeChatHtml(raw) {
  const input = String(raw ?? '').trim()
  if (!input) return ''

  return input.replace(STRIP_TAGS, (match, tagName) => {
    const tag = tagName.toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) return ''

    if (tag === 'img') {
      const isSticker = /class\s*=\s*["'][^"']*chat-sticker/i.test(match)
      const srcMatch = match.match(/\bsrc\s*=\s*["']([^"']+)["']/i)
      const idMatch = match.match(/\bdata-sticker-id\s*=\s*["'](\d+)["']/i)
      if (!isSticker || !srcMatch || !idMatch) return ''
      const src = srcMatch[1]
      if (src.includes('..')) return ''
      if (
        !src.startsWith('/') &&
        !/^https?:\/\//i.test(src) &&
        !src.startsWith('data:image/svg+xml')
      ) {
        return ''
      }
      return `<img class="chat-sticker" data-sticker-id="${idMatch[1]}" src="${src}" alt="" />`
    }

    if (match.startsWith('</')) return `</${tag}>`
    return `<${tag}>`
  })
}
