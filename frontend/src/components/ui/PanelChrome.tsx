import type { ReactNode } from 'react'
import { IconClose } from '../icons/FlocusIcons'

export function FlocusCloseButton({ onClick, label = 'Close' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="flocus-icon-close" onClick={onClick} aria-label={label}>
      <IconClose size={10} />
    </button>
  )
}

export function SoundsHeaderTabs({
  active,
  onSounds,
  onMusic,
  trailing,
}: {
  active: 'sounds' | 'music'
  onSounds: () => void
  onMusic: () => void
  trailing?: ReactNode
}) {
  return (
    <header className="sounds-header">
      <nav>
        <button type="button" className={active === 'sounds' ? 'active' : ''} onClick={onSounds}>
          Sounds
        </button>
        <button type="button" className={active === 'music' ? 'active' : ''} onClick={onMusic}>
          Music
        </button>
      </nav>
      {trailing ? <div className="sounds-header-actions">{trailing}</div> : null}
    </header>
  )
}
