import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { displayNameFromEmail } from '../lib/displayName'
import { extractErrorMessage } from '../lib/functionErrors'
import { Dialog } from '../components/Dialog'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
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
  gep_document_clients: { client_id: string }[]
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

type Tab = 'sent' | 'received'

type ReceivedRow = {
  id: string
  filePath: string
  fileName: string
  uploadedAt: string
  clientName: string
  clientEmail: string | null
}

const SENT_ENTITY: CrudEntityLabel = { singular: 'documento enviado', plural: 'documentos enviados' }
const RECEIVED_ENTITY: CrudEntityLabel = { singular: 'arquivo recebido', plural: 'arquivos recebidos' }

const TEXTAREA_CLASS_NAME =
  'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:outline-none'

function mapSentDocumentRow(row: SentDocumentRow): SentDocument {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    filePath: row.file_path,
    fileName: row.file_name,
    audienceType: row.audience_type as AudienceType,
    targetClientIds: row.gep_document_clients.map((client) => client.client_id),
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

  const [tab, setTab] = useState<Tab>('sent')
  const search = useCrudSearch()

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
      .from('gep_documents')
      .select('id, title, description, file_path, file_name, audience_type, created_at, gep_document_clients(client_id)')
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
      .from('gep_uploads')
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
    const query = search.term.trim().toLowerCase()
    return (sentDocuments ?? []).filter(
      (doc) => !query || doc.title.toLowerCase().includes(query) || doc.fileName.toLowerCase().includes(query),
    )
  }, [sentDocuments, search.term])

  const filteredReceived = useMemo(() => {
    const query = search.term.trim().toLowerCase()
    const rows: ReceivedRow[] = (receivedUploads ?? []).map((upload) => {
      const client = clients?.find((item) => item.id === upload.clientId)
      return {
        id: upload.id,
        filePath: upload.filePath,
        fileName: upload.fileName,
        uploadedAt: upload.uploadedAt,
        clientName: client ? (client.name ?? displayNameFromEmail(client.email)) : 'Cliente removido',
        clientEmail: client?.email ?? null,
      }
    })
    if (!query) return rows
    return rows.filter(
      (row) =>
        row.fileName.toLowerCase().includes(query) ||
        row.clientName.toLowerCase().includes(query) ||
        (row.clientEmail ?? '').toLowerCase().includes(query),
    )
  }, [receivedUploads, search.term, clients])

  usePageMetadata({
    title: 'Documentos',
    subtitle: `${totalSent} enviados · ${totalReceived} recebidos`,
  })

  function handleTabChange(nextTab: Tab) {
    setTab(nextTab)
    search.onChange('')
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
      const { error: uploadError } = await supabase.storage.from('gep-files').upload(path, selectedFile)
      if (uploadError) {
        setFormError(uploadError.message)
        setSubmitting(false)
        return
      }
      if (editingDocument) {
        await supabase.storage.from('gep-files').remove([editingDocument.filePath])
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
      const { error } = await supabase.from('gep_documents').update(payload).eq('id', documentId)
      if (error) {
        setFormError(error.message)
        setSubmitting(false)
        return
      }
    } else {
      const { data, error } = await supabase.from('gep_documents').insert(payload).select('id').single()
      if (error) {
        setFormError(error.message)
        setSubmitting(false)
        return
      }
      documentId = data.id
    }

    const { error: deleteClientsError } = await supabase.from('gep_document_clients').delete().eq('document_id', documentId)
    if (deleteClientsError) {
      setFormError(deleteClientsError.message)
      setSubmitting(false)
      return
    }

    if (audienceType !== 'all') {
      const audienceRows = audienceClientIds.map((clientId) => ({ document_id: documentId, client_id: clientId }))
      const { error: insertClientsError } = await supabase.from('gep_document_clients').insert(audienceRows)
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
    await supabase.storage.from('gep-files').remove([document.filePath])
    const { error } = await supabase.from('gep_documents').delete().eq('id', document.id)
    if (error) {
      setSentError(error.message)
      return
    }
    await loadSentDocuments()
  }

  async function handleDeleteReceived(upload: ReceivedUpload) {
    if (!window.confirm(`Excluir o arquivo "${upload.fileName}"?`)) return
    await supabase.storage.from('gep-files').remove([upload.filePath])
    const { error } = await supabase.from('gep_uploads').delete().eq('id', upload.id)
    if (error) {
      setReceivedError(error.message)
      return
    }
    await loadReceivedUploads()
  }

  async function handleDownload(path: string) {
    setDownloadError(null)
    setDownloadingPath(path)
    const { data, error } = await supabase.storage.from('gep-files').createSignedUrl(path, 60)
    setDownloadingPath(null)
    if (error || !data) {
      setDownloadError('Erro ao gerar link do arquivo.')
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  const tabFilter: CrudFilterDef = {
    key: 'tab',
    label: 'Tipo',
    options: [
      { value: 'sent', label: `Enviados (${totalSent})` },
      { value: 'received', label: `Recebidos (${totalReceived})` },
    ],
    value: tab,
    onChange: (value) => value && handleTabChange(value as Tab),
    defaultVisible: true,
    required: true,
  }

  const sentColumns: TableColumn<SentDocument>[] = [
    {
      key: 'title',
      header: 'Documento',
      render: (document) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{document.title}</p>
          <p className="truncate text-xs text-muted-foreground">{document.fileName}</p>
        </div>
      ),
    },
    {
      key: 'audienceType',
      header: 'Destinatários',
      render: (document) => <span className="text-muted-foreground">{audienceLabel(document)}</span>,
    },
    {
      key: 'createdAt',
      header: 'Enviado em',
      render: (document) => <span className="text-muted-foreground">{formatDateTime(document.createdAt)}</span>,
    },
  ]

  const receivedColumns: TableColumn<ReceivedRow>[] = [
    {
      key: 'clientName',
      header: 'Cliente',
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {row.clientName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.clientName}</p>
            {row.clientEmail && <p className="truncate text-xs text-muted-foreground">{row.clientEmail}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'fileName',
      header: 'Arquivo',
      render: (row) => <span className="text-muted-foreground">{row.fileName}</span>,
    },
    {
      key: 'uploadedAt',
      header: 'Recebido em',
      render: (row) => <span className="text-muted-foreground">{formatDateTime(row.uploadedAt)}</span>,
    },
  ]

  const sentRowActions = (document: SentDocument): CrudRowAction[] => [
    {
      label: 'Baixar',
      icon: Download,
      onSelect: () => handleDownload(document.filePath),
      disabled: downloadingPath === document.filePath,
    },
    { label: 'Editar', icon: Pencil, onSelect: () => openEditModal(document) },
    { label: 'Excluir', icon: Trash2, tone: 'destructive', onSelect: () => handleDeleteSent(document) },
  ]

  const receivedRowActions = (row: ReceivedRow): CrudRowAction[] => [
    {
      label: 'Baixar',
      icon: Download,
      onSelect: () => handleDownload(row.filePath),
      disabled: downloadingPath === row.filePath,
    },
    {
      label: 'Excluir',
      icon: Trash2,
      tone: 'destructive',
      onSelect: () => {
        const upload = receivedUploads?.find((item) => item.id === row.id)
        if (upload) handleDeleteReceived(upload)
      },
    },
  ]

  const receivedLoadError = receivedError ?? clientsError

  function belowBarOf(error: string | null) {
    if (!error && !downloadError) return undefined
    return (
      <div className="space-y-1 px-4 pb-2 text-sm text-destructive">
        {error && <p>{error}</p>}
        {downloadError && <p>{downloadError}</p>}
      </div>
    )
  }

  function retryReceived() {
    if (receivedError) loadReceivedUploads()
    if (clientsError) loadClients()
  }

  return (
    <div className="h-full">
      {tab === 'sent' ? (
        <CrudListPage<SentDocument>
          entity={SENT_ENTITY}
          rows={filteredSent}
          columns={sentColumns}
          isLoading={sentDocuments === null && !sentError}
          isError={sentError !== null}
          onRetry={loadSentDocuments}
          search={search}
          searchPlaceholder="Buscar documento..."
          filterDefs={[tabFilter]}
          resetKey={tab}
          pageSize={10}
          onNew={openCreateModal}
          newLabel="Enviar documento"
          newIcon={Plus}
          rowActions={sentRowActions}
          belowBar={belowBarOf(sentError)}
        />
      ) : (
        <CrudListPage<ReceivedRow>
          entity={RECEIVED_ENTITY}
          rows={filteredReceived}
          columns={receivedColumns}
          isLoading={!receivedLoadError && (receivedUploads === null || clients === null)}
          isError={receivedLoadError !== null}
          onRetry={retryReceived}
          search={search}
          searchPlaceholder="Buscar arquivo ou cliente..."
          filterDefs={[tabFilter]}
          resetKey={tab}
          pageSize={10}
          rowActions={receivedRowActions}
          belowBar={belowBarOf(receivedLoadError)}
        />
      )}

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDocument ? 'Editar documento' : 'Enviar documento'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="document-title">Título</Label>
            <Input id="document-title" type="text" required value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="document-description">Descrição</Label>
            <textarea
              id="document-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={TEXTAREA_CLASS_NAME}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="document-file">
              Arquivo{editingDocument && ' (opcional — mantém o atual se não escolher outro)'}
            </Label>
            {editingDocument && !selectedFile && (
              <p className="text-xs text-muted-foreground">Atual: {editingDocument.fileName}</p>
            )}
            <Input
              id="document-file"
              type="file"
              required={!editingDocument}
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="h-auto text-muted-foreground"
            />
          </div>

          <div className="space-y-3 rounded-xl border bg-muted/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Destinatários</p>
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {(Object.keys(AUDIENCE_TYPE_LABELS) as AudienceType[]).map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={audienceType === option ? 'tertiary' : 'ghost'}
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
                  {!clientsError && clients === null && <p className="px-2 py-1 text-sm text-muted-foreground">Carregando...</p>}
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
                        name={audienceType === 'individual' ? 'document-individual' : undefined}
                        checked={audienceClientIds.includes(client.id)}
                        onChange={() => handleToggleAudienceClient(client.id)}
                        className="h-4 w-4 accent-primary"
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
              {submitting ? 'Enviando...' : editingDocument ? 'Salvar' : 'Enviar'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
