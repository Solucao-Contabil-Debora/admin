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

function MegaphoneStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3.5 11v2a1.5 1.5 0 0 0 1.5 1.5h1l.7 4.2a1 1 0 0 0 1 .8h1a1 1 0 0 0 1-1.2L9 14.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M6 8.5 15.5 4c1-.5 2 .3 2 1.4v11.2c0 1.1-1 1.9-2 1.4L6 13.5v-5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CalendarStatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
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

const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  alerta: 'Alerta',
  aviso: 'Aviso',
  normal: 'Normal',
  pendencia: 'Pendência',
}

const ANNOUNCEMENT_TYPE_DOT_COLORS: Record<AnnouncementType, string> = {
  alerta: 'bg-red-500',
  aviso: 'bg-amber-500',
  normal: 'bg-primary-500',
  pendencia: 'bg-purple-500',
}

const ANNOUNCEMENT_TYPE_TEXT_COLORS: Record<AnnouncementType, string> = {
  alerta: 'text-red-400',
  aviso: 'text-amber-400',
  normal: 'text-primary-400',
  pendencia: 'text-purple-400',
}

const AUDIENCE_TYPE_LABELS: Record<AudienceType, string> = {
  all: 'Todos',
  individual: 'Individual',
  group: 'Grupo selecionado',
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

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

  const [tab, setTab] = useState<'all' | 'scheduled'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])


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

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (announcements ?? [])
      .filter((item) => (tab === 'scheduled' ? item.eventAt !== null : true))
      .filter((item) => {
        if (!query) return true
        return item.title.toLowerCase().includes(query) || item.message.toLowerCase().includes(query)
      })
  }, [announcements, tab, search])

  const totalPages = Math.max(1, Math.ceil(filteredAnnouncements.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = filteredAnnouncements.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, filteredAnnouncements.length)
  const pageAnnouncements = filteredAnnouncements.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function handleTabChange(nextTab: 'all' | 'scheduled') {
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

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Comunicados</h2>
          <p className="mt-1 text-sm text-gray-400">{totalAnnouncements} no total</p>
          <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <MegaphoneStatIcon className="h-4 w-4 text-gray-500" />
              {totalAnnouncements} comunicados
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarStatIcon className="h-4 w-4 text-gray-500" />
              {totalScheduled} agendados
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          Novo comunicado
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
            Todos {totalAnnouncements}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('scheduled')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === 'scheduled' ? 'bg-gray-900 text-primary-400 shadow-sm' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Agendados {totalScheduled}
          </button>
        </div>

        <div className="relative w-full sm:w-auto">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Buscar comunicado..."
            className="w-full rounded-lg border border-gray-800 bg-gray-800 py-2 pl-9 pr-3 text-sm focus:border-gray-600 focus:outline-none sm:w-64"
          />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-gray-800 bg-gray-900">
        {loadError && (
          <div className="flex items-center justify-between p-4 text-sm text-red-400">
            {loadError}
            <button type="button" onClick={loadAnnouncements} className="font-medium underline">
              Tentar novamente
            </button>
          </div>
        )}

        {!loadError && announcements === null && <p className="p-6 text-sm text-gray-500">Carregando...</p>}

        {!loadError && announcements !== null && (
          <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">Comunicado</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Data vinculada</th>
                <th className="px-4 py-3 font-medium">Destinatários</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageAnnouncements.map((announcement) => (
                <tr key={announcement.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-100">{announcement.title}</p>
                      <p className="truncate text-xs text-gray-400">{announcement.message}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className={`h-1.5 w-1.5 rounded-full ${ANNOUNCEMENT_TYPE_DOT_COLORS[announcement.type]}`} />
                      <span className={ANNOUNCEMENT_TYPE_TEXT_COLORS[announcement.type]}>
                        {ANNOUNCEMENT_TYPE_LABELS[announcement.type]}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {announcement.eventAt ? formatEventDate(announcement.eventAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{audienceLabel(announcement)}</td>
                  <td className="px-4 py-3">
                    <ActionMenu
                      items={[
                        { label: 'Editar', onClick: () => openEditModal(announcement) },
                        { label: 'Excluir', onClick: () => handleDelete(announcement), danger: true },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {pageAnnouncements.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    Nenhum comunicado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}

        {!loadError && announcements !== null && (
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
              {pageStart}-{pageEnd} de {filteredAnnouncements.length} itens
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
        title={editingAnnouncement ? 'Editar comunicado' : 'Novo comunicado'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="announcement-title" className="text-sm font-medium text-gray-300">
              Título
            </label>
            <input
              id="announcement-title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="announcement-message" className="text-sm font-medium text-gray-300">
              Mensagem
            </label>
            <textarea
              id="announcement-message"
              rows={3}
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="announcement-type" className="text-sm font-medium text-gray-300">
              Tipo
            </label>
            <select
              id="announcement-type"
              value={announcementType}
              onChange={(event) => setAnnouncementType(event.target.value as AnnouncementType)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {(Object.keys(ANNOUNCEMENT_TYPE_LABELS) as AnnouncementType[]).map((option) => (
                <option key={option} value={option}>
                  {ANNOUNCEMENT_TYPE_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-800/60 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <input
                type="checkbox"
                checked={hasEventDate}
                onChange={(event) => setHasEventDate(event.target.checked)}
                className="h-4 w-4 rounded border-gray-700 accent-primary-600"
              />
              Vincular a uma data no calendário
            </label>

            {hasEventDate && (
              <input
                type="date"
                required
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            )}
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
                        name={audienceType === 'individual' ? 'announcement-individual' : undefined}
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
    </div>
  )
}
