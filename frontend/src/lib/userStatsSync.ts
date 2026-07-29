import { apiPost } from './api'
import { getUserToken } from './authStorage'
import { todayKey } from './focusScore'

function postStat(path: string, body: Record<string, unknown>) {
  const token = getUserToken()
  if (!token) return
  void apiPost(path, { date: todayKey(), ...body }, token).catch(() => {
    /* offline or server down — local stats still work */
  })
}

export function syncFocusSession(seconds: number) {
  if (seconds <= 0) return
  postStat('/api/user/stats/focus', { seconds })
}

export function syncBreakSession(seconds: number) {
  if (seconds <= 0) return
  postStat('/api/user/stats/break', { seconds })
}

export function syncTaskComplete() {
  postStat('/api/user/stats/task-complete', {})
}
