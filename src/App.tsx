import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginForm } from './components/LoginForm'
import loginImage from './assets/imagem-login.png'
import logo from './assets/logo.png'
import { Sidebar } from './components/Sidebar'
import type { NavKey } from './components/Sidebar'
import { UsersPage } from './pages/UsersPage'
import { CalendarPage } from './pages/CalendarPage'
import { AnnouncementsPage } from './pages/AnnouncementsPage'
import { RequestsPage } from './pages/RequestsPage'
import { DocumentsPage } from './pages/DocumentsPage'

function App() {
  const { session, isAdmin, loading, signIn, signOut } = useAuth()
  const [activeView, setActiveView] = useState<NavKey>('users')

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gray-950">
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-svh bg-zinc-950">
        <div className="relative hidden flex-1 overflow-hidden lg:block">
          <img src={loginImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-xs">
            <img src={logo} alt="Solução Contábil" className="mx-auto mb-8 h-9 w-auto object-contain" />
            <LoginForm onSubmit={signIn} />
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gray-950">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-100">Acesso negado</h1>
          <p className="mt-2 text-sm text-gray-400">
            Esta conta não tem permissão de admin.
          </p>
          <button
            onClick={signOut}
            className="mt-4 text-sm font-medium text-gray-300 underline"
          >
            Sair
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh bg-gray-950">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        userEmail={session.user.email ?? ''}
        onSignOut={signOut}
      />
      <main className="flex-1 p-8">
        {activeView === 'users' && <UsersPage />}
        {activeView === 'calendar' && <CalendarPage />}
        {activeView === 'announcements' && <AnnouncementsPage />}
        {activeView === 'requests' && <RequestsPage />}
        {activeView === 'documents' && <DocumentsPage />}
      </main>
    </div>
  )
}

export default App
