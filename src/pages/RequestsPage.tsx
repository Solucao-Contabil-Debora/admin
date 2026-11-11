import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { displayNameFromEmail } from '../lib/displayName'
import { extractErrorMessage } from '../lib/functionErrors'
import { Download, Search } from 'lucide-react'
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
import { usePageMetadata } from '../contexts/PageMetadataContext'

type ClientOption = {
  id: string
  email: string
  name: string | null
}

type ResponseType = 'arquivo' | 'texto' | 'data'
type AudienceType = 'all' | 'individual' | 'group'

type RequestItem = {
  id: string
  title: string
  description: string | null
  responseType: ResponseType
  audienceType: AudienceType
  targetClientIds: string[]
  respondedClientIds: string[]
}

type RequestRow = {
  id: string
  title: string
  description: string | null
  response_type: string
  audience_type: string
  request_clients: { client_id: string }[]
  request_responses: { client_id: string }[]
}

type ResponseDetail = {
  filePath: string | null
  textValue: string | null
  dateValue: string | null
  submittedAt: string
}

type ResponseDetailRow = {
  client_id: string
  file_path: string | null
  text_value: string | null
  date_value: string | null
  submitted_at: string
}

const RESPONSE_TYPE_LABELS: Record<ResponseType, string> = {
  arquivo: 'Arquivo',
  texto: 'Texto',
  data: 'Data',
}

const RESPONSE_TYPE_BADGE_VARIANTS: Record<ResponseType, 'info' | 'secondary' | 'outline'> = {
  arquivo: 'info',
  texto: 'secondary',
  data: 'outline',
}

const AUDIENCE_TYPE_LABELS: Record<AudienceType, string> = {
  all: 'Todos',
  individual: 'Individual',
  group: 'Grupo selecionado',
}

const REQUEST_ENTITY: CrudEntityLabel = { singular: 'solicitação', plural: 'solicitações', feminine: true }

const STATUS_FILTER_OPTIONS = [
  { value: 'pending', label: 'Pendentes' },
  { value: 'done', label: 'Concluídas' },
]

const TYPE_FILTER_OPTIONS = (Object.keys(RESPONSE_TYPE_LABELS) as ResponseType[]).map((value) => ({
  value,
  label: RESPONSE_TYPE_LABELS[value],
}))

const PAGE_SIZE = 10

const textareaClassName =
  'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function mapRequestRow(row: RequestRow): RequestItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    responseType: row.response_type as ResponseType,
    audienceType: row.audience_type as AudienceType,
    targetClientIds: row.request_clients.map((client) => client.client_id),
    respondedClientIds: row.request_responses.map((client) => client.client_id),
  }
}

function filterClientsByQuery(options: ClientOption[], query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return options
  return options.filter((client) => {
    const name = (client.name ?? displayNameFromEmail(client.email)).toLowerCase()
    return name.includes(normalized) || client.email.toLowerCase().includes(normalized)
  })
}

function targetCount(request: RequestItem, totalClients: number) {
  if (request.audienceType === 'all') return totalClients
  if (request.audienceType === 'individual') return 1
  return request.targetClientIds.length
}

function isPending(request: RequestItem, totalClients: number) {
  return request.respondedClientIds.length < targetCount(request, totalClients)
}

function audienceLabel(request: RequestItem) {
  if (request.audienceType === 'all') return 'Todos'
  if (request.audienceType === 'individual') return '1 pessoa'
  const count = request.targetClientIds.length
  return `${count} pessoa${count === 1 ? '' : 's'}`
}

function formatDateValue(value: string) {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function formatSubmittedAt(iso: string) {
  const date = new Date(iso)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} às ${String(
    date.getHours(),
  ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [clients, setClients] = useState<ClientOption[] | null>(null)
  const [clientsError, setClientsError] = useState<string | null>(null)

  const search = useCrudSearch()
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<RequestItem | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [responseType, setResponseType] = useState<ResponseType>('arquivo')
  const [audienceType, setAudienceType] = useState<AudienceType>('all')
  const [audienceClientIds, setAudienceClientIds] = useState<string[]>([])
  const [audienceQuery, setAudienceQuery] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [detailRequest, setDetailRequest] = useState<RequestItem | null>(null)
  const [detailResponses, setDetailResponses] = useState<Map<string, ResponseDetail> | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailQuery, setDetailQuery] = useState('')
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  async function loadRequests() {
    setLoadError(null)
    const { data, error } = await supabase
      .from('requests')
      .select('id, title, description, response_type, audience_type, request_clients(client_id), request_responses(client_id)')
      .order('created_at', { ascending: false })

    if (error) {
      setLoadError(error.message)
      return
    }
    setRequests((data as RequestRow[]).map(mapRequestRow))
  }

  async function loadClients() {
    setClientsError(null)
    const { data, error } = await supabase.functions.invoke('admin-list-users')
    if (error) {
      setClientsError(await extractErrorMessage(error, 'Erro ao carregar pessoas'))
      return
    }
    setClients(data.users)
  }

  useEffect(() => {
    loadRequests()
    loadClients()
  }, [])

  const filteredAudienceClients = useMemo(() => filterClientsByQuery(clients ?? [], audienceQuery), [clients, audienceQuery])

  const totalClients = clients?.length ?? 0
  const totalRequests = requests?.length ?? 0
  const totalResponses = useMemo(
    () => (requests ?? []).reduce((sum, request) => sum + request.respondedClientIds.length, 0),
    [requests],
  )

  const filteredRequests = useMemo(() => {
    const query = search.term.trim().toLowerCase()
    return (requests ?? [])
      .filter((item) => statusFilter === null || isPending(item, totalClients) === (statusFilter === 'pending'))
      .filter((item) => typeFilter === null || item.responseType === typeFilter)
      .filter((item) => {
        if (!query) return true
        return item.title.toLowerCase().includes(query) || (item.description ?? '').toLowerCase().includes(query)
      })
  }, [requests, statusFilter, typeFilter, search.term, totalClients])

  const detailTargetClients = useMemo(() => {
    if (!detailRequest || !clients) return []
    const base =
      detailRequest.audienceType === 'all'
        ? clients
        : clients.filter((client) => detailRequest.targetClientIds.includes(client.id))
    const filtered = filterClientsByQuery(base, detailQuery)
    return [...filtered].sort((a, b) =>
      (a.name ?? displayNameFromEmail(a.email)).localeCompare(b.name ?? displayNameFromEmail(b.email)),
    )
  }, [detailRequest, clients, detailQuery])

  function handleAudienceTypeChange(next: AudienceType) {
    setAudienceType(next)
    setAudienceClientIds([])
  }

  function handleToggleAudienceClient(clientId: string) {
    if (audienceType === 'individual') {
      setAudienceClientIds([clientId])
      return
    }
    setAudienceClientIds((current) =>
      current.includes(clientId) ? current.filter((id) => id !== clientId) : [...current, clientId],
    )
  }

  function openCreateModal() {
    setEditingRequest(null)
    setTitle('')
    setDescription('')
    setResponseType('arquivo')
    setAudienceType('all')
    setAudienceClientIds([])
    setAudienceQuery('')
    setFormError(null)
    setModalOpen(true)
  }

  function openEditModal(request: RequestItem) {
    setEditingRequest(request)
    setTitle(request.title)
    setDescription(request.description ?? '')
    setResponseType(request.responseType)
    setAudienceType(request.audienceType)
    setAudienceClientIds(request.targetClientIds)
    setAudienceQuery('')
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (audienceType !== 'all' && audienceClientIds.length === 0) {
      setFormError('Selecione ao menos um destinatário.')
      return
    }

    setSubmitting(true)

    const payload = {
      title,
      description: description.trim() ? description.trim() : null,
      response_type: responseType,
      audience_type: audienceType,
    }

    let requestId = editingRequest?.id ?? null

    if (requestId) {
      const { error } = await supabase.from('requests').update(payload).eq('id', requestId)
      if (error) {
        setFormError(error.message)
        setSubmitting(false)
        return
      }
    } else {
      const { data, error } = await supabase.from('requests').insert(payload).select('id').single()
      if (error) {
        setFormError(error.message)
        setSubmitting(false)
        return
      }
      requestId = data.id
    }

    const { error: deleteClientsError } = await supabase.from('request_clients').delete().eq('request_id', requestId)
    if (deleteClientsError) {
      setFormError(deleteClientsError.message)
      setSubmitting(false)
      return
    }

    if (audienceType !== 'all') {
      const audienceRows = audienceClientIds.map((clientId) => ({ request_id: requestId, client_id: clientId }))
      const { error: insertClientsError } = await supabase.from('request_clients').insert(audienceRows)
      if (insertClientsError) {
        setFormError(insertClientsError.message)
        setSubmitting(false)
        return
      }
    }

    setSubmitting(false)
    setModalOpen(false)
    await loadRequests()
  }

  async function handleDelete(request: RequestItem) {
    if (!window.confirm(`Excluir a solicitação "${request.title}"?`)) return
    const { error } = await supabase.from('requests').delete().eq('id', request.id)
    if (error) {
      setLoadError(error.message)
      return
    }
    await loadRequests()
  }

  function openDetail(request: RequestItem) {
    setDetailRequest(request)
    setDetailResponses(null)
    setDetailError(null)
    setDetailQuery('')
    setDownloadError(null)
    loadDetailResponses(request.id)
  }

  async function loadDetailResponses(requestId: string) {
    const { data, error } = await supabase
      .from('request_responses')
      .select('client_id, file_path, text_value, date_value, submitted_at')
      .eq('request_id', requestId)

    if (error) {
      setDetailError(error.message)
      return
    }

    const map = new Map(
      (data as ResponseDetailRow[]).map((row) => [
        row.client_id,
        { filePath: row.file_path, textValue: row.text_value, dateValue: row.date_value, submittedAt: row.submitted_at },
      ]),
    )
    setDetailResponses(map)
  }

  async function handleDownload(path: string) {
    setDownloadError(null)
    setDownloadingPath(path)
    const { data, error } = await supabase.storage.from('request-files').createSignedUrl(path, 60)
    setDownloadingPath(null)
    if (error || !data) {
      setDownloadError('Erro ao gerar link do arquivo.')
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  usePageMetadata({
    title: 'Solicitações',
    subtitle: `${totalRequests} solicitações · ${totalResponses} respostas recebidas`,
  })

  const columns: TableColumn<RequestItem>[] = [
    {
      key: 'title',
      header: 'Solicitação',
      render: (request) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{request.title}</p>
          {request.description && <p className="truncate text-xs text-muted-foreground">{request.description}</p>}
        </div>
      ),
    },
    {
      key: 'responseType',
      header: 'Tipo',
      render: (request) => (
        <Badge variant={RESPONSE_TYPE_BADGE_VARIANTS[request.responseType]}>
          {RESPONSE_TYPE_LABELS[request.responseType]}
        </Badge>
      ),
    },
    {
      key: 'audienceType',
      header: 'Destinatários',
      render: (request) => <span className="text-muted-foreground">{audienceLabel(request)}</span>,
    },
    {
      key: 'respondedClientIds',
      header: 'Respostas',
      render: (request) => (
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{request.respondedClientIds.length}</span>
          {' / '}
          {targetCount(request, totalClients)} enviaram
        </span>
      ),
    },
  ]

  const filterDefs: CrudFilterDef[] = [
    {
      key: 'status',
      label: 'Situação',
      options: STATUS_FILTER_OPTIONS,
      value: statusFilter,
      onChange: setStatusFilter,
      defaultVisible: true,
    },
    {
      key: 'type',
      label: 'Tipo',
      options: TYPE_FILTER_OPTIONS,
      value: typeFilter,
      onChange: setTypeFilter,
      defaultVisible: true,
    },
  ]

  const rowActionsOf = (request: RequestItem): CrudRowAction[] => [
    { label: 'Editar', onSelect: () => openEditModal(request) },
    { label: 'Excluir', onSelect: () => handleDelete(request), tone: 'destructive' },
  ]

  return (
    <div className="h-full">
      <CrudListPage<RequestItem>
        entity={REQUEST_ENTITY}
        rows={filteredRequests}
        columns={columns}
        isLoading={requests === null && !loadError}
        isError={loadError !== null}
        onRetry={loadRequests}
        search={search}
        searchPlaceholder="Buscar solicitação..."
        filterDefs={filterDefs}
        hasActiveFilters={statusFilter !== null || typeFilter !== null}
        resetKey={`${statusFilter ?? ''}|${typeFilter ?? ''}`}
        onNew={openCreateModal}
        newLabel="Nova solicitação"
        onRowClick={openDetail}
        rowActions={rowActionsOf}
        pageSize={PAGE_SIZE}
      />

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRequest ? 'Editar solicitação' : 'Nova solicitação'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="request-title">Título</Label>
            <Input
              id="request-title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="request-description">Descrição</Label>
            <textarea
              id="request-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={textareaClassName}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="request-type">Tipo de dado esperado</Label>
            <Select value={responseType} onValueChange={(value) => setResponseType(value as ResponseType)}>
              <SelectTrigger id="request-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RESPONSE_TYPE_LABELS) as ResponseType[]).map((option) => (
                  <SelectItem key={option} value={option}>
                    {RESPONSE_TYPE_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 rounded-xl border bg-muted/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Destinatários</p>
            <div className="flex items-center gap-1">
              {(Object.keys(AUDIENCE_TYPE_LABELS) as AudienceType[]).map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={audienceType === option ? 'primary' : 'outline'}
                  onClick={() => handleAudienceTypeChange(option)}
                  className="flex-1"
                >
                  {AUDIENCE_TYPE_LABELS[option]}
                </Button>
              ))}
            </div>

            {audienceType !== 'all' && (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={audienceQuery}
                  onChange={(event) => setAudienceQuery(event.target.value)}
                  placeholder="Buscar pessoa..."
                />

                {clientsError && (
                  <div className="flex items-center justify-between text-sm text-destructive">
                    {clientsError}
                    <Button type="button" variant="link" size="sm" onClick={loadClients}>
                      Tentar novamente
                    </Button>
                  </div>
                )}

                <div className="max-h-32 space-y-0.5 overflow-y-auto">
                  {!clientsError && clients === null && (
                    <p className="px-2 py-1 text-sm text-muted-foreground">Carregando...</p>
                  )}
                  {!clientsError && clients !== null && filteredAudienceClients.length === 0 && (
                    <p className="px-2 py-1 text-sm text-muted-foreground">Nenhuma pessoa encontrada.</p>
                  )}
                  {filteredAudienceClients.map((client) => (
                    <label
                      key={client.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent"
                    >
                      <input
                        type={audienceType === 'individual' ? 'radio' : 'checkbox'}
                        name={audienceType === 'individual' ? 'request-individual' : undefined}
                        checked={audienceClientIds.includes(client.id)}
                        onChange={() => handleToggleAudienceClient(client.id)}
                        className={audienceType === 'individual' ? 'h-4 w-4 accent-primary' : 'h-4 w-4 rounded accent-primary'}
                      />
                      {client.name ?? displayNameFromEmail(client.email)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={detailRequest !== null}
        onClose={() => setDetailRequest(null)}
        title={detailRequest?.title ?? ''}
        description={detailRequest ? `${RESPONSE_TYPE_LABELS[detailRequest.responseType]} · ${audienceLabel(detailRequest)}` : undefined}
        maxWidth="lg"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={detailQuery}
              onChange={(event) => setDetailQuery(event.target.value)}
              placeholder="Buscar pessoa..."
              className="pl-9"
            />
          </div>

          {detailError && (
            <div className="flex items-center justify-between text-sm text-destructive">
              {detailError}
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => detailRequest && loadDetailResponses(detailRequest.id)}
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {clientsError && (
            <div className="flex items-center justify-between text-sm text-destructive">
              {clientsError}
              <Button type="button" variant="link" size="sm" onClick={loadClients}>
                Tentar novamente
              </Button>
            </div>
          )}

          {downloadError && <p className="text-sm text-destructive">{downloadError}</p>}

          {!detailError && (clients === null || detailResponses === null) && (
            <p className="py-4 text-sm text-muted-foreground">Carregando...</p>
          )}

          {!detailError && clients !== null && detailResponses !== null && (
            <div className="max-h-[26rem] space-y-2 overflow-y-auto">
              {detailTargetClients.length === 0 && (
                <p className="py-4 text-sm text-muted-foreground">Nenhuma pessoa nesta lista.</p>
              )}
              {detailTargetClients.map((client) => {
                const response = detailResponses.get(client.id)
                const name = client.name ?? displayNameFromEmail(client.email)
                return (
                  <div key={client.id} className="rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{name}</p>
                          <p className="truncate text-xs text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                      <Badge variant={response ? 'success' : 'secondary'} className="shrink-0">
                        {response ? 'Respondido' : 'Pendente'}
                      </Badge>
                    </div>

                    {response && (
                      <div className="mt-2.5 border-t pt-2.5">
                        {detailRequest?.responseType === 'arquivo' && response.filePath && (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => handleDownload(response.filePath!)}
                            disabled={downloadingPath === response.filePath}
                            className="h-auto p-0"
                          >
                            <Download />
                            {downloadingPath === response.filePath ? 'Gerando link...' : 'Baixar arquivo'}
                          </Button>
                        )}
                        {detailRequest?.responseType === 'texto' && response.textValue && (
                          <p className="text-sm text-foreground">{response.textValue}</p>
                        )}
                        {detailRequest?.responseType === 'data' && response.dateValue && (
                          <p className="text-sm text-foreground">{formatDateValue(response.dateValue)}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Enviado em {formatSubmittedAt(response.submittedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  )
}
