import { useEffect, useState } from 'react'
import { SettingsNavIcon } from './SettingsNavIcons'
import type { SettingsNavGroupDef } from './settingsNavConstants'
import type { DashboardMode } from '../../types'
import { useFlocusStore } from '../../store/useFlocusStore'

type Props = {
  group: SettingsNavGroupDef
  settingsTab: string
  setSettingsTab: (tab: string) => void
  setMode: (mode: DashboardMode) => void
  isLoggedIn: boolean
  onNavigate?: () => void
}

/** Collapsible settings nav group (Appearance, Focus, Account, Help). */
export function SettingsNavGroup({
  group,
  settingsTab,
  setSettingsTab,
  setMode,
  isLoggedIn,
  onNavigate,
}: Props) {
  const childActive = group.tabs.some((tab) => tab.id === settingsTab)
  const [open, setOpen] = useState(childActive)

  useEffect(() => {
    if (childActive) setOpen(true)
  }, [childActive])

  return (
    <div className={`theme-nav-group settings-nav-group${open ? ' open' : ''}`}>
      <button
        id={`settModal-${group.id}-group`}
        type="button"
        className={`nav-link text-start nav-link-theme-head${open ? ' open' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <SettingsNavIcon name={group.icon} />
        <span className="nav-label">{group.label}</span>
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
        aria-labelledby={`settModal-${group.id}-group`}
        aria-hidden={!open}
      >
        <div className="theme-nav-children-inner">
          {group.tabs.map((tab) => {
            const active = settingsTab === tab.id
            return (
              <button
                key={tab.id}
                id={`settModal-${tab.id}-tab`}
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  if (tab.id === 'leaderboard' && settingsTab === 'leaderboard') {
                    useFlocusStore.getState().bumpLeaderboardReset()
                  }
                  setSettingsTab(tab.id)
                  if (tab.mode) setMode(tab.mode)
                  onNavigate?.()
                }}
                className={`nav-link text-start nav-link-theme-child${active ? ' active' : ''}${
                  tab.requiresLogin && isLoggedIn ? ' logged-in' : ''
                }`}
              >
                <SettingsNavIcon name={tab.id} />
                <span className="nav-label">{tab.label}</span>
                {tab.badge ? <span className="badge badge-new ms-2 bg-success">{tab.badge}</span> : null}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
