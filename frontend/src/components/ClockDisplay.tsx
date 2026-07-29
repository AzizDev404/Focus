import { useEffect, useState } from 'react'
import { formatClock } from '../lib/greetings'
import type { FlocusSettings } from '../types'

interface Props {
  settings: FlocusSettings
  variant?: 'clock' | 'timer'
  time?: number
}

export function ClockDisplay({ settings, variant = 'clock', time }: Props) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    if (time != null) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [time])

  const display =
    time != null
      ? formatTimeFromSeconds(time)
      : formatClock(now, settings.clockFormat, settings.showClockSeconds)

  const clockAttr = settings.clockFormat === '12' ? '12h' : '24h'
  const className = variant === 'timer' ? 'pomodoro-timer' : 'clock'

  if (settings.flipClock) {
    return (
      <div className={`${className} flip-clock-display`} data-clock={clockAttr}>
        {display.split('').map((ch, i) =>
          ch === ':' ? (
            <span key={i}>:</span>
          ) : (
            <span key={i} className="flip-card">
              {ch}
            </span>
          ),
        )}
      </div>
    )
  }

  return (
    <time className={className} data-clock={clockAttr}>
      {display}
    </time>
  )
}

function formatTimeFromSeconds(total: number): string {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${m}:${pad(s)}`
}
