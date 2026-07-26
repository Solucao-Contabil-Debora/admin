import { useState } from 'react'
import type { ReactNode } from 'react'
import { displayNameFromEmail } from '../lib/displayName'

export type NavKey = 'users' | 'calendar'

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

type NavItem = {
  key: NavKey
  label: string
  icon: (props: IconProps) => ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { key: 'users', label: 'Usuários', icon: UsersIcon },
  { key: 'calendar', label: 'Calendário', icon: CalendarIcon },
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
      className={`flex h-svh flex-col justify-between border-r border-gray-200 bg-white transition-[width] duration-200 ${
        collapsed ? 'w-[72px]' : 'w-60'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 px-4 py-5">
          <div className="flex items-center gap-2 overflow-hidden">
            <img src="/favicon.svg" alt="" className="h-8 w-8 shrink-0" />
            {!collapsed && (
              <div className="leading-none">
                <p className="text-[11px] font-medium uppercase tracking-wide text-blue-500">Evento da</p>
                <p className="text-sm font-extrabold uppercase text-blue-600">Igreja</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
                } ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-gray-200 p-3">
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <button
            type="button"
            onClick={onSignOut}
            title="Sair"
            className={`flex min-w-0 items-center gap-2 rounded-lg p-1 hover:bg-gray-50 ${
              collapsed ? '' : 'flex-1'
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {displayName.charAt(0).toUpperCase()}
            </span>
            {!collapsed && (
              <span className="min-w-0 text-left">
                <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
                <p className="truncate text-xs text-gray-500">{userEmail}</p>
              </span>
            )}
          </button>

          {!collapsed && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400">
              <BellIcon className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}
