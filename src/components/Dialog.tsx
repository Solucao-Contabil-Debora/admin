import { useEffect } from 'react'
import type { ReactNode } from 'react'

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl'

const MAX_WIDTH_CLASSES: Record<MaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  maxWidth?: MaxWidth
  stacked?: boolean
  children: ReactNode
}

export function Dialog({ open, onClose, title, maxWidth = 'sm', stacked = false, children }: DialogProps) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 flex items-center justify-center bg-black/30 px-4 ${stacked ? 'z-40' : 'z-30'}`}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`w-full ${MAX_WIDTH_CLASSES[maxWidth]} rounded-lg bg-white p-6 shadow-xl`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
