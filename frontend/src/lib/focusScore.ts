import type { DayStats } from '../types'

export function calculateFocusScore(
  stats: DayStats,
  streak: number,
): number {
  const focusHours = stats.focusSeconds / 3600
  const breakHours = stats.breakSeconds / 3600
  const sessionBonus = Math.min(stats.sessions * 4, 40)
  const focusBonus = Math.min(focusHours * 25, 35)
  const taskBonus = Math.min(stats.tasksCompleted * 2, 15)
  let streakBoost = 0
  if (streak >= 180) streakBoost = 20
  else if (streak >= 90) streakBoost = 15
  else if (streak >= 30) streakBoost = 10
  else if (streak >= 7) streakBoost = 5

  let breakBonus = 0
  if (focusHours > 0) {
    const ratio = breakHours / focusHours
    if (ratio >= 0.1 && ratio <= 0.35) breakBonus = 10
  }

  const raw = sessionBonus + focusBonus + taskBonus + streakBoost + breakBonus
  return Math.min(100, Math.max(0, Math.round(raw)))
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}
