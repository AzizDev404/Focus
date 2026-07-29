import { useEffect, useRef, useCallback } from 'react'
import { audioEngine } from '../lib/howlerAudio'
import { useFlocusStore } from '../store/useFlocusStore'
import type { TimerSegment } from '../types'

function segmentDuration(
  segment: TimerSegment,
  settings: ReturnType<typeof useFlocusStore.getState>['settings'],
  taskEtaSeconds?: number,
): number {
  if (settings.useTaskEtaTimer && taskEtaSeconds && segment === 'focus') {
    return taskEtaSeconds
  }
  switch (segment) {
    case 'focus':
      return settings.focusMinutes * 60
    case 'shortBreak':
      return settings.shortBreakMinutes * 60
    case 'longBreak':
      return settings.longBreakMinutes * 60
    case 'countdown':
      return settings.countdownMinutes * 60
    default:
      return 0
  }
}

function activeTaskEtaSeconds(): number | undefined {
  const { tasks, settings } = useFlocusStore.getState()
  if (!settings.useTaskEtaTimer) return undefined
  const task = tasks.find((t) => !t.completed)
  return task?.etaMinutes ? task.etaMinutes * 60 : undefined
}

export function useFocusTimer() {
  const timer = useFlocusStore((s) => s.timer)
  const settings = useFlocusStore((s) => s.settings)
  const setTimer = useFlocusStore((s) => s.setTimer)
  const recordFocusSession = useFlocusStore((s) => s.recordFocusSession)
  const recordBreak = useFlocusStore((s) => s.recordBreak)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const notifyEnd = useCallback(() => {
    audioEngine.playAlert(settings.alertSound, settings.alertVolume)
    if (settings.showNotification && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Focus', { body: 'Timer segment complete!' })
      }
    }
  }, [settings.alertSound, settings.alertVolume, settings.showNotification])

  const advanceSegment = useCallback(() => {
    const { timerMode } = settings
    const { pomodoroCount, segment } = timer
    const eta = activeTaskEtaSeconds()

    if (timerMode === 'stopwatch') {
      recordFocusSession(timer.secondsElapsed)
      setTimer({ isRunning: false, secondsElapsed: 0 })
      notifyEnd()
      return
    }

    const focusDuration =
      segment === 'countdown'
        ? settings.countdownMinutes * 60
        : settings.useTaskEtaTimer && eta
          ? eta
          : settings.focusMinutes * 60

    if (segment === 'focus' || segment === 'countdown') {
      recordFocusSession(focusDuration)
    } else {
      recordBreak(
        segment === 'longBreak'
          ? settings.longBreakMinutes * 60
          : settings.shortBreakMinutes * 60,
      )
    }

    notifyEnd()

    if (timerMode === 'countdown') {
      const nextSecs = settings.countdownMinutes * 60
      setTimer({
        secondsLeft: nextSecs,
        isRunning: settings.autoStart,
      })
      return
    }

    if (timerMode === '52/17') {
      if (segment === 'focus') {
        setTimer({
          segment: 'shortBreak',
          secondsLeft: 17 * 60,
          isRunning: settings.autoStart,
          pomodoroCount: pomodoroCount + 1,
        })
      } else {
        setTimer({
          segment: 'focus',
          secondsLeft: 52 * 60,
          isRunning: settings.autoStart,
        })
      }
      return
    }

    if (timerMode === 'animedoro') {
      if (segment === 'focus') {
        setTimer({
          segment: 'longBreak',
          secondsLeft: settings.longBreakMinutes * 60,
          isRunning: settings.autoStart,
          pomodoroCount: pomodoroCount + 1,
        })
      } else {
        setTimer({
          segment: 'focus',
          secondsLeft: segmentDuration('focus', settings, eta),
          isRunning: settings.autoStart,
          pomodoroCount: 0,
        })
      }
      return
    }

    if (segment === 'focus') {
      const next = pomodoroCount + 1
      if (next >= 4) {
        setTimer({
          segment: 'longBreak',
          secondsLeft: settings.longBreakMinutes * 60,
          isRunning: settings.autoStart,
          pomodoroCount: 0,
        })
      } else {
        setTimer({
          segment: 'shortBreak',
          secondsLeft: settings.shortBreakMinutes * 60,
          isRunning: settings.autoStart,
          pomodoroCount: next,
        })
      }
    } else {
      const task = useFlocusStore.getState().tasks.find((t) => !t.completed)
      const nextEta = task?.etaMinutes ? task.etaMinutes * 60 : undefined
      setTimer({
        segment: 'focus',
        secondsLeft: segmentDuration('focus', settings, nextEta),
        isRunning: settings.autoStart,
        currentTaskId: task?.id ?? null,
      })
    }
  }, [settings, timer, setTimer, recordFocusSession, recordBreak, notifyEnd])

  useEffect(() => {
    if (!timer.isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      const t = useFlocusStore.getState().timer
      const s = useFlocusStore.getState().settings

      if (s.timerMode === 'stopwatch') {
        useFlocusStore.getState().setTimer({
          secondsElapsed: t.secondsElapsed + 1,
        })
        return
      }

      if (t.secondsLeft <= 1) {
        advanceSegment()
      } else {
        useFlocusStore.getState().setTimer({ secondsLeft: t.secondsLeft - 1 })
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timer.isRunning, advanceSegment])

  const start = () => {
    if (settings.showNotification && 'Notification' in window) {
      void Notification.requestPermission()
    }
    const task = useFlocusStore.getState().tasks.find((t) => !t.completed)
    if (settings.useTaskEtaTimer && task?.etaMinutes) {
      setTimer({
        isRunning: true,
        currentTaskId: task.id,
        secondsLeft: task.etaMinutes * 60,
        segment: 'focus',
      })
    } else {
      useFlocusStore.getState().updateStreak()
      setTimer({ isRunning: true })
    }
    useFlocusStore.getState().updateStreak()
  }

  const pause = () => setTimer({ isRunning: false })

  const toggle = () => (timer.isRunning ? pause() : start())

  const reset = () => {
    const eta = activeTaskEtaSeconds()
    const seg: TimerSegment =
      settings.timerMode === 'stopwatch'
        ? 'stopwatch'
        : settings.timerMode === 'countdown'
          ? 'countdown'
          : 'focus'
    const task = useFlocusStore.getState().tasks.find((t) => !t.completed)
    setTimer({
      isRunning: false,
      segment: seg,
      secondsLeft: segmentDuration(seg, settings, eta),
      secondsElapsed: 0,
      pomodoroCount: 0,
      currentTaskId: task?.id ?? null,
    })
  }

  const initFromSettings = useCallback(() => {
    const eta = activeTaskEtaSeconds()
    const seg: TimerSegment =
      settings.timerMode === 'stopwatch'
        ? 'stopwatch'
        : settings.timerMode === 'countdown'
          ? 'countdown'
          : 'focus'
    const task = useFlocusStore.getState().tasks.find((t) => !t.completed)
    setTimer({
      segment: seg,
      secondsLeft: segmentDuration(seg, settings, eta),
      secondsElapsed: 0,
      isRunning: false,
      currentTaskId: task?.id ?? null,
    })
  }, [settings, setTimer])

  const switchSegment = (seg: 'focus' | 'shortBreak' | 'longBreak') => {
    const eta = activeTaskEtaSeconds()
    const task = useFlocusStore.getState().tasks.find((t) => !t.completed)
    setTimer({
      segment: seg,
      secondsLeft: segmentDuration(seg, settings, eta),
      isRunning: false,
      currentTaskId: task?.id ?? null,
    })
  }

  return { start, pause, toggle, reset, initFromSettings, advanceSegment, switchSegment }
}
