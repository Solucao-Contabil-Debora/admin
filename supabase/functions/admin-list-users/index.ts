import { createClient } from 'jsr:@supabase/supabase-js@2'

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

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: isAdmin, error: isAdminError } = await callerClient.rpc('is_admin')
  if (isAdminError || !isAdmin) {
    return jsonResponse({ error: 'Acesso negado' }, 403)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: adminIds, error: adminIdsError } = await adminClient.rpc('list_admin_ids')
  if (adminIdsError) {
    return jsonResponse({ error: adminIdsError.message }, 400)
  }
  const adminIdSet = new Set(adminIds as string[])

  const users = []
  let page = 1
  const perPage = 1000
  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) {
      return jsonResponse({ error: error.message }, 400)
    }
    for (const user of data.users) {
      users.push({
        id: user.id,
        email: user.email ?? '',
        name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          null,
        createdAt: user.created_at,
        isAdmin: adminIdSet.has(user.id),
      })
    }
    if (data.users.length < perPage) break
    page += 1
  }

  return jsonResponse({ users }, 200)
})
