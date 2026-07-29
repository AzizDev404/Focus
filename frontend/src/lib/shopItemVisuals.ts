import type { CSSProperties, ReactNode } from 'react'
import type { ShopItem } from './auth/types'

export function isShopImagePreview(preview?: string | null): preview is string {
  return typeof preview === 'string' && preview.startsWith('/uploads/')
}

export function isCssRingFrame(preview?: string | null): boolean {
  return preview === 'ring-gold' || preview === 'ring-silver'
}

export function equippedFrameSrc(
  frame: Pick<ShopItem, 'preview'> | null | undefined,
): string | null {
  if (!frame || !isShopImagePreview(frame.preview)) return null
  return frame.preview
}

export function equippedCharmVisual(
  charm: Pick<ShopItem, 'preview' | 'emoji'> | null | undefined,
): { kind: 'image'; src: string } | { kind: 'emoji'; emoji: string } | null {
  if (!charm) return null
  if (isShopImagePreview(charm.preview)) return { kind: 'image', src: charm.preview }
  if (charm.emoji) return { kind: 'emoji', emoji: charm.emoji }
  return null
}

export function shopItemPreviewStyle(
  preview: string,
  fit: 'cover' | 'contain' = 'cover',
): CSSProperties {
  if (preview.startsWith('/uploads/')) {
    return {
      backgroundImage: `url(${preview})`,
      backgroundSize: fit,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }
  if (preview.startsWith('linear-gradient')) return { background: preview }
  if (preview.startsWith('ring-')) return { background: '#1e293b' }
  return { background: preview }
}

export function equippedBannerStyle(
  media: { backgroundUrl: string | null },
  bg: Pick<ShopItem, 'preview'> | null | undefined,
  fallback = 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%)',
): CSSProperties {
  if (media.backgroundUrl) {
    return { background: 'transparent' }
  }
  if (bg?.preview && isShopImagePreview(bg.preview)) {
    return { background: 'transparent' }
  }
  if (bg?.preview) return shopItemPreviewStyle(bg.preview)
  return { background: fallback }
}

export function equippedAvatarSrc(
  media: { avatarUrl: string | null },
  avatar: Pick<ShopItem, 'preview'> | null | undefined,
): string | null {
  if (media.avatarUrl) return media.avatarUrl
  if (isShopImagePreview(avatar?.preview)) return avatar.preview
  return null
}

export function equippedAvatarEmoji(
  media: { avatarUrl: string | null },
  avatar: Pick<ShopItem, 'preview' | 'emoji'> | null | undefined,
): string | null {
  if (media.avatarUrl || isShopImagePreview(avatar?.preview)) return null
  return avatar?.emoji ?? null
}

/** Emoji overlay for cards whose container already uses `shopItemPreviewStyle`. */
export function shopItemOverlayFace(item: Pick<ShopItem, 'preview' | 'emoji'>): ReactNode {
  if (isShopImagePreview(item.preview)) return null
  return item.emoji
}
