import { useEffect, useState } from 'react'
import { SettingsNavIcon } from './SettingsNavIcons'
import { THEME_SUB_TABS, THEME_TAB_IDS } from './themeNavConstants'
import type { DashboardMode } from '../../types'

/** Themes accordion in settings nav — header toggles 3 sub-tabs. */
export function ThemeNavGroup({
  settingsTab,
  setSettingsTab,
  setMode,
  onNavigate,
}: {
  settingsTab: string
  setSettingsTab: (tab: string) => void
  setMode: (mode: DashboardMode) => void
  onNavigate?: () => void
}) {
  const childActive = THEME_TAB_IDS.has(settingsTab)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (childActive) setOpen(true)
  }, [childActive])

  return (
    <div className={`theme-nav-group${open ? ' open' : ''}`}>
      <button
        id="settModal-Theme-tab"
        type="button"
        className={`nav-link text-start nav-link-theme-head${open ? ' open' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <SettingsNavIcon name="themes" />
        <span className="nav-label">Themes</span>
        <svg
          className={`theme-nav-chevron${open ? ' open' : ''}`}
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        className={`theme-nav-children${open ? ' is-open' : ''}`}
        role="group"
        aria-labelledby="settModal-Theme-tab"
        aria-hidden={!open}
      >
        <div className="theme-nav-children-inner">
          {THEME_SUB_TABS.map((t) => {
            const active = settingsTab === t.id
            return (
              <button
                key={t.id}
                id={`settModal-${t.id}-tab`}
                type="button"
                tabIndex={open ? 0 : -1}
                className={`nav-link text-start nav-link-theme-child${active ? ' active' : ''}`}
                onClick={() => {
                  setSettingsTab(t.id)
                  setMode(t.mode)
                  onNavigate?.()
                }}
              >
                <SettingsNavIcon name={t.id} />
                <span className="nav-label">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
