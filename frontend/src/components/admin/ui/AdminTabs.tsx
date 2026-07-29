import * as Tabs from '@radix-ui/react-tabs'

type Tab = { id: string; label: string }

type Props = {
  tabs: Tab[]
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

export function AdminTabs({ tabs, value, onValueChange, children }: Props) {
  return (
    <Tabs.Root value={value} onValueChange={onValueChange} className="adm-radix-tabs">
      <Tabs.List className="adm-radix-tabs-list" aria-label="Sections">
        {tabs.map((t) => (
          <Tabs.Trigger key={t.id} value={t.id} className="adm-radix-tabs-trigger">
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {children}
    </Tabs.Root>
  )
}

export function AdminTabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <Tabs.Content value={value} className="adm-radix-tabs-content">
      {children}
    </Tabs.Content>
  )
}
