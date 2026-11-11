import { useState } from 'react'
import { Building2, CalendarDays, Folder, Inbox, LogOut, Megaphone, Users } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { LoginForm } from './components/LoginForm'
import loginImage from './assets/imagem-login.png'
import logo from './assets/logo-black.png'
import { AppHeader } from './components/layout/AppHeader'
import { AppLayout } from './components/layout/AppLayout'
import { HeaderUserMenu } from './components/layout/HeaderUserMenu'
import type { SidebarConfig } from './components/types/sidebar'
import { displayNameFromEmail } from './lib/displayName'
import { UsersPage } from './pages/UsersPage'
import { CalendarPage } from './pages/CalendarPage'
import { AnnouncementsPage } from './pages/AnnouncementsPage'
import { RequestsPage } from './pages/RequestsPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { ClientsPage } from './pages/ClientsPage'

type NavKey = 'users' | 'clients' | 'calendar' | 'announcements' | 'requests' | 'documents'

const SIDEBAR_CONFIG: SidebarConfig = {
  navigation: [
    { label: 'Usuários', path: 'users', icon: Users },
    { label: 'Clientes', path: 'clients', icon: Building2 },
    { label: 'Calendário', path: 'calendar', icon: CalendarDays },
    { label: 'Comunicados', path: 'announcements', icon: Megaphone },
    { label: 'Solicitações', path: 'requests', icon: Inbox },
    { label: 'Documentos', path: 'documents', icon: Folder },
  ],
}

const PAGES: Record<NavKey, { Page: () => React.JSX.Element; padded: boolean }> = {
  users: { Page: UsersPage, padded: false },
  clients: { Page: ClientsPage, padded: false },
  calendar: { Page: CalendarPage, padded: false },
  announcements: { Page: AnnouncementsPage, padded: false },
  requests: { Page: RequestsPage, padded: false },
  documents: { Page: DocumentsPage, padded: false },
}

function App() {
  const { session, isAdmin, loading, signIn, signOut } = useAuth()
  const [activeView, setActiveView] = useState<NavKey>('users')

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-svh bg-background">
        <div className="relative hidden flex-1 overflow-hidden lg:block">
          <img src={loginImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-xs">
            <img src={logo} alt="Solução Contábil" className="mx-auto mb-4 h-24 w-auto object-contain" />
            <LoginForm onSubmit={signIn} />
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-lg border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">Acesso negado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta conta não tem permissão de admin.
          </p>
          <button
            onClick={signOut}
            className="mt-4 text-sm font-medium text-foreground underline"
          >
            Sair
          </button>
        </div>
      </div>
    )
  }

  const userEmail = session.user.email ?? ''
  const { Page, padded } = PAGES[activeView]

  return (
    <AppLayout
      showHeader={false}
      sidebarConfig={SIDEBAR_CONFIG}
      activePath={activeView}
      onNavigate={(path) => setActiveView(path as NavKey)}
    >
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader
          actions={
            <HeaderUserMenu
              name={displayNameFromEmail(userEmail)}
              subtitle={userEmail}
              actions={[{ id: 'sign-out', label: 'Sair', icon: LogOut, onSelect: signOut, tone: 'destructive' }]}
            />
          }
        />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-hidden">
          {padded ? (
            <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
              <Page />
            </div>
          ) : (
            <Page />
          )}
        </main>
      </div>
    </AppLayout>
  )
}

export default App
