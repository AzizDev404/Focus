import { useEffect, useState, type ReactNode } from 'react'
import { ALERT_SOUNDS, DYNAMIC_TALLIES, STATIC_TALLIES } from '../data/catalog'
import { calculateFocusScore } from '../lib/focusScore'
import { CLOCK_FONT_DEFINITIONS, CLOCK_FONT_PICKER_IDS } from '../lib/clockFonts'
import { getTheme } from '../data/catalog'
import { aggregatePeriodStats } from '../lib/statsPeriod'
import { StatsChart, SessionsBarChart } from './StatsChart'
import { SettingsNavGroup } from './settings/SettingsNavGroup'
import { flattenSettingsNavTabs, SETTINGS_NAV_GROUPS } from './settings/settingsNavConstants'
import { isThemeSettingsTab } from './settings/themeNavConstants'
import { ThemeTabContent } from './settings/ThemeTabContent'
import { FormSwitch, SettingsGroup, SettingsHeader, SettingsInputGroup, SettingsSection } from './settings/settingsForm'
import { SettingsSelect } from './settings/SettingsSelect'
import type { DashboardMode, TimerMode } from '../types'
import { AccountTabContent } from './account/AccountTabContent'
import '../styles/account-hub-pages.css'
import { useIsLoggedIn } from '../hooks/useAuthSession'
import { useFlocusStore } from '../store/useFlocusStore'

const TIMER_MODES: { id: TimerMode; label: string }[] = [
  { id: 'pomodoro', label: 'Pomodoro' },
  { id: 'countdown', label: 'Countdown' },
  { id: 'stopwatch', label: 'Stopwatch (Count-Up)' },
  { id: 'animedoro', label: 'Animedoro' },
  { id: '52/17', label: '52/17' },
]

export function SettingsPanel() {
  const settings = useFlocusStore((s) => s.settings)
  const setSettings = useFlocusStore((s) => s.setSettings)
  const settingsTab = useFlocusStore((s) => s.settingsTab)
  const setSettingsTab = useFlocusStore((s) => s.setSettingsTab)
  const setPanel = useFlocusStore((s) => s.setPanel)
  const setMode = useFlocusStore((s) => s.setMode)
  const streak = useFlocusStore((s) => s.streak)
  const statsPeriod = useFlocusStore((s) => s.statsPeriod)
  const setStatsPeriod = useFlocusStore((s) => s.setStatsPeriod)
  const statsHistory = useFlocusStore((s) => s.statsHistory)
  const requestWakeLock = useFlocusStore((s) => s.requestWakeLock)
  const releaseWakeLock = useFlocusStore((s) => s.releaseWakeLock)

  const [navOpen, setNavOpen] = useState(false)

  const isLoggedIn = useIsLoggedIn()

  useEffect(() => {
    if (settingsTab === 'account') setSettingsTab('profile')
  }, [settingsTab, setSettingsTab])

  // Back-compat: old clients may still have these tabs selected.
  useEffect(() => {
    if (settingsTab === 'achievements' || settingsTab === 'collection') {
      setSettingsTab(settingsTab === 'collection' ? 'magazine' : 'profile')
    }
    if (settingsTab === 'chats' || settingsTab === 'messages' || settingsTab === 'chat') {
      setSettingsTab('profile')
    }
    if (settingsTab === 'ambientTheme') setSettingsTab('homeTheme')
  }, [settingsTab, setSettingsTab])

  const periodStats = aggregatePeriodStats(statsPeriod, statsHistory)
  const score = calculateFocusScore(periodStats, streak)

  const activeThemeMode: DashboardMode = settingsTab === 'focusTheme' ? 'focus' : 'home'

  const tabPane = (id: string, title: string, children: ReactNode, subtitle?: string) => (
    <div id={id} className="tab-pane fade show active flocus-is-plus" role="tabpanel">
      <SettingsHeader title={title} subtitle={subtitle} />
      {children}
    </div>
  )

  const previewStyleForMode = (mode: DashboardMode): React.CSSProperties => {
    const themeId = mode === 'focus' ? settings.themeFocus : settings.themeHome
    const custom = settings.customThemes?.[mode]
    const theme = getTheme(themeId)

    // Custom uploaded image
    if (custom?.dataUrl && custom.kind !== 'video') {
      return {
        backgroundImage: `url(${custom.dataUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: `${custom.posX ?? 50}% ${custom.posY ?? 50}%`,
      }
    }

    // Theme image
    const themeImage = theme?.image ?? theme?.mobileImage
    if (themeImage) {
      return { backgroundImage: `url(${themeImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    }

    // Gradient
    if (theme?.gradient) return { background: theme.gradient }

    // Fallback to accent color
    if (settings.accentColor) return { background: settings.accentColor }

    return {}
  }

  const renderNavGroups = () =>
    SETTINGS_NAV_GROUPS.map((group) => (
      <SettingsNavGroup
        key={group.id}
        group={group}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        setMode={setMode}
        isLoggedIn={isLoggedIn}
        onNavigate={() => setNavOpen(false)}
      />
    ))

  return (
    <div
      className="offcanvas offcanvas-end show"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setPanel('none')
      }}
    >
      <div
        className="offcanvas-body"
        style={
          {
            '--bs-offcanvas-padding-x': '0',
            '--bs-offcanvas-padding-y': '0',
          } as React.CSSProperties
        }
      >
        <div className="d-flex align-items-start h-100">
          <div className="offcanvas-buttons">
            <button
              type="button"
              className="btn-close"
              aria-label="Close settings"
              onClick={() => setPanel('none')}
            />
            <button
              type="button"
              className={`navbar-toggler d-md-none me-auto order-first ${navOpen ? '' : 'collapsed'}`}
              aria-label="Toggle settings navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((o) => !o)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          <nav
            className={`nav flex-column h-100 nav-pills collapse navbar-collapse navbar-expand-lg ${navOpen ? 'show' : ''}`}
            id="settModal-tab"
            role="tablist"
            aria-orientation="vertical"
          >
            {renderNavGroups()}
          </nav>

          <div className="tab-content flex-grow-1" id="settModal-tabContent">
        {settingsTab === 'profile' &&
          tabPane(
            'settModal-profile',
            'Profile',
            <AccountTabContent view="profile" />,
            'Your card, level and achievements.',
          )}

        {settingsTab === 'edit-profile' &&
          tabPane(
            'settModal-edit-profile',
            'Edit profile',
            <AccountTabContent view="edit-profile" />,
            'Customize cover, avatar, frame and charm.',
          )}

        {settingsTab === 'magazine' &&
          tabPane(
            'settModal-magazine',
            'Magazine',
            <AccountTabContent view="magazine" />,
            'Spend coins on backgrounds, avatars, frames and charms.',
          )}

        {settingsTab === 'leaderboard' &&
          tabPane(
            'settModal-leaderboard',
            'Leaderboard',
            <AccountTabContent view="leaderboard" />,
            'Player cards with photo, cover and ID lookup.',
          )}

        {settingsTab === 'mail' &&
          tabPane(
            'settModal-mail',
            'Mail',
            <AccountTabContent view="mail" />,
            'System notifications and password-reset codes.',
          )}

        {settingsTab === 'stats' &&
          tabPane(
            'settModal-stats',
            'Focus Stats',
            <SettingsGroup>
              <div className="stats-panel-body">
              <p className="stats-panel-desc">
                Refine your workflow with insights into your productivity patterns.
              </p>
              <div className="stats-period-pills" role="tablist" aria-label="Stats period">
                {(['today', 'week', 'month'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="tab"
                    aria-selected={statsPeriod === p}
                    onClick={() => setStatsPeriod(p)}
                    className={`stats-period-pill${statsPeriod === p ? ' active' : ''}`}
                  >
                    {p === 'today' ? 'Today' : p === 'week' ? '1 Week' : '4 Weeks'}
                  </button>
                ))}
              </div>
              <div className="stats-grid">
                <div className="stat streak">
                  <span className="time-period-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M12 23c-1.1 0-2-.9-2-2 0-.7.4-1.3 1-1.6-.6-.3-1-1-1-1.7C10 15.1 12 13 12 10.5 12 8 10 6 8 6c-2.2 0-4 1.8-4 4 0 2.5 2 4.6 2 7.2 0 .7-.4 1.4-1 1.7.6.3 1 .9 1 1.6 0 1.1.9 2 2 2h6z" />
                    </svg>
                  </span>
                  <div className="time-period-title">Streak</div>
                  <div className="time-period-value">{formatStreak(streak)}</div>
                </div>
                <div className="stat focus">
                  <span className="time-period-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                    </svg>
                  </span>
                  <div className="time-period-title">Focus Time</div>
                  <div className="time-period-value">{formatDur(periodStats.focusSeconds)}</div>
                </div>
                <div className="stat score">
                  <span className="time-period-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                    </svg>
                  </span>
                  <div className="time-period-title">Focus Score</div>
                  <div className="time-period-value">{score}</div>
                </div>
                <div className="stat tasks">
                  <span className="time-period-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </span>
                  <div className="time-period-title">Tasks Completed</div>
                  <div className="time-period-value">{periodStats.tasksCompleted}</div>
                </div>
                <div className="stat pomos">
                  <span className="time-period-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="13" r="8" />
                      <path d="M12 9v4l2.5 1.5M16 5l1-2M8 5L7 3" />
                    </svg>
                  </span>
                  <div className="time-period-title">Sessions</div>
                  <div className="time-period-value">{periodStats.sessions}</div>
                </div>
                <div className="stat break">
                  <span className="time-period-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M18.5 3H6c-1.1 0-2 .9-2 2v5.71c0 3.13 2.55 5.68 5.68 5.68.93 0 1.82-.22 2.6-.63l1.02 1.02c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-1.02-1.02c.41-.78.63-1.67.63-2.6V5h10v5.71c0 1.08-.29 2.09-.8 2.96l1.46 1.46c.39.39.39 1.02 0 1.41-.39.39-1.02.39-1.41 0L18.5 14.1V19c0 1.1-.9 2-2 2H8v2h8.5c2.21 0 4-1.79 4-4v-4.9c1.16-.91 2-2.24 2-3.81V5c0-1.1-.9-2-2-2z" />
                    </svg>
                  </span>
                  <div className="time-period-title">Break Time</div>
                  <div className="time-period-value">{formatDur(periodStats.breakSeconds)}</div>
                </div>
              </div>
              <div className="stats-charts">
                <h4 className="stats-chart-label">Recent productivity</h4>
                <div className="stats-chart-card">
                  <StatsChart period={statsPeriod} />
                </div>
                {statsPeriod !== 'today' && (
                  <>
                    <h4 className="stats-chart-label">Sessions</h4>
                    <div className="stats-chart-card stats-chart-card--compact">
                      <SessionsBarChart period={statsPeriod} />
                    </div>
                  </>
                )}
              </div>
              </div>
            </SettingsGroup>,
            'Track your focus patterns over time.',
          )}

        {settingsTab === 'timer' &&
          tabPane(
            'settModal-timer',
            'Focus Timer',
            <SettingsGroup>
              <SettingsSection title="Timer mode" description="Choose how each focus session is measured.">
                <SettingsInputGroup label="Mode" htmlFor="timerMode">
                  <SettingsSelect
                    id="timerMode"
                    value={settings.timerMode}
                    onValueChange={(v) => setSettings({ timerMode: v as TimerMode })}
                    options={TIMER_MODES.map((m) => ({ value: m.id, label: m.label }))}
                    aria-label="Timer mode"
                  />
                </SettingsInputGroup>
                <FormSwitch
                  id="taskMode"
                  label="Use Task ETA Mode timer"
                  description="Runs your timer according to task estimates."
                  checked={settings.useTaskEtaTimer}
                  onChange={(v) => setSettings({ useTaskEtaTimer: v })}
                />
              </SettingsSection>

              {settings.timerMode !== 'stopwatch' && (
                <SettingsSection
                  title="Timer lengths"
                  description="Tune the focus and break durations in minutes."
                >
                  <div className="timer-lengths-grid">
                    <NumField label="Focus" value={settings.focusMinutes} onChange={(v) => setSettings({ focusMinutes: v })} />
                    <NumField label="Short break" value={settings.shortBreakMinutes} onChange={(v) => setSettings({ shortBreakMinutes: v })} />
                    <NumField label="Long break" value={settings.longBreakMinutes} onChange={(v) => setSettings({ longBreakMinutes: v })} />
                    {settings.timerMode === 'countdown' && (
                      <NumField label="Countdown" value={settings.countdownMinutes} onChange={(v) => setSettings({ countdownMinutes: v })} />
                    )}
                  </div>
                </SettingsSection>
              )}

              <SettingsSection title="Behavior" className="settings-section-tall">
                <FormSwitch id="autoStart" label="Auto-start next segment" checked={settings.autoStart} onChange={(v) => setSettings({ autoStart: v })} />
                <FormSwitch id="autoStartBreaks" label="Auto-start breaks" checked={settings.autoStartBreaks} onChange={(v) => setSettings({ autoStartBreaks: v })} />
                <FormSwitch id="showStreaks" label="Show streak counter" checked={settings.showStreakCounter} onChange={(v) => setSettings({ showStreakCounter: v })} />
                <FormSwitch id="showPip" label="Show task in PiP" checked={settings.showTaskInPip} onChange={(v) => setSettings({ showTaskInPip: v })} />
                <FormSwitch id="flipTimer" label="Flip clock timer" checked={settings.flipClock} onChange={(v) => setSettings({ flipClock: v })} />
                <FormSwitch
                  id="showProgressBar"
                  label="Show timer progress bar"
                  checked={settings.showProgressBar}
                  onChange={(v) => setSettings({ showProgressBar: v })}
                />
              </SettingsSection>

              <SettingsSection title="Alert sound" description="Sound that plays when a segment ends.">
                <SettingsInputGroup label="Volume" htmlFor="alertVolume">
                  <input
                    id="alertVolume"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.alertVolume}
                    onChange={(e) => setSettings({ alertVolume: Number(e.target.value) })}
                    className="form-range"
                  />
                </SettingsInputGroup>
                <div className="alert-sound-grid" role="radiogroup" aria-label="Alert sound">
                  {ALERT_SOUNDS.map((a) => {
                    const active = settings.alertSound === a.id
                    const parts = a.label.split(' ')
                    const emoji = parts[0]
                    const name = parts.slice(1).join(' ')
                    return (
                      <button
                        key={a.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSettings({ alertSound: a.id })}
                        className={`alert-sound-option${active ? ' active' : ''}`}
                      >
                        <span className="radio-dot" aria-hidden />
                        <span className="alert-sound-emoji" aria-hidden>{emoji}</span>
                        <span className="alert-sound-name">{name}</span>
                      </button>
                    )
                  })}
                </div>
                <FormSwitch
                  id="showNotification"
                  label="Show desktop notifications"
                  description="Notify you when a segment ends."
                  checked={settings.showNotification}
                  onChange={(v) => setSettings({ showNotification: v })}
                />
              </SettingsSection>

              <SettingsSection
                title="Session tallies"
                description="Visual counter that fills as you complete sessions."
              >
                <SettingsInputGroup label="Static tally style" htmlFor="staticTally">
                  <div className="tally-picker" role="radiogroup" aria-label="Static tally style">
                    {STATIC_TALLIES.map((t) => {
                      const active = settings.staticTally === t.id
                      return (
                        <button
                          key={t.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setSettings({ staticTally: t.id })}
                          className={`tally-card${active ? ' active' : ''}`}
                          data-style={t.id}
                        >
                          <span className="tally-card-pill">Focus</span>
                          <span className="tally-card-row" aria-hidden>
                            {Array.from({ length: 4 }).map((_, i) => (
                              <span key={i} className={`tally-card-icon${i < 2 ? ' on' : ''}`}>
                                {t.icon}
                              </span>
                            ))}
                          </span>
                          <span className="tally-card-label">{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </SettingsInputGroup>
                <SettingsInputGroup label="Dynamic tally" htmlFor="dynamicTally">
                  <SettingsSelect
                    id="dynamicTally"
                    value={settings.dynamicTally ?? '__none__'}
                    onValueChange={(v) => setSettings({ dynamicTally: v === '__none__' ? null : v })}
                    options={[
                      { value: '__none__', label: 'None' },
                      ...DYNAMIC_TALLIES.map((t) => ({
                        value: t.id,
                        label: `${t.stages.join(' ')} ${t.label}`,
                      })),
                    ]}
                    aria-label="Dynamic tally"
                  />
                  {settings.dynamicTally && (
                    <div className="tally-preview" aria-hidden>
                      {(() => {
                        const def = DYNAMIC_TALLIES.find((t) => t.id === settings.dynamicTally)
                        if (!def) return null
                        return def.stages.map((stage, i) => (
                          <span key={i} className="tally-preview-icon active">
                            {stage}
                          </span>
                        ))
                      })()}
                    </div>
                  )}
                </SettingsInputGroup>
              </SettingsSection>
            </SettingsGroup>,
            'Customize your timer to match your workflow.',
          )}

        {isThemeSettingsTab(settingsTab) && <ThemeTabContent mode={activeThemeMode} />}

        {settingsTab === 'clock' &&
          tabPane(
            'settModal-clock',
            'Clock',
            <SettingsGroup>
              <SettingsSection title="Clock format" description="Choose between 12-hour or 24-hour clock format.">
                <div className="format-picker" role="radiogroup" aria-label="Clock format">
                    {([
                    { id: '12', label: '12-hour Clock', preview: '2:24', tone: 'warm' },
                    { id: '24', label: '24-hour Clock', preview: '14:24', tone: 'cool' },
                  ] as const).map((opt) => {
                    const active = settings.clockFormat === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={`format-card${active ? ' active' : ''}`}
                        data-tone={opt.tone}
                        onClick={() => setSettings({ clockFormat: opt.id as '12' | '24' })}
                      >
                        <span className="format-card-preview" style={previewStyleForMode('home')}>{opt.preview}</span>
                        <span className="format-card-label">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </SettingsSection>

              <SettingsSection title="Clock & timer style" description="Pick a typography style for the home clock and focus timer.">
                <div className="clock-style-grid" role="radiogroup" aria-label="Clock style">
                  {CLOCK_FONT_PICKER_IDS.map((id) => {
                    const s = CLOCK_FONT_DEFINITIONS[id]
                    const active = settings.clockFont === id
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSettings({ clockFont: id })}
                        className={`clock-style-card${active ? ' active' : ''}`}
                        data-font-style={id}
                      >
                        <span className="clock-style-preview" aria-hidden style={previewStyleForMode('home')}>
                          <span className="clock-style-brand">focus</span>
                          <span
                            className="clock-style-time"
                            style={{
                              fontFamily: s.fontFamily,
                              letterSpacing: s.letterSpacing,
                              fontWeight: s.fontWeight,
                            }}
                          >
                            {settings.clockFormat === '24' ? '14:24' : '2:24'}
                          </span>
                        </span>
                        <span className="clock-style-label">{s.label}</span>
                      </button>
                    )
                  })}
                  
                  {/* Upload card: small '+' card rendered alongside font cards */}
                  <input
                    id="upload-clock-font"
                    type="file"
                    accept=".woff,.woff2"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const url = URL.createObjectURL(f)
                      const name = `CustomClock-${Date.now()}`
                      const rule = `@font-face { font-family: "${name}"; src: url('${url}'); font-weight: normal; font-style: normal; }`
                      const style = document.createElement('style')
                      style.setAttribute('data-custom-clock-font', name)
                      style.appendChild(document.createTextNode(rule))
                      document.head.appendChild(style)
                      setSettings({ customClockFont: { name, url }, clockFont: 'custom' })
                    }}
                  />
                  <label htmlFor="upload-clock-font" className="clock-style-card clock-upload-card" role="button" aria-label="Upload clock font">
                          <span className="clock-style-preview" aria-hidden style={previewStyleForMode('home')}>
                      <span className="clock-style-time" style={{ fontSize: '1.6rem' }}>+</span>
                    </span>
                  </label>
                </div>
                <FormSwitch id="flipClockHome" label="Use flip clock" description="Display the clock with a flip animation." checked={settings.flipClock} onChange={(v) => setSettings({ flipClock: v })} />
                <FormSwitch id="showSeconds" label="Show clock seconds" description="Get a detailed time view. Turn off to hide seconds." checked={settings.showClockSeconds} onChange={(v) => setSettings({ showClockSeconds: v })} />
              </SettingsSection>

              <SettingsSection title="Greetings">
                <FormSwitch id="dynamicGreetings" label="Show dynamic greetings" description="Turn off for generic greetings." checked={settings.dynamicGreetings} onChange={(v) => setSettings({ dynamicGreetings: v })} />
                <FormSwitch id="showGreetings" label="Show greetings" description="Turn off to hide dashboard greetings." checked={settings.showGreetings} onChange={(v) => setSettings({ showGreetings: v })} />
              </SettingsSection>
            </SettingsGroup>,
            'Customize your clock and greetings.',
          )}

        {settingsTab === 'quotes' &&
          tabPane(
            'settModal-quotes',
            'Quotes',
            <SettingsGroup>
              <SettingsSection title="Quote category">
                <SettingsInputGroup label="Select category" htmlFor="quoteCategory">
                  <SettingsSelect
                    id="quoteCategory"
                    value={settings.quoteCategory}
                    onValueChange={(v) => {
                      setSettings({ quoteCategory: v as typeof settings.quoteCategory })
                      useFlocusStore.getState().setQuote()
                    }}
                    options={['all', 'motivational', 'inspirational', 'selfcare', 'gratitude'].map((c) => ({
                      value: c,
                      label: c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1),
                    }))}
                    aria-label="Quote category"
                  />
                </SettingsInputGroup>
                <FormSwitch id="quotesFocus" label="Show quotes in Focus Mode" checked={settings.showQuotesFocus} onChange={(v) => setSettings({ showQuotesFocus: v })} />
                <FormSwitch id="quotesHome" label="Show quotes in Home" checked={settings.showQuotesHome} onChange={(v) => setSettings({ showQuotesHome: v })} />
                <button
                  type="button"
                  onClick={() => useFlocusStore.getState().setQuote()}
                  className="btn btn-secondary btn-sm"
                >
                  Shuffle to a new quote
                </button>
              </SettingsSection>
            </SettingsGroup>,
            'Pick a quote to keep you motivated through the day.',
          )}

        {settingsTab === 'extras' &&
          tabPane(
            'settModal-extras',
            'Extras',
            <SettingsGroup>
              <SettingsSection title="Dashboard display name" description="Update your name that appears in the Home dashboard.">
                <SettingsInputGroup label="Display name" htmlFor="dashboardName">
                  <input
                    id="dashboardName"
                    type="text"
                    value={settings.displayName}
                    onChange={(e) => setSettings({ displayName: e.target.value })}
                    className="form-control"
                    placeholder="Your name"
                  />
                </SettingsInputGroup>
              </SettingsSection>

              <SettingsSection title="Appearance" className="settings-section-tall">
                <SettingsInputGroup label="Accent color" htmlFor="accentColor">
                  <p className="settings-input-help">Pick a highlight color used throughout the UI for buttons, progress, checkboxes and focus rings.</p>
                  <div className="position-picker color-swatch-grid" role="radiogroup" aria-label="Accent color">
                    {([
                      { id: 'blue', label: 'Blue', color: '#0369A1' },
                      { id: 'cyan', label: 'Cyan', color: '#0891B2' },
                      { id: 'emerald', label: 'Emerald', color: '#0D9488' },
                      { id: 'green', label: 'Green', color: '#059669' },
                      { id: 'lime', label: 'Lime', color: '#65A30D' },
                      { id: 'yellow', label: 'Yellow', color: '#CA8A04' },
                      { id: 'amber', label: 'Amber', color: '#D97706' },
                      { id: 'orange', label: 'Orange', color: '#EA580C' },
                      { id: 'red', label: 'Red', color: '#DC2626' },
                      { id: 'rose', label: 'Rose', color: '#E11D48' },
                      { id: 'pink', label: 'Pink', color: '#DB2777' },
                      { id: 'purple', label: 'Purple', color: '#7432FF' },
                    ] as const).map((opt) => {
                      const active =
                        (settings.accentColor ?? '#0369A1').toLowerCase() === opt.color.toLowerCase()
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          aria-label={opt.label}
                          title={opt.label}
                          onClick={() => setSettings({ accentColor: opt.color })}
                          className={`position-card color-swatch-card${active ? ' active' : ''}`}
                          style={
                            {
                              '--swatch-color': opt.color,
                              background: `linear-gradient(180deg, color-mix(in srgb, ${opt.color} 28%, rgba(255,255,255,0.04)) 0%, color-mix(in srgb, ${opt.color} 40%, rgba(255,255,255,0.02)) 100%)`,
                            } as React.CSSProperties
                          }
                        >
                          <span
                            className="color-swatch-preview"
                            style={{ backgroundColor: opt.color }}
                            aria-hidden
                          />
                          <span className="position-label color-swatch-label">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  <br />
                  <div className="color-custom-row">
                    <div className="color-custom-input-wrap">                    
                      <label htmlFor="accentColor" className="color-custom-label">
                        Custom color
                      </label>
                      <br />
                        <input
                        id="accentColor"
                        type="color"
                        className="color-custom-input"
                        value={settings.accentColor ?? '#0369A1'}
                        onChange={(e) => setSettings({ accentColor: e.target.value })}
                        aria-label="Custom accent color"
                      />
                    </div>
                    <br />
                    {(settings.accentColor ?? '#0369A1').toLowerCase() !== '#0369A1' && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm color-reset-btn"
                        onClick={() => setSettings({ accentColor: '#0369A1' })}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </SettingsInputGroup>

                <SettingsInputGroup label="Menu position" htmlFor="sideRailPosition">
                  <p className="settings-input-help">Place the side menu on the left, right or bottom of the screen.</p>
                  <div className="position-picker" role="radiogroup" aria-label="Menu position">
                    {([
                      { id: 'left', label: 'Left' },
                      { id: 'right', label: 'Right' },
                      { id: 'bottom', label: 'Bottom' },
                    ] as const).map((opt) => {
                      const active = settings.sideRailPosition === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setSettings({ sideRailPosition: opt.id })}
                          className={`position-card${active ? ' active' : ''}`}
                        >
                          <span className="position-preview" data-position={opt.id} aria-hidden>
                            <span className="position-preview-bar" />
                          </span>
                          <span className="position-label">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </SettingsInputGroup>
                <FormSwitch
                  id="disableAnimated"
                  label="Disable animated themes"
                  description="Recommended for older devices, especially if you are experiencing lag or timer interruptions. Refresh to take effect."
                  checked={settings.disableAnimatedThemes}
                  onChange={(v) => setSettings({ disableAnimatedThemes: v })}
                />
                <FormSwitch
                  id="randomizeTheme"
                  label="Randomize theme on load"
                  description="Pick a fresh theme each time you open the app."
                  checked={settings.randomizeTheme}
                  onChange={(v) => setSettings({ randomizeTheme: v })}
                />
                <FormSwitch
                  id="clearMode"
                  label="Clear mode"
                  description="Hide extra UI elements when your mouse is not over the browser window. May not work on tablets."
                  checked={settings.clearMode}
                  onChange={(v) => setSettings({ clearMode: v })}
                />
              </SettingsSection>

              <SettingsSection title="Behavior" className="settings-section-tall">
                <SettingsInputGroup label="Default settings shortcut" htmlFor="defaultTab">
                  <p className="settings-input-help">Choose which tab shows when you open the Settings Panel.</p>
                  <SettingsSelect
                    id="defaultTab"
                    value={settings.defaultSettingsTab}
                    onValueChange={(v) => setSettings({ defaultSettingsTab: v })}
                    options={flattenSettingsNavTabs().map((t) => ({ value: t.id, label: t.label }))}
                    aria-label="Default settings tab"
                  />
                </SettingsInputGroup>
                <FormSwitch
                  id="preventSleep"
                  label="Prevent sleep"
                  description="Prevent your device from dimming or turning the screen off. May impact battery life."
                  checked={settings.preventSleep}
                  onChange={(v) => {
                    setSettings({ preventSleep: v })
                    if (v) void requestWakeLock()
                    else releaseWakeLock()
                  }}
                />
              </SettingsSection>
            </SettingsGroup>,
            'Supercharge your experience with these advanced settings.',
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

function NumField({
  label,
  value,
  onChange,
  suffix = 'mins',
  min = 1,
  max = 180,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix?: string
  min?: number
  max?: number
}) {
  // Track the raw text so users can clear the field while typing without
  // it instantly snapping back to a number. Sync from props whenever the
  // committed value changes (e.g. from another component).
  const [draft, setDraft] = useState(String(value))
  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '')
    if (cleaned === '') {
      onChange(min)
      setDraft(String(min))
      return
    }
    let n = Number(cleaned)
    if (!Number.isFinite(n)) n = min
    if (n < min) n = min
    if (n > max) n = max
    onChange(n)
    setDraft(String(n))
  }

  return (
    <SettingsInputGroup label={label} htmlFor={`num-${label}`}>
      <div className="num-input-wrap">
        <input
          id={`num-${label}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={3}
          value={draft}
          /* Strip non-digits live; clamping/empty-handling happens on blur. */
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            // Block characters that <input type="number"> normally allows
            // (minus, plus, dot, comma, e/E) and commit on Enter.
            if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
              e.preventDefault()
              return
            }
            if (e.key === 'Enter') {
              e.preventDefault()
              ;(e.target as HTMLInputElement).blur()
            }
          }}
          className="form-control num-input"
          aria-label={label}
        />
        {suffix ? <span className="num-input-suffix">{suffix}</span> : null}
      </div>
    </SettingsInputGroup>
  )
}

function formatDur(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h) return `${h}h ${m}m`
  if (m) return `${m}m`
  return `${sec}s`
}

function formatStreak(days: number) {
  if (days <= 0) return '0 days'
  return days === 1 ? '1 day' : `${days} days`
}

