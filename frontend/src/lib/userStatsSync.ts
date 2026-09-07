import { apiPost } from './api'
import { getUserToken } from './authStorage'
import { todayKey } from './focusScore'

const FOCUS_KEY = 'tsukiyomi-stats-clock-focus'
const BREAK_KEY = 'tsukiyomi-stats-clock-break'

function storageKey(kind: 'focus' | 'break') {
  return kind === 'break' ? BREAK_KEY : FOCUS_KEY
}

function readSessionId(kind: 'focus' | 'break') {
  try {
    return sessionStorage.getItem(storageKey(kind))
  } catch {
    return null
  }
}

function writeSessionId(kind: 'focus' | 'break', id: string | null) {
  try {
    if (id) sessionStorage.setItem(storageKey(kind), id)
    else sessionStorage.removeItem(storageKey(kind))
  } catch {
    /* */
  }
}

function postStat(path: string, body: Record<string, unknown>) {
  if (!getUserToken()) return
  void apiPost(path, { date: todayKey(), ...body }).catch(() => {
    /* offline or server down — local stats still work */
  })
}

export async function startStatsClock(kind: 'focus' | 'break') {
  if (!getUserToken()) return
  try {
    const data = await apiPost<{ sessionId?: string }>('/api/user/stats/start', { kind })
    if (data.sessionId) writeSessionId(kind, data.sessionId)
  } catch {
    /* */
  }
}

export function pauseStatsClock(kind: 'focus' | 'break') {
  if (!getUserToken()) return
  void apiPost('/api/user/stats/pause', { kind }).catch(() => {})
}

export function syncFocusSession(seconds: number) {
  if (seconds <= 0) return
  const sessionId = readSessionId('focus')
  postStat('/api/user/stats/focus', { seconds, sessionId })
  writeSessionId('focus', null)
}

export function syncBreakSession(seconds: number) {
  if (seconds <= 0) return
  const sessionId = readSessionId('break')
  postStat('/api/user/stats/break', { seconds, sessionId })
  writeSessionId('break', null)
}

export function syncTaskComplete() {
  postStat('/api/user/stats/task-complete', {})
}

export function statsKindFromSegment(segment: string): 'focus' | 'break' {
  return segment === 'shortBreak' || segment === 'longBreak' ? 'break' : 'focus'
}
