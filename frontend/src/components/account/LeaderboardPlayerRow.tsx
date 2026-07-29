import { Coins, Flame, Sparkles } from '../icons'
import type { LeaderboardUser } from '../../lib/communityApi'
import { shopItemById } from '../../lib/profileApi'
import type { ShopItem } from '../../lib/auth/types'
import {
  equippedAvatarEmoji,
  equippedAvatarSrc,
  equippedFrameSrc,
} from '../../lib/shopItemVisuals'

import {
  prettyFocus,
  type LeaderboardSortKey,
} from './LeaderboardProfileCard'

type SortKey = LeaderboardSortKey

type Props = {
  user: LeaderboardUser
  sort: SortKey
  shopItems: ShopItem[]
  isSelf?: boolean
  onClick: () => void
}

export function LeaderboardPlayerRow({ user, sort, shopItems, isSelf, onClick }: Props) {
  const avatar = shopItemById(shopItems, user.equipped.avatar)
  const frame = shopItemById(shopItems, user.equipped.frame)
  const avatarSrc = equippedAvatarSrc(user.media, avatar)
  const avatarEmoji = equippedAvatarEmoji(user.media, avatar)
  const frameSrc = equippedFrameSrc(frame)

  const avatarFace = avatarSrc ? (
    <img src={avatarSrc} alt="" />
  ) : avatarEmoji ? (
    <span>{avatarEmoji}</span>
  ) : null

  return (
    <button
      type="button"
      className={`lb-row${isSelf ? ' is-self' : ''}`}
      onClick={onClick}
    >
      <span className="lb-row-rank">#{user.rank}</span>
      <div className="lb-row-avatar">
        {frameSrc ? (
          <span className="lb-row-avatar-framed">
            <span className="lb-row-avatar-face">{avatarFace}</span>
            <img className="lb-row-frame-overlay" src={frameSrc} alt="" aria-hidden />
          </span>
        ) : (
          <span className="lb-row-avatar-face">{avatarFace}</span>
        )}
      </div>
      <div className="lb-row-meta">
        <strong>{user.displayName}</strong>
        <small>ID {user.id}</small>
      </div>
      <span className={`lb-row-stat lb-row-stat--level${sort === 'level' ? ' is-primary' : ''}`}>
        <Sparkles size={10} aria-hidden /> {user.level}
      </span>
      <span className={`lb-row-stat lb-row-stat--focus${sort === 'focus' ? ' is-primary' : ''}`}>
        <Flame size={10} aria-hidden /> {prettyFocus(user.totalFocusSeconds)}
      </span>
      <span className={`lb-row-stat lb-row-stat--coins${sort === 'coins' ? ' is-primary' : ''}`}>
        <Coins size={10} aria-hidden /> {user.coins.toLocaleString()}
      </span>
    </button>
  )
}
