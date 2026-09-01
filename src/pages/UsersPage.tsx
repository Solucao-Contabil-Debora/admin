import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { displayNameFromEmail } from '../lib/displayName'
import { extractErrorMessage } from '../lib/functionErrors'
import { Dialog } from '../components/Dialog'
import { ActionMenu } from '../components/ActionMenu'

type IconProps = {
  className?: string
}

function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function UsersStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3.5 19c.7-2.9 3-4.5 5.5-4.5s4.8 1.6 5.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M15.5 5.5c1.4.3 2.5 1.5 2.5 3s-1.1 2.7-2.5 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M17 14.6c1.9.5 3.3 1.9 3.8 4.4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3.5 5 6v5.2c0 4.3 2.9 7.4 7 8.3 4.1-.9 7-4 7-8.3V6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronsLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="m15 17-5-5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="m9 17 5-5-5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronsRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="m6 17 5-5-5-5M13 17l5-5-5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type UserRow = {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [tab, setTab] = useState<'all' | 'admins'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])


  const [modalOpen, setModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadUsers() {
    setLoadError(null)
    const { data, error } = await supabase.functions.invoke('admin-list-users')
    if (error) {
      setLoadError(await extractErrorMessage(error, 'Erro ao carregar usuários'))
      return
    }
    setUsers(data.users)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const totalUsers = users?.length ?? 0
  const totalAdmins = users?.filter((user) => user.isAdmin).length ?? 0

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (users ?? [])
      .filter((user) => (tab === 'admins' ? user.isAdmin : true))
      .filter((user) => {
        if (!query) return true
        const name = (user.name ?? displayNameFromEmail(user.email)).toLowerCase()
        return name.includes(query) || user.email.toLowerCase().includes(query)
      })
  }, [users, tab, search])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, filteredUsers.length)
  const pageUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function handleTabChange(nextTab: 'all' | 'admins') {
    setTab(nextTab)
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handlePageSizeChange(value: number) {
    setPageSize(value)
    setPage(1)
  }

  async function handleCopyEmail(user: UserRow) {
    await navigator.clipboard.writeText(user.email)
  }

  function openModal() {
    setEmail('')
    setPassword('')
    setFormError(null)
    setModalOpen(true)
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)

    const { error } = await supabase.functions.invoke('admin-create-user', {
      body: { email, password },
    })

    if (error) {
      setFormError(await extractErrorMessage(error, 'Erro ao criar usuário'))
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    setModalOpen(false)
    await loadUsers()
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Usuários</h2>
          <p className="mt-1 text-sm text-gray-400">{totalUsers} no total</p>
          <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <UsersStatIcon className="h-4 w-4 text-gray-500" />
              {totalUsers} usuários
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldIcon className="h-4 w-4 text-gray-500" />
              {totalAdmins} admins
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg bg-gray-800 p-1">
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === 'all' ? 'bg-gray-900 text-primary-400 shadow-sm' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Todos {totalUsers}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('admins')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === 'admins' ? 'bg-gray-900 text-primary-400 shadow-sm' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Admins {totalAdmins}
          </button>
        </div>

        <div className="relative w-full sm:w-auto">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Buscar usuário..."
            className="w-full rounded-lg border border-gray-800 bg-gray-800 py-2 pl-9 pr-3 text-sm focus:border-gray-600 focus:outline-none sm:w-64"
          />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-gray-800 bg-gray-900">
        {loadError && (
          <div className="flex items-center justify-between p-4 text-sm text-red-400">
            {loadError}
            <button type="button" onClick={loadUsers} className="font-medium underline">
              Tentar novamente
            </button>
          </div>
        )}

        {!loadError && users === null && <p className="p-6 text-sm text-gray-500">Carregando...</p>}

        {!loadError && users !== null && (
          <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageUsers.map((user) => {
                const name = user.name ?? displayNameFromEmail(user.email)
                return (
                  <tr key={user.id} className="border-b border-gray-800 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-100">{name}</p>
                          <p className="truncate text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-sm">
                        <span className={`h-1.5 w-1.5 rounded-full ${user.isAdmin ? 'bg-purple-500' : 'bg-gray-600'}`} />
                        <span className={user.isAdmin ? 'text-purple-400' : 'text-gray-400'}>
                          {user.isAdmin ? 'Administrador' : 'Membro'}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ActionMenu width="w-40" items={[{ label: 'Copiar e-mail', onClick: () => handleCopyEmail(user) }]} />
                    </td>
                  </tr>
                )
              })}
              {pageUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}

        {!loadError && users !== null && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 px-4 py-3 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span>Registros por página</span>
              <select
                value={pageSize}
                onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                className="rounded-md border border-gray-800 bg-gray-900 px-2 py-1 text-sm focus:outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <span>
              {pageStart}-{pageEnd} de {filteredUsers.length} itens
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                className="rounded-md p-1.5 hover:bg-gray-800 disabled:opacity-30"
              >
                <ChevronsLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage === 1}
                className="rounded-md p-1.5 hover:bg-gray-800 disabled:opacity-30"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="px-2">
                {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md p-1.5 hover:bg-gray-800 disabled:opacity-30"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                className="rounded-md p-1.5 hover:bg-gray-800 disabled:opacity-30"
              >
                <ChevronsRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Adicionar usuário"
        description="Cria uma conta de acesso ao aplicativo."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="new-user-email" className="text-sm font-medium text-gray-300">
              E-mail
            </label>
            <input
              id="new-user-email"
              type="email"
              autoComplete="off"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="new-user-password" className="text-sm font-medium text-gray-300">
              Senha
            </label>
            <input
              id="new-user-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {formError && <p className="text-sm text-red-400">{formError}</p>}

          <div className="flex items-center justify-end gap-2 border-t border-gray-800 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
