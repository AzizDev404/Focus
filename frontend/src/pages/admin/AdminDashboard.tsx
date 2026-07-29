import { useEffect, useState } from 'react'
import { Activity, Coins, ShoppingBag, Timer, Users } from '../../components/icons'
import { ApiError, fetchAdminStats, type AdminStats } from '../../lib/adminApi'

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h) return `${h}h ${m}m`
  if (m) return `${m}m`
  return `${sec}s`
}

type Props = { token: string }

export function AdminDashboard({ token }: Props) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetchAdminStats(token)
      .then(setStats)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load stats'))
  }, [token])

  const cards = stats
    ? [
        { label: 'Users', value: stats.userCount.toLocaleString(), Icon: Users, tone: 'violet' },
        { label: 'Magazine items', value: `${stats.shopEnabledCount}/${stats.shopItemCount}`, Icon: ShoppingBag, tone: 'pink' },
        { label: 'Coins in economy', value: stats.totalCoins.toLocaleString(), Icon: Coins, tone: 'amber' },
        { label: 'Total focus', value: formatDuration(stats.totalFocusSeconds), Icon: Timer, tone: 'cyan' },
        { label: 'Sessions', value: stats.totalSessions.toLocaleString(), Icon: Activity, tone: 'green' },
        { label: 'Tasks completed', value: stats.totalTasksCompleted.toLocaleString(), Icon: Activity, tone: 'slate' },
      ]
    : []

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="adm-muted">Live overview from the production database.</p>
        </div>
      </header>

      {error ? <p className="adm-banner adm-banner--error">{error}</p> : null}

      <div className="adm-stat-grid">
        {cards.map((c) => {
          const Icon = c.Icon
          return (
            <article key={c.label} className={`adm-stat-card adm-stat-card--${c.tone}`}>
              <div className="adm-stat-icon">
                <Icon size={20} aria-hidden />
              </div>
              <div>
                <span className="adm-stat-label">{c.label}</span>
                <strong className="adm-stat-value">{c.value}</strong>
              </div>
            </article>
          )
        })}
      </div>

      {!stats && !error ? <p className="adm-muted">Loading statistics…</p> : null}
    </div>
  )
}
