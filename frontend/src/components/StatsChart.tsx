import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, subDays } from 'date-fns'
import { calculateFocusScore } from '../lib/focusScore'
import { useFlocusStore } from '../store/useFlocusStore'

export type StatsPeriod = 'today' | 'week' | 'month'

export function StatsChart({ period }: { period: StatsPeriod }) {
  const statsHistory = useFlocusStore((s) => s.statsHistory)
  const streak = useFlocusStore((s) => s.streak)
  const accent = useFlocusStore((s) => s.settings.accentColor) || '#7432FF'

  const days = period === 'today' ? 1 : period === 'week' ? 7 : 28
  const data = Array.from({ length: days }, (_, i) => {
    const d = subDays(new Date(), days - 1 - i)
    const key = format(d, 'yyyy-MM-dd')
    const s = statsHistory[key] ?? {
      date: key,
      focusSeconds: 0,
      breakSeconds: 0,
      sessions: 0,
      tasksCompleted: 0,
    }
    return {
      label: period === 'today' ? 'Today' : format(d, days <= 7 ? 'EEE' : 'MMM d'),
      focusMin: Math.round(s.focusSeconds / 60),
      sessions: s.sessions,
      tasks: s.tasksCompleted,
      score: calculateFocusScore(s, streak),
    }
  })

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.5} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
          <Area type="monotone" dataKey="focusMin" name="Focus (min)" stroke={accent} fill="url(#focusGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SessionsBarChart({ period }: { period: StatsPeriod }) {
  const statsHistory = useFlocusStore((s) => s.statsHistory)
  const accent = useFlocusStore((s) => s.settings.accentColor) || '#7432FF'
  const days = period === 'week' ? 7 : 28
  const data = Array.from({ length: days }, (_, i) => {
    const d = subDays(new Date(), days - 1 - i)
    const key = format(d, 'yyyy-MM-dd')
    return { label: format(d, 'EEE'), sessions: statsHistory[key]?.sessions ?? 0 }
  })

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar dataKey="sessions" fill={accent} radius={[4, 4, 0, 0]} />
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
