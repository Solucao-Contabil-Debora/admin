import { useEffect, useRef, useState } from 'react'
import { Building2, CalendarDays, ChevronUp, Folder, Inbox, LogOut, Megaphone, PanelLeft, Users, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { displayNameFromEmail } from '../lib/displayName'
import logo from '../assets/logo-black.png'

export type NavKey = 'users' | 'clients' | 'calendar' | 'announcements' | 'requests' | 'documents'

type NavItem = {
  key: NavKey
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { key: 'users', label: 'Usuários', icon: Users },
  { key: 'clients', label: 'Clientes', icon: Building2 },
  { key: 'calendar', label: 'Calendário', icon: CalendarDays },
  { key: 'announcements', label: 'Comunicados', icon: Megaphone },
  { key: 'requests', label: 'Solicitações', icon: Inbox },
  { key: 'documents', label: 'Documentos', icon: Folder },
]

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
        className={`fixed inset-y-0 left-0 z-50 flex h-svh w-64 flex-col justify-between border-r border-sidebar-border bg-sidebar transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:transition-[width] ${
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
              className="hidden shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:block"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onCloseMobile}
              title="Fechar menu"
              className="shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
            >
              <X className="h-5 w-5" />
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
                  } ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div ref={menuRef} className="relative border-t border-sidebar-border p-3">
          {menuOpen && (
            <div
              role="menu"
              className={`absolute inset-x-3 bottom-full mb-2 overflow-hidden rounded-lg border border-sidebar-border bg-popover shadow-lg [animation:dialog-panel_0.15s_ease-out] ${
                collapsed ? 'md:inset-x-auto md:bottom-0 md:left-full md:mb-0 md:ml-2 md:w-48' : ''
              }`}
            >
              <div className="border-b border-sidebar-border px-3 py-2.5">
                <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={onSignOut}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-sidebar-accent"
              >
                <LogOut className="h-4 w-4 shrink-0" />
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
            className={`flex w-full cursor-pointer items-center gap-2 rounded-lg p-1 hover:bg-sidebar-accent ${
              collapsed ? 'md:justify-center' : ''
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className={`min-w-0 text-left ${collapsed ? 'md:hidden' : ''}`}>
              <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
            </span>
            <ChevronUp
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${collapsed ? 'md:hidden' : ''} ${
                menuOpen ? '' : 'rotate-180'
              }`}
            />
          </button>
        </div>
      </aside>
    </>
  )
}
