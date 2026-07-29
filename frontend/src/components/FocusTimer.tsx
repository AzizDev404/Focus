import { useEffect, useId, useState } from 'react'
import { IconPip, IconReset } from './icons/FlocusIcons'
import { useFocusTimer } from '../hooks/useFocusTimer'
import { timerDataMode } from '../lib/timerMode'
import { useFlocusStore } from '../store/useFlocusStore'
import { ClockDisplay } from './ClockDisplay'
import { STATIC_TALLIES, DYNAMIC_TALLIES, getTheme } from '../data/catalog'
import { CLOCK_FONTS_GOOGLE_STYLESHEET, pipClockFontCss } from '../lib/clockFonts'
import type { TimerSegment } from '../types'

export function FocusTimer() {
  const timer = useFlocusStore((s) => s.timer)
  const settings = useFlocusStore((s) => s.settings)
  const tasks = useFlocusStore((s) => s.tasks)
  const { toggle, reset, initFromSettings, switchSegment } = useFocusTimer()
  const [resetSpin, setResetSpin] = useState(false)
  const radioName = useId()

  useEffect(() => {
    initFromSettings()
  }, [
    settings.timerMode,
    settings.focusMinutes,
    settings.shortBreakMinutes,
    settings.longBreakMinutes,
    settings.countdownMinutes,
    settings.useTaskEtaTimer,
    initFromSettings,
  ])

  const activeTask = tasks.find((t) => !t.completed)
  const displaySeconds =
    settings.timerMode === 'stopwatch' ? timer.secondsElapsed : timer.secondsLeft

  const maxTally = 4
  const tallyIndex = Math.min(timer.pomodoroCount, maxTally - 1)

  const staticTallyDef = STATIC_TALLIES.find((t) => t.id === settings.staticTally)
  const dynamicTallyDef = DYNAMIC_TALLIES.find((t) => t.id === settings.dynamicTally)
  const tallyIcon = staticTallyDef?.icon ?? '●'

  const totalSegmentSeconds =
    timer.segment === 'focus'
      ? settings.focusMinutes * 60
      : timer.segment === 'shortBreak'
        ? settings.shortBreakMinutes * 60
        : timer.segment === 'longBreak'
          ? settings.longBreakMinutes * 60
          : timer.segment === 'countdown'
            ? settings.countdownMinutes * 60
            : 0
  const progressPct =
    settings.timerMode === 'stopwatch'
      ? 0
      : totalSegmentSeconds > 0
        ? Math.max(0, Math.min(100, ((totalSegmentSeconds - timer.secondsLeft) / totalSegmentSeconds) * 100))
        : 0

  const showPomoSegments =
    settings.timerMode === 'pomodoro' || settings.timerMode === '52/17' || settings.timerMode === 'animedoro'

  const formatTimerSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
    return `${m}:${pad(s)}`
  }

  const handleReset = () => {
    reset()
    setResetSpin(true)
    window.setTimeout(() => setResetSpin(false), 1000)
  }

  /**
   * Resolve the focus background source for the PiP window: prefers the user
   * upload, then the picked theme's image, then the theme gradient. Falls back
   * to a tasteful dark gradient so the PiP is never empty.
   */
  const resolvePipBackground = () => {
    const state = useFlocusStore.getState()
    const focusTheme = getTheme(state.settings.themeFocus)
    const focusCustom = state.settings.customThemes.focus
    if (focusCustom?.dataUrl) {
      return {
        image: focusCustom.dataUrl,
        gradient: undefined as string | undefined,
        overlayOpacity: focusCustom.opacity ?? 35,
      }
    }
    if (focusTheme?.image) {
      return { image: focusTheme.image, gradient: undefined, overlayOpacity: 35 }
    }
    if (focusTheme?.gradient) {
      return { image: undefined, gradient: focusTheme.gradient, overlayOpacity: 0 }
    }
    return {
      image: undefined,
      gradient: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
      overlayOpacity: 0,
    }
  }

  const enterDocumentPip = async () => {
    const format = formatTimerSeconds

    /**
     * Renders the entire PiP UI into the given Document: background image
     * (with overlay), task title (optional), big timer, and Start/Pause +
     * Reset buttons. Returns a cleanup function that clears the interval.
     */
    const renderPipDocument = (doc: Document, win: Window) => {
      const { image, gradient, overlayOpacity } = resolvePipBackground()
      const clockFont = useFlocusStore.getState().settings.clockFont
      const pipFont = pipClockFontCss(clockFont)
      const accent =
        getComputedStyle(document.documentElement).getPropertyValue('--fl-accent-color').trim() ||
        '#7432ff'

      doc.head.insertAdjacentHTML(
        'beforeend',
        `<link rel="preconnect" href="https://fonts.googleapis.com" />
         <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
         <link href="${CLOCK_FONTS_GOOGLE_STYLESHEET}" rel="stylesheet" />`,
      )

      doc.head.insertAdjacentHTML(
        'beforeend',
        `<style>
          :root { --fl-accent: ${accent}; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; height: 100%; font-family: 'Inter', system-ui, sans-serif; color: #fff; }
          body { background: ${gradient ?? '#0f0f1a'}; overflow: hidden; }
          .pip-root {
            position: relative;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            gap: 0.6rem;
            padding: 0.85rem 1rem;
          }
          .pip-bg {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: 0;
          }
          .pip-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.75) 100%);
            z-index: 1;
          }
          .pip-content { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 0.45rem; }
          .pip-task {
            font-size: 0.78rem;
            opacity: 0.85;
            max-width: 260px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 500;
            letter-spacing: -0.01em;
          }
          .pip-time {
            font-size: ${clockFont === 'pixel' ? '1.65rem' : '3.4rem'};
            line-height: 1.15;
            font-variant-numeric: tabular-nums;
            text-shadow: 0 4px 22px rgba(0,0,0,0.4);
            ${pipFont}
          }
          .pip-actions { display: flex; align-items: center; gap: 0.55rem; }
          .pip-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: none;
            padding: 0.45rem 1.05rem;
            border-radius: 999px;
            background: var(--fl-accent);
            color: #fff;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            letter-spacing: -0.01em;
            transition: transform 160ms ease, filter 160ms ease;
          }
          .pip-btn:hover { filter: brightness(1.1); }
          .pip-btn:active { transform: scale(0.96); }
          .pip-btn.icon {
            background: rgba(255,255,255,0.12);
            padding: 0.45rem;
            width: 2.05rem;
            height: 2.05rem;
            border-radius: 999px;
          }
          .pip-btn.icon:hover { background: rgba(255,255,255,0.2); }
          .pip-btn svg { width: 1.05rem; height: 1.05rem; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        </style>`,
      )

      const root = doc.createElement('div')
      root.className = 'pip-root'

      if (image) {
        const bg = doc.createElement('div')
        bg.className = 'pip-bg'
        bg.style.backgroundImage = `url("${image}")`
        bg.style.opacity = String(1 - overlayOpacity / 100)
        root.appendChild(bg)
      }
      const overlay = doc.createElement('div')
      overlay.className = 'pip-overlay'
      root.appendChild(overlay)

      const content = doc.createElement('div')
      content.className = 'pip-content'

      const taskEl = doc.createElement('div')
      taskEl.className = 'pip-task'
      content.appendChild(taskEl)

      const timeEl = doc.createElement('div')
      timeEl.className = 'pip-time'
      content.appendChild(timeEl)

      const actions = doc.createElement('div')
      actions.className = 'pip-actions'

      const toggleBtn = doc.createElement('button')
      toggleBtn.type = 'button'
      toggleBtn.className = 'pip-btn'
      toggleBtn.textContent = 'Start'
      toggleBtn.addEventListener('click', () => {
        useFlocusStore.getState()
        toggle()
      })
      actions.appendChild(toggleBtn)

      const resetBtn = doc.createElement('button')
      resetBtn.type = 'button'
      resetBtn.className = 'pip-btn icon'
      resetBtn.title = 'Reset'
      resetBtn.setAttribute('aria-label', 'Reset')
      resetBtn.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
        </svg>`
      resetBtn.addEventListener('click', () => {
        reset()
        setResetSpin(true)
        window.setTimeout(() => setResetSpin(false), 1000)
      })
      actions.appendChild(resetBtn)

      content.appendChild(actions)
      root.appendChild(content)
      doc.body.appendChild(root)

      const tick = () => {
        const state = useFlocusStore.getState()
        const t = state.timer
        const secs =
          state.settings.timerMode === 'stopwatch' ? t.secondsElapsed : t.secondsLeft
        timeEl.textContent = format(secs)
        toggleBtn.textContent = t.isRunning ? 'Pause' : 'Start'
        const showTask = state.settings.showTaskInPip
        const at = state.tasks.find((task) => !task.completed)
        if (showTask && at?.text) {
          taskEl.textContent = at.text
          taskEl.style.display = ''
        } else {
          taskEl.style.display = 'none'
        }
      }
      tick()
      const id = setInterval(tick, 250)
      win.addEventListener('pagehide', () => clearInterval(id))
    }

    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await (
          window as Window & {
            documentPictureInPicture: {
              requestWindow: (opts?: { width?: number; height?: number }) => Promise<Window>
            }
          }
        ).documentPictureInPicture.requestWindow({ width: 320, height: 200 })

        renderPipDocument(pipWindow.document, pipWindow)
        return
      } catch {
        /* popup fallback below */
      }
    }

    const popup = window.open(
      '',
      'flocus-pip',
      'width=320,height=200,menubar=no,toolbar=no,location=no,status=no',
    )
    if (!popup) return
    popup.document.title = 'Focus Timer'
    renderPipDocument(popup.document, popup)
  }

  const controlTimerType = (seg: TimerSegment) =>
    seg === 'focus' ? 'pomodoro' : seg

  const segmentOption = (seg: TimerSegment, label: string, withCounter = false) => (
    <div className="form-check" data-controls-timer-type={controlTimerType(seg)}>
      <input
        className="form-check-input"
        type="radio"
        name={radioName}
        id={`${radioName}-${seg}`}
        checked={timer.segment === seg}
        onChange={() => switchSegment(seg as 'focus' | 'shortBreak' | 'longBreak')}
      />
      <label className="form-check-label btn" htmlFor={`${radioName}-${seg}`}>
        {label}
      </label>
      {withCounter &&
        (settings.timerMode === 'pomodoro' ||
          settings.timerMode === '52/17' ||
          settings.timerMode === 'animedoro') && (
        <div
          className="pomo-counter"
          data-indicators={dynamicTallyDef ? 'dynamic' : 'static'}
          data-timer={timerDataMode(settings.timerMode)}
          data-counter={timer.pomodoroCount}
        >
          {Array.from({ length: maxTally }).map((_, i) => {
            const active = i < timer.pomodoroCount
            const isPulse = i === tallyIndex && active
            const stage = dynamicTallyDef
              ? dynamicTallyDef.stages[Math.min(i, dynamicTallyDef.stages.length - 1)]
              : tallyIcon
            return (
              <span
                key={i}
                className={`tally-icon${active ? ' active' : ''}${isPulse ? ' pulse' : ''}`}
                aria-hidden
              >
                {stage}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )

  const dataMode = timerDataMode(settings.timerMode)
  const timerTypeAttr = timer.segment === 'focus' ? 'pomodoro' : timer.segment

  return (
    <pomodoro-timer
      data-mode={dataMode}
      data-timer-type={timerTypeAttr}
      className="text-center"
    >
      <flocus-priorities
        onClick={() => useFlocusStore.getState().setPanel('tasks')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            useFlocusStore.getState().setPanel('tasks')
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="task">
          {activeTask?.emoji && <span className="emoji">{activeTask.emoji}</span>}
          <span className="title">{activeTask?.text || 'What do you want to focus on?'}</span>
        </div>
      </flocus-priorities>

      {showPomoSegments && (
        <div className="pomodoro-durations">
          {segmentOption('focus', 'Focus', true)}
          {segmentOption('shortBreak', 'Short Break')}
          {segmentOption('longBreak', 'Long Break')}
        </div>
      )}

      <ClockDisplay settings={settings} variant="timer" time={displaySeconds} />

      {settings.showProgressBar && settings.timerMode !== 'stopwatch' && (
        <div className="timer-progress" role="progressbar" aria-valuenow={Math.round(progressPct)} aria-valuemin={0} aria-valuemax={100}>
          <div className="timer-progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      <div className="pomodoro-clock-actions">
        <button type="button" className="btn pomodoro-start" onClick={toggle}>
          <span className="play-icon">{timer.isRunning ? 'Pause' : 'Start'}</span>
        </button>
        <button
          type="button"
          className={`pomodoro-stop no-style bg-transparent${resetSpin ? ' animation-spin' : ''}`}
          title="Reset"
          aria-label="Reset timer"
          onClick={handleReset}
        >
          <IconReset />
        </button>
        <button
          type="button"
          className="pip-button no-style bg-transparent"
          title="Picture-in-Picture"
          aria-label="Picture in picture"
          onClick={() => void enterDocumentPip()}
        >
          <IconPip />
        </button>
      </div>
    </pomodoro-timer>
  )
}
