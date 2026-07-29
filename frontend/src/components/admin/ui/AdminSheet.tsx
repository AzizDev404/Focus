import * as Dialog from '@radix-ui/react-dialog'
import { X } from '../../icons'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  children: React.ReactNode
  width?: 'md' | 'lg' | 'xl'
}

export function AdminSheet({ open, onOpenChange, title, subtitle, children, width = 'xl' }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="adm-radix-overlay" />
        <Dialog.Content className={`adm-radix-sheet adm-radix-sheet--${width}`} aria-describedby={undefined}>
          <header className="adm-radix-sheet-head">
            <div>
              {subtitle ? <Dialog.Description className="adm-eyebrow">{subtitle}</Dialog.Description> : null}
              <Dialog.Title className="adm-radix-sheet-title">{title}</Dialog.Title>
            </div>
            <Dialog.Close className="adm-icon-btn" aria-label="Close">
              <X size={18} />
            </Dialog.Close>
          </header>
          <div className="adm-radix-sheet-body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AdminModal({ open, onOpenChange, title, children, footer }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="adm-radix-overlay adm-radix-overlay--center" />
        <Dialog.Content className="adm-radix-modal" aria-describedby={undefined}>
          <header className="adm-radix-modal-head">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="adm-icon-btn" aria-label="Close">
              <X size={18} />
            </Dialog.Close>
          </header>
          <div className="adm-radix-modal-body">{children}</div>
          {footer ? <footer className="adm-radix-modal-foot">{footer}</footer> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
