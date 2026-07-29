import { format, subDays } from 'date-fns'
import type { StatsPeriod } from '../components/StatsChart'
import type { DayStats } from '../types'

const emptyDay = (date: string): DayStats => ({
  date,
  focusSeconds: 0,
  breakSeconds: 0,
  sessions: 0,
  tasksCompleted: 0,
})

export function aggregatePeriodStats(
  period: StatsPeriod,
  statsHistory: Record<string, DayStats>,
): DayStats {
  const days = period === 'today' ? 1 : period === 'week' ? 7 : 28
  const acc = emptyDay('period')
  for (let i = 0; i < days; i++) {
    const key = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd')
    const s = statsHistory[key] ?? emptyDay(key)
    acc.focusSeconds += s.focusSeconds
    acc.breakSeconds += s.breakSeconds
    acc.sessions += s.sessions
    acc.tasksCompleted += s.tasksCompleted
  }
  return acc
}

export function statsPeriodHeading(period: StatsPeriod): string {
  if (period === 'today') return 'Today'
  if (period === 'week') return 'Last 7 days'
  return 'Last 4 weeks'
}
