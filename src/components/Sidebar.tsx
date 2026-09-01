import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { displayNameFromEmail } from '../lib/displayName'
import logo from '../assets/logo-black.png'

export type NavKey = 'users' | 'calendar' | 'announcements' | 'requests' | 'documents'

type IconProps = {
  className?: string
}

function PanelIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 4v16" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M3.5 19c.7-2.9 3-4.5 5.5-4.5s4.8 1.6 5.5 4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M15.5 5.5c1.4.3 2.5 1.5 2.5 3s-1.1 2.7-2.5 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M17 14.6c1.9.5 3.3 1.9 3.8 4.4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function LogOutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 16l4-4-4-4M19 12H9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function MegaphoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3.5 11v2a1.5 1.5 0 0 0 1.5 1.5h1l.7 4.2a1 1 0 0 0 1 .8h1a1 1 0 0 0 1-1.2L9 14.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M6 8.5 15.5 4c1-.5 2 .3 2 1.4v11.2c0 1.1-1 1.9-2 1.4L6 13.5v-5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M19.5 9.5c.8.6 1.3 1.5 1.3 2.5s-.5 1.9-1.3 2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function InboxIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3.5 13.5 6 5.7A1.5 1.5 0 0 1 7.4 4.5h9.2a1.5 1.5 0 0 1 1.4 1.2l2.5 7.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 13.5h5.2l1 2h4.6l1-2h5.2v4a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FolderIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3.5 7.2A1.7 1.7 0 0 1 5.2 5.5h4.1c.4 0 .8.16 1.1.45l1.2 1.2c.3.3.7.45 1.1.45h6.1a1.7 1.7 0 0 1 1.7 1.7v8a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7V7.2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type NavItem = {
  key: NavKey
  label: string
  icon: (props: IconProps) => ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { key: 'users', label: 'Usuários', icon: UsersIcon },
  { key: 'calendar', label: 'Calendário', icon: CalendarIcon },
  { key: 'announcements', label: 'Comunicados', icon: MegaphoneIcon },
  { key: 'requests', label: 'Solicitações', icon: InboxIcon },
  { key: 'documents', label: 'Documentos', icon: FolderIcon },
]

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function ChevronUpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="m6 15 6-6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type SidebarProps = {
  activeView: NavKey
  onNavigate: (view: NavKey) => void
  userEmail: string
  onSignOut: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ activeView, onNavigate, userEmail, onSignOut, mobileOpen, onCloseMobile }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const displayName = displayNameFromEmail(userEmail)

  function handleNavigate(view: NavKey) {
    onNavigate(view)
    onCloseMobile()
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!menuOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onCloseMobile} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-svh w-64 flex-col justify-between border-r border-gray-800 bg-gray-900 transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:transition-[width] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-[72px]' : 'md:w-60'}`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 px-4 py-5">
            <div className="flex items-center gap-2 overflow-hidden">
              {collapsed ? (
                <div className="hidden h-10 w-10 shrink-0 overflow-hidden rounded md:block">
                  <img src={logo} alt="Solução Contábil" className="h-10 w-auto max-w-none" />
                </div>
              ) : (
                <img src={logo} alt="Solução Contábil" className="h-24 w-auto max-w-full object-contain" />
              )}
            </div>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              title={collapsed ? 'Expandir menu' : 'Recolher menu'}
              className="hidden shrink-0 cursor-pointer rounded-md p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 md:block"
            >
              <PanelIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onCloseMobile}
              title="Fechar menu"
              className="shrink-0 cursor-pointer rounded-md p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 md:hidden"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavigate(item.key)}
                  title={item.label}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                    collapsed ? 'md:justify-center' : ''
                  } ${isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div ref={menuRef} className="relative border-t border-gray-800 p-3">
          {menuOpen && (
            <div
              role="menu"
              className={`absolute inset-x-3 bottom-full mb-2 overflow-hidden rounded-lg border border-gray-800 bg-gray-900 shadow-lg [animation:dialog-panel_0.15s_ease-out] ${
                collapsed ? 'md:inset-x-auto md:bottom-0 md:left-full md:mb-0 md:ml-2 md:w-48' : ''
              }`}
            >
              <div className="border-b border-gray-800 px-3 py-2.5">
                <p className="truncate text-sm font-medium text-gray-100">{displayName}</p>
                <p className="truncate text-xs text-gray-400">{userEmail}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={onSignOut}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-gray-800"
              >
                <LogOutIcon className="h-4 w-4 shrink-0" />
                Sair
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            title={displayName}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={`flex w-full cursor-pointer items-center gap-2 rounded-lg p-1 hover:bg-gray-800 ${
              collapsed ? 'md:justify-center' : ''
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-900 text-sm font-semibold text-primary-300">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className={`min-w-0 text-left ${collapsed ? 'md:hidden' : ''}`}>
              <p className="truncate text-sm font-medium text-gray-100">{displayName}</p>
              <p className="truncate text-xs text-gray-400">{userEmail}</p>
            </span>
            <ChevronUpIcon
              className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${collapsed ? 'md:hidden' : ''} ${
                menuOpen ? '' : 'rotate-180'
              }`}
            />
          </button>
        </div>
      </aside>
    </>
  )
}
