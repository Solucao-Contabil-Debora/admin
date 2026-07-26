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

  const { email, password } = await req.json()
  if (!email || !password) {
    return jsonResponse({ error: 'E-mail e senha são obrigatórios' }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    return jsonResponse({ error: error.message }, 400)
  }

  return jsonResponse({ user: { id: data.user.id, email: data.user.email } }, 200)
})
