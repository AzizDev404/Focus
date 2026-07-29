import { achievementsForUser, userAggregateStats } from './achievements.js'
import { levelFromXp, xpProgress } from './levels.js'
import { socialCountsForUser } from './socialPublic.js'

export function defaultEquipped() {
  return { background: null, avatar: null, frame: null, charm: null }
}

/** Level from XP, but never below a stored level (supports admin/db boosts). */
export function resolvedLevel(user) {
  const stored = user.level ?? 1
  const fromXp = levelFromXp(user.xp ?? 0)
  return Math.max(stored, fromXp)
}

export function normalizeProfile(user) {
  if (user.coins == null) user.coins = 0
  if (user.xp == null) user.xp = 0
  if (user.level == null) user.level = 1
  if (!user.achievements) user.achievements = []
  if (!user.inventory) user.inventory = []
  if (!user.equipped) user.equipped = defaultEquipped()
  if (!user.mailbox) user.mailbox = []
  if (user.nextMailId == null) user.nextMailId = 1
  if (!user.media) user.media = { avatarUrl: null, backgroundUrl: null }
  if (typeof user.media.avatarUrl !== 'string') user.media.avatarUrl = null
  if (typeof user.media.backgroundUrl !== 'string') user.media.backgroundUrl = null
  if (typeof user.emailVerified !== 'boolean') user.emailVerified = true
  if (user.googleId === undefined) user.googleId = null
  if (user.pendingVerification === undefined) user.pendingVerification = null
  if (!user.tasks) user.tasks = []
  if (!user.notepadDaily) user.notepadDaily = {}
  return user
}

export function publicProfile(user) {
  normalizeProfile(user)
  const level = resolvedLevel(user)
  const progress = xpProgress(user.xp, level)
  return {
    id: user.id,
    email: user.email ?? user.address,
    displayName: user.displayName,
    coins: user.coins,
    level: progress.level,
    xp: user.xp,
    xpProgress: progress.progress,
    xpToNext: progress.xpToNext,
    nextLevelXp: progress.nextLevelXp,
    currentLevelXp: progress.currentLevelXp,
    equipped: { ...user.equipped },
    inventory: [...user.inventory],
    achievements: achievementsForUser(user),
    media: {
      avatarUrl: user.media.avatarUrl,
      backgroundUrl: user.media.backgroundUrl,
    },
    totals: userAggregateStats(user),
    emailVerified: user.emailVerified !== false,
    provider: user.googleId ? 'google' : 'password',
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    ...socialCountsForUser(user.id),
  }
}

/** Public card for leaderboard — no email or private mail data. */
export function publicUserCard(user) {
  normalizeProfile(user)
  const level = resolvedLevel(user)
  const progress = xpProgress(user.xp, level)
  const achievements = achievementsForUser(user)
  return {
    id: user.id,
    displayName: user.displayName,
    level: progress.level,
    xp: user.xp,
    xpProgress: progress.progress,
    xpToNext: progress.xpToNext,
    coins: user.coins,
    equipped: { ...user.equipped },
    media: {
      avatarUrl: user.media.avatarUrl,
      backgroundUrl: user.media.backgroundUrl,
    },
    totals: userAggregateStats(user),
    achievements: achievements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      imageUrl: a.imageUrl,
      unlocked: a.unlocked,
      unlockedAt: a.unlockedAt,
    })),
    achievementsUnlocked: achievements.filter((a) => a.unlocked).length,
    achievementsTotal: achievements.length,
    createdAt: user.createdAt,
    ...socialCountsForUser(user.id),
  }
}
