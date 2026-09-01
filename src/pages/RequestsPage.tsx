import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { displayNameFromEmail } from '../lib/displayName'
import { extractErrorMessage } from '../lib/functionErrors'
import { Dialog } from '../components/Dialog'

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

function InboxStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3.5 13.5 6 5.7A1.5 1.5 0 0 1 7.4 4.5h9.2a1.5 1.5 0 0 1 1.4 1.2l2.5 7.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 13.5h5.2l1 2h4.6l1-2h5.2v4a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="m8.5 12.3 2.4 2.4 4.6-4.9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DownloadIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 4v11.5M8 12l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 17.5V19a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function MoreIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
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

const RESPONSE_TYPE_DOT_COLORS: Record<ResponseType, string> = {
  arquivo: 'bg-indigo-500',
  texto: 'bg-primary-500',
  data: 'bg-teal-500',
}

const RESPONSE_TYPE_TEXT_COLORS: Record<ResponseType, string> = {
  arquivo: 'text-indigo-400',
  texto: 'text-primary-400',
  data: 'text-teal-400',
}

const AUDIENCE_TYPE_LABELS: Record<AudienceType, string> = {
  all: 'Todos',
  individual: 'Individual',
  group: 'Grupo selecionado',
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

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

  const [tab, setTab] = useState<'all' | 'pending'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

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
    const query = search.trim().toLowerCase()
    return (requests ?? [])
      .filter((item) => (tab === 'pending' ? isPending(item, totalClients) : true))
      .filter((item) => {
        if (!query) return true
        return item.title.toLowerCase().includes(query) || (item.description ?? '').toLowerCase().includes(query)
      })
  }, [requests, tab, search, totalClients])

  const totalPending = useMemo(
    () => (requests ?? []).filter((item) => isPending(item, totalClients)).length,
    [requests, totalClients],
  )

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = filteredRequests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, filteredRequests.length)
  const pageRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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

  function handleTabChange(nextTab: 'all' | 'pending') {
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

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Solicitações</h2>
          <p className="mt-1 text-sm text-gray-400">{totalRequests} no total</p>
          <div className="mt-3 flex items-center gap-5 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <InboxStatIcon className="h-4 w-4 text-primary-400" />
              {totalRequests} solicitações
            </span>
            <span className="flex items-center gap-1.5">
              <CheckStatIcon className="h-4 w-4 text-primary-400" />
              {totalResponses} respostas recebidas
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          Nova solicitação
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
            Todas {totalRequests}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('pending')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === 'pending' ? 'bg-gray-900 text-primary-400 shadow-sm' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Pendentes {totalPending}
          </button>
        </div>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Buscar solicitação..."
            className="w-64 rounded-lg border border-gray-800 bg-gray-800 py-2 pl-9 pr-3 text-sm focus:border-gray-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
        {loadError && (
          <div className="flex items-center justify-between p-4 text-sm text-red-400">
            {loadError}
            <button type="button" onClick={loadRequests} className="font-medium underline">
              Tentar novamente
            </button>
          </div>
        )}

        {!loadError && requests === null && <p className="p-6 text-sm text-gray-500">Carregando...</p>}

        {!loadError && requests !== null && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">Solicitação</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Destinatários</th>
                <th className="px-4 py-3 font-medium">Respostas</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageRequests.map((request) => (
                <tr
                  key={request.id}
                  onClick={() => openDetail(request)}
                  className="cursor-pointer border-b border-gray-800 last:border-0 hover:bg-gray-800"
                >
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-100">{request.title}</p>
                      {request.description && <p className="truncate text-xs text-gray-400">{request.description}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className={`h-1.5 w-1.5 rounded-full ${RESPONSE_TYPE_DOT_COLORS[request.responseType]}`} />
                      <span className={RESPONSE_TYPE_TEXT_COLORS[request.responseType]}>
                        {RESPONSE_TYPE_LABELS[request.responseType]}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{audienceLabel(request)}</td>
                  <td className="px-4 py-3 text-gray-400">
                    <span className="font-medium text-gray-100">{request.respondedClientIds.length}</span>
                    {' / '}
                    {targetCount(request, totalClients)} enviaram
                  </td>
                  <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === request.id ? null : request.id)}
                        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-400"
                      >
                        <MoreIcon className="h-4 w-4" />
                      </button>
                      {openMenuId === request.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-0 z-20 mt-1 w-32 rounded-md border border-gray-800 bg-gray-900 py-1 shadow-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null)
                                openEditModal(request)
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null)
                                handleDelete(request)
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-800"
                            >
                              Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {pageRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {!loadError && requests !== null && (
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
              {pageStart}-{pageEnd} de {filteredRequests.length} itens
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
        title={editingRequest ? 'Editar solicitação' : 'Nova solicitação'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="request-title" className="text-sm font-medium text-gray-300">
              Título
            </label>
            <input
              id="request-title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="request-description" className="text-sm font-medium text-gray-300">
              Descrição
            </label>
            <textarea
              id="request-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="request-type" className="text-sm font-medium text-gray-300">
              Tipo de dado esperado
            </label>
            <select
              id="request-type"
              value={responseType}
              onChange={(event) => setResponseType(event.target.value as ResponseType)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {(Object.keys(RESPONSE_TYPE_LABELS) as ResponseType[]).map((option) => (
                <option key={option} value={option}>
                  {RESPONSE_TYPE_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-800/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Destinatários</p>
            <div className="flex items-center gap-1 rounded-lg bg-gray-800 p-1">
              {(Object.keys(AUDIENCE_TYPE_LABELS) as AudienceType[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleAudienceTypeChange(option)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                    audienceType === option ? 'bg-gray-900 text-primary-400 shadow-sm' : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {AUDIENCE_TYPE_LABELS[option]}
                </button>
              ))}
            </div>

            {audienceType !== 'all' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={audienceQuery}
                  onChange={(event) => setAudienceQuery(event.target.value)}
                  placeholder="Buscar pessoa..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />

                {clientsError && (
                  <div className="flex items-center justify-between text-sm text-red-400">
                    {clientsError}
                    <button type="button" onClick={loadClients} className="font-medium underline">
                      Tentar novamente
                    </button>
                  </div>
                )}

                <div className="max-h-32 space-y-0.5 overflow-y-auto">
                  {!clientsError && clients === null && <p className="px-2 py-1 text-sm text-gray-500">Carregando...</p>}
                  {!clientsError && clients !== null && filteredAudienceClients.length === 0 && (
                    <p className="px-2 py-1 text-sm text-gray-500">Nenhuma pessoa encontrada.</p>
                  )}
                  {filteredAudienceClients.map((client) => (
                    <label
                      key={client.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
                    >
                      <input
                        type={audienceType === 'individual' ? 'radio' : 'checkbox'}
                        name={audienceType === 'individual' ? 'request-individual' : undefined}
                        checked={audienceClientIds.includes(client.id)}
                        onChange={() => handleToggleAudienceClient(client.id)}
                        className={
                          audienceType === 'individual'
                            ? 'h-4 w-4 border-gray-700 accent-primary-600'
                            : 'h-4 w-4 rounded border-gray-700 accent-primary-600'
                        }
                      />
                      {client.name ?? displayNameFromEmail(client.email)}
                    </label>
                  ))}
                </div>
              </div>
            )}
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
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
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
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={detailQuery}
              onChange={(event) => setDetailQuery(event.target.value)}
              placeholder="Buscar pessoa..."
              className="w-full rounded-lg border border-gray-800 bg-gray-800 py-2 pl-9 pr-3 text-sm focus:border-gray-600 focus:outline-none"
            />
          </div>

          {detailError && (
            <div className="flex items-center justify-between text-sm text-red-400">
              {detailError}
              <button
                type="button"
                onClick={() => detailRequest && loadDetailResponses(detailRequest.id)}
                className="font-medium underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {clientsError && (
            <div className="flex items-center justify-between text-sm text-red-400">
              {clientsError}
              <button type="button" onClick={loadClients} className="font-medium underline">
                Tentar novamente
              </button>
            </div>
          )}

          {downloadError && <p className="text-sm text-red-400">{downloadError}</p>}

          {!detailError && (clients === null || detailResponses === null) && (
            <p className="py-4 text-sm text-gray-500">Carregando...</p>
          )}

          {!detailError && clients !== null && detailResponses !== null && (
            <div className="max-h-[26rem] space-y-2 overflow-y-auto">
              {detailTargetClients.length === 0 && <p className="py-4 text-sm text-gray-500">Nenhuma pessoa nesta lista.</p>}
              {detailTargetClients.map((client) => {
                const response = detailResponses.get(client.id)
                const name = client.name ?? displayNameFromEmail(client.email)
                return (
                  <div key={client.id} className="rounded-xl border border-gray-800 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-900 text-xs font-semibold text-primary-400">
                          {name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-100">{name}</p>
                          <p className="truncate text-xs text-gray-400">{client.email}</p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          response ? 'bg-green-950 text-green-400' : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {response ? 'Respondido' : 'Pendente'}
                      </span>
                    </div>

                    {response && (
                      <div className="mt-2.5 border-t border-gray-800 pt-2.5">
                        {detailRequest?.responseType === 'arquivo' && response.filePath && (
                          <button
                            type="button"
                            onClick={() => handleDownload(response.filePath!)}
                            disabled={downloadingPath === response.filePath}
                            className="flex items-center gap-1.5 text-sm font-medium text-primary-400 hover:text-primary-300 disabled:opacity-50"
                          >
                            <DownloadIcon className="h-4 w-4" />
                            {downloadingPath === response.filePath ? 'Gerando link...' : 'Baixar arquivo'}
                          </button>
                        )}
                        {detailRequest?.responseType === 'texto' && response.textValue && (
                          <p className="text-sm text-gray-300">{response.textValue}</p>
                        )}
                        {detailRequest?.responseType === 'data' && response.dateValue && (
                          <p className="text-sm text-gray-300">{formatDateValue(response.dateValue)}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">Enviado em {formatSubmittedAt(response.submittedAt)}</p>
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
