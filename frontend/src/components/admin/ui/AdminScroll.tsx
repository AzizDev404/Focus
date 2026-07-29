import * as ScrollArea from '@radix-ui/react-scroll-area'

type Props = {
  children: React.ReactNode
  className?: string
  maxHeight?: string
}

export function AdminScrollArea({ children, className = '', maxHeight }: Props) {
  return (
    <ScrollArea.Root
      className={`adm-radix-scroll ${className}`.trim()}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <ScrollArea.Viewport className="adm-radix-scroll-viewport">{children}</ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="adm-radix-scroll-bar" orientation="vertical">
        <ScrollArea.Thumb className="adm-radix-scroll-thumb" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}
