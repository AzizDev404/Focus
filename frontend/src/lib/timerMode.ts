import type { TimerMode } from '../types'

/** `pomodoro-timer` data-mode values used by native CSS selectors. */
export function timerDataMode(mode: TimerMode): string {
  switch (mode) {
    case '52/17':
      return 'fiftytwo'
    case 'animedoro':
      return 'animedoro'
    case 'countdown':
      return 'countdown'
    case 'stopwatch':
      return 'stopwatch'
    default:
      return 'pomodoro'
  }
}
