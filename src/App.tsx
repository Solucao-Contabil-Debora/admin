import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginForm } from './components/LoginForm'
import { Sidebar } from './components/Sidebar'
import type { NavKey } from './components/Sidebar'
import { UsersPage } from './pages/UsersPage'
import { CalendarPage } from './pages/CalendarPage'

function App() {
  const { session, isAdmin, loading, signIn, signOut } = useAuth()
  const [activeView, setActiveView] = useState<NavKey>('users')

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Carregando...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gray-50">
        <LoginForm onSubmit={signIn} />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gray-50">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Acesso negado</h1>
          <p className="mt-2 text-sm text-gray-500">
            Esta conta não tem permissão de admin.
          </p>
          <button
            onClick={signOut}
            className="mt-4 text-sm font-medium text-gray-700 underline"
          >
            Sair
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh bg-gray-50">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        userEmail={session.user.email ?? ''}
        onSignOut={signOut}
      />
      <main className="flex-1 p-8">
        {activeView === 'users' && <UsersPage />}
        {activeView === 'calendar' && <CalendarPage />}
      </main>
    </div>
  )
}

export default App
