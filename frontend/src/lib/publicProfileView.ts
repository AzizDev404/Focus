import type { AchievementView, UserProfile } from './auth/types'
import type { PublicUserCard } from './communityApi'

export function publicUserToProfileAchievements(user: PublicUserCard): UserProfile {
  const achievements: AchievementView[] = user.achievements.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    icon: '🏅',
    imageUrl: a.imageUrl,
    coinReward: 0,
    xpReward: 0,
    unlocked: a.unlocked,
    unlockedAt: a.unlockedAt,
    progress: a.unlocked ? 1 : 0,
    target: 1,
  }))

  return {
    id: user.id,
    email: '',
    displayName: user.displayName,
    coins: user.coins,
    level: user.level,
    xp: user.xp,
    xpProgress: user.xpProgress,
    xpToNext: user.xpToNext,
    nextLevelXp: 0,
    currentLevelXp: 0,
    equipped: user.equipped,
    media: user.media,
    inventory: [],
    achievements,
  }
}

export function formatMemberSince(iso?: string) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
