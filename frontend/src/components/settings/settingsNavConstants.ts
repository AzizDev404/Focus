import type { DashboardMode } from '../../types'

export type SettingsNavTab = {
  id: string
  label: string
  badge?: 'NEW'
  mode?: DashboardMode
  requiresLogin?: boolean
}

export type SettingsNavGroupDef = {
  id: string
  label: string
  icon: string
  tabs: SettingsNavTab[]
}

export const SETTINGS_NAV_GROUPS: SettingsNavGroupDef[] = [
  {
    id: 'appearance',
    label: 'Appearance',
    icon: 'themes',
    tabs: [
      { id: 'homeTheme', label: 'Home Theme', mode: 'home' },
      { id: 'focusTheme', label: 'Focus Theme', mode: 'focus' },
      { id: 'clock', label: 'Clock', badge: 'NEW' },
      { id: 'quotes', label: 'Quotes' },
      { id: 'extras', label: 'Extras' },
    ],
  },
  {
    id: 'focus',
    label: 'Focus',
    icon: 'timer',
    tabs: [
      { id: 'timer', label: 'Focus Timer', badge: 'NEW' },
      { id: 'stats', label: 'Stats' },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: 'profile',
    tabs: [
      { id: 'profile', label: 'Profile', requiresLogin: true },
      { id: 'magazine', label: 'Magazine', requiresLogin: true },
      { id: 'leaderboard', label: 'Leaderboard', requiresLogin: true },
      { id: 'mail', label: 'Mail', requiresLogin: true },
    ],
  },
]

export function flattenSettingsNavTabs(): SettingsNavTab[] {
  return SETTINGS_NAV_GROUPS.flatMap((group) => group.tabs)
}

export function settingsNavGroupForTab(tab: string): SettingsNavGroupDef | undefined {
  return SETTINGS_NAV_GROUPS.find((group) => group.tabs.some((t) => t.id === tab))
}
