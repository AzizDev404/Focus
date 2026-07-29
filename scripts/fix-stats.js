import fs from 'fs'

const content = String.raw`import {
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
  const settings = useFlocusStore((s) => s.settings)

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
      score: settings.isPlus ? calculateFocusScore(s, streak) : 0,
    }
  })

  if (period === 'today') {
    const t = data[0]
    return (
      <WRAPPER className="grid grid-cols-2 gap-2">
        <MiniStat label="Focus" value={\`\${t.focusMin}m\`} />
        <MiniStat label="Sessions" value={String(t.sessions)} />
        <MiniStat label="Tasks" value={String(t.tasks)} />
        {settings.isPlus && <MiniStat label="Score" value={String(t.score)} />}
      </WRAPPER>
    )
  }

  return (
    <WRAPPER className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7432FF" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#7432FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
          <Area type="monotone" dataKey="focusMin" name="Focus (min)" stroke="#7432FF" fill="url(#focusGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </WRAPPER>
  )
}

export function SessionsBarChart({ period }: { period: StatsPeriod }) {
  const statsHistory = useFlocusStore((s) => s.statsHistory)
  const days = period === 'week' ? 7 : 28
  const data = Array.from({ length: days }, (_, i) => {
    const d = subDays(new Date(), days - 1 - i)
    const key = format(d, 'yyyy-MM-dd')
    return { label: format(d, 'EEE'), sessions: statsHistory[key]?.sessions ?? 0 }
  })

  return (
    <WRAPPER className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar dataKey="sessions" fill="#7432FF" radius={[4, 4, 0, 0]} />
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
        </BarChart>
      </ResponsiveContainer>
    </WRAPPER>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <WRAPPER className="rounded-xl bg-white/5 p-3">
      <p className="text-[10px] uppercase tracking-wider text-white/45">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
    </WRAPPER>
  )
}
`.replaceAll('WRAPPER', 'motionFallback')

fs.writeFileSync('src/components/StatsChart.tsx', content.replaceAll('motionFallback', 'div'))
console.log('fixed StatsChart')
