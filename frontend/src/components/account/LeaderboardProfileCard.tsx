import { Coins, Flame, Sparkles } from '../icons'
import type { LeaderboardUser } from '../../lib/communityApi'
import type { ShopItem, UserProfile } from '../../lib/auth/types'
import { ProfileGlassCard } from '../profile/ProfileGlassCard'

export type LeaderboardSortKey = 'level' | 'focus' | 'coins'

export function prettyFocus(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h) return `${h}h ${m}m`
  return `${m}m`
}

type StatsUser = {
  level: number
  coins: number
  totalFocusSeconds: number
}

export function LeaderboardStatsFooter({
  user,
  sort,
  sessions,
}: {
  user: StatsUser
  sort: LeaderboardSortKey
  sessions?: number
}) {
  return (
    <>
      <span className={sort === 'level' ? 'is-primary' : undefined}>
        <Sparkles size={10} aria-hidden /> Lv {user.level}
      </span>
      <span className={sort === 'focus' ? 'is-primary' : undefined}>
        <Flame size={10} aria-hidden /> {prettyFocus(user.totalFocusSeconds)}
      </span>
      {sessions != null ? <span>{sessions} sessions</span> : null}
      <span className={`profile-card-stat-coins${sort === 'coins' ? ' is-primary' : ''}`}>
        <Coins size={10} aria-hidden /> {user.coins.toLocaleString()}
      </span>
    </>
  )
}

type CardUser = {
  id: number
  displayName: string
  level: number
  coins: number
  totalFocusSeconds: number
  xpProgress?: number
  xpToNext?: number
  media: UserProfile['media']
  equipped: UserProfile['equipped']
}

type Props = {
  user: CardUser
  shopItems: ShopItem[]
  sort: LeaderboardSortKey
  rank?: number
  isSelf?: boolean
  sessions?: number
  className?: string
  onClick?: () => void
}

export function LeaderboardProfileCard({
  user,
  shopItems,
  sort,
  rank,
  isSelf,
  sessions,
  className = 'lb-player-card',
  onClick,
}: Props) {
  return (
    <ProfileGlassCard
      displayName={user.displayName}
      level={user.level}
      shopItems={shopItems}
      media={user.media}
      equipped={user.equipped}
      subtitle={`ID ${user.id}`}
      xpProgress={user.xpProgress ?? 0}
      xpToNext={user.xpToNext ?? 0}
      rank={rank}
      size="mini"
      highlightStat={sort}
      statsFooter={
        <LeaderboardStatsFooter
          user={user}
          sort={sort}
          sessions={sessions}
        />
      }
      isSelf={isSelf}
      userId={user.id}
      showXpBar={false}
      showCharm
      showLevelPill={false}
      charmInteractive={false}
      className={className}
      onClick={onClick}
    />
  )
}

export function leaderboardUserFromEntry(entry: LeaderboardUser): CardUser {
  return {
    id: entry.id,
    displayName: entry.displayName,
    level: entry.level,
    coins: entry.coins,
    totalFocusSeconds: entry.totalFocusSeconds,
    xpProgress: entry.xpProgress,
    xpToNext: entry.xpToNext,
    media: entry.media,
    equipped: entry.equipped,
  }
}
