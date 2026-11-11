import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { extractErrorMessage } from '../lib/functionErrors'
import { Dialog } from '../components/Dialog'
import { ActionMenu } from '../components/ActionMenu'

type IconProps = {
  className?: string
}

function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function DownloadIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type ClientRow = {
  id: string
  cnpj: string
  razao_social: string
  client_users: { user_id: string }[]
  jettax_sync_state: { last_success_at: string | null; last_error: string | null }[]
  fiscal_documents: { count: number }[]
}

type SyncStatus = { label: string; className: string; detail?: string }

function syncStatusOf(client: ClientRow): SyncStatus {
  const units = client.jettax_sync_state
  const errors = units.map((unit) => unit.last_error).filter((error): error is string => !!error)
  if (errors.length > 0) {
    return { label: 'Erro na sincronização', className: 'text-red-400', detail: errors.join('\n') }
  }
  if (units.length === 0) return { label: 'Sem notas para sincronizar', className: 'text-gray-500' }
  if (units.some((unit) => !unit.last_success_at)) {
    return { label: 'Aguardando sincronização', className: 'text-yellow-400' }
  }
  const oldest = units.map((unit) => unit.last_success_at!).sort()[0]
  return { label: `Sincronizado ${new Date(oldest).toLocaleString('pt-BR')}`, className: 'text-gray-400' }
}

type UserOption = {
  id: string
  email: string
  isAdmin: boolean
}

const inputClassName =
  'w-full rounded-lg border border-gray-700 px-3 py-2 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20'

type ImportSummary = {
  total_jettax: number
  invalid: number
  new: number
  updated: number
  dry_run: boolean
}

function formatCnpj(cnpj: string) {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

async function runJettaxImport(dryRun: boolean) {
  return supabase.functions.invoke<ImportSummary>('jettax-sync', {
    body: { action: 'import_clients', dry_run: dryRun },
  })
}

export function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [importOpen, setImportOpen] = useState(false)
  const [preview, setPreview] = useState<ImportSummary | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const [accessClientId, setAccessClientId] = useState<string | null>(null)
  const [users, setUsers] = useState<UserOption[] | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [accessError, setAccessError] = useState<string | null>(null)
  const [savingAccess, setSavingAccess] = useState(false)

  const [syncingClientId, setSyncingClientId] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<{ text: string; isError: boolean } | null>(null)

  async function loadClients() {
    setLoadError(null)
    const { data, error } = await supabase
      .from('clients')
      .select(
        'id, cnpj, razao_social, client_users(user_id), jettax_sync_state(last_success_at, last_error), fiscal_documents(count)',
      )
      .order('razao_social')
    if (error) {
      setLoadError(error.message)
      return
    }
    setClients(data)
  }

  useEffect(() => {
    loadClients()
  }, [])

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase()
    const digits = query.replace(/\D/g, '')
    return (clients ?? []).filter(
      (client) =>
        !query ||
        client.razao_social.toLowerCase().includes(query) ||
        (digits !== '' && client.cnpj.includes(digits)),
    )
  }, [clients, search])

  const totalWithAccess = clients?.filter((client) => client.client_users.length > 0).length ?? 0

  const accessClient = clients?.find((client) => client.id === accessClientId) ?? null
  const linkedUserIds = new Set(accessClient?.client_users.map((link) => link.user_id))
  const emailByUserId = new Map(users?.map((user) => [user.id, user.email]))
  const linkableUsers = (users ?? []).filter((user) => !user.isAdmin && !linkedUserIds.has(user.id))

  async function loadUsers() {
    const { data, error } = await supabase.functions.invoke('admin-list-users')
    if (error) {
      setAccessError(await extractErrorMessage(error, 'Erro ao carregar usuários'))
      return
    }
    setUsers(data.users)
  }

  function openAccessDialog(client: ClientRow) {
    setAccessClientId(client.id)
    setSelectedUserId('')
    setNewEmail('')
    setNewPassword('')
    setAccessError(null)
    if (users === null) loadUsers()
  }

  async function linkUser(userId: string) {
    const { error } = await supabase.from('client_users').insert({ client_id: accessClientId, user_id: userId })
    if (error) {
      setAccessError(error.message)
      return false
    }
    await loadClients()
    return true
  }

  async function handleLinkExisting(event: FormEvent) {
    event.preventDefault()
    setAccessError(null)
    setSavingAccess(true)
    if (await linkUser(selectedUserId)) setSelectedUserId('')
    setSavingAccess(false)
  }

  async function handleCreateAndLink(event: FormEvent) {
    event.preventDefault()
    setAccessError(null)
    setSavingAccess(true)

    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { email: newEmail, password: newPassword },
    })
    if (error) {
      setAccessError(await extractErrorMessage(error, 'Erro ao criar usuário'))
      setSavingAccess(false)
      return
    }

    if (await linkUser(data.user.id)) {
      setNewEmail('')
      setNewPassword('')
      await loadUsers()
    }
    setSavingAccess(false)
  }

  async function handleUnlink(userId: string) {
    setAccessError(null)
    const { error } = await supabase
      .from('client_users')
      .delete()
      .eq('client_id', accessClientId)
      .eq('user_id', userId)
    if (error) {
      setAccessError(error.message)
      return
    }
    await loadClients()
  }

  async function handleSyncNow(client: ClientRow) {
    setSyncMessage(null)
    setSyncingClientId(client.id)
    const { data, error } = await supabase.functions.invoke('jettax-sync', {
      body: { action: 'sync_documents', client_id: client.id },
    })
    setSyncingClientId(null)
    if (error) {
      setSyncMessage({ text: await extractErrorMessage(error, 'Erro ao sincronizar notas'), isError: true })
      return
    }
    setSyncMessage({
      text: `${client.razao_social}: ${data.documents_new} notas novas${data.errors ? `, ${data.errors} com erro` : ''}.`,
      isError: data.errors > 0,
    })
    await loadClients()
  }

  async function openImportDialog() {
    setPreview(null)
    setImportError(null)
    setImportOpen(true)
    setImporting(true)

    const { data, error } = await runJettaxImport(true)
    setImporting(false)
    if (error) {
      setImportError(await extractErrorMessage(error, 'Erro ao consultar a Jettax'))
      return
    }
    setPreview(data)
  }

  async function handleConfirmImport() {
    setImportError(null)
    setImporting(true)

    const { error } = await runJettaxImport(false)
    setImporting(false)
    if (error) {
      setImportError(await extractErrorMessage(error, 'Erro ao importar clientes'))
      return
    }
    setImportOpen(false)
    await loadClients()
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Clientes</h2>
          <p className="mt-1 text-sm text-gray-400">
            {clients?.length ?? 0} no total · {totalWithAccess} com acesso ao app
          </p>
        </div>

        <button
          type="button"
          onClick={openImportDialog}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <DownloadIcon className="h-4 w-4" />
          Importar da Jettax
        </button>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="relative w-full sm:w-auto">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou CNPJ..."
            className="w-full rounded-lg border border-gray-800 bg-gray-800 py-2 pl-9 pr-3 text-sm focus:border-gray-600 focus:outline-none sm:w-64"
          />
        </div>
      </div>

      {syncMessage && (
        <p className={`mt-4 text-sm ${syncMessage.isError ? 'text-red-400' : 'text-green-400'}`}>{syncMessage.text}</p>
      )}

      <div className="mt-4 rounded-lg border border-gray-800 bg-gray-900">
        {loadError && (
          <div className="flex items-center justify-between p-4 text-sm text-red-400">
            {loadError}
            <button type="button" onClick={loadClients} className="font-medium underline">
              Tentar novamente
            </button>
          </div>
        )}

        {!loadError && clients === null && <p className="p-6 text-sm text-gray-500">Carregando...</p>}

        {!loadError && clients !== null && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Acesso ao app</th>
                  <th className="px-4 py-3 font-medium">Notas fiscais</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const loginCount = client.client_users.length
                  const documentCount = client.fiscal_documents[0]?.count ?? 0
                  const syncStatus = syncStatusOf(client)
                  return (
                    <tr key={client.id} className="border-b border-gray-800 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-100">{client.razao_social}</p>
                        <p className="text-xs text-gray-400">{formatCnpj(client.cnpj)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${loginCount ? 'bg-green-500' : 'bg-gray-600'}`} />
                          <span className={loginCount ? 'text-green-400' : 'text-gray-400'}>
                            {loginCount ? `${loginCount} ${loginCount === 1 ? 'login' : 'logins'}` : 'Sem acesso'}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-100">{documentCount} notas</p>
                        <p className={`text-xs ${syncStatus.className}`} title={syncStatus.detail}>
                          {syncingClientId === client.id ? 'Sincronizando...' : syncStatus.label}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <ActionMenu
                          width="w-52"
                          items={[
                            { label: 'Gerenciar acesso', onClick: () => openAccessDialog(client) },
                            ...(syncingClientId
                              ? []
                              : [{ label: 'Sincronizar notas agora', onClick: () => handleSyncNow(client) }]),
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      {clients.length === 0
                        ? 'Nenhum cliente. Use "Importar da Jettax" para trazer a lista.'
                        : 'Nenhum cliente encontrado.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Importar clientes da Jettax"
        description="Nada é gravado até você confirmar. Nenhum cliente ganha acesso ao app."
      >
        <div className="space-y-4">
          {importing && !preview && <p className="text-sm text-gray-400">Consultando a Jettax...</p>}

          {preview && (
            <ul className="space-y-1 text-sm text-gray-300">
              <li>{preview.total_jettax} clientes encontrados na Jettax</li>
              <li>{preview.new} novos</li>
              <li>{preview.updated} já cadastrados (serão atualizados)</li>
              {preview.invalid > 0 && (
                <li className="text-yellow-400">{preview.invalid} ignorados por CNPJ ou razão social inválidos</li>
              )}
            </ul>
          )}

          {importError && <p className="text-sm text-red-400">{importError}</p>}

          <div className="flex items-center justify-end gap-2 border-t border-gray-800 pt-4">
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={!preview || importing}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {importing && preview ? 'Importando...' : 'Confirmar importação'}
            </button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={accessClient !== null}
        onClose={() => setAccessClientId(null)}
        title="Acesso ao app"
        description={accessClient ? `${accessClient.razao_social} · ${formatCnpj(accessClient.cnpj)}` : undefined}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-300">Logins com acesso</p>
            {accessClient?.client_users.length === 0 && <p className="text-sm text-gray-500">Nenhum login vinculado.</p>}
            <ul className="space-y-1">
              {accessClient?.client_users.map((link) => (
                <li key={link.user_id} className="flex items-center justify-between gap-2 text-sm text-gray-300">
                  <span className="truncate">{emailByUserId.get(link.user_id) ?? 'Carregando...'}</span>
                  <button
                    type="button"
                    onClick={() => handleUnlink(link.user_id)}
                    className="shrink-0 text-xs font-medium text-red-400 hover:underline"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleLinkExisting} className="space-y-2 border-t border-gray-800 pt-4">
            <label htmlFor="link-user" className="text-sm font-medium text-gray-300">
              Vincular login existente
            </label>
            <div className="flex gap-2">
              <select
                id="link-user"
                required
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className={inputClassName}
              >
                <option value="">{users === null ? 'Carregando...' : 'Selecione um usuário'}</option>
                {linkableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={savingAccess}
                className="shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Vincular
              </button>
            </div>
          </form>

          <form onSubmit={handleCreateAndLink} className="space-y-2 border-t border-gray-800 pt-4">
            <p className="text-sm font-medium text-gray-300">Criar novo login para este cliente</p>
            <input
              type="email"
              required
              autoComplete="off"
              placeholder="E-mail"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              className={inputClassName}
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Senha"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={inputClassName}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingAccess}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {savingAccess ? 'Salvando...' : 'Criar e vincular'}
              </button>
            </div>
          </form>

          {accessError && <p className="text-sm text-red-400">{accessError}</p>}
        </div>
      </Dialog>
    </div>
  )
}
