import { createClient } from 'jsr:@supabase/supabase-js@2'

const JETTAX_BASE_URL = 'https://morfeu.jettax360.com.br'
const JETTAX_TIMEOUT_MS = 90_000

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

type JettaxClient = { id: string; cnpj: string; razaoSocial: string }

type JettaxPage<T> = {
  data: T[]
  meta: { pagination: { current_page: number; total_pages: number } }
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
    totalPages = body.meta.pagination.total_pages
    page++
  } while (page <= totalPages)
  return clients
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Não autenticado' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const jettaxToken = Deno.env.get('JETTAX_API_TOKEN')
  if (!jettaxToken) {
    return jsonResponse({ error: 'JETTAX_API_TOKEN não configurado' }, 500)
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: isAdmin, error: isAdminError } = await callerClient.rpc('is_admin')
  if (isAdminError || !isAdmin) {
    return jsonResponse({ error: 'Acesso negado' }, 403)
  }

  const { action, dry_run: dryRun = true } = await req.json().catch(() => ({}))
  if (action !== 'import_clients') {
    return jsonResponse({ error: 'Ação inválida' }, 400)
  }

  let jettaxClients: JettaxClient[]
  try {
    jettaxClients = await fetchAllJettaxClients(jettaxToken)
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 502)
  }

  const rows = new Map<string, { cnpj: string; razao_social: string; jettax_id: string }>()
  let invalid = 0
  for (const c of jettaxClients) {
    const cnpj = String(c.cnpj ?? '').replace(/\D/g, '')
    if (cnpj.length !== 14 || !c.razaoSocial) {
      invalid++
      continue
    }
    rows.set(cnpj, { cnpj, razao_social: c.razaoSocial.trim(), jettax_id: String(c.id) })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: existing, error: existingError } = await adminClient
    .from('clients')
    .select('cnpj')
    .in('cnpj', [...rows.keys()])
  if (existingError) {
    return jsonResponse({ error: existingError.message }, 500)
  }

  const summary = {
    total_jettax: jettaxClients.length,
    invalid,
    new: rows.size - existing.length,
    updated: existing.length,
    dry_run: dryRun !== false,
  }

  if (summary.dry_run) {
    return jsonResponse(summary, 200)
  }

  const syncedAt = new Date().toISOString()
  const { error: upsertError } = await adminClient
    .from('clients')
    .upsert(
      [...rows.values()].map((r) => ({ ...r, jettax_synced_at: syncedAt })),
      { onConflict: 'cnpj' },
    )
  if (upsertError) {
    return jsonResponse({ error: upsertError.message }, 500)
  }

  return jsonResponse(summary, 200)
})
