import type { CSSProperties } from 'react'
import type { LeaderboardUser } from './communityApi'
import type { ShopItem } from './auth/types'
import { shopItemById } from './profileApi'
import {
  equippedAvatarEmoji,
  equippedAvatarSrc,
  equippedBannerStyle,
  equippedFrameSrc,
  isShopImagePreview,
} from './shopItemVisuals'

export type LeaderboardUserVisuals = {
  bannerImageSrc: string | null
  bannerStyle: CSSProperties
  avatarUrl: string | null
  avatarEmoji: string | null
  frameSrc: string | null
}

export function leaderboardUserVisuals(
  user: Pick<LeaderboardUser, 'media' | 'equipped'>,
  shopItems: ShopItem[],
): LeaderboardUserVisuals {
  const bg = shopItemById(shopItems, user.equipped.background)
  const avatar = shopItemById(shopItems, user.equipped.avatar)
  const frame = shopItemById(shopItems, user.equipped.frame)

  const bannerImageSrc =
    user.media.backgroundUrl ?? (isShopImagePreview(bg?.preview) ? bg.preview : null)

  return {
    bannerImageSrc,
    bannerStyle: bannerImageSrc
      ? { background: '#10121a' }
      : equippedBannerStyle(user.media, bg, 'linear-gradient(135deg, #141820 0%, #1e293b 55%, #334155 100%)'),
    avatarUrl: equippedAvatarSrc(user.media, avatar),
    avatarEmoji: equippedAvatarEmoji(user.media, avatar),
    frameSrc: equippedFrameSrc(frame),
  }
}
