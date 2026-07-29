/** XP required to reach each level (index = level - 1). */
const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000]

export function xpForLevel(level) {
  const idx = Math.max(0, Math.min(level - 1, XP_THRESHOLDS.length - 1))
  return XP_THRESHOLDS[idx] ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + (level - XP_THRESHOLDS.length) * 800
}

export function levelFromXp(xp) {
  let level = 1
  while (level < 99 && xp >= xpForLevel(level + 1)) level += 1
  return level
}

export function xpProgress(xp, level) {
  const current = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const span = Math.max(1, next - current)
  return {
    level,
    xp,
    currentLevelXp: current,
    nextLevelXp: next,
    progress: Math.min(1, (xp - current) / span),
    xpToNext: Math.max(0, next - xp),
  }
}

export function coinRewardForLevelUp(newLevel) {
  return 25 + newLevel * 10
}
