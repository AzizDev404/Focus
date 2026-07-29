export function getGreeting(
  name: string,
  dynamic: boolean,
  hour: number,
): string {
  if (!dynamic) {
    if (hour < 12) return `Good morning, ${name}.`
    if (hour < 17) return `Good afternoon, ${name}.`
    return `Good night, ${name}.`
  }

  const day = new Date().getDay()
  const isWeekend = day === 0 || day === 6

  if (isWeekend && hour >= 10 && hour < 18) {
    return `Weekend's shining bright, ${name}. Soak it in!`
  }
  if (hour < 6) return `Still up, ${name}? Rest when you can.`
  if (hour < 12) return `Good morning, ${name}. Let's make today count.`
  if (hour < 14) return `Afternoon focus time, ${name}.`
  if (hour < 17) return `Keep the momentum going, ${name}.`
  if (hour < 21) return `Evening session, ${name}. You've got this.`
  return `Wind down gently, ${name}.`
}

export function formatClock(date: Date, format: '12' | '24', showSeconds: boolean): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: format === '12',
  }
  if (showSeconds) opts.second = '2-digit'
  return date.toLocaleTimeString(undefined, opts)
}
