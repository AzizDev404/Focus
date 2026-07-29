export type AccountFilterOption = {
  id: string
  label: string
}

export type AccountFilterGroup = {
  id: string
  label?: string
  options: AccountFilterOption[]
}

type SingleProps = {
  groups: AccountFilterGroup[]
  value: string
  onChange: (id: string) => void
  className?: string
  'aria-label'?: string
}

type MultiProps = {
  groups: AccountFilterGroup[]
  values: Record<string, string>
  onChange: (groupId: string, optionId: string) => void
  className?: string
  'aria-label'?: string
}

function FilterButtons({
  group,
  activeId,
  onSelect,
}: {
  group: AccountFilterGroup
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="account-filter-group" role="group" aria-label={group.label ?? group.id}>
      {group.label ? <span className="account-filter-group-label">{group.label}</span> : null}
      {group.options.map((opt) => {
        const active = activeId === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            className={`account-filter-btn${active ? ' is-active' : ''}`}
            aria-pressed={active}
            onClick={() => onSelect(opt.id)}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function AccountFilterBar({
  groups,
  value,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Filter',
}: SingleProps) {
  return (
    <div className={`account-filter-bar ${className}`.trim()} role="group" aria-label={ariaLabel}>
      <div className="account-filter-scroll">
        {groups.map((group, gi) => (
          <div key={group.id} className="account-filter-row">
            {gi > 0 ? <span className="account-filter-divider" aria-hidden /> : null}
            <FilterButtons group={group} activeId={value} onSelect={onChange} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Several independent filter groups in one compact bar. */
export function AccountMultiFilterBar({
  groups,
  values,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Filters',
}: MultiProps) {
  return (
    <div className={`account-filter-bar account-filter-bar--multi ${className}`.trim()} role="group" aria-label={ariaLabel}>
      <div className="account-filter-scroll">
        {groups.map((group, gi) => (
          <div key={group.id} className="account-filter-row">
            {gi > 0 ? <span className="account-filter-divider" aria-hidden /> : null}
            <FilterButtons
              group={group}
              activeId={values[group.id] ?? group.options[0]?.id ?? ''}
              onSelect={(id) => onChange(group.id, id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
