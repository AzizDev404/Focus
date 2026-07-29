import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from '../../icons'

export type AdminSelectOption = { value: string; label: string }

type Props = {
  value: string
  onValueChange: (value: string) => void
  options: AdminSelectOption[]
  placeholder?: string
  disabled?: boolean
  id?: string
}

export function AdminSelect({ value, onValueChange, options, placeholder = 'Choose…', disabled, id }: Props) {
  return (
    <Select.Root value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger id={id} className="adm-select-trigger" aria-label={placeholder}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="adm-select-icon" aria-hidden>
          <ChevronDown size={16} strokeWidth={2} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="adm-select-content" position="popper" sideOffset={6}>
          <Select.Viewport className="adm-select-viewport">
            {options.map((opt) => (
              <Select.Item key={opt.value} value={opt.value} className="adm-select-item">
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator className="adm-select-indicator">
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
