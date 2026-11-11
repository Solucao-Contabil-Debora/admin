import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { displayNameFromEmail } from '../lib/displayName'
import { extractErrorMessage } from '../lib/functionErrors'
import { Dialog } from '../components/Dialog'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Checkbox } from '../components/ui/checkbox'
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

type AnnouncementType = 'alerta' | 'aviso' | 'normal' | 'pendencia'
type AudienceType = 'all' | 'individual' | 'group'

type Announcement = {
  id: string
  title: string
  message: string
  type: AnnouncementType
  audienceType: AudienceType
  eventAt: string | null
  targetClientIds: string[]
}

type AnnouncementRow = {
  id: string
  title: string
  message: string
  type: string
  audience_type: string
  event_at: string | null
  announcement_clients: { client_id: string }[]
}

const ANNOUNCEMENT_ENTITY: CrudEntityLabel = { singular: 'comunicado', plural: 'comunicados' }

const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  alerta: 'Alerta',
  aviso: 'Aviso',
  normal: 'Normal',
  pendencia: 'Pendência',
}

const ANNOUNCEMENT_TYPE_BADGE_VARIANTS: Record<AnnouncementType, 'danger' | 'warning' | 'info' | 'secondary'> = {
  alerta: 'danger',
  aviso: 'warning',
  normal: 'info',
  pendencia: 'secondary',
}

const ANNOUNCEMENT_TYPE_FILTER_OPTIONS = (Object.keys(ANNOUNCEMENT_TYPE_LABELS) as AnnouncementType[]).map((value) => ({
  value,
  label: ANNOUNCEMENT_TYPE_LABELS[value],
}))

const SCHEDULE_FILTER_OPTIONS = [{ value: 'scheduled', label: 'Agendados' }]

const AUDIENCE_TYPE_LABELS: Record<AudienceType, string> = {
  all: 'Todos',
  individual: 'Individual',
  group: 'Grupo selecionado',
}

const textareaClassName =
  'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

function mapAnnouncementRow(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type as AnnouncementType,
    audienceType: row.audience_type as AudienceType,
    eventAt: row.event_at,
    targetClientIds: row.announcement_clients.map((client) => client.client_id),
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

function formatEventDate(iso: string) {
  const date = new Date(iso)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function audienceLabel(announcement: Announcement) {
  if (announcement.audienceType === 'all') return 'Todos'
  if (announcement.audienceType === 'individual') return '1 pessoa'
  const count = announcement.targetClientIds.length
  return `${count} pessoa${count === 1 ? '' : 's'}`
}

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [clients, setClients] = useState<ClientOption[] | null>(null)
  const [clientsError, setClientsError] = useState<string | null>(null)

  const search = useCrudSearch()
  const [scheduleFilter, setScheduleFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [announcementType, setAnnouncementType] = useState<AnnouncementType>('normal')
  const [hasEventDate, setHasEventDate] = useState(false)
  const [eventDate, setEventDate] = useState('')
  const [audienceType, setAudienceType] = useState<AudienceType>('all')
  const [audienceClientIds, setAudienceClientIds] = useState<string[]>([])
  const [audienceQuery, setAudienceQuery] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadAnnouncements() {
    setLoadError(null)
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, message, type, audience_type, event_at, announcement_clients(client_id)')
      .order('created_at', { ascending: false })

    if (error) {
      setLoadError(error.message)
      return
    }
    setAnnouncements((data as AnnouncementRow[]).map(mapAnnouncementRow))
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
    loadAnnouncements()
    loadClients()
  }, [])

  const filteredAudienceClients = useMemo(() => filterClientsByQuery(clients ?? [], audienceQuery), [clients, audienceQuery])

  const totalAnnouncements = announcements?.length ?? 0
  const totalScheduled = announcements?.filter((item) => item.eventAt !== null).length ?? 0

  usePageMetadata({
    title: 'Comunicados',
    subtitle: `${totalAnnouncements} no total · ${totalScheduled} agendados`,
  })

  const filteredAnnouncements = useMemo(() => {
    const query = search.term.trim().toLowerCase()
    return (announcements ?? [])
      .filter((item) => (scheduleFilter === 'scheduled' ? item.eventAt !== null : true))
      .filter((item) => (typeFilter === null ? true : item.type === typeFilter))
      .filter((item) => {
        if (!query) return true
        return item.title.toLowerCase().includes(query) || item.message.toLowerCase().includes(query)
      })
  }, [announcements, scheduleFilter, typeFilter, search.term])

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
    setEditingAnnouncement(null)
    setTitle('')
    setMessage('')
    setAnnouncementType('normal')
    setHasEventDate(false)
    setEventDate('')
    setAudienceType('all')
    setAudienceClientIds([])
    setAudienceQuery('')
    setFormError(null)
    setModalOpen(true)
  }

  function openEditModal(announcement: Announcement) {
    setEditingAnnouncement(announcement)
    setTitle(announcement.title)
    setMessage(announcement.message)
    setAnnouncementType(announcement.type)
    setHasEventDate(announcement.eventAt !== null)
    setEventDate(announcement.eventAt ? announcement.eventAt.slice(0, 10) : '')
    setAudienceType(announcement.audienceType)
    setAudienceClientIds(announcement.targetClientIds)
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

    if (hasEventDate && !eventDate) {
      setFormError('Informe a data para vincular ao calendário.')
      return
    }

    setSubmitting(true)

    const payload = {
      title,
      message,
      type: announcementType,
      audience_type: audienceType,
      event_at: hasEventDate ? new Date(`${eventDate}T12:00`).toISOString() : null,
    }

    let announcementId = editingAnnouncement?.id ?? null

    if (announcementId) {
      const { error } = await supabase.from('announcements').update(payload).eq('id', announcementId)
      if (error) {
        setFormError(error.message)
        setSubmitting(false)
        return
      }
    } else {
      const { data, error } = await supabase.from('announcements').insert(payload).select('id').single()
      if (error) {
        setFormError(error.message)
        setSubmitting(false)
        return
      }
      announcementId = data.id
    }

    const { error: deleteClientsError } = await supabase
      .from('announcement_clients')
      .delete()
      .eq('announcement_id', announcementId)
    if (deleteClientsError) {
      setFormError(deleteClientsError.message)
      setSubmitting(false)
      return
    }

    if (audienceType !== 'all') {
      const audienceRows = audienceClientIds.map((clientId) => ({ announcement_id: announcementId, client_id: clientId }))
      const { error: insertClientsError } = await supabase.from('announcement_clients').insert(audienceRows)
      if (insertClientsError) {
        setFormError(insertClientsError.message)
        setSubmitting(false)
        return
      }
    }

    setSubmitting(false)
    setModalOpen(false)
    await loadAnnouncements()
  }

  async function handleDelete(announcement: Announcement) {
    if (!window.confirm(`Excluir o comunicado "${announcement.title}"?`)) return
    const { error } = await supabase.from('announcements').delete().eq('id', announcement.id)
    if (error) {
      setLoadError(error.message)
      return
    }
    await loadAnnouncements()
  }

  const columns: TableColumn<Announcement>[] = [
    {
      key: 'title',
      header: 'Comunicado',
      render: (announcement) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{announcement.title}</p>
          <p className="truncate text-xs text-muted-foreground">{announcement.message}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (announcement) => (
        <Badge variant={ANNOUNCEMENT_TYPE_BADGE_VARIANTS[announcement.type]}>
          {ANNOUNCEMENT_TYPE_LABELS[announcement.type]}
        </Badge>
      ),
    },
    {
      key: 'eventAt',
      header: 'Data vinculada',
      render: (announcement) => (
        <span className="text-muted-foreground">{announcement.eventAt ? formatEventDate(announcement.eventAt) : '—'}</span>
      ),
    },
    {
      key: 'audienceType',
      header: 'Destinatários',
      render: (announcement) => <span className="text-muted-foreground">{audienceLabel(announcement)}</span>,
    },
  ]

  const filterDefs: CrudFilterDef[] = [
    {
      key: 'schedule',
      label: 'Agendamento',
      options: SCHEDULE_FILTER_OPTIONS,
      value: scheduleFilter,
      onChange: setScheduleFilter,
      defaultVisible: true,
    },
    {
      key: 'type',
      label: 'Tipo',
      options: ANNOUNCEMENT_TYPE_FILTER_OPTIONS,
      value: typeFilter,
      onChange: setTypeFilter,
      defaultVisible: true,
    },
  ]

  const rowActionsOf = (announcement: Announcement): CrudRowAction[] => [
    { label: 'Editar', onSelect: () => openEditModal(announcement) },
    { label: 'Excluir', onSelect: () => handleDelete(announcement), tone: 'destructive' },
  ]

  return (
    <div className="h-full">
      <CrudListPage<Announcement>
        entity={ANNOUNCEMENT_ENTITY}
        rows={filteredAnnouncements}
        columns={columns}
        isLoading={announcements === null && !loadError}
        isError={loadError !== null}
        onRetry={loadAnnouncements}
        search={search}
        searchPlaceholder="Buscar comunicado..."
        filterDefs={filterDefs}
        hasActiveFilters={scheduleFilter !== null || typeFilter !== null}
        resetKey={`${scheduleFilter ?? ''}|${typeFilter ?? ''}`}
        onNew={openCreateModal}
        newLabel="Novo comunicado"
        newIcon={Plus}
        rowActions={rowActionsOf}
      />

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAnnouncement ? 'Editar comunicado' : 'Novo comunicado'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="announcement-title">Título</Label>
            <Input
              id="announcement-title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="announcement-message">Mensagem</Label>
            <textarea
              id="announcement-message"
              rows={3}
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className={textareaClassName}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="announcement-type">Tipo</Label>
            <Select value={announcementType} onValueChange={(value) => setAnnouncementType(value as AnnouncementType)}>
              <SelectTrigger id="announcement-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ANNOUNCEMENT_TYPE_LABELS) as AnnouncementType[]).map((option) => (
                  <SelectItem key={option} value={option}>
                    {ANNOUNCEMENT_TYPE_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 rounded-xl border bg-muted/60 p-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="announcement-has-event-date"
                checked={hasEventDate}
                onCheckedChange={(checked) => setHasEventDate(checked === true)}
              />
              <Label htmlFor="announcement-has-event-date">Vincular a uma data no calendário</Label>
            </div>

            {hasEventDate && (
              <Input
                type="date"
                required
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                aria-label="Data vinculada"
              />
            )}
          </div>

          <div className="space-y-3 rounded-xl border bg-muted/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Destinatários</p>
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {(Object.keys(AUDIENCE_TYPE_LABELS) as AudienceType[]).map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={audienceType === option ? 'primary' : 'ghost'}
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
                  aria-label="Buscar pessoa"
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
                      {audienceType === 'individual' ? (
                        <input
                          type="radio"
                          name="announcement-individual"
                          checked={audienceClientIds.includes(client.id)}
                          onChange={() => handleToggleAudienceClient(client.id)}
                          className="h-4 w-4 accent-primary"
                        />
                      ) : (
                        <Checkbox
                          checked={audienceClientIds.includes(client.id)}
                          onCheckedChange={() => handleToggleAudienceClient(client.id)}
                        />
                      )}
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
    </div>
  )
}
