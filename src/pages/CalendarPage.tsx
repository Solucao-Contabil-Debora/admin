import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { displayNameFromEmail } from '../lib/displayName'
import { extractErrorMessage } from '../lib/functionErrors'
import { Dialog } from '../components/Dialog'
import { ActionMenu } from '../components/ActionMenu'
import { Bell, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Checkbox } from '../components/ui/checkbox'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { CrudActionBarV2, CrudPageCard } from '../components/crud'
import type { CrudFilterDef } from '../components/crud'
import { usePageMetadata } from '../contexts/PageMetadataContext'

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
  alerta: 'bg-destructive',
  informativo: 'bg-primary',
  urgente: 'bg-warning',
}

const NOTE_TYPE_CHIP_CLASSES: Record<NoteType, string> = {
  alerta: 'border-destructive bg-destructive/10',
  informativo: 'border-primary bg-primary/10',
  urgente: 'border-warning bg-warning/10',
}

const NOTE_TYPE_BADGE_VARIANTS: Record<NoteType, 'danger' | 'info' | 'warning'> = {
  alerta: 'danger',
  informativo: 'info',
  urgente: 'warning',
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
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()))
  const [notes, setNotes] = useState<CalendarNote[] | null>(null)
  const [notesError, setNotesError] = useState<string | null>(null)

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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

  usePageMetadata({
    title: 'Calendário',
    subtitle: `${totalNotesThisMonth} notas neste mês · ${notesWithNotification} com notificação`,
  })

  function handleSelectClient(client: ClientOption | null) {
    setSelectedClient(client)
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

  const clientFilterDefs: CrudFilterDef[] = [
    {
      key: 'client',
      label: 'Cliente',
      options: (clients ?? []).map((client) => ({
        value: client.id,
        label: client.name ?? displayNameFromEmail(client.email),
      })),
      value: selectedClient?.id ?? null,
      onChange: (clientId) => handleSelectClient(clients?.find((client) => client.id === clientId) ?? null),
      defaultVisible: true,
    },
  ]

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
    <div className="h-full">
      <CrudPageCard
        actionBar={
          <CrudActionBarV2
            className="border-b-0 bg-muted"
            filters={clientFilterDefs}
            onNew={() => openCreateModal(selectedDate ?? new Date())}
            newButtonLabel="Nova nota"
            newButtonIcon={Plus}
          />
        }
        contentClassName="flex flex-col overflow-hidden bg-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="min-w-36 text-base font-semibold text-foreground">
              {MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Mês anterior"
              onClick={() => setViewMonth((month) => addMonths(month, -1))}
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Próximo mês"
              onClick={() => setViewMonth((month) => addMonths(month, 1))}
            >
              <ChevronRight />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setViewMonth(startOfMonth(new Date()))}>
              Hoje
            </Button>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {(Object.keys(NOTE_TYPE_LABELS) as NoteType[]).map((type) => (
              <span key={type} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${NOTE_TYPE_DOT_COLORS[type]}`} />
                {NOTE_TYPE_LABELS[type]}
              </span>
            ))}
          </div>
        </div>

        {(clientsError || notesError) && (
          <div className="flex items-center justify-between gap-3 border-b px-4 py-2 text-sm text-destructive">
            {clientsError ?? notesError}
            <Button type="button" variant="link" size="sm" onClick={clientsError ? loadClients : loadNotes}>
              Tentar novamente
            </Button>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col max-lg:overflow-y-auto lg:flex-row">
          <div className="flex min-h-[26rem] min-w-0 flex-1 flex-col lg:min-h-0">
            <div className="grid shrink-0 grid-cols-7 border-b bg-muted/50 text-xs">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="px-2 py-2 text-center font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 overflow-y-auto">
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
                    className={`flex min-h-20 cursor-pointer flex-col items-stretch gap-1 border-b border-r p-1.5 text-left transition-colors hover:bg-muted/60 ${
                      isCurrentMonth ? 'bg-card text-foreground' : 'bg-muted/30 text-muted-foreground/60'
                    } ${isSelected ? 'bg-primary/5 ring-2 ring-inset ring-primary' : ''}`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                        isToday ? 'bg-primary text-primary-foreground' : ''
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    <div className="hidden min-w-0 flex-col gap-0.5 md:flex">
                      {dayNotes.slice(0, dayNotes.length > 2 ? 1 : 2).map((note) => (
                        <span
                          key={note.id}
                          title={note.title}
                          className={`truncate rounded-sm border-l-2 px-1.5 py-0.5 text-[11px] font-medium text-foreground ${NOTE_TYPE_CHIP_CLASSES[note.type]}`}
                        >
                          {formatTime(new Date(note.eventAt))} {note.title}
                        </span>
                      ))}
                      {dayNotes.length > 2 && (
                        <span className="px-1.5 text-[11px] font-medium text-muted-foreground">
                          +{dayNotes.length - 1} notas
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 md:hidden">
                      {dayNotes.slice(0, 3).map((note) => (
                        <span key={note.id} className={`h-1.5 w-1.5 rounded-full ${NOTE_TYPE_DOT_COLORS[note.type]}`} />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedDate && (
            <aside className="flex w-full shrink-0 flex-col border-t bg-card lg:w-80 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">{formatDayLabel(selectedDate)}</h3>
                <Button
                  type="button"
                  variant="subtle"
                  size="icon-sm"
                  aria-label="Fechar painel do dia"
                  onClick={() => setSelectedDate(null)}
                >
                  <X />
                </Button>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                <Button type="button" onClick={() => openCreateModal(selectedDate)} className="w-full">
                  <Plus />
                  Nova nota
                </Button>

                {selectedDateNotes.length === 0 && (
                  <p className="pt-2 text-sm text-muted-foreground">Nenhuma nota para este dia.</p>
                )}
                {selectedDateNotes.map((note) => (
                  <div key={note.id} className={`rounded-lg border border-l-4 p-3 ${NOTE_TYPE_CHIP_CLASSES[note.type]}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={NOTE_TYPE_BADGE_VARIANTS[note.type]}>{NOTE_TYPE_LABELS[note.type]}</Badge>
                          <span className="text-xs text-muted-foreground">{formatTime(new Date(note.eventAt))}</span>
                          {note.notifyEnabled && <Bell className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-foreground">{note.title}</p>
                        {note.description && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{note.description}</p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {note.appliesToAll
                            ? 'Todos os clientes'
                            : `${note.targetClientIds.length} cliente${note.targetClientIds.length === 1 ? '' : 's'}`}
                        </p>
                      </div>
                      <ActionMenu
                        items={[
                          { label: 'Editar', onClick: () => openEditModal(note) },
                          { label: 'Excluir', onClick: () => handleDeleteNote(note), danger: true },
                        ]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </CrudPageCard>

      <Dialog
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title={editingNote ? 'Editar nota' : 'Nova nota'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveNote} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="note-title">Título</Label>
            <Input
              id="note-title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note-description">Descrição</Label>
            <textarea
              id="note-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-xs transition-colors placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:outline-none md:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="note-date">Data</Label>
              <Input
                id="note-date"
                type="date"
                required
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note-time">Hora</Label>
              <Input
                id="note-time"
                type="time"
                required
                value={eventTime}
                onChange={(event) => setEventTime(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note-type">Tipo</Label>
            <Select value={noteType} onValueChange={(value) => setNoteType(value as NoteType)}>
              <SelectTrigger id="note-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(NOTE_TYPE_LABELS) as NoteType[]).map((option) => (
                  <SelectItem key={option} value={option}>
                    {NOTE_TYPE_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 rounded-xl border bg-muted/60 p-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="note-all-clients"
                checked={allClients}
                onCheckedChange={(checked) => setAllClients(checked === true)}
              />
              <Label htmlFor="note-all-clients">Todos os clientes</Label>
            </div>

            {!allClients && (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={audienceQuery}
                  onChange={(event) => setAudienceQuery(event.target.value)}
                  placeholder="Buscar cliente..."
                />
                <div className="max-h-32 space-y-0.5 overflow-y-auto">
                  {filteredAudienceClients.length === 0 && (
                    <p className="px-2 py-1 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                  )}
                  {filteredAudienceClients.map((client) => (
                    <div key={client.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
                      <Checkbox
                        id={`audience-${client.id}`}
                        checked={audienceClientIds.includes(client.id)}
                        onCheckedChange={() => toggleAudienceClient(client.id)}
                      />
                      <Label htmlFor={`audience-${client.id}`} className="flex-1 cursor-pointer font-normal">
                        {client.name ?? displayNameFromEmail(client.email)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="note-notify"
              checked={notifyEnabled}
              onCheckedChange={(checked) => setNotifyEnabled(checked === true)}
            />
            <Label htmlFor="note-notify">Notificar</Label>
          </div>

          {notifyEnabled && (
            <div className="space-y-1.5 rounded-xl border bg-muted/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avisar</p>
              {REMINDER_OPTIONS.map((option) => (
                <div key={option.minutes} className="flex items-center gap-2">
                  <Checkbox
                    id={`note-reminder-${option.minutes}`}
                    checked={selectedOffsets.includes(option.minutes)}
                    onCheckedChange={() => toggleOffset(option.minutes)}
                  />
                  <Label htmlFor={`note-reminder-${option.minutes}`} className="font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setNoteModalOpen(false)}>
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
