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

function UploadStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 15.5V4M8 8l4-4 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 15v2.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function DownloadStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 4v11.5M8 12l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 17.5V19a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
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

function TrashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 7h14M9.5 7V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7m-8 0 .8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L18 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
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

type ClientOption = {
  id: string
  email: string
  name: string | null
}

type AudienceType = 'all' | 'individual' | 'group'

type SentDocument = {
  id: string
  title: string
  description: string | null
  filePath: string
  fileName: string
  audienceType: AudienceType
  targetClientIds: string[]
  createdAt: string
}

type SentDocumentRow = {
  id: string
  title: string
  description: string | null
  file_path: string
  file_name: string
  audience_type: string
  created_at: string
  ged_document_clients: { client_id: string }[]
}

type ReceivedUpload = {
  id: string
  clientId: string
  filePath: string
  fileName: string
  uploadedAt: string
}

type ReceivedUploadRow = {
  id: string
  client_id: string
  file_path: string
  file_name: string
  uploaded_at: string
}

const AUDIENCE_TYPE_LABELS: Record<AudienceType, string> = {
  all: 'Todos',
  individual: 'Individual',
  group: 'Grupo selecionado',
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function mapSentDocumentRow(row: SentDocumentRow): SentDocument {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    filePath: row.file_path,
    fileName: row.file_name,
    audienceType: row.audience_type as AudienceType,
    targetClientIds: row.ged_document_clients.map((client) => client.client_id),
    createdAt: row.created_at,
  }
}

function mapReceivedUploadRow(row: ReceivedUploadRow): ReceivedUpload {
  return {
    id: row.id,
    clientId: row.client_id,
    filePath: row.file_path,
    fileName: row.file_name,
    uploadedAt: row.uploaded_at,
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

function audienceLabel(document: SentDocument) {
  if (document.audienceType === 'all') return 'Todos'
  if (document.audienceType === 'individual') return '1 pessoa'
  const count = document.targetClientIds.length
  return `${count} pessoa${count === 1 ? '' : 's'}`
}

function formatDateTime(iso: string) {
  const date = new Date(iso)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} às ${String(
    date.getHours(),
  ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function DocumentsPage() {
  const [sentDocuments, setSentDocuments] = useState<SentDocument[] | null>(null)
  const [sentError, setSentError] = useState<string | null>(null)

  const [receivedUploads, setReceivedUploads] = useState<ReceivedUpload[] | null>(null)
  const [receivedError, setReceivedError] = useState<string | null>(null)

  const [clients, setClients] = useState<ClientOption[] | null>(null)
  const [clientsError, setClientsError] = useState<string | null>(null)

  const [tab, setTab] = useState<'sent' | 'received'>('sent')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])


  const [modalOpen, setModalOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<SentDocument | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [audienceType, setAudienceType] = useState<AudienceType>('all')
  const [audienceClientIds, setAudienceClientIds] = useState<string[]>([])
  const [audienceQuery, setAudienceQuery] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [downloadingPath, setDownloadingPath] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  async function loadSentDocuments() {
    setSentError(null)
    const { data, error } = await supabase
      .from('ged_documents')
      .select('id, title, description, file_path, file_name, audience_type, created_at, ged_document_clients(client_id)')
      .order('created_at', { ascending: false })

    if (error) {
      setSentError(error.message)
      return
    }
    setSentDocuments((data as SentDocumentRow[]).map(mapSentDocumentRow))
  }

  async function loadReceivedUploads() {
    setReceivedError(null)
    const { data, error } = await supabase
      .from('ged_uploads')
      .select('id, client_id, file_path, file_name, uploaded_at')
      .order('uploaded_at', { ascending: false })

    if (error) {
      setReceivedError(error.message)
      return
    }
    setReceivedUploads((data as ReceivedUploadRow[]).map(mapReceivedUploadRow))
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
    loadSentDocuments()
    loadReceivedUploads()
    loadClients()
  }, [])

  const filteredAudienceClients = useMemo(() => filterClientsByQuery(clients ?? [], audienceQuery), [clients, audienceQuery])

  const totalSent = sentDocuments?.length ?? 0
  const totalReceived = receivedUploads?.length ?? 0

  const filteredSent = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (sentDocuments ?? []).filter(
      (doc) => !query || doc.title.toLowerCase().includes(query) || doc.fileName.toLowerCase().includes(query),
    )
  }, [sentDocuments, search])

  const filteredReceived = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return receivedUploads ?? []
    return (receivedUploads ?? []).filter((upload) => {
      const client = clients?.find((item) => item.id === upload.clientId)
      const name = client ? (client.name ?? displayNameFromEmail(client.email)) : ''
      return (
        upload.fileName.toLowerCase().includes(query) ||
        name.toLowerCase().includes(query) ||
        (client?.email ?? '').toLowerCase().includes(query)
      )
    })
  }, [receivedUploads, search, clients])

  const activeLength = tab === 'sent' ? filteredSent.length : filteredReceived.length
  const totalPages = Math.max(1, Math.ceil(activeLength / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = activeLength === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, activeLength)
  const pageSent = filteredSent.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const pageReceived = filteredReceived.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function handleTabChange(nextTab: 'sent' | 'received') {
    setTab(nextTab)
    setSearch('')
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
    setEditingDocument(null)
    setTitle('')
    setDescription('')
    setSelectedFile(null)
    setAudienceType('all')
    setAudienceClientIds([])
    setAudienceQuery('')
    setFormError(null)
    setModalOpen(true)
  }

  function openEditModal(document: SentDocument) {
    setEditingDocument(document)
    setTitle(document.title)
    setDescription(document.description ?? '')
    setSelectedFile(null)
    setAudienceType(document.audienceType)
    setAudienceClientIds(document.targetClientIds)
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
    if (!editingDocument && !selectedFile) {
      setFormError('Selecione um arquivo.')
      return
    }

    setSubmitting(true)

    let filePath = editingDocument?.filePath ?? ''
    let fileName = editingDocument?.fileName ?? ''

    if (selectedFile) {
      const path = `sent/${crypto.randomUUID()}-${selectedFile.name}`
      const { error: uploadError } = await supabase.storage.from('ged-files').upload(path, selectedFile)
      if (uploadError) {
        setFormError(uploadError.message)
        setSubmitting(false)
        return
      }
      if (editingDocument) {
        await supabase.storage.from('ged-files').remove([editingDocument.filePath])
      }
      filePath = path
      fileName = selectedFile.name
    }

    const payload = {
      title,
      description: description.trim() ? description.trim() : null,
      file_path: filePath,
      file_name: fileName,
      audience_type: audienceType,
    }

    let documentId = editingDocument?.id ?? null

    if (documentId) {
      const { error } = await supabase.from('ged_documents').update(payload).eq('id', documentId)
      if (error) {
        setFormError(error.message)
        setSubmitting(false)
        return
      }
    } else {
      const { data, error } = await supabase.from('ged_documents').insert(payload).select('id').single()
      if (error) {
        setFormError(error.message)
        setSubmitting(false)
        return
      }
      documentId = data.id
    }

    const { error: deleteClientsError } = await supabase.from('ged_document_clients').delete().eq('document_id', documentId)
    if (deleteClientsError) {
      setFormError(deleteClientsError.message)
      setSubmitting(false)
      return
    }

    if (audienceType !== 'all') {
      const audienceRows = audienceClientIds.map((clientId) => ({ document_id: documentId, client_id: clientId }))
      const { error: insertClientsError } = await supabase.from('ged_document_clients').insert(audienceRows)
      if (insertClientsError) {
        setFormError(insertClientsError.message)
        setSubmitting(false)
        return
      }
    }

    setSubmitting(false)
    setModalOpen(false)
    await loadSentDocuments()
  }

  async function handleDeleteSent(document: SentDocument) {
    if (!window.confirm(`Excluir o documento "${document.title}"?`)) return
    await supabase.storage.from('ged-files').remove([document.filePath])
    const { error } = await supabase.from('ged_documents').delete().eq('id', document.id)
    if (error) {
      setSentError(error.message)
      return
    }
    await loadSentDocuments()
  }

  async function handleDeleteReceived(upload: ReceivedUpload) {
    if (!window.confirm(`Excluir o arquivo "${upload.fileName}"?`)) return
    await supabase.storage.from('ged-files').remove([upload.filePath])
    const { error } = await supabase.from('ged_uploads').delete().eq('id', upload.id)
    if (error) {
      setReceivedError(error.message)
      return
    }
    await loadReceivedUploads()
  }

  async function handleDownload(path: string) {
    setDownloadError(null)
    setDownloadingPath(path)
    const { data, error } = await supabase.storage.from('ged-files').createSignedUrl(path, 60)
    setDownloadingPath(null)
    if (error || !data) {
      setDownloadError('Erro ao gerar link do arquivo.')
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Documentos</h2>
          <p className="mt-1 text-sm text-gray-400">Envio e recebimento de arquivos com clientes</p>
          <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <UploadStatIcon className="h-4 w-4 text-gray-500" />
              {totalSent} enviados
            </span>
            <span className="flex items-center gap-1.5">
              <DownloadStatIcon className="h-4 w-4 text-gray-500" />
              {totalReceived} recebidos
            </span>
          </div>
        </div>

        {tab === 'sent' && (
          <button
            type="button"
            onClick={openCreateModal}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4" />
            Enviar documento
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg bg-gray-800 p-1">
          <button
            type="button"
            onClick={() => handleTabChange('sent')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === 'sent' ? 'bg-gray-900 text-primary-400 shadow-sm' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Enviados {totalSent}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('received')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === 'received' ? 'bg-gray-900 text-primary-400 shadow-sm' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Recebidos {totalReceived}
          </button>
        </div>

        <div className="relative w-full sm:w-auto">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={tab === 'sent' ? 'Buscar documento...' : 'Buscar arquivo ou cliente...'}
            className="w-full rounded-lg border border-gray-800 bg-gray-800 py-2 pl-9 pr-3 text-sm focus:border-gray-600 focus:outline-none sm:w-64"
          />
        </div>
      </div>

      {downloadError && <p className="mt-3 text-sm text-red-400">{downloadError}</p>}

      <div className="mt-4 rounded-lg border border-gray-800 bg-gray-900">
        {tab === 'sent' && sentError && (
          <div className="flex items-center justify-between p-4 text-sm text-red-400">
            {sentError}
            <button type="button" onClick={loadSentDocuments} className="font-medium underline">
              Tentar novamente
            </button>
          </div>
        )}

        {tab === 'sent' && !sentError && sentDocuments === null && <p className="p-6 text-sm text-gray-500">Carregando...</p>}

        {tab === 'sent' && !sentError && sentDocuments !== null && (
          <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Destinatários</th>
                <th className="px-4 py-3 font-medium">Enviado em</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageSent.map((document) => (
                <tr key={document.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-100">{document.title}</p>
                      <p className="truncate text-xs text-gray-400">{document.fileName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{audienceLabel(document)}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDateTime(document.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDownload(document.filePath)}
                        disabled={downloadingPath === document.filePath}
                        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-400 disabled:opacity-50"
                        title="Baixar"
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </button>
                      <ActionMenu
                        items={[
                          { label: 'Editar', onClick: () => openEditModal(document) },
                          { label: 'Excluir', onClick: () => handleDeleteSent(document), danger: true },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {pageSent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    Nenhum documento enviado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}

        {tab === 'received' && receivedError && (
          <div className="flex items-center justify-between p-4 text-sm text-red-400">
            {receivedError}
            <button type="button" onClick={loadReceivedUploads} className="font-medium underline">
              Tentar novamente
            </button>
          </div>
        )}

        {tab === 'received' && !receivedError && (receivedUploads === null || clients === null) && !clientsError && (
          <p className="p-6 text-sm text-gray-500">Carregando...</p>
        )}

        {tab === 'received' && clientsError && (
          <div className="flex items-center justify-between p-4 text-sm text-red-400">
            {clientsError}
            <button type="button" onClick={loadClients} className="font-medium underline">
              Tentar novamente
            </button>
          </div>
        )}

        {tab === 'received' && !receivedError && !clientsError && receivedUploads !== null && clients !== null && (
          <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Arquivo</th>
                <th className="px-4 py-3 font-medium">Recebido em</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageReceived.map((upload) => {
                const client = clients.find((item) => item.id === upload.clientId)
                const name = client ? (client.name ?? displayNameFromEmail(client.email)) : 'Cliente removido'
                return (
                  <tr key={upload.id} className="border-b border-gray-800 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-900 text-xs font-semibold text-primary-400">
                          {name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-100">{name}</p>
                          {client && <p className="truncate text-xs text-gray-400">{client.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{upload.fileName}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDateTime(upload.uploadedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownload(upload.filePath)}
                          disabled={downloadingPath === upload.filePath}
                          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-400 disabled:opacity-50"
                          title="Baixar"
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReceived(upload)}
                          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-800 hover:text-red-400"
                          title="Excluir"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {pageReceived.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    Nenhum arquivo recebido.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}

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
            {pageStart}-{pageEnd} de {activeLength} itens
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
      </div>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDocument ? 'Editar documento' : 'Enviar documento'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="document-title" className="text-sm font-medium text-gray-300">
              Título
            </label>
            <input
              id="document-title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="document-description" className="text-sm font-medium text-gray-300">
              Descrição
            </label>
            <textarea
              id="document-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="document-file" className="text-sm font-medium text-gray-300">
              Arquivo{editingDocument && ' (opcional — mantém o atual se não escolher outro)'}
            </label>
            {editingDocument && !selectedFile && (
              <p className="text-xs text-gray-400">Atual: {editingDocument.fileName}</p>
            )}
            <input
              id="document-file"
              type="file"
              required={!editingDocument}
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-400 transition-colors file:mr-3 file:rounded-md file:border-0 file:bg-gray-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-300 hover:file:bg-gray-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
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
                        name={audienceType === 'individual' ? 'document-individual' : undefined}
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
              {submitting ? 'Enviando...' : editingDocument ? 'Salvar' : 'Enviar'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
