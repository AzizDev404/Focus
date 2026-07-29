import {
  achievementById,
  listAchievementDefinitions,
} from './achievementCatalog.js'

function userStats(user) {
  let sessions = 0
  let focusSeconds = 0
  let tasks = 0
  for (const day of Object.values(user.statsHistory ?? {})) {
    sessions += Number(day?.sessions ?? 0)
    focusSeconds += Number(day?.focusSeconds ?? 0)
    tasks += Number(day?.tasksCompleted ?? 0)
  }
  return { sessions, focusMinutes: Math.floor(focusSeconds / 60), tasks }
}

function isUnlocked(user, ach) {
  const stats = userStats(user)
  switch (ach.trigger) {
    case 'register':
      return true
    case 'sessions':
      return stats.sessions >= (ach.target ?? 1)
    case 'focusMinutes':
      return stats.focusMinutes >= (ach.target ?? 1)
    case 'tasks':
      return stats.tasks >= (ach.target ?? 1)
    case 'level':
      return (user.level ?? 1) >= (ach.target ?? 1)
    default:
      return false
  }
}

/** Returns newly unlocked achievement ids and applies rewards to user (mutates). */
export function evaluateAchievements(user, { includeRegister = false } = {}) {
  if (!user.achievements) user.achievements = []
  const unlockedIds = new Set(user.achievements.map((a) => a.id))
  const newlyUnlocked = []
  const catalog = listAchievementDefinitions()

  for (const ach of catalog) {
    if (unlockedIds.has(ach.id)) continue
    if (ach.trigger === 'register' && !includeRegister) continue
    if (!isUnlocked(user, ach)) continue

    user.achievements.push({
      id: ach.id,
      unlockedAt: new Date().toISOString(),
    })
    user.coins = (user.coins ?? 0) + (ach.coinReward ?? 0)
    user.xp = (user.xp ?? 0) + (ach.xpReward ?? 0)
    newlyUnlocked.push(ach.id)
    unlockedIds.add(ach.id)
  }

  return newlyUnlocked
}

function currentProgressFor(user, ach) {
  const stats = userStats(user)
  switch (ach.trigger) {
    case 'register':
      return 1
    case 'sessions':
      return stats.sessions
    case 'focusMinutes':
      return stats.focusMinutes
    case 'tasks':
      return stats.tasks
    case 'level':
      return user.level ?? 1
    default:
      return 0
  }
}

export function achievementsForUser(user) {
  const unlockedMap = new Map((user.achievements ?? []).map((a) => [a.id, a.unlockedAt]))
  const catalog = listAchievementDefinitions({ includeDisabled: true })
  return catalog
    .filter((ach) => ach.enabled !== false || unlockedMap.has(ach.id))
    .map((ach) => {
      const target = ach.target ?? 1
      const progress = unlockedMap.has(ach.id)
        ? target
        : Math.min(target, currentProgressFor(user, ach))
      return {
        ...ach,
        unlocked: unlockedMap.has(ach.id),
        unlockedAt: unlockedMap.get(ach.id) ?? null,
        progress,
        target,
      }
    })
}

export { achievementById, listAchievementDefinitions }

export function userAggregateStats(user) {
  let totalFocusSeconds = 0
  let totalBreakSeconds = 0
  let totalSessions = 0
  let totalTasksCompleted = 0
  for (const day of Object.values(user.statsHistory ?? {})) {
    totalFocusSeconds += Number(day?.focusSeconds ?? 0)
    totalBreakSeconds += Number(day?.breakSeconds ?? 0)
    totalSessions += Number(day?.sessions ?? 0)
    totalTasksCompleted += Number(day?.tasksCompleted ?? 0)
  }
  return { totalFocusSeconds, totalBreakSeconds, totalSessions, totalTasksCompleted }
}
