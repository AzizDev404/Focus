const CHANGELOG = [
  {
    version: 'v1.9.2',
    date: '2025',
    items: [
      'Improved animated themes performance',
      'New soundscape: Light Rain on Tent',
      'Bug fixes for timer auto-start',
    ],
  },
  {
    version: 'v1.9.0',
    date: '2025',
    items: [
      'Document Picture-in-Picture for focus timer',
      'Task ETA timer mode',
      'Dynamic session tallies',
    ],
  },
  {
    version: 'v1.8.0',
    date: '2024',
    items: [
      '73 themes with filters',
      '43 ambient soundscapes',
      'Spotify curated playlists',
    ],
  },
  {
    version: 'v1.7.0',
    date: '2024',
    items: [
      'Focus Score and stats charts',
      'Onboarding flow',
      'All features unlocked',
      'Custom upload backgrounds',
    ],
  },
]

export function WhatsNewPanel() {
  return (
    <div className="whats-new-panel">
      {CHANGELOG.map((entry) => (
        <section key={entry.version} className="whats-new-entry glass-surface">
          <header className="whats-new-entry-head">
            <h4>{entry.version}</h4>
            <span>{entry.date}</span>
          </header>
          <ul className="whats-new-list">
            {entry.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
