/** Allow a safe subset for chat / DM. Stickers must use same-origin paths. */

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
])

const STRIP_TAGS = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi
const STICKER_SRC =
  /^\/(stickers|uploads\/shop)\/[A-Za-z0-9._-]+$/

function escapeAttr(value) {
  return String(value).replace(/[&<>"']/g, (ch) => {
    if (ch === '&') return '&amp;'
    if (ch === '<') return '&lt;'
    if (ch === '>') return '&gt;'
    if (ch === '"') return '&quot;'
    return '&#39;'
  })
}

export function isAllowedStickerSrc(src) {
  if (typeof src !== 'string' || !src || src.includes('..') || src.includes('\\')) return false
  return STICKER_SRC.test(src)
}

function findTagEnd(html, start) {
  let quote = null
  for (let i = start; i < html.length; i += 1) {
    const ch = html[i]
    if (quote) {
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") quote = ch
    else if (ch === '>') return i
  }
  return -1
}

function rewriteImgs(html) {
  let out = ''
  let i = 0
  const lower = html.toLowerCase()
  while (i < html.length) {
    const start = lower.indexOf('<img', i)
    if (start === -1) {
      out += html.slice(i)
      break
    }
    out += html.slice(i, start)
    const end = findTagEnd(html, start)
    if (end === -1) break
    const tag = html.slice(start, end + 1)
    const isSticker = /class\s*=\s*["'][^"']*chat-sticker/i.test(tag)
    const srcMatch = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)
    const idMatch = tag.match(/\bdata-sticker-id\s*=\s*["'](\d+)["']/i)
    if (isSticker && srcMatch && idMatch && isAllowedStickerSrc(srcMatch[1])) {
      out += `<img class="chat-sticker" data-sticker-id="${escapeAttr(idMatch[1])}" src="${escapeAttr(srcMatch[1])}" alt="" />`
    }
    i = end + 1
  }
  return out
}

export function sanitizeChatHtml(raw) {
  const input = String(raw ?? '').trim()
  if (!input) return ''

  const withSafeTags = input.replace(STRIP_TAGS, (match, tagName) => {
    const tag = tagName.toLowerCase()
    if (tag === 'img') return match
    if (!ALLOWED_TAGS.has(tag)) return ''
    if (match.startsWith('</')) return `</${tag}>`
    return `<${tag}>`
  })
  return rewriteImgs(withSafeTags)
}
