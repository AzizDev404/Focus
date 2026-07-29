import { ArrowLeft } from '../icons'

type Props = {
  backLabel: string
  onBack: () => void
  title?: string
  meta?: string
}

export function AccountSubpageToolbar({ backLabel, onBack, title, meta }: Props) {
  return (
    <div className="account-subpage-toolbar">
      <button type="button" className="account-subpage-back" onClick={onBack}>
        <ArrowLeft size={14} aria-hidden />
        {backLabel}
      </button>
      {title ? (
        <div className="account-subpage-toolbar-text">
          <strong>{title}</strong>
          {meta ? <span>{meta}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
