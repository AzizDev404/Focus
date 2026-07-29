import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from '../icons'
import '../../styles/settings-controls.css'

export type SettingsSelectOption = { value: string; label: string }

type Props = {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: SettingsSelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function SettingsSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Choose…',
  disabled,
  className = '',
  'aria-label': ariaLabel,
}: Props) {
  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger
        id={id}
        className={`sett-select-trigger${className ? ` ${className}` : ''}`}
        aria-label={ariaLabel ?? placeholder}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="sett-select-icon" aria-hidden>
          <ChevronDown size={16} strokeWidth={2} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="sett-select-content" position="popper" sideOffset={6}>
          <Select.Viewport className="sett-select-viewport">
            {options.map((opt) => (
              <Select.Item key={opt.value} value={opt.value} className="sett-select-item">
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator className="sett-select-indicator">
                  <Check size={14} strokeWidth={2.5} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
