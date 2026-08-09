import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  ArrowLeft,
  Activity,
  LogOut,
  Settings,
  ShoppingBag,
  Trophy,
  Users,
} from '../components/icons'
import { FOCUS_APP_URL } from '../lib/appLinks'

const NAV: { to: string; label: string; Icon: typeof Activity; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', Icon: Activity, end: true },
  { to: '/users', label: 'Users', Icon: Users },
  { to: '/magazine', label: 'Magazine', Icon: ShoppingBag },
  { to: '/achievements', label: 'Achievements', Icon: Trophy },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

type Props = {
  children: React.ReactNode
  onLogout: () => void
}

export function AdminLayout({ children, onLogout }: Props) {
  useEffect(() => {
    document.body.classList.add('adm-route')
    return () => document.body.classList.remove('adm-route')
  }, [])

  return (
    <div className="adm-shell adm-root">
      <aside className="adm-sidebar">
        <div className="adm-sidebar-brand">
          <span className="adm-brand-mark">月</span>
          <div>
            <strong>Focus Admin</strong>
            <small>Tsukiyomi</small>
          </div>
        </div>
        <nav className="adm-nav">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `adm-nav-link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.6} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="adm-sidebar-foot">
          <a href={FOCUS_APP_URL} className="adm-nav-link adm-nav-link--ghost">
            <ArrowLeft size={16} aria-hidden />
            Open Focus app
          </a>
          <button type="button" className="adm-nav-link adm-nav-link--ghost" onClick={onLogout}>
            <LogOut size={16} aria-hidden />
            Log out
          </button>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  )
}
