import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Coins, Lock, Sparkles } from '../icons'
import type { UserProfile } from '../../lib/auth/types'
import { achievementImageUrl } from '../../lib/achievementAssets'
import { AccountFilterBar, type AccountFilterGroup } from '../account/AccountFilterBar'

type Props = {
  profile: UserProfile
  variant?: 'full' | 'compact'
  limit?: number
}

type FilterKey = 'all' | 'unlocked' | 'locked'

const ACH_FILTER_GROUPS: AccountFilterGroup[] = [
  {
    id: 'status',
    options: [
      { id: 'all', label: 'All' },
      { id: 'unlocked', label: 'Unlocked' },
      { id: 'locked', label: 'Locked' },
    ],
  },
]

export function ProfileAchievements({ profile, variant = 'full', limit = 5 }: Props) {
  const [filter, setFilter] = useState<FilterKey>('all')

  const items = useMemo(() => {
    return [...profile.achievements].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
      const aPct = a.target ? a.progress / a.target : 0
      const bPct = b.target ? b.progress / b.target : 0
      return bPct - aPct
    })
  }, [profile.achievements])

  const visible = variant === 'compact'
    ? items.slice(0, Math.max(1, Number(limit) || 5))
    : items.filter((a) => {
        if (filter === 'unlocked') return a.unlocked
        if (filter === 'locked') return !a.unlocked
        return true
      })

  const unlockedCount = profile.achievements.filter((a) => a.unlocked).length
  const total = profile.achievements.length || 1
  const overallPct = Math.round((unlockedCount / total) * 100)

  const isCompact = variant === 'compact'

  return (
    <section className={`profile-section${isCompact ? ' profile-section--compact' : ''}`}>
      <header className="profile-section-head">
        <h2>Achievements</h2>
        <span className="profile-section-meta">
          {unlockedCount}/{profile.achievements.length} unlocked
        </span>
      </header>

      <div className="profile-ach-overall">
        <div className="profile-ach-overall-bar" aria-hidden>
          <motion.div
            className="profile-ach-overall-fill"
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <small>{overallPct}% completed</small>
      </div>

      {!isCompact ? (
        <AccountFilterBar
          groups={ACH_FILTER_GROUPS}
          value={filter}
          onChange={(id) => setFilter(id as FilterKey)}
          aria-label="Achievement filters"
        />
      ) : null}

      <div className={`profile-ach-grid${isCompact ? ' profile-ach-grid--compact' : ''}`}>
        {visible.map((ach, idx) => {
          const pct = ach.target ? Math.round((ach.progress / ach.target) * 100) : 0
          const imgSrc = achievementImageUrl(ach.imageUrl)
          return (
            <motion.article
              key={ach.id}
              className={`profile-ach-card${ach.unlocked ? ' is-unlocked' : ''}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: idx * 0.03, ease: 'easeOut' }}
              whileHover={{ y: -2 }}
            >
              <div className="profile-ach-art">
                {imgSrc ? (
                  <img src={imgSrc} alt="" loading="lazy" />
                ) : (
                  <span className="profile-ach-art-fallback" aria-hidden>
                    {ach.icon}
                  </span>
                )}
                {!ach.unlocked ? (
                  <span className="profile-ach-art-lock" aria-hidden>
                    <Lock size={14} />
                  </span>
                ) : null}
              </div>
              <h3>{ach.title}</h3>
              <p>{ach.description}</p>
              {ach.unlocked ? (
                <span className="profile-ach-status unlocked">
                  <Check size={11} aria-hidden /> Unlocked
                </span>
              ) : (
                <span className="profile-ach-status locked">
                  <Lock size={11} aria-hidden /> {ach.progress}/{ach.target}
                </span>
              )}
              {!ach.unlocked && ach.target > 1 ? (
                <div className="profile-ach-progress" aria-hidden>
                  <motion.span
                    className="profile-ach-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              ) : null}
              <div className="profile-ach-rewards">
                {ach.coinReward > 0 ? (
                  <span>
                    <Coins size={11} aria-hidden /> +{ach.coinReward}
                  </span>
                ) : null}
                {ach.xpReward > 0 ? (
                  <span>
                    <Sparkles size={11} aria-hidden /> +{ach.xpReward} XP
                  </span>
                ) : null}
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
