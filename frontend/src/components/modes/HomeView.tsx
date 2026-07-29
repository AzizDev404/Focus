import { getGreeting } from '../../lib/greetings'
import { useFlocusStore } from '../../store/useFlocusStore'
import { ClockDisplay } from '../ClockDisplay'

export function HomeView() {
  const settings = useFlocusStore((s) => s.settings)
  const hour = new Date().getHours()

  return (
    <>
      {settings.showGreetings && (
        <p className="greeting">{getGreeting(settings.displayName, settings.dynamicGreetings, hour)}</p>
      )}
      <ClockDisplay settings={settings} variant="clock" />
    </>
  )
}
