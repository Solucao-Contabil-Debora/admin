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
  description?: string
  maxWidth?: MaxWidth
  stacked?: boolean
  children: ReactNode
}

export function Dialog({ open, onClose, title, description, maxWidth = 'sm', stacked = false, children }: DialogProps) {
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
      className={`fixed inset-0 flex items-center justify-center bg-gray-900/50 px-4 py-8 backdrop-blur-[2px] [animation:dialog-overlay_0.15s_ease-out] ${
        stacked ? 'z-40' : 'z-30'
      }`}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`flex max-h-full w-full ${MAX_WIDTH_CLASSES[maxWidth]} flex-col overflow-hidden rounded-2xl bg-gray-900 shadow-2xl ring-1 ring-white/10 [animation:dialog-panel_0.18s_ease-out]`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-800 px-6 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-gray-400">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
