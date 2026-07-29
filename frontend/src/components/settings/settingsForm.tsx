import type { ReactNode } from 'react'

export function SettingsHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="settings-header">
      <h3>{title}</h3>
      {subtitle ? <span className="subtitle">{subtitle}</span> : null}
    </div>
  )
}

export function SettingsGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`settings-group ${className}`.trim()}>{children}</div>
}

/**
 * Card-style section block used inside a tab pane. Mirrors the Flocus
 * reference layout: title at top, optional description below, then the
 * controls. Stack multiple sections inside a SettingsGroup to compose a tab.
 */
export function SettingsSection({
  title,
  description,
  children,
  className = '',
}: {
  title?: string
  description?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`settings-section ${className}`.trim()}>
      {title ? <h4 className="settings-section-title">{title}</h4> : null}
      {description ? <p className="settings-section-desc">{description}</p> : null}
      <div className="settings-section-body">{children}</div>
    </section>
  )
}

export function SettingsInputGroup({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="settings-input-group">
      <label className="form-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function FormSwitch({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="settings-input-group">
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <label className="form-check-label" htmlFor={id}>
          {label}
          {description ? <div className="description">{description}</div> : null}
        </label>
      </div>
    </div>
  )
}
