import { Minus, Plus } from '../../icons'

type Props = {
  value: string | number
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  disabled?: boolean
  id?: string
  showSteppers?: boolean
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'className' | 'min' | 'max' | 'step'>

export function AdminNumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  disabled,
  id,
  showSteppers = true,
  ...rest
}: Props) {
  const parsed = value === '' || value === undefined ? NaN : Number(value)

  const bump = (delta: number) => {
    const base = Number.isFinite(parsed) ? parsed : (min ?? 0)
    let next = base + delta * step
    if (min != null) next = Math.max(min, next)
    if (max != null) next = Math.min(max, next)
    onChange(String(next))
  }

  const canDec = !disabled && (min == null || !Number.isFinite(parsed) || parsed > min)
  const canInc = !disabled && (max == null || !Number.isFinite(parsed) || parsed < max)

  return (
    <div className={`adm-number-field${showSteppers ? '' : ' adm-number-field--plain'}`}>
      {showSteppers ? (
        <button
          type="button"
          className="adm-number-step"
          onClick={() => bump(-1)}
          disabled={!canDec}
          aria-label="Decrease"
          tabIndex={-1}
        >
          <Minus size={14} strokeWidth={2.5} />
        </button>
      ) : null}
      <input
        id={id}
        type="number"
        className="adm-number-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        {...rest}
      />
      {showSteppers ? (
        <button
          type="button"
          className="adm-number-step"
          onClick={() => bump(1)}
          disabled={!canInc}
          aria-label="Increase"
          tabIndex={-1}
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  )
}
