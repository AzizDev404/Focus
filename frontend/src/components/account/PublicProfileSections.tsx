import { useState } from 'react'
import { Calendar, Check, Coins, Flame, MessageCircle, Sparkles, Users } from '../icons'
import { FollowListSheet } from './FollowListSheet'
import type { PublicUserCard } from '../../lib/communityApi'
import type { UserProfile } from '../../lib/auth/types'
import { formatMemberSince } from '../../lib/publicProfileView'
import { prettyFocus } from './LeaderboardProfileCard'

type ActivityProps = {
  focusSeconds: number
  sessions: number
  tasksCompleted: number
  coins: number
  memberSince?: string | null
}

export function ProfileActivitySection({
  focusSeconds,
  sessions,
  tasksCompleted,
  coins,
  memberSince,
}: ActivityProps) {
  const stats = [
    { id: 'focus', label: 'Focus time', value: prettyFocus(focusSeconds), icon: Flame },
    { id: 'sessions', label: 'Sessions', value: String(sessions), icon: Sparkles },
    { id: 'tasks', label: 'Tasks done', value: String(tasksCompleted), icon: Check },
    { id: 'coins', label: 'Coins', value: coins.toLocaleString(), icon: Coins },
  ]

  return (
    <section className="account-hub-section account-activity-section glass-surface">
      <header className="account-hub-section-head">
        <h4>Activity</h4>
        {memberSince ? (
          <span>
            <Calendar size={11} aria-hidden /> {memberSince}
          </span>
        ) : null}
      </header>
      <div className="account-hub-section-body">
        <div className="account-hub-stats-grid">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.id} className="account-hub-stat">
                <Icon size={14} aria-hidden />
                <strong>{s.value}</strong>
                <small>{s.label}</small>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function PublicProfileStats({ user }: { user: PublicUserCard }) {
  return (
    <ProfileActivitySection
      focusSeconds={user.totals.totalFocusSeconds}
      sessions={user.totals.totalSessions}
      tasksCompleted={user.totals.totalTasksCompleted}
      coins={user.coins}
      memberSince={formatMemberSince(user.createdAt)}
    />
  )
}

export function OwnProfileActivity({ profile }: { profile: UserProfile }) {
  const totals = profile.totals
  if (!totals) return null
  return (
    <ProfileActivitySection
      focusSeconds={totals.totalFocusSeconds}
      sessions={totals.totalSessions}
      tasksCompleted={totals.totalTasksCompleted}
      coins={profile.coins}
      memberSince={formatMemberSince(profile.createdAt)}
    />
  )
}

type SocialProps = {
  user: PublicUserCard
  isSelf: boolean
  loggedIn: boolean
  followBusy: boolean
  onToggleFollow: () => void
  onMessage: () => void
  onOpenOwnProfile?: () => void
}

export function ProfileSocialCounts({
  userId,
  followers,
  following,
}: {
  userId: number
  followers: number
  following: number
}) {
  const [listKind, setListKind] = useState<'followers' | 'following' | null>(null)

  return (
    <>
      <div className="account-hub-follow-stats">
        <button
          type="button"
          className="account-hub-follow-stat"
          onClick={() => setListKind('followers')}
          aria-label={`${followers} followers`}
        >
          <strong>{followers}</strong>
          <span>followers</span>
        </button>
        <button
          type="button"
          className="account-hub-follow-stat"
          onClick={() => setListKind('following')}
          aria-label={`${following} following`}
        >
          <strong>{following}</strong>
          <span>following</span>
        </button>
      </div>
      {listKind ? (
        <FollowListSheet userId={userId} kind={listKind} onClose={() => setListKind(null)} />
      ) : null}
    </>
  )
}

export function PublicProfileSocialActions({
  user,
  isSelf,
  loggedIn,
  followBusy,
  onToggleFollow,
  onMessage,
  onOpenOwnProfile,
}: SocialProps) {
  if (isSelf) {
    return (
      <div className="account-hub-profile-actions">
        <ProfileSocialCounts
          userId={user.id}
          followers={user.followersCount ?? 0}
          following={user.followingCount ?? 0}
        />
        {onOpenOwnProfile ? (
          <button type="button" className="profile-edit-btn" onClick={onOpenOwnProfile}>
            Open your profile
          </button>
        ) : null}
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="account-hub-profile-actions">
        <p className="account-hub-guest-hint">Sign in to follow and message players.</p>
      </div>
    )
  }

  return (
    <div className="account-hub-profile-actions">
      <ProfileSocialCounts
        userId={user.id}
        followers={user.followersCount ?? 0}
        following={user.followingCount ?? 0}
      />
      <div className="account-hub-action-btns">
        <button
          type="button"
          className={`profile-edit-btn${user.isFollowing ? ' is-following' : ''}`}
          disabled={followBusy}
          onClick={onToggleFollow}
        >
          {user.isFollowing ? (
            <>
              <Check size={14} aria-hidden /> Following
            </>
          ) : (
            <>
              <Users size={14} aria-hidden /> Follow
            </>
          )}
        </button>
        <button type="button" className="profile-edit-btn" onClick={onMessage}>
          <MessageCircle size={14} aria-hidden /> Message
        </button>
      </div>
    </div>
  )
}
