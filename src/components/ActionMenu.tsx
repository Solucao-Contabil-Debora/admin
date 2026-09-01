import { useEffect, useRef, useState } from 'react'

type ActionMenuItem = {
  label: string
  onClick: () => void
  danger?: boolean
}

type ActionMenuProps = {
  items: ActionMenuItem[]
  width?: string
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  )
}

export function ActionMenu({ items, width = 'w-32' }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="cursor-pointer rounded-md p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-400"
      >
        <MoreIcon className="h-4 w-4" />
      </button>
      {open && position && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`fixed z-50 ${width} rounded-md border border-gray-800 bg-gray-900 py-1 shadow-lg`}
            style={{ top: position.top, right: position.right }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
                className={`w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-gray-800 ${
                  item.danger ? 'text-red-400' : 'text-gray-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
