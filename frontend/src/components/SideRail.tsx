import {
  IconExpand,
  IconMore,
  IconMusic,
  IconNotepad,
  IconTasks,
} from './icons/FlocusIcons'
import { IconHouse, IconLamp } from './icons/AppIcons'
import { NotepadPanel } from './NotepadPanel'
import { SoundsPanel } from './SoundsPanel'
import { TaskPanel } from './TaskPanel'
import type { DashboardMode, Panel } from '../types'
import { useFlocusStore } from '../store/useFlocusStore'

const MODES: { id: DashboardMode; label: string; Icon: typeof IconHouse }[] = [
  { id: 'home', label: 'Home', Icon: IconHouse },
  { id: 'focus', label: 'Focus', Icon: IconLamp },
]

export function SideRail() {
  const mode = useFlocusStore((s) => s.mode)
  const panel = useFlocusStore((s) => s.panel)
  const streak = useFlocusStore((s) => s.streak)
  const tasks = useFlocusStore((s) => s.tasks)
  const settings = useFlocusStore((s) => s.settings)
  const setMode = useFlocusStore((s) => s.setMode)
  const setPanel = useFlocusStore((s) => s.setPanel)
  const setSettingsTab = useFlocusStore((s) => s.setSettingsTab)

  const position = settings.sideRailPosition ?? 'left'
  const incompleteTasks = tasks.filter((t) => !t.completed).length

  const pickMode = (next: DashboardMode) => {
    if (next === mode) return
    setMode(next)
  }

  const togglePanel = (target: Panel) => {
    if (panel === target) {
      setPanel('none')
      return
    }
    setPanel(target)
  }

  const openSettings = () => {
    if (panel === 'settings') {
      setPanel('none')
      return
    }
    const legacy: Record<string, string> = {
      themeHome: 'homeTheme',
      themeFocus: 'focusTheme',
      themeAmbient: 'homeTheme',
      ambientTheme: 'homeTheme',
    }
    let tab = legacy[settings.defaultSettingsTab] ?? settings.defaultSettingsTab
    if (!tab || tab === 'themes') tab = 'homeTheme'
    setSettingsTab(tab)
    setPanel('settings')
  }

  const fullscreen = () => {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen()
    else void document.exitFullscreen()
  }

  const soundsOpen = panel === 'sounds'
  const tasksOpen = panel === 'tasks'
  const notepadOpen = panel === 'notepad'
  const drawerOpen = soundsOpen || tasksOpen || notepadOpen

  return (
    <>
      {drawerOpen && (
        <div
          className="rail-drawer-backdrop"
          aria-hidden
          onClick={() => setPanel('none')}
        />
      )}

      <nav className={`side-rail side-rail--${position}`} id="side-rail" aria-label="Dashboard controls">
        <div
          className="rail-mode-group"
          role="tablist"
          aria-label="Dashboard mode"
          data-active={mode}
        >
          <span className="rail-mode-indicator" aria-hidden />
          {MODES.map(({ id, label, Icon }) => {
            const active = mode === id
            const showStreakHere =
              id === 'focus' && settings.showStreakCounter && mode === 'focus'
            return (
              <div
                key={id}
                className={`rail-mode-slot${showStreakHere ? ' rail-mode-slot--streak' : ''}`}
              >
                {showStreakHere ? (
                  <div className="rail-streak" title={`${streak}-day streak`} aria-live="polite">
                    <span className="rail-streak-emoji" aria-hidden>🔥</span>
                    <span className="rail-streak-count">{streak}</span>
                  </div>
                ) : null}
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  title={label}
                  className={`rail-mode-btn${active ? ' is-active' : ''}`}
                  onClick={() => pickMode(id)}
                >
                  <Icon size={20} />
                  <span className="rail-mode-label">{label}</span>
                </button>
              </div>
            )
          })}
        </div>

        <span className="rail-divider" aria-hidden />

        <button
          type="button"
          className={`rail-btn${tasksOpen ? ' is-active' : ''}`}
          title="Tasks"
          aria-pressed={tasksOpen}
          onClick={() => togglePanel('tasks')}
        >
          <IconTasks size={22} />
          {incompleteTasks > 0 && (
            <span className="rail-badge" aria-label={`${incompleteTasks} open tasks`}>
              {incompleteTasks}
            </span>
          )}
          <span className="rail-label">Tasks</span>
        </button>

        <button
          type="button"
          className={`rail-btn${soundsOpen ? ' is-active' : ''}`}
          title="Sounds & Music"
          aria-pressed={soundsOpen}
          onClick={() => togglePanel(soundsOpen ? 'none' : 'sounds')}
        >
          <IconMusic size={22} />
          <span className="rail-label">Sounds</span>
        </button>

        <button
          type="button"
          className={`rail-btn${notepadOpen ? ' is-active' : ''}`}
          title="Notepad"
          aria-pressed={notepadOpen}
          onClick={() => togglePanel('notepad')}
        >
          <IconNotepad size={22} />
          <span className="rail-label">Notepad</span>
        </button>

        <span className="rail-divider" aria-hidden />

        <button
          type="button"
          className={`rail-btn${panel === 'settings' ? ' is-active' : ''}`}
          title="More / Settings"
          aria-pressed={panel === 'settings'}
          aria-label="Settings and appearance"
          onClick={openSettings}
        >
          <IconMore size={22} />
          <span className="rail-label">More</span>
        </button>

        <button
          type="button"
          className="rail-btn"
          title="Toggle fullscreen"
          onClick={fullscreen}
        >
          <IconExpand size={22} />
          <span className="rail-label">Fullscreen</span>
        </button>
      </nav>

      {drawerOpen && (
        <div className={`rail-drawer rail-drawer--${position}`} role="dialog" aria-modal="false">
          {tasksOpen && (
            <div className="tasks-popout-wrapper show flocus-is-plus">
              <TaskPanel />
            </div>
          )}
          {soundsOpen && (
            <flocus-sounds className={`show active flocus-is-plus${panel === 'sounds' ? ' show-controls' : ''}`}>
              <SoundsPanel />
            </flocus-sounds>
          )}
          {notepadOpen && (
            <flocus-notepad className="show flocus-is-plus">
              <NotepadPanel />
            </flocus-notepad>
          )}
        </div>
      )}
    </>
  )
}
