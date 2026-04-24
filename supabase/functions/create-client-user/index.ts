import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { client_id, email, password, full_name } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Cria o usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: 'client' }
  })

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const userId = authData.user.id

  // Cria o perfil
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    role: 'client',
    full_name,
    email,
    is_active: true
  })

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Vincula o usuário ao cliente
  const { error: clientError } = await supabase
    .from('clients')
    .update({ user_id: userId })
    .eq('id', client_id)

  if (clientError) {
    return new Response(JSON.stringify({ error: clientError.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ success: true, user_id: userId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
