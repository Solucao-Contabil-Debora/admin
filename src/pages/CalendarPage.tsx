import { useCallback, useEffect, useMemo, useState } from 'react'
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

function MoreIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
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

function NoteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3.5c-2.9 0-5 2.3-5 5.2v3.1c0 .6-.2 1.2-.6 1.7l-.9 1.1c-.6.8 0 1.9 1 1.9h11c1 0 1.6-1.1 1-1.9l-.9-1.1c-.4-.5-.6-1.1-.6-1.7V8.7c0-2.9-2.1-5.2-5-5.2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

type ClientOption = {
  id: string
  email: string
  name: string | null
}

type NoteType = 'alerta' | 'informativo' | 'urgente'

type CalendarNote = {
  id: string
  title: string
  description: string | null
  type: NoteType
  eventAt: string
  notifyEnabled: boolean
  appliesToAll: boolean
  targetClientIds: string[]
  reminderMinutes: number[]
}

type CalendarNoteRow = {
  id: string
  title: string
  description: string | null
  type: string
  event_at: string
  notify_enabled: boolean
  applies_to_all: boolean
  calendar_note_clients: { client_id: string }[]
  calendar_note_reminders: { offset_minutes: number }[]
}

const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  alerta: 'Alerta',
  informativo: 'Informativo',
  urgente: 'Urgente',
}

const NOTE_TYPE_DOT_COLORS: Record<NoteType, string> = {
  alerta: 'bg-red-500',
  informativo: 'bg-blue-500',
  urgente: 'bg-amber-500',
}

const NOTE_TYPE_TEXT_COLORS: Record<NoteType, string> = {
  alerta: 'text-red-600',
  informativo: 'text-blue-600',
  urgente: 'text-amber-600',
}

const REMINDER_OPTIONS = [
  { minutes: 5, label: '5 minutos antes' },
  { minutes: 30, label: '30 minutos antes' },
  { minutes: 60, label: '1 hora antes' },
  { minutes: 1440, label: '1 dia antes' },
  { minutes: 4320, label: '3 dias antes' },
  { minutes: 10080, label: '7 dias antes' },
]

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function getMonthGridDays(monthStart: Date): Date[] {
  const gridStartOffset = monthStart.getDay()
  return Array.from(
    { length: 42 },
    (_, index) => new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - gridStartOffset + index),
  )
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDayLabel(date: Date) {
  return `${date.getDate()} de ${MONTH_LABELS[date.getMonth()].toLowerCase()} de ${date.getFullYear()}`
}

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function mapNoteRow(row: CalendarNoteRow): CalendarNote {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type as NoteType,
    eventAt: row.event_at,
    notifyEnabled: row.notify_enabled,
    appliesToAll: row.applies_to_all,
    targetClientIds: row.calendar_note_clients.map((client) => client.client_id),
    reminderMinutes: row.calendar_note_reminders.map((reminder) => reminder.offset_minutes),
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

export function CalendarPage() {
  const [clients, setClients] = useState<ClientOption[] | null>(null)
  const [clientsError, setClientsError] = useState<string | null>(null)
  const [clientQuery, setClientQuery] = useState('')
  const [clientPickerOpen, setClientPickerOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()))
  const [notes, setNotes] = useState<CalendarNote[] | null>(null)
  const [notesError, setNotesError] = useState<string | null>(null)

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<CalendarNote | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('informativo')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [notifyEnabled, setNotifyEnabled] = useState(false)
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>([])
  const [allClients, setAllClients] = useState(true)
  const [audienceClientIds, setAudienceClientIds] = useState<string[]>([])
  const [audienceQuery, setAudienceQuery] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadClients() {
    setClientsError(null)
    const { data, error } = await supabase.functions.invoke('admin-list-users')
    if (error) {
      setClientsError(await extractErrorMessage(error, 'Erro ao carregar clientes'))
      return
    }
    setClients(data.users)
  }

  useEffect(() => {
    loadClients()
  }, [])

  const filteredClients = useMemo(() => filterClientsByQuery(clients ?? [], clientQuery), [clients, clientQuery])

  const filteredAudienceClients = useMemo(
    () => filterClientsByQuery(clients ?? [], audienceQuery),
    [clients, audienceQuery],
  )

  const loadNotes = useCallback(async () => {
    setNotesError(null)
    const rangeStart = viewMonth
    const rangeEnd = addMonths(viewMonth, 1)
    const { data, error } = await supabase
      .from('calendar_notes')
      .select(
        'id, title, description, type, event_at, notify_enabled, applies_to_all, calendar_note_clients(client_id), calendar_note_reminders(offset_minutes)',
      )
      .gte('event_at', rangeStart.toISOString())
      .lt('event_at', rangeEnd.toISOString())
      .order('event_at', { ascending: true })

    if (error) {
      setNotesError(error.message)
      return
    }
    setNotes((data as CalendarNoteRow[]).map(mapNoteRow))
  }, [viewMonth])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const visibleNotes = useMemo(() => {
    if (!notes) return []
    if (!selectedClient) return notes
    return notes.filter((note) => note.appliesToAll || note.targetClientIds.includes(selectedClient.id))
  }, [notes, selectedClient])

  const notesByDate = useMemo(() => {
    const map = new Map<string, CalendarNote[]>()
    for (const note of visibleNotes) {
      const key = toDateKey(new Date(note.eventAt))
      const existing = map.get(key)
      if (existing) existing.push(note)
      else map.set(key, [note])
    }
    return map
  }, [visibleNotes])

  const monthGridDays = useMemo(() => getMonthGridDays(viewMonth), [viewMonth])
  const selectedDateNotes = selectedDate ? (notesByDate.get(toDateKey(selectedDate)) ?? []) : []
  const todayKey = toDateKey(new Date())
  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : null
  const totalNotesThisMonth = visibleNotes.length
  const notesWithNotification = visibleNotes.filter((note) => note.notifyEnabled).length

  function handleSelectClient(client: ClientOption | null) {
    setSelectedClient(client)
    setClientPickerOpen(false)
    setClientQuery('')
    setSelectedDate(null)
  }

  function handleSelectDay(day: Date) {
    const key = toDateKey(day)
    setSelectedDate((current) => (current && toDateKey(current) === key ? null : day))
  }

  function toggleOffset(minutes: number) {
    setSelectedOffsets((current) =>
      current.includes(minutes) ? current.filter((value) => value !== minutes) : [...current, minutes],
    )
  }

  function toggleAudienceClient(clientId: string) {
    setAudienceClientIds((current) =>
      current.includes(clientId) ? current.filter((id) => id !== clientId) : [...current, clientId],
    )
  }

  function openCreateModal(date: Date) {
    setEditingNote(null)
    setTitle('')
    setDescription('')
    setNoteType('informativo')
    setEventDate(toDateKey(date))
    setEventTime('09:00')
    setNotifyEnabled(false)
    setSelectedOffsets([])
    setAllClients(true)
    setAudienceClientIds([])
    setAudienceQuery('')
    setFormError(null)
    setNoteModalOpen(true)
  }

  function openEditModal(note: CalendarNote) {
    const noteDate = new Date(note.eventAt)
    setEditingNote(note)
    setTitle(note.title)
    setDescription(note.description ?? '')
    setNoteType(note.type)
    setEventDate(toDateKey(noteDate))
    setEventTime(formatTime(noteDate))
    setNotifyEnabled(note.notifyEnabled)
    setSelectedOffsets(note.reminderMinutes)
    setAllClients(note.appliesToAll)
    setAudienceClientIds(note.targetClientIds)
    setAudienceQuery('')
    setFormError(null)
    setNoteModalOpen(true)
  }

  async function handleSaveNote(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (!allClients && audienceClientIds.length === 0) {
      setFormError('Selecione ao menos um cliente ou marque "Todos os clientes".')
      return
    }

    setSubmitting(true)

    const payload = {
      title,
      description: description.trim() ? description.trim() : null,
      type: noteType,
      event_at: new Date(`${eventDate}T${eventTime}`).toISOString(),
      notify_enabled: notifyEnabled,
      applies_to_all: allClients,
    }

    let noteId = editingNote?.id ?? null

    if (noteId) {
      const { error } = await supabase.from('calendar_notes').update(payload).eq('id', noteId)
      if (error) {
        setFormError(error.message)
        setSubmitting(false)
        return
      }
    } else {
      const { data, error } = await supabase.from('calendar_notes').insert(payload).select('id').single()
      if (error) {
        setFormError(error.message)
        setSubmitting(false)
        return
      }
      noteId = data.id
    }

    const { error: deleteClientsError } = await supabase.from('calendar_note_clients').delete().eq('note_id', noteId)
    if (deleteClientsError) {
      setFormError(deleteClientsError.message)
      setSubmitting(false)
      return
    }

    if (!allClients) {
      const audienceRows = audienceClientIds.map((clientId) => ({ note_id: noteId, client_id: clientId }))
      const { error: insertClientsError } = await supabase.from('calendar_note_clients').insert(audienceRows)
      if (insertClientsError) {
        setFormError(insertClientsError.message)
        setSubmitting(false)
        return
      }
    }

    const { error: deleteRemindersError } = await supabase.from('calendar_note_reminders').delete().eq('note_id', noteId)
    if (deleteRemindersError) {
      setFormError(deleteRemindersError.message)
      setSubmitting(false)
      return
    }

    if (notifyEnabled && selectedOffsets.length > 0) {
      const reminders = selectedOffsets.map((offsetMinutes) => ({ note_id: noteId, offset_minutes: offsetMinutes }))
      const { error: insertRemindersError } = await supabase.from('calendar_note_reminders').insert(reminders)
      if (insertRemindersError) {
        setFormError(insertRemindersError.message)
        setSubmitting(false)
        return
      }
    }

    setSubmitting(false)
    setNoteModalOpen(false)
    await loadNotes()
  }

  async function handleDeleteNote(note: CalendarNote) {
    if (!window.confirm(`Excluir a nota "${note.title}"?`)) return
    const { error } = await supabase.from('calendar_notes').delete().eq('id', note.id)
    if (error) {
      setNotesError(error.message)
      return
    }
    await loadNotes()
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendário</h2>
          <p className="mt-1 text-sm text-gray-500">{totalNotesThisMonth} notas neste mês</p>
          <div className="mt-3 flex items-center gap-5 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <NoteIcon className="h-4 w-4 text-blue-500" />
              {totalNotesThisMonth} notas
            </span>
            <span className="flex items-center gap-1.5">
              <BellIcon className="h-4 w-4 text-blue-500" />
              {notesWithNotification} com notificação
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal(selectedDate ?? new Date())}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          Nova nota
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setViewMonth((month) => addMonths(month, -1))}
            className="rounded-md p-1.5 text-gray-500 hover:bg-white hover:text-gray-700 hover:shadow-sm"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <span className="w-32 text-center text-sm font-medium text-gray-900">
            {MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => setViewMonth((month) => addMonths(month, 1))}
            className="rounded-md p-1.5 text-gray-500 hover:bg-white hover:text-gray-700 hover:shadow-sm"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMonth(startOfMonth(new Date()))}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Hoje
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setClientPickerOpen((value) => !value)}
              className="relative flex w-56 items-center justify-start truncate rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-left text-sm text-gray-700 hover:border-gray-300"
            >
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <span className="truncate">
                {selectedClient ? (selectedClient.name ?? displayNameFromEmail(selectedClient.email)) : 'Todos os clientes'}
              </span>
            </button>

            {clientPickerOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setClientPickerOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
                  <div className="p-2">
                    <input
                      type="text"
                      autoFocus
                      value={clientQuery}
                      onChange={(event) => setClientQuery(event.target.value)}
                      placeholder="Buscar cliente..."
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                    />
                  </div>

                  {clientsError && (
                    <div className="flex items-center justify-between px-3 pb-2 text-sm text-red-600">
                      {clientsError}
                      <button type="button" onClick={loadClients} className="font-medium underline">
                        Tentar novamente
                      </button>
                    </div>
                  )}

                  {!clientsError && clients === null && (
                    <p className="px-3 pb-2 text-sm text-gray-400">Carregando...</p>
                  )}

                  {!clientsError && clients !== null && (
                    <div className="max-h-56 overflow-y-auto border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleSelectClient(null)}
                        className="w-full px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
                      >
                        Todos os clientes
                      </button>
                      {filteredClients.length === 0 && (
                        <p className="px-3 py-2 text-sm text-gray-400">Nenhum cliente encontrado.</p>
                      )}
                      {filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleSelectClient(client)}
                          className="flex w-full flex-col items-start border-t border-gray-100 px-3 py-2 text-left hover:bg-gray-50"
                        >
                          <span className="text-sm font-medium text-gray-900">
                            {client.name ?? displayNameFromEmail(client.email)}
                          </span>
                          <span className="text-xs text-gray-500">{client.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {(Object.keys(NOTE_TYPE_LABELS) as NoteType[]).map((type) => (
            <span key={type} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${NOTE_TYPE_DOT_COLORS[type]}`} />
              {NOTE_TYPE_LABELS[type]}
            </span>
          ))}
        </div>

        {notesError && (
          <div className="mt-4 flex items-center justify-between text-sm text-red-600">
            {notesError}
            <button type="button" onClick={loadNotes} className="font-medium underline">
              Tentar novamente
            </button>
          </div>
        )}

        <div className="mt-3 flex gap-4">
          <div className="grid flex-1 grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-100 bg-gray-100 text-xs">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="bg-gray-50 px-2 py-2 text-center font-medium uppercase tracking-wide text-gray-400">
                {label}
              </div>
            ))}
            {monthGridDays.map((day) => {
              const key = toDateKey(day)
              const dayNotes = notesByDate.get(key) ?? []
              const isCurrentMonth = day.getMonth() === viewMonth.getMonth()
              const isToday = key === todayKey
              const isSelected = key === selectedDateKey
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`flex min-h-[76px] flex-col items-start gap-1 bg-white p-2 text-left hover:bg-gray-50 ${
                    isCurrentMonth ? '' : 'text-gray-300'
                  } ${isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday ? 'bg-blue-600 text-white' : ''
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {dayNotes.slice(0, 3).map((note) => (
                      <span key={note.id} className={`h-1.5 w-1.5 rounded-full ${NOTE_TYPE_DOT_COLORS[note.type]}`} />
                    ))}
                    {dayNotes.length > 3 && <span className="text-[10px] text-gray-400">+{dayNotes.length - 3}</span>}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="w-72 shrink-0 rounded-lg border border-gray-200 p-4">
            {selectedDate ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">{formatDayLabel(selectedDate)}</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="text-xs font-medium text-gray-400 hover:text-gray-600"
                  >
                    Fechar
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openCreateModal(selectedDate)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  Nova nota
                </button>

                <div className="mt-4 max-h-[26rem] space-y-2 overflow-y-auto">
                  {selectedDateNotes.length === 0 && (
                    <p className="text-sm text-gray-400">Nenhuma nota para este dia.</p>
                  )}
                  {selectedDateNotes.map((note) => (
                    <div key={note.id} className="rounded-lg border border-gray-100 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${NOTE_TYPE_DOT_COLORS[note.type]}`} />
                            <span className={`text-xs font-medium ${NOTE_TYPE_TEXT_COLORS[note.type]}`}>
                              {NOTE_TYPE_LABELS[note.type]}
                            </span>
                            <span className="text-xs text-gray-400">{formatTime(new Date(note.eventAt))}</span>
                            {note.notifyEnabled && <BellIcon className="h-3.5 w-3.5 text-gray-400" />}
                          </div>
                          <p className="mt-1 truncate text-sm font-medium text-gray-900">{note.title}</p>
                          {note.description && (
                            <p className="mt-0.5 truncate text-xs text-gray-500">{note.description}</p>
                          )}
                          <p className="mt-0.5 text-xs text-gray-400">
                            {note.appliesToAll
                              ? 'Todos os clientes'
                              : `${note.targetClientIds.length} cliente${note.targetClientIds.length === 1 ? '' : 's'}`}
                          </p>
                        </div>
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(openMenuId === note.id ? null : note.id)}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            <MoreIcon className="h-4 w-4" />
                          </button>
                          {openMenuId === note.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 z-20 mt-1 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    openEditModal(note)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    handleDeleteNote(note)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                                >
                                  Excluir
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">Selecione um dia no calendário para ver os itens programados.</p>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title={editingNote ? 'Editar nota' : 'Nova nota'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveNote} className="mt-5 space-y-4">
          <div className="space-y-1">
            <label htmlFor="note-title" className="text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              id="note-title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="note-description" className="text-sm font-medium text-gray-700">
              Descrição
            </label>
            <textarea
              id="note-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="note-date" className="text-sm font-medium text-gray-700">
                Data
              </label>
              <input
                id="note-date"
                type="date"
                required
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="note-time" className="text-sm font-medium text-gray-700">
                Hora
              </label>
              <input
                id="note-time"
                type="time"
                required
                value={eventTime}
                onChange={(event) => setEventTime(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="note-type" className="text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              id="note-type"
              value={noteType}
              onChange={(event) => setNoteType(event.target.value as NoteType)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            >
              {(Object.keys(NOTE_TYPE_LABELS) as NoteType[]).map((option) => (
                <option key={option} value={option}>
                  {NOTE_TYPE_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 rounded-md border border-gray-200 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={allClients}
                onChange={(event) => setAllClients(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Todos os clientes
            </label>

            {!allClients && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={audienceQuery}
                  onChange={(event) => setAudienceQuery(event.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                />
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {filteredAudienceClients.length === 0 && (
                    <p className="text-sm text-gray-400">Nenhum cliente encontrado.</p>
                  )}
                  {filteredAudienceClients.map((client) => (
                    <label key={client.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={audienceClientIds.includes(client.id)}
                        onChange={() => toggleAudienceClient(client.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      {client.name ?? displayNameFromEmail(client.email)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={notifyEnabled}
              onChange={(event) => setNotifyEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Notificar
          </label>

          {notifyEnabled && (
            <div className="space-y-1.5 rounded-md border border-gray-200 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Avisar</p>
              {REMINDER_OPTIONS.map((option) => (
                <label key={option.minutes} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedOffsets.includes(option.minutes)}
                    onChange={() => toggleOffset(option.minutes)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          )}

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </Dialog>
    </div>
  )
}
