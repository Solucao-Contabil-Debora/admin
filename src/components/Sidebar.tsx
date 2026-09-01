import { useState } from 'react'
import type { ReactNode } from 'react'
import { displayNameFromEmail } from '../lib/displayName'
import logo from '../assets/logo.png'

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

function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3.5c-2.9 0-5 2.3-5 5.2v3.1c0 .6-.2 1.2-.6 1.7l-.9 1.1c-.6.8 0 1.9 1 1.9h11c1 0 1.6-1.1 1-1.9l-.9-1.1c-.4-.5-.6-1.1-.6-1.7V8.7c0-2.9-2.1-5.2-5-5.2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
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

type SidebarProps = {
  activeView: NavKey
  onNavigate: (view: NavKey) => void
  userEmail: string
  onSignOut: () => void
}

export function Sidebar({ activeView, onNavigate, userEmail, onSignOut }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const displayName = displayNameFromEmail(userEmail)

  return (
    <aside
      className={`flex h-svh flex-col justify-between border-r border-sidebar-800 bg-sidebar-900 transition-[width] duration-200 ${
        collapsed ? 'w-[72px]' : 'w-60'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 px-4 py-5">
          <div className="flex items-center gap-2 overflow-hidden">
            {collapsed ? (
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded">
                <img src={logo} alt="Solução Contábil" className="h-8 w-auto max-w-none" />
              </div>
            ) : (
              <img src={logo} alt="Solução Contábil" className="h-9 w-auto max-w-full object-contain" />
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className="shrink-0 rounded-md p-1.5 text-sidebar-500 hover:bg-sidebar-800 hover:text-sidebar-300"
          >
            <PanelIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                title={item.label}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  collapsed ? 'justify-center' : ''
                } ${isActive ? 'bg-primary-950 text-primary-400' : 'text-sidebar-400 hover:bg-sidebar-800'}`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-sidebar-800 p-3">
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <button
            type="button"
            onClick={onSignOut}
            title="Sair"
            className={`flex min-w-0 items-center gap-2 rounded-lg p-1 hover:bg-sidebar-800 ${
              collapsed ? '' : 'flex-1'
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-900 text-sm font-semibold text-primary-300">
              {displayName.charAt(0).toUpperCase()}
            </span>
            {!collapsed && (
              <span className="min-w-0 text-left">
                <p className="truncate text-sm font-medium text-sidebar-100">{displayName}</p>
                <p className="truncate text-xs text-sidebar-400">{userEmail}</p>
              </span>
            )}
          </button>

          {!collapsed && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sidebar-800 text-sidebar-500">
              <BellIcon className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}
