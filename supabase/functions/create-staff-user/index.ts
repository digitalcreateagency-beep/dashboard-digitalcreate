import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { full_name, email, password } = await req.json()

    if (!full_name || !email || !password) {
      return new Response(JSON.stringify({ error: 'Nome, e-mail e senha são obrigatórios.' }), { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Cria o usuário no Auth
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authErr) {
      return new Response(JSON.stringify({ error: authErr.message }), { status: 400, headers: corsHeaders })
    }

    const userId = authData.user.id

    // Cria o perfil com role 'staff'
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: userId,
      full_name,
      email,
      role: 'staff',
      is_active: true,
    })

    if (profileErr) {
      // Rollback: remove o auth user se o perfil falhar
      await supabase.auth.admin.deleteUser(userId)
      return new Response(JSON.stringify({ error: profileErr.message }), { status: 400, headers: corsHeaders })
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders })
  }
})
