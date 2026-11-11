import { createClient } from 'jsr:@supabase/supabase-js@2'
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const JETTAX_BASE_URL = 'https://morfeu.jettax360.com.br'
const JETTAX_TIMEOUT_MS = 60_000
const FILE_TIMEOUT_MS = 30_000
const SYNC_BUDGET_MS = 60_000
const SYNC_WINDOW_MONTHS = 3
const DOWNLOAD_CONCURRENCY = 5
const DOCUMENTS_BUCKET = 'fiscal-documents'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type DocUnit = 'nfse' | 'nfe_sales' | 'nfe_purchases' | 'cte_sales'

type JettaxClient = {
  id: string
  cnpj: string
  razaoSocial: string
  servico?: boolean
  comercio?: { NFeSaida?: boolean; NFeEntrada?: boolean; CTe?: boolean }
}

type JettaxPage<T> = {
  data: T[]
  meta: { pagination: { current_page?: number; total_pages?: number; proximoId?: string | null } }
}

type NfseInvoice = {
  id: string
  numero: number | string
  dataEmissao: string
  tipoNota: string
  notaSituacao: string
  servico?: { valores?: { valorServicos?: number } }
  prestadorServico?: { razaoSocial?: string }
  tomadorServico?: { razaoSocial?: string }
  url?: string
  urlPDF?: string
}

type NfeInvoice = {
  id: string
  chave: string
  dataEmissao: string
  valor: string
  status: string
  xml?: string
}

type FiscalDocument = {
  kind: 'nfse' | 'nfe' | 'cte'
  direction: 'emitida' | 'recebida' | null
  jettax_id: string
  number: string | null
  access_key: string | null
  issued_at: string | null
  amount: number | null
  status: string | null
  counterpart_name: string | null
  xmlUrl?: string
  pdfUrl?: string
}

type SyncState = {
  client_id: string
  doc_type: DocUnit
  cursor: string | null
  clients: { cnpj: string }
}

const NFE_UNITS: Record<Exclude<DocUnit, 'nfse'>, { path: string; kind: 'nfe' | 'cte'; direction: 'emitida' | 'recebida' }> = {
  nfe_sales: { path: 'nfes/{cnpj}/sales', kind: 'nfe', direction: 'emitida' },
  nfe_purchases: { path: 'nfes/{cnpj}/purchases', kind: 'nfe', direction: 'recebida' },
  cte_sales: { path: 'ctes/{cnpj}/sales', kind: 'cte', direction: 'emitida' },
}

async function jettaxGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${JETTAX_BASE_URL}${path}`, {
    headers: { Authorization: token, Accept: 'application/json' },
    signal: AbortSignal.timeout(JETTAX_TIMEOUT_MS),
  })
  if (!res.ok) {
    throw new Error(`Jettax ${path.split('?')[0]} respondeu ${res.status}`)
  }
  return await res.json() as T
}

async function fetchAllJettaxClients(token: string): Promise<JettaxClient[]> {
  const clients: JettaxClient[] = []
  let page = 1
  let totalPages = 1
  do {
    const body = await jettaxGet<JettaxPage<JettaxClient>>(`/api/clients?page=${page}`, token)
    clients.push(...body.data)
    totalPages = body.meta.pagination.total_pages ?? 1
    page++
  } while (page <= totalPages)
  return clients
}

function docUnitsFor(client: JettaxClient): DocUnit[] {
  const units: DocUnit[] = []
  if (client.servico) units.push('nfse')
  if (client.comercio?.NFeSaida) units.push('nfe_sales')
  if (client.comercio?.NFeEntrada) units.push('nfe_purchases')
  if (client.comercio?.CTe) units.push('cte_sales')
  return units
}

async function isAdminCaller(authHeader: string, supabaseUrl: string, anonKey: string) {
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data, error } = await callerClient.rpc('is_admin')
  return !error && data === true
}

async function isValidCronSecret(adminClient: SupabaseClient, secret: string) {
  const { data, error } = await adminClient.rpc('is_valid_jettax_cron_secret', { secret })
  return !error && data === true
}

async function importClients(adminClient: SupabaseClient, jettaxToken: string, dryRun: boolean) {
  const jettaxClients = await fetchAllJettaxClients(jettaxToken)

  const rows = new Map<string, { cnpj: string; razao_social: string; jettax_id: string; jettax_doc_types: DocUnit[] }>()
  let invalid = 0
  for (const c of jettaxClients) {
    const cnpj = String(c.cnpj ?? '').replace(/\D/g, '')
    if (cnpj.length !== 14 || !c.razaoSocial) {
      invalid++
      continue
    }
    rows.set(cnpj, { cnpj, razao_social: c.razaoSocial.trim(), jettax_id: String(c.id), jettax_doc_types: docUnitsFor(c) })
  }

  const { data: existing, error: existingError } = await adminClient
    .from('clients')
    .select('cnpj')
    .in('cnpj', [...rows.keys()])
  if (existingError) throw new Error(existingError.message)

  const summary = {
    total_jettax: jettaxClients.length,
    invalid,
    new: rows.size - existing.length,
    updated: existing.length,
    dry_run: dryRun,
  }
  if (dryRun) return summary

  const syncedAt = new Date().toISOString()
  const { data: saved, error: upsertError } = await adminClient
    .from('clients')
    .upsert(
      [...rows.values()].map((r) => ({ ...r, jettax_synced_at: syncedAt })),
      { onConflict: 'cnpj' },
    )
    .select('id, jettax_doc_types')
  if (upsertError) throw new Error(upsertError.message)

  const stateRows = saved.flatMap((client) =>
    (client.jettax_doc_types as DocUnit[]).map((docType) => ({ client_id: client.id, doc_type: docType })),
  )
  const { error: stateError } = await adminClient
    .from('jettax_sync_state')
    .upsert(stateRows, { onConflict: 'client_id,doc_type', ignoreDuplicates: true })
  if (stateError) throw new Error(stateError.message)

  return summary
}

type WindowMonth = { key: string; period: string; from: string; to: string }

function windowMonths(now = new Date()): WindowMonth[] {
  const today = now.toISOString().slice(0, 10)
  return Array.from({ length: SYNC_WINDOW_MONTHS }, (_, i) => {
    const offset = SYNC_WINDOW_MONTHS - 1 - i
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1))
    const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0))
    const lastDay = last.toISOString().slice(0, 10)
    return {
      key: first.toISOString().slice(0, 7),
      period: `${String(first.getUTCMonth() + 1).padStart(2, '0')}-${first.getUTCFullYear()}`,
      from: first.toISOString().slice(0, 10),
      to: lastDay < today ? lastDay : today,
    }
  })
}

type NfeCursor = { month: string; ultimoId: string | null }

function parseNfeCursor(cursor: string | null): NfeCursor | null {
  if (!cursor) return null
  try {
    const parsed = JSON.parse(cursor)
    return typeof parsed?.month === 'string' ? parsed : null
  } catch {
    return null
  }
}

function parseAmount(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : null
}

function toNfseDocument(invoice: NfseInvoice): FiscalDocument {
  const tipo = invoice.tipoNota?.toLowerCase() ?? ''
  const direction = tipo.startsWith('emit') ? 'emitida' : tipo.startsWith('receb') ? 'recebida' : null
  const counterpart = direction === 'emitida' ? invoice.tomadorServico : invoice.prestadorServico
  return {
    kind: 'nfse',
    direction,
    jettax_id: String(invoice.id),
    number: invoice.numero != null ? String(invoice.numero) : null,
    access_key: null,
    issued_at: invoice.dataEmissao || null,
    amount: parseAmount(invoice.servico?.valores?.valorServicos),
    status: invoice.notaSituacao || null,
    counterpart_name: counterpart?.razaoSocial ?? null,
    xmlUrl: invoice.url,
    pdfUrl: invoice.urlPDF,
  }
}

function toNfeDocument(invoice: NfeInvoice, kind: 'nfe' | 'cte', direction: 'emitida' | 'recebida'): FiscalDocument {
  const accessKey = invoice.chave || null
  return {
    kind,
    direction,
    jettax_id: String(invoice.id),
    number: accessKey?.length === 44 ? String(Number(accessKey.slice(25, 34))) : null,
    access_key: accessKey,
    issued_at: invoice.dataEmissao || null,
    amount: parseAmount(invoice.valor),
    status: invoice.status || null,
    counterpart_name: null,
    xmlUrl: invoice.xml,
  }
}

async function copyFile(adminClient: SupabaseClient, url: string, path: string, contentType: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(FILE_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`Download de arquivo respondeu ${res.status}`)
  const { error } = await adminClient.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, await res.arrayBuffer(), { contentType, upsert: true })
  if (error) throw new Error(error.message)
  return path
}

// Some cities' NFS-e "PDF" link points to the city hall print page (HTML, often unreachable),
// so the PDF is kept only when a real PDF can be downloaded; the XML stays mandatory.
async function copyPdfIfAvailable(adminClient: SupabaseClient, url: string, path: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FILE_TIMEOUT_MS) })
    if (!res.ok) return null
    const bytes = new Uint8Array(await res.arrayBuffer())
    const isPdf = new TextDecoder().decode(bytes.subarray(0, 5)) === '%PDF-'
    if (!isPdf) return null
    const { error } = await adminClient.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, bytes, { contentType: 'application/pdf', upsert: true })
    if (error) throw new Error(error.message)
    return path
  } catch (e) {
    if (e instanceof TypeError || (e as Error).name === 'TimeoutError') return null
    throw e
  }
}

async function withFiles(adminClient: SupabaseClient, clientId: string, doc: FiscalDocument) {
  const basePath = `${clientId}/${doc.kind}/${doc.jettax_id}`
  const [xmlPath, pdfPath] = await Promise.all([
    doc.xmlUrl ? copyFile(adminClient, doc.xmlUrl, `${basePath}.xml`, 'application/xml') : null,
    doc.pdfUrl ? copyPdfIfAvailable(adminClient, doc.pdfUrl, `${basePath}.pdf`) : null,
  ])
  return { xml_path: xmlPath, pdf_path: pdfPath }
}

function toRow(clientId: string, { xmlUrl: _xmlUrl, pdfUrl: _pdfUrl, ...doc }: FiscalDocument) {
  return { client_id: clientId, ...doc }
}

async function saveDocuments(adminClient: SupabaseClient, clientId: string, docs: FiscalDocument[]) {
  if (docs.length === 0) return 0
  const kind = docs[0].kind

  const { data: existing, error: existingError } = await adminClient
    .from('fiscal_documents')
    .select('jettax_id')
    .eq('kind', kind)
    .in('jettax_id', docs.map((doc) => doc.jettax_id))
  if (existingError) throw new Error(existingError.message)

  const existingIds = new Set(existing.map((row) => row.jettax_id))
  const newDocs = docs.filter((doc) => !existingIds.has(doc.jettax_id))
  const knownDocs = docs.filter((doc) => existingIds.has(doc.jettax_id))

  if (knownDocs.length > 0) {
    const { error } = await adminClient
      .from('fiscal_documents')
      .upsert(knownDocs.map((doc) => toRow(clientId, doc)), { onConflict: 'kind,jettax_id' })
    if (error) throw new Error(error.message)
  }

  for (let i = 0; i < newDocs.length; i += DOWNLOAD_CONCURRENCY) {
    const batch = newDocs.slice(i, i + DOWNLOAD_CONCURRENCY)
    const rows = await Promise.all(
      batch.map(async (doc) => ({ ...toRow(clientId, doc), ...(await withFiles(adminClient, clientId, doc)) })),
    )
    const { error } = await adminClient
      .from('fiscal_documents')
      .upsert(rows, { onConflict: 'kind,jettax_id', ignoreDuplicates: true })
    if (error) throw new Error(error.message)
  }

  return newDocs.length
}

async function syncNfse(adminClient: SupabaseClient, token: string, state: SyncState) {
  let saved = 0
  for (const { period } of windowMonths()) {
    let page = 1
    let totalPages = 1
    do {
      const body = await jettaxGet<JettaxPage<NfseInvoice>>(
        `/api/nfse/invoices/${state.clients.cnpj}?period=${period}&page=${page}`,
        token,
      )
      saved += await saveDocuments(adminClient, state.client_id, body.data.map(toNfseDocument))
      totalPages = body.meta.pagination.total_pages ?? 1
      page++
    } while (page <= totalPages)
  }
  return { saved }
}

async function saveNfeCursor(adminClient: SupabaseClient, state: SyncState, cursor: NfeCursor | null) {
  const { error } = await adminClient
    .from('jettax_sync_state')
    .update({ cursor: cursor ? JSON.stringify(cursor) : null })
    .eq('client_id', state.client_id)
    .eq('doc_type', state.doc_type)
  if (error) throw new Error(error.message)
}

// The NF-e/CT-e API only accepts date ranges within one month, so the window is scanned month by month.
// The cursor records where a run stopped so the next run resumes there.
async function syncNfe(adminClient: SupabaseClient, token: string, state: SyncState, deadline: number) {
  const unit = NFE_UNITS[state.doc_type as Exclude<DocUnit, 'nfse'>]
  const basePath = `/api/${unit.path.replace('{cnpj}', state.clients.cnpj)}`
  const months = windowMonths()
  const resumeFrom = parseNfeCursor(state.cursor)
  const startIndex = Math.max(0, months.findIndex((month) => month.key === resumeFrom?.month))
  let saved = 0

  for (let i = startIndex; i < months.length; i++) {
    const month = months[i]
    let ultimoId = i === startIndex && resumeFrom?.month === month.key ? resumeFrom.ultimoId : null

    do {
      const query = new URLSearchParams({ dataInicial: month.from, dataFinal: month.to })
      if (ultimoId) query.set('ultimoId', ultimoId)
      const body = await jettaxGet<JettaxPage<NfeInvoice>>(`${basePath}?${query}`, token)
      saved += await saveDocuments(
        adminClient,
        state.client_id,
        body.data.map((invoice) => toNfeDocument(invoice, unit.kind, unit.direction)),
      )
      ultimoId = body.meta.pagination.proximoId ?? null

      if (Date.now() > deadline) {
        const next = ultimoId ? { month: month.key, ultimoId } : months[i + 1] ? { month: months[i + 1].key, ultimoId: null } : null
        await saveNfeCursor(adminClient, state, next)
        return { saved }
      }
    } while (ultimoId)
  }

  await saveNfeCursor(adminClient, state, null)
  return { saved }
}

async function syncDocuments(adminClient: SupabaseClient, jettaxToken: string, clientId?: string) {
  const deadline = Date.now() + SYNC_BUDGET_MS
  let query = adminClient
    .from('jettax_sync_state')
    .select('client_id, doc_type, cursor, clients(cnpj)')
    .order('last_run_at', { ascending: true, nullsFirst: true })
    .limit(50)
  if (clientId) query = query.eq('client_id', clientId)
  const { data: states, error } = await query
  if (error) throw new Error(error.message)

  const summary = { units: 0, documents_new: 0, errors: 0 }
  for (const state of states as unknown as SyncState[]) {
    if (Date.now() > deadline) break
    summary.units++

    const startedAt = new Date().toISOString()
    try {
      const result = state.doc_type === 'nfse'
        ? await syncNfse(adminClient, jettaxToken, state)
        : await syncNfe(adminClient, jettaxToken, state, deadline)
      summary.documents_new += result.saved
      await adminClient
        .from('jettax_sync_state')
        .update({ last_run_at: startedAt, last_success_at: new Date().toISOString(), last_error: null })
        .eq('client_id', state.client_id)
        .eq('doc_type', state.doc_type)
    } catch (e) {
      summary.errors++
      await adminClient
        .from('jettax_sync_state')
        .update({ last_run_at: startedAt, last_error: (e as Error).message })
        .eq('client_id', state.client_id)
        .eq('doc_type', state.doc_type)
    }
  }
  return summary
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  const cronSecret = req.headers.get('x-cron-secret')
  if (!authHeader && !cronSecret) {
    return jsonResponse({ error: 'Não autenticado' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const jettaxToken = Deno.env.get('JETTAX_API_TOKEN')
  if (!jettaxToken) {
    return jsonResponse({ error: 'JETTAX_API_TOKEN não configurado' }, 500)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const authorized = cronSecret
    ? await isValidCronSecret(adminClient, cronSecret)
    : await isAdminCaller(authHeader!, supabaseUrl, anonKey)
  if (!authorized) {
    return jsonResponse({ error: 'Acesso negado' }, 403)
  }

  const { action, dry_run: dryRun = true, client_id: clientId } = await req.json().catch(() => ({}))
  if (clientId !== undefined && typeof clientId !== 'string') {
    return jsonResponse({ error: 'client_id inválido' }, 400)
  }
  try {
    if (action === 'import_clients') {
      return jsonResponse(await importClients(adminClient, jettaxToken, dryRun !== false), 200)
    }
    if (action === 'sync_documents') {
      return jsonResponse(await syncDocuments(adminClient, jettaxToken, clientId), 200)
    }
    return jsonResponse({ error: 'Ação inválida' }, 400)
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 502)
  }
})
