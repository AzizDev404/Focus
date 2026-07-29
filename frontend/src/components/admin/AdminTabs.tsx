import * as Tabs from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'

export type AdminTabItem = {
  value: string
  label: string
  content: ReactNode
}

type Props = {
  items: AdminTabItem[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function AdminTabs({ items, value, onValueChange, className = '' }: Props) {
  return (
    <Tabs.Root className={`adm-tabs-root ${className}`.trim()} value={value} onValueChange={onValueChange}>
      <Tabs.List className="adm-tabs-list" aria-label="Sections">
        {items.map((item) => (
          <Tabs.Trigger key={item.value} className="adm-tabs-trigger" value={item.value}>
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {items.map((item) => (
        <Tabs.Content key={item.value} className="adm-tabs-content" value={item.value}>
          {item.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}
