import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useFlocusStore } from '../store/useFlocusStore'

function parsePage(pathname: string) {
  const segments = pathname.replace(/^\/+/g, '').replace(/\/+$/g, '').split('/')
  // Only return a mode when the URL explicitly references one we care about.
  if (segments[1] === 'focus') {
    return { mode: 'focus' as const, panel: 'none' as const }
  }
  if (segments[1] === 'settings') {
    const settingsTab = segments[2]
    return {
      mode: settingsTab === 'focusTheme' ? 'focus' as const : undefined,
      panel: 'settings' as const,
      settingsTab: settingsTab || undefined,
    }
  }
  // For other paths (e.g. /app/more) don't force a mode change; return an empty
  // object so callers can choose whether to update the mode.
  return {}
}

export function useLocationSync() {
  const location = useLocation()
  const navigate = useNavigate()
  const setMode = useFlocusStore((s) => s.setMode)
  const setPanel = useFlocusStore((s) => s.setPanel)
  const setSettingsTab = useFlocusStore((s) => s.setSettingsTab)
  const mode = useFlocusStore((s) => s.mode)
  const panel = useFlocusStore((s) => s.panel)
  const settingsTab = useFlocusStore((s) => s.settingsTab)
  const initialized = useRef(false)

  useEffect(() => {
    const { mode: pageMode, panel: pagePanel, settingsTab: pageSettingsTab } = parsePage(location.pathname) as {
      mode?: 'home' | 'focus'
      panel?: 'none' | 'settings'
      settingsTab?: string
    }
    if (pageMode) setMode(pageMode)
    if (pagePanel) setPanel(pagePanel)
    if (pageSettingsTab) setSettingsTab(pageSettingsTab)
    initialized.current = true
  }, [location.pathname, setMode, setPanel, setSettingsTab])

  useEffect(() => {
    if (!initialized.current) return
    let path = '/app'
    if (mode === 'focus') path = '/app/focus'
    if (panel === 'settings') {
      path = `/app/settings${settingsTab ? `/${settingsTab}` : ''}`
    }
    const isManagedPath = (p: string) => {
      // Only consider our core app routes as managed. Anything else (e.g.
      // /app/more) is left alone so the user stays where they navigated.
      return /^\/app(?:\/focus|(?:\/settings(?:\/.*)?)?)?$/.test(p) || p === '/app'
    }

    if (location.pathname !== path && isManagedPath(location.pathname)) {
      navigate(path, { replace: true })
    }
  }, [mode, panel, settingsTab, location.pathname, navigate])
}
