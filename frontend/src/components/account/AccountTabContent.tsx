import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut } from '../icons'
import { EditProfilePage } from '../profile/EditProfilePage'
import { ProfileCard } from '../profile/ProfileHero'
import { ProfileAchievements } from '../profile/ProfileAchievements'
import { ProfileMagazine } from '../profile/ProfileMagazine'
import { AccountLeaderboard } from './AccountLeaderboard'
import { useIsLoggedIn, useOpenAuthModal } from '../../hooks/useAuthSession'
import { fetchProfile, fetchShopEvents, fetchShopItems } from '../../lib/profileApi'
import { ApiError } from '../../lib/api'
import type { ShopEvent, ShopItem } from '../../lib/auth/types'
import { getUserToken } from '../../lib/authStorage'
import { logoutUser } from '../../lib/establishSession'
import { useFlocusStore } from '../../store/useFlocusStore'
import { AccountMailInbox } from './AccountMailInbox'
import '../../styles/profile.css'
import '../../styles/account-pages.css'
import '../../styles/account-hub-pages.css'

export type AccountView = 'profile' | 'edit-profile' | 'magazine' | 'leaderboard' | 'mail'

export function AccountTabContent({ view = 'profile' }: { view?: AccountView }) {
  const setSettings = useFlocusStore((s) => s.setSettings)
  const setSettingsTab = useFlocusStore((s) => s.setSettingsTab)
  const profile = useFlocusStore((s) => s.profile)
  const setProfile = useFlocusStore((s) => s.setProfile)
  const openAuth = useOpenAuthModal()
  const isLoggedIn = useIsLoggedIn()

  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [shopEvents, setShopEvents] = useState<ShopEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async () => {
    const activeToken = getUserToken()
    if (!activeToken) return
    setLoading(true)
    setLoadError('')
    try {
      const [p, items, events] = await Promise.all([
        fetchProfile(activeToken),
        fetchShopItems(),
        fetchShopEvents(),
      ])
      if (p) setProfile(p)
      setShopItems(items)
      setShopEvents(events)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logoutUser()
        return
      }
      setLoadError(err instanceof ApiError ? err.message : 'Could not reach API.')
    } finally {
      setLoading(false)
    }
  }, [setProfile])

  useEffect(() => {
    if (!isLoggedIn) return
    void load()
  }, [isLoggedIn, load, view])

  if (!isLoggedIn) {
    return (
      <div id="Profile" className="account account-guest-cta account-guest-cta--modern">
        <p className="account-guest-note">Sign in to sync coins, shop & progress.</p>
        <button type="button" className="btn btn-primary w-100" onClick={() => openAuth('login')}>
          Sign in
        </button>
      </div>
    )
  }

  const accountToolbar =
    view !== 'profile' && view !== 'edit-profile' && view !== 'magazine' && view !== 'leaderboard' ? (
      <div className="account-tab-toolbar">
        <span className="account-tab-user">{profile?.displayName ?? profile?.email}</span>
        <button type="button" className="btn btn-outline-light btn-sm" onClick={() => logoutUser()}>
          <LogOut size={13} aria-hidden /> Sign out
        </button>
      </div>
    ) : null

  if (!profile) {
    return (
      <div className="account-reload">
        <p className="account-reload-msg">{loadError || (loading ? 'Loading profile…' : 'Could not load profile.')}</p>
        {!loading && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
            Retry
          </button>
        )}
      </div>
    )
  }

  let body: React.ReactNode
  if (view === 'magazine') {
    body = (
      <ProfileMagazine
        profile={profile}
        shopItems={shopItems}
        shopEvents={shopEvents}
        onRefresh={load}
      />
    )
  } else if (view === 'leaderboard') {
    body = <AccountLeaderboard />
  } else if (view === 'mail') {
    body = <AccountMailInbox />
  } else if (view === 'edit-profile') {
    body = (
      <EditProfilePage
        profile={profile}
        shopItems={shopItems}
        onBack={() => setSettingsTab('profile')}
        onProfileChange={(next) => {
          setProfile(next)
          setSettings({ displayName: next.displayName })
        }}
      />
    )
  } else {
    body = (
      <>
        <ProfileCard
          profile={profile}
          shopItems={shopItems}
          onOpenEdit={() => setSettingsTab('edit-profile')}
          onProfileChange={(next) => {
            setProfile(next)
            setSettings({ displayName: next.displayName })
          }}
        />
        <div className="account-profile-extra">
          {profile.achievements.length > 0 ? (
            <div className="account-achievements-panel">
              <ProfileAchievements profile={profile} />
            </div>
          ) : null}
        </div>
        <div className="account-page-actions">
          <button type="button" className="btn btn-outline-light btn-sm" onClick={() => logoutUser()}>
            <LogOut size={13} aria-hidden /> Sign out
          </button>
        </div>
      </>
    )
  }

  return (
    <motion.div
      key={view}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      id="Profile"
      className="account logged-in settings-account-hub"
    >
      {accountToolbar}
      <div className={`account-page account-page-${view} settings-account-body`}>{body}</div>
    </motion.div>
  )
}
