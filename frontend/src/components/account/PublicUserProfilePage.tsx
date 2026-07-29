import { useEffect, useMemo, useState } from 'react'
import type { PublicUserCard } from '../../lib/communityApi'
import { fetchPublicUser } from '../../lib/communityApi'
import { ProfileAchievements } from '../profile/ProfileAchievements'
import { AccountSubpageToolbar } from './AccountSubpageToolbar'
import { PublicProfileCard } from './PublicProfileCard'
import { publicUserToProfileAchievements } from '../../lib/publicProfileView'
import { fetchShopItems } from '../../lib/profileApi'
import { followUser, unfollowUser } from '../../lib/socialApi'
import { useFlocusStore } from '../../store/useFlocusStore'
import type { LeaderboardSortKey } from './LeaderboardProfileCard'
import '../../styles/profile.css'
import '../../styles/account-hub-pages.css'

type Props = {
  userId: number
  sort: LeaderboardSortKey
  rank?: number
  onBack: () => void
}

export function PublicUserProfilePage({ userId, sort: _sort, rank, onBack }: Props) {
  const selfId = useFlocusStore((s) => s.profile?.id ?? null)
  const setSettingsTab = useFlocusStore((s) => s.setSettingsTab)
  const openMessagesWith = useFlocusStore((s) => s.openMessagesWith)
  const [user, setUser] = useState<PublicUserCard | null>(null)
  const [shopItems, setShopItems] = useState<Awaited<ReturnType<typeof fetchShopItems>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    void (async () => {
      try {
        const [u, items] = await Promise.all([fetchPublicUser(userId), fetchShopItems()])
        if (!cancelled) {
          setUser(u)
          setShopItems(items)
        }
      } catch {
        if (!cancelled) setError(`User ID ${userId} not found.`)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const isSelf = user != null && selfId != null && user.id === selfId

  const achievementProfile = useMemo(
    () => (user ? publicUserToProfileAchievements(user) : null),
    [user],
  )

  const toggleFollow = async () => {
    if (!user || isSelf) return
    setFollowBusy(true)
    try {
      const next = user.isFollowing ? await unfollowUser(user.id) : await followUser(user.id)
      setUser((prev) => (prev ? { ...prev, ...next } : prev))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update follow')
    } finally {
      setFollowBusy(false)
    }
  }

  return (
    <div className="account-page-panel account-page-profile-view account-hub-player-view">
      <AccountSubpageToolbar
        backLabel="Rankings"
        onBack={onBack}
        title={user?.displayName}
        meta={user ? `ID ${user.id}${rank != null ? ` · Rank #${rank}` : ''}` : undefined}
      />

      {loading ? (
        <p className="lb-rank-empty">Loading profile…</p>
      ) : error || !user ? (
        <div className="account-hub-guest">
          <p>{error || 'Profile not found.'}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}>
            Back
          </button>
        </div>
      ) : (
        <>
          <PublicProfileCard
            user={user}
            shopItems={shopItems}
            isSelf={isSelf}
            loggedIn={selfId != null}
            followBusy={followBusy}
            onToggleFollow={() => void toggleFollow()}
            onMessage={() => openMessagesWith(user.id, user.displayName)}
            onOpenOwnProfile={() => setSettingsTab('profile')}
          />

          <div className="account-profile-extra">
            {achievementProfile && achievementProfile.achievements.length > 0 ? (
              <div className="account-achievements-panel">
                <ProfileAchievements profile={achievementProfile} />
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
