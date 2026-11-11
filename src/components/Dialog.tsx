import type { ReactNode } from 'react'
import {
  Dialog as DialogRoot,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl'

const MAX_WIDTHS: Record<MaxWidth, string> = {
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
}

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  maxWidth?: MaxWidth
  children: ReactNode
}

export function Dialog({ open, onClose, title, description, maxWidth = 'sm', children }: DialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus()
        }}
        customWidth="calc(100vw - 2rem)" customMaxWidth={MAX_WIDTHS[maxWidth]} customMaxHeight="90vh">
        <DialogHeader showSeparator>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}
