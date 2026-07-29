import { useCallback, useEffect, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Crown, Medal, Sparkles, Trophy, User } from '../icons'
import type { ShopItem, UserProfile } from '../../lib/auth/types'
import { bannerHeightForWidth } from '../../lib/profileMediaFit'
import { shopItemById } from '../../lib/profileApi'
import {
  equippedAvatarEmoji,
  equippedAvatarSrc,
  equippedBannerStyle,
  equippedCharmVisual,
  equippedFrameSrc,
  isShopImagePreview,
} from '../../lib/shopItemVisuals'
import { ProfileCharmPin } from './ProfileCharmPin'

export type ProfileGlassCardSize = 'full' | 'compact' | 'mini'

export type ProfileGlassCardProps = {
  displayName: string
  level: number
  shopItems: ShopItem[]
  media: UserProfile['media']
  equipped: UserProfile['equipped']
  subtitle?: string
  xpProgress?: number
  xpToNext?: number
  rank?: number
  size?: ProfileGlassCardSize
  highlightStat?: 'level' | 'focus' | 'coins'
  statsFooter?: ReactNode
  actions?: ReactNode
  onClick?: () => void
  className?: string
  wrapClassName?: string
  isSelf?: boolean
  animate?: boolean
  userId?: number
  charmInteractive?: boolean
  showXpBar?: boolean
  showCharm?: boolean
  showLevelPill?: boolean
}

const RANK_ICON = { 1: Crown, 2: Trophy, 3: Medal } as const
const RANK_LABEL: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' }

export function ProfileGlassCard({
  displayName,
  level,
  shopItems,
  media,
  equipped,
  subtitle,
  xpProgress = 0,
  xpToNext = 0,
  rank,
  size = 'full',
  highlightStat,
  statsFooter,
  actions,
  onClick,
  className = '',
  wrapClassName = '',
  isSelf,
  animate = false,
  userId,
  charmInteractive,
  showXpBar = true,
  showCharm = true,
  showLevelPill = true,
}: ProfileGlassCardProps) {
  const cardRef = useRef<HTMLElement>(null)
  const bannerImgRef = useRef<HTMLImageElement>(null)

  const bg = shopItemById(shopItems, equipped.background)
  const avatar = shopItemById(shopItems, equipped.avatar)
  const frame = shopItemById(shopItems, equipped.frame)
  const charm = shopItemById(shopItems, equipped.charm)
  const charmVisual = equippedCharmVisual(charm)
  const showCharmPin = Boolean(showCharm && charmVisual && userId != null)
  const charmCanDrag = charmInteractive === true
  const safeMedia = media ?? { avatarUrl: null, backgroundUrl: null }

  const bannerImageSrc =
    safeMedia.backgroundUrl ?? (isShopImagePreview(bg?.preview) ? bg.preview : null)
  const bannerStyle: CSSProperties = bannerImageSrc
    ? { background: 'transparent' }
    : equippedBannerStyle(safeMedia, bg)

  const syncBannerHeight = useCallback((img?: HTMLImageElement | null) => {
    if (size === 'full') return
    const el = img ?? bannerImgRef.current
    const card = cardRef.current
    if (!el || !card || !el.naturalWidth) return
    const measured = el.offsetHeight
    const h =
      measured > 0
        ? measured
        : bannerHeightForWidth(card.clientWidth, el.naturalWidth, el.naturalHeight)
    card.style.setProperty('--profile-banner-height', `${h}px`)
  }, [size])

  useEffect(() => {
    if (!bannerImageSrc || size === 'full') return
    const card = cardRef.current
    if (!card) return
    const ro = new ResizeObserver(() => syncBannerHeight())
    ro.observe(card)
    return () => ro.disconnect()
  }, [bannerImageSrc, size, syncBannerHeight])

  const frameClass =
    frame?.preview === 'ring-gold'
      ? 'profile-frame-gold'
      : frame?.preview === 'ring-silver'
        ? 'profile-frame-silver'
        : frame && !isShopImagePreview(frame.preview)
          ? 'profile-frame-default'
          : ''

  const frameSrc = equippedFrameSrc(frame)
  const avatarSrc = equippedAvatarSrc(safeMedia, avatar)
  const avatarEmoji = equippedAvatarEmoji(safeMedia, avatar)

  const avatarInner = avatarSrc ? (
    <img className="profile-avatar-image" src={avatarSrc} alt="" />
  ) : avatarEmoji ? (
    <span className="profile-avatar-emoji">{avatarEmoji}</span>
  ) : (
    <span className="profile-avatar-icon" aria-hidden>
      <User size={size === 'mini' ? 18 : size === 'compact' ? 22 : 34} strokeWidth={1.75} />
    </span>
  )

  const xpPct = Math.round((xpProgress ?? 0) * 100)
  const RankIcon = rank != null ? (RANK_ICON[rank as 1 | 2 | 3] ?? Trophy) : Trophy

  const isFull = size === 'full'

  const cardClass = [
    'profile-card',
    'profile-card--glass',
    isFull ? 'profile-card--full' : '',
    size !== 'full' ? `profile-card--${size}` : '',
    rank != null ? `profile-card--rank-${rank}` : '',
    isSelf ? 'profile-card--self' : '',
    onClick ? 'profile-card--clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const bannerNode = (
    <>
      {bannerImageSrc ? (
        <img
          ref={bannerImgRef}
          src={bannerImageSrc}
          alt=""
          className="profile-banner-img"
          onLoad={(e) => {
            syncBannerHeight(e.currentTarget)
            requestAnimationFrame(() => syncBannerHeight(e.currentTarget))
          }}
        />
      ) : null}
      {rank != null && rank <= 3 ? (
        <span className={`profile-rank-badge rank-${rank}`}>
          <RankIcon size={12} aria-hidden /> {RANK_LABEL[rank] ?? `#${rank}`}
        </span>
      ) : rank != null ? (
        <span className="profile-rank-badge profile-rank-badge--plain">#{rank}</span>
      ) : null}
    </>
  )

  const avatarStack = (
    <div className="profile-avatar-stack">
      <div className="profile-avatar-hit profile-avatar-hit--static">
        {frame ? (
          frameSrc ? (
            <div className="profile-avatar-framed">
              <div className="profile-avatar">{avatarInner}</div>
              <img className="profile-frame-overlay" src={frameSrc} alt="" aria-hidden />
            </div>
          ) : (
            <div className={`profile-frame-ring ${frameClass}`.trim()}>
              <div className="profile-avatar">{avatarInner}</div>
            </div>
          )
        ) : (
          <div className="profile-avatar">{avatarInner}</div>
        )}
      </div>
    </div>
  )

  const identityBlock = (
    <div className="profile-identity">
      <div className="profile-identity-head">
        <h2 className="profile-display-name">{displayName}</h2>
        {showLevelPill ? (
          <span className={`profile-level-pill${highlightStat === 'level' ? ' is-primary' : ''}`}>
            <Sparkles size={12} aria-hidden /> Lv {level}
          </span>
        ) : null}
      </div>
      {subtitle ? <p className="profile-email">{subtitle}</p> : null}
      {showXpBar ? (
        <div className="profile-xp-row">
          <div className="profile-xp-bar" aria-hidden>
            <div className="profile-xp-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <span className="profile-xp-text">
            {xpToNext > 0 ? `${xpPct}% · ${xpToNext} XP to Lv ${level + 1}` : 'Level maxed'}
          </span>
        </div>
      ) : null}
      {statsFooter ? <div className="profile-card-stats">{statsFooter}</div> : null}
    </div>
  )

  const charmNode =
    showCharmPin ? (
      <ProfileCharmPin
        userId={userId!}
        label={charm?.name ?? 'Charm'}
        visual={charmVisual!}
        interactive={charmCanDrag}
        anchor={isFull ? 'banner' : 'card'}
      />
    ) : null

  const body = (
    <>
      <div
        className={['profile-card-banner', bannerImageSrc ? 'profile-card-banner--cover' : '']
          .filter(Boolean)
          .join(' ')}
        style={bannerStyle}
      >
        {bannerNode}
        {isFull ? charmNode : null}
      </div>

      {avatarStack}

      <div className="profile-card-body">
        <div className="profile-card-header">{identityBlock}</div>
        {actions ? <div className="profile-card-footer">{actions}</div> : null}
      </div>
      {!isFull ? charmNode : null}
    </>
  )

  const wrapCard = (card: ReactNode) =>
    wrapClassName ? <div className={`profile-card-wrap ${wrapClassName}`.trim()}>{card}</div> : card

  const interactiveProps = onClick
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick,
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        },
      }
    : {}

  if (onClick) {
    const motionProps = animate
      ? {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.28, ease: 'easeOut' as const },
        }
      : {}

    if (animate) {
      return wrapCard(
        <motion.div
          ref={cardRef as never}
          className={cardClass}
          aria-label={`${displayName} profile`}
          {...interactiveProps}
          {...motionProps}
        >
          {body}
        </motion.div>,
      )
    }

    return wrapCard(
      <div ref={cardRef as never} className={cardClass} aria-label={`${displayName} profile`} {...interactiveProps}>
        {body}
      </div>,
    )
  }

  if (animate) {
    return wrapCard(
      <motion.section
        ref={cardRef}
        className={cardClass}
        aria-label={`${displayName} profile`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {body}
      </motion.section>,
    )
  }

  return wrapCard(
    <section ref={cardRef} className={cardClass} aria-label={`${displayName} profile`}>
      {body}
    </section>,
  )
}
