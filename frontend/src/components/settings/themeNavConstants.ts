import type { DashboardMode } from '../../types'

export const THEME_SUB_TABS: ReadonlyArray<{
  id: 'homeTheme' | 'focusTheme'
  label: string
  mode: DashboardMode
}> = [
  { id: 'homeTheme', label: 'Home Theme', mode: 'home' },
  { id: 'focusTheme', label: 'Focus Theme', mode: 'focus' },
]

export const THEME_TAB_IDS = new Set<string>(THEME_SUB_TABS.map((t) => t.id))

export function isThemeSettingsTab(tab: string): boolean {
  return THEME_TAB_IDS.has(tab)
}
