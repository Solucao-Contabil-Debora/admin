import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { displayNameFromEmail } from '../lib/displayName'
import { extractErrorMessage } from '../lib/functionErrors'
import { Dialog } from '../components/Dialog'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { CrudListPage } from '../components/crud'
import type { CrudEntityLabel, CrudFilterDef, CrudRowAction } from '../components/crud'
import type { TableColumn } from '../components/types/crud'
import { useCrudSearch } from '../hooks/useCrudSearch'
import { useCrudSort } from '../hooks/useCrudSort'
import { usePageMetadata } from '../contexts/PageMetadataContext'

type UserRow = {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
  deletionRequest: { reason: string | null; createdAt: string } | null
}

const USER_ENTITY: CrudEntityLabel = { singular: 'usuário', plural: 'usuários' }

const ROLE_FILTER_OPTIONS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'member', label: 'Membro' },
]

const PAGE_SIZE = 10

function nameOf(user: UserRow) {
  return user.name ?? displayNameFromEmail(user.email)
}

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const search = useCrudSearch()
  const sort = useCrudSort({ field: 'name' })
  const [roleFilter, setRoleFilter] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [userToDelete, setUserToDelete] = useState<UserRow | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  usePageMetadata({
    title: 'Usuários',
    subtitle: `${totalUsers} no total · ${totalAdmins} admins`,
  })

  const filteredUsers = useMemo(() => {
    const query = search.term.trim().toLowerCase()
    const direction = sort.sortDirection === 'asc' ? 1 : -1
    return (users ?? [])
      .filter((user) => roleFilter === null || user.isAdmin === (roleFilter === 'admin'))
      .filter((user) => !query || nameOf(user).toLowerCase().includes(query) || user.email.toLowerCase().includes(query))
      .sort((a, b) => direction * nameOf(a).localeCompare(nameOf(b), 'pt-BR'))
  }, [users, roleFilter, search.term, sort.sortDirection])

  async function handleCopyEmail(user: UserRow) {
    await navigator.clipboard.writeText(user.email)
  }

  function openDeleteDialog(user: UserRow) {
    setDeleteError(null)
    setUserToDelete(user)
  }

  async function handleDelete() {
    if (!userToDelete) return
    setDeleteError(null)
    setDeleting(true)

    const { error } = await supabase.functions.invoke('admin-delete-user', {
      body: { userId: userToDelete.id },
    })

    if (error) {
      setDeleteError(await extractErrorMessage(error, 'Erro ao excluir usuário'))
      setDeleting(false)
      return
    }

    setDeleting(false)
    setUserToDelete(null)
    await loadUsers()
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

  const columns: TableColumn<UserRow>[] = [
    {
      key: 'name',
      header: 'Usuário',
      sortable: true,
      render: (user) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{nameOf(user)}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          {user.deletionRequest && (
            <p className="mt-1 text-xs text-destructive" title={user.deletionRequest.reason ?? undefined}>
              Exclusão solicitada em {new Date(user.deletionRequest.createdAt).toLocaleDateString('pt-BR')}
              {user.deletionRequest.reason && ` — ${user.deletionRequest.reason}`}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'isAdmin',
      header: 'Papel',
      render: (user) => (
        <Badge variant={user.isAdmin ? 'info' : 'secondary'}>{user.isAdmin ? 'Administrador' : 'Membro'}</Badge>
      ),
    },
  ]

  const filterDefs: CrudFilterDef[] = [
    {
      key: 'role',
      label: 'Papel',
      options: ROLE_FILTER_OPTIONS,
      value: roleFilter,
      onChange: setRoleFilter,
      defaultVisible: true,
    },
  ]

  const rowActionsOf = (user: UserRow): CrudRowAction[] => [
    { label: 'Copiar e-mail', onSelect: () => handleCopyEmail(user) },
    { label: 'Excluir conta', onSelect: () => openDeleteDialog(user), tone: 'destructive', hidden: user.isAdmin },
  ]

  return (
    <div className="h-full">
      <CrudListPage<UserRow>
        entity={USER_ENTITY}
        rows={filteredUsers}
        columns={columns}
        isLoading={users === null && !loadError}
        isError={loadError !== null}
        onRetry={loadUsers}
        search={search}
        searchPlaceholder="Buscar usuário..."
        filterDefs={filterDefs}
        hasActiveFilters={roleFilter !== null}
        resetKey={roleFilter ?? ''}
        sort={sort}
        onNew={openModal}
        newLabel="Adicionar"
        newIcon={Plus}
        rowActions={rowActionsOf}
        pageSize={PAGE_SIZE}
      />

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Adicionar usuário"
        description="Cria uma conta de acesso ao aplicativo."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-user-email">E-mail</Label>
            <Input
              id="new-user-email"
              type="email"
              autoComplete="off"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-user-password">Senha</Label>
            <Input
              id="new-user-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Criando...' : 'Criar usuário'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={userToDelete !== null}
        onClose={() => setUserToDelete(null)}
        title="Excluir conta"
        description={userToDelete?.email}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground">
            O acesso ao app e os dados do usuário (anotações, respostas, vínculos e registros de envio) serão
            apagados. Os arquivos no armazenamento não são removidos automaticamente. Esta ação não pode ser
            desfeita.
          </p>

          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setUserToDelete(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir conta'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
