import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from '../icons'
import type { PublicUserCard } from '../../lib/communityApi'
import { fetchPublicUser } from '../../lib/communityApi'
import { achievementImageUrl } from '../../lib/achievementAssets'
import { fetchShopItems } from '../../lib/profileApi'
import { useFlocusStore } from '../../store/useFlocusStore'
import {
  LeaderboardProfileCard,
  type LeaderboardSortKey,
} from './LeaderboardProfileCard'
import '../../styles/profile.css'
import '../../styles/leaderboard-senkuro.css'

type Props = {
  userId: number
  sort: LeaderboardSortKey
  rank?: number
  onClose: () => void
}

export function PublicUserModal({ userId, sort, rank, onClose }: Props) {
  const selfId = useFlocusStore((s) => s.profile?.id ?? null)
  const [user, setUser] = useState<PublicUserCard | null>(null)
  const [shopItems, setShopItems] = useState<Awaited<ReturnType<typeof fetchShopItems>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const isSelf = user != null && selfId != null && user.id === selfId

  return (
    <motion.div
      className="public-user-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-user-title"
        className="public-user-modal"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="public-user-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        {loading ? (
          <p className="public-user-loading">Loading profile…</p>
        ) : error || !user ? (
          <div className="public-user-error">
            <p>{error || 'Profile not found.'}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <div className="public-user-modal-inner">
            <h4 id="public-user-title" className="public-user-modal-label">
              Player profile
            </h4>
            <LeaderboardProfileCard
              user={{
                id: user.id,
                displayName: user.displayName,
                level: user.level,
                coins: user.coins,
                totalFocusSeconds: user.totals.totalFocusSeconds,
                xpProgress: user.xpProgress,
                xpToNext: user.xpToNext,
                media: user.media,
                equipped: user.equipped,
              }}
              shopItems={shopItems}
              sort={sort}
              rank={rank}
              isSelf={isSelf}
              sessions={user.totals.totalSessions}
              className="lb-player-card public-user-profile-card"
            />

            {user.achievementsTotal > 0 ? (
              <div className="public-user-achievements">
                <header>
                  <h4>Achievements</h4>
                  <span>
                    {user.achievementsUnlocked}/{user.achievementsTotal}
                  </span>
                </header>
                <div className="public-user-ach-grid">
                  {user.achievements.map((ach) => {
                    const imgSrc = achievementImageUrl(ach.imageUrl)
                    return (
                      <div
                        key={ach.id}
                        className={`public-user-ach-item${ach.unlocked ? ' is-unlocked' : ''}`}
                        title={ach.title}
                      >
                        {imgSrc ? (
                          <img src={imgSrc} alt="" loading="lazy" />
                        ) : (
                          <span className="public-user-ach-fallback" aria-hidden>
                            🏅
                          </span>
                        )}
                        <small>{ach.title}</small>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
