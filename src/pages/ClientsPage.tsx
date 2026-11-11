import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Download } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { extractErrorMessage } from '../lib/functionErrors'
import { Dialog } from '../components/Dialog'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { CrudListPage } from '../components/crud'
import type { CrudEntityLabel, CrudFilterDef, CrudRowAction } from '../components/crud'
import type { TableColumn } from '../components/types/crud'
import { useCrudSearch } from '../hooks/useCrudSearch'
import { useCrudSort } from '../hooks/useCrudSort'
import { usePageMetadata } from '../contexts/PageMetadataContext'

type ClientRow = {
  id: string
  cnpj: string
  razao_social: string
  client_users: { user_id: string }[]
  jettax_sync_state: { last_success_at: string | null; last_error: string | null }[]
  fiscal_documents: { count: number }[]
}

type SyncKind = 'error' | 'empty' | 'pending' | 'synced'

type SyncStatus = { kind: SyncKind; label: string; className: string; detail?: string }

const CLIENT_ENTITY: CrudEntityLabel = { singular: 'cliente', plural: 'clientes' }

const ACCESS_FILTER_OPTIONS = [
  { value: 'with', label: 'Com acesso' },
  { value: 'without', label: 'Sem acesso' },
]

const SYNC_FILTER_OPTIONS: { value: SyncKind; label: string }[] = [
  { value: 'error', label: 'Com erro' },
  { value: 'pending', label: 'Aguardando' },
  { value: 'synced', label: 'Sincronizado' },
  { value: 'empty', label: 'Sem notas' },
]

function syncStatusOf(client: ClientRow): SyncStatus {
  const units = client.jettax_sync_state
  const errors = units.map((unit) => unit.last_error).filter((error): error is string => !!error)
  if (errors.length > 0) {
    return { kind: 'error', label: 'Erro na sincronização', className: 'text-destructive', detail: errors.join('\n') }
  }
  if (units.length === 0) return { kind: 'empty', label: 'Sem notas para sincronizar', className: 'text-muted-foreground' }
  if (units.some((unit) => !unit.last_success_at)) {
    return { kind: 'pending', label: 'Aguardando sincronização', className: 'text-warning' }
  }
  const oldest = units.map((unit) => unit.last_success_at!).sort()[0]
  return { kind: 'synced', label: `Sincronizado ${new Date(oldest).toLocaleString('pt-BR')}`, className: 'text-muted-foreground' }
}

type UserOption = {
  id: string
  email: string
  isAdmin: boolean
}

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
  const search = useCrudSearch()
  const sort = useCrudSort({ field: 'razao_social' })
  const [accessFilter, setAccessFilter] = useState<string | null>(null)
  const [syncFilter, setSyncFilter] = useState<string | null>(null)

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
    const query = search.term.trim().toLowerCase()
    const digits = query.replace(/\D/g, '')
    const direction = sort.sortDirection === 'asc' ? 1 : -1
    return (clients ?? [])
      .filter(
        (client) =>
          (!query ||
            client.razao_social.toLowerCase().includes(query) ||
            (digits !== '' && client.cnpj.includes(digits))) &&
          (accessFilter === null || (client.client_users.length > 0) === (accessFilter === 'with')) &&
          (syncFilter === null || syncStatusOf(client).kind === syncFilter),
      )
      .sort((a, b) => direction * a.razao_social.localeCompare(b.razao_social, 'pt-BR'))
  }, [clients, search.term, accessFilter, syncFilter, sort.sortDirection])

  const totalWithAccess = clients?.filter((client) => client.client_users.length > 0).length ?? 0

  usePageMetadata({
    title: 'Clientes',
    subtitle: `${clients?.length ?? 0} no total · ${totalWithAccess} com acesso ao app`,
  })

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

  const columns: TableColumn<ClientRow>[] = [
    {
      key: 'razao_social',
      header: 'Cliente',
      sortable: true,
      render: (client) => (
        <>
          <p className="font-medium text-foreground">{client.razao_social}</p>
          <p className="text-xs text-muted-foreground">{formatCnpj(client.cnpj)}</p>
        </>
      ),
    },
    {
      key: 'client_users',
      header: 'Acesso ao app',
      render: (client) => {
        const loginCount = client.client_users.length
        return (
          <Badge variant={loginCount ? 'success' : 'secondary'}>
            {loginCount ? `${loginCount} ${loginCount === 1 ? 'login' : 'logins'}` : 'Sem acesso'}
          </Badge>
        )
      },
    },
    {
      key: 'fiscal_documents',
      header: 'Notas fiscais',
      render: (client) => {
        const syncStatus = syncStatusOf(client)
        return (
          <>
            <p className="text-foreground">{client.fiscal_documents[0]?.count ?? 0} notas</p>
            <p className={`text-xs ${syncStatus.className}`} title={syncStatus.detail}>
              {syncingClientId === client.id ? 'Sincronizando...' : syncStatus.label}
            </p>
          </>
        )
      },
    },
  ]

  const filterDefs: CrudFilterDef[] = [
    {
      key: 'access',
      label: 'Acesso ao app',
      options: ACCESS_FILTER_OPTIONS,
      value: accessFilter,
      onChange: setAccessFilter,
      defaultVisible: true,
    },
    {
      key: 'sync',
      label: 'Sincronização',
      options: SYNC_FILTER_OPTIONS,
      value: syncFilter,
      onChange: setSyncFilter,
      defaultVisible: true,
    },
  ]

  const rowActionsOf = (client: ClientRow): CrudRowAction[] => [
    { label: 'Gerenciar acesso', onSelect: () => openAccessDialog(client) },
    { label: 'Sincronizar notas agora', onSelect: () => handleSyncNow(client), hidden: syncingClientId !== null },
  ]

  return (
    <div className="h-full">
      <CrudListPage<ClientRow>
        entity={CLIENT_ENTITY}
        rows={filteredClients}
        columns={columns}
        isLoading={clients === null && !loadError}
        isError={loadError !== null}
        onRetry={loadClients}
        search={search}
        searchPlaceholder="Buscar por nome ou CNPJ..."
        filterDefs={filterDefs}
        hasActiveFilters={accessFilter !== null || syncFilter !== null}
        resetKey={`${accessFilter ?? ''}|${syncFilter ?? ''}`}
        sort={sort}
        onNew={openImportDialog}
        newLabel="Importar da Jettax"
        newIcon={Download}
        emptyDescription='Use "Importar da Jettax" para trazer a lista.'
        rowActions={rowActionsOf}
        belowBar={
          syncMessage && (
            <p className={`px-4 pb-2 text-sm ${syncMessage.isError ? 'text-destructive' : 'text-success'}`}>
              {syncMessage.text}
            </p>
          )
        }
      />

      <Dialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Importar clientes da Jettax"
        description="Nada é gravado até você confirmar. Nenhum cliente ganha acesso ao app."
      >
        <div className="space-y-4">
          {importing && !preview && <p className="text-sm text-muted-foreground">Consultando a Jettax...</p>}

          {preview && (
            <ul className="space-y-1 text-sm text-foreground">
              <li>{preview.total_jettax} clientes encontrados na Jettax</li>
              <li>{preview.new} novos</li>
              <li>{preview.updated} já cadastrados (serão atualizados)</li>
              {preview.invalid > 0 && (
                <li className="text-warning">{preview.invalid} ignorados por CNPJ ou razão social inválidos</li>
              )}
            </ul>
          )}

          {importError && <p className="text-sm text-destructive">{importError}</p>}

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmImport} disabled={!preview || importing}>
              {importing && preview ? 'Importando...' : 'Confirmar importação'}
            </Button>
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
            <p className="text-sm font-medium text-foreground">Logins com acesso</p>
            {accessClient?.client_users.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum login vinculado.</p>
            )}
            <ul className="space-y-1">
              {accessClient?.client_users.map((link) => (
                <li key={link.user_id} className="flex items-center justify-between gap-2 text-sm text-foreground">
                  <span className="truncate">{emailByUserId.get(link.user_id) ?? 'Carregando...'}</span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => handleUnlink(link.user_id)}
                    className="h-auto shrink-0 p-0 text-xs text-destructive"
                  >
                    Remover
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleLinkExisting} className="space-y-2 border-t pt-4">
            <Label htmlFor="link-user">Vincular login existente</Label>
            <div className="flex gap-2">
              <Select required value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="link-user">
                  <SelectValue placeholder={users === null ? 'Carregando...' : 'Selecione um usuário'} />
                </SelectTrigger>
                <SelectContent>
                  {linkableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={savingAccess || !selectedUserId} className="shrink-0">
                Vincular
              </Button>
            </div>
          </form>

          <form onSubmit={handleCreateAndLink} className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium text-foreground">Criar novo login para este cliente</p>
            <Input
              type="email"
              required
              autoComplete="off"
              placeholder="E-mail"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
            />
            <Input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Senha"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={savingAccess}>
                {savingAccess ? 'Salvando...' : 'Criar e vincular'}
              </Button>
            </div>
          </form>

          {accessError && <p className="text-sm text-destructive">{accessError}</p>}
        </div>
      </Dialog>
    </div>
  )
}
