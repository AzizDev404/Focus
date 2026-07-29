import type { ShopItem } from './auth/types'

/** Built-in stickers — always available in chat without purchase. */
export const DEFAULT_CHAT_STICKERS: ReadonlyArray<Pick<ShopItem, 'id' | 'name' | 'preview' | 'emoji'>> = [
  { id: 101, name: 'Moon', preview: '/stickers/moon.svg', emoji: '🌙' },
  { id: 102, name: 'Wave', preview: '/stickers/wave.svg', emoji: '👋' },
  { id: 103, name: 'Heart', preview: '/stickers/heart.svg', emoji: '💜' },
  { id: 104, name: 'Star', preview: '/stickers/star.svg', emoji: '⭐' },
  { id: 105, name: 'Fire', preview: '/stickers/fire.svg', emoji: '🔥' },
  { id: 106, name: 'Sparkle', preview: '/stickers/sparkle.svg', emoji: '✨' },
]

export type ChatSticker = Pick<ShopItem, 'id' | 'name' | 'preview' | 'emoji'>

/** Stickers the user owns (admin shop uploads in inventory). */
export function getOwnedChatStickers(owned: ShopItem[]): ChatSticker[] {
  return owned
    .filter((item) => item.type === 'sticker')
    .map((item) => ({
      id: item.id,
      name: item.name,
      preview: item.preview,
      emoji: item.emoji,
    }))
}

/** Owned shop stickers only — no built-in defaults in chat UI. */
export function mergeChatStickers(owned: ShopItem[]): ChatSticker[] {
  return getOwnedChatStickers(owned)
}

export function stickerPreviewSrc(item: ChatSticker): string | null {
  if (item.preview) {
    return item.preview.startsWith('/') ? item.preview : `/${item.preview}`
  }
  if (item.emoji) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text x="32" y="44" font-size="44" text-anchor="middle">${item.emoji}</text></svg>`
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
  }
  return null
}

export function buildStickerHtml(item: ChatSticker): string {
  const src = stickerPreviewSrc(item)
  if (!src) return ''
  return `<p><img class="chat-sticker" data-sticker-id="${item.id}" src="${src}" alt="" /></p>`
}
