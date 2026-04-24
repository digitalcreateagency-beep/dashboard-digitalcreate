import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { client_id, date_start, date_stop } = await req.json()
    if (!client_id) return new Response(JSON.stringify({ error: 'client_id obrigatório' }), { status: 400, headers: corsHeaders })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Busca credenciais do Google Ads salvas no banco
    const { data: token, error: tokenErr } = await supabase
      .from('platform_tokens')
      .select('*')
      .eq('client_id', client_id)
      .eq('platform', 'google_ads')
      .single()

    if (tokenErr || !token) {
      return new Response(JSON.stringify({ error: 'Token Google Ads não encontrado' }), { status: 404, headers: corsHeaders })
    }

    let creds: { developerToken: string; clientId: string; clientSecret: string; refreshToken: string }
    try {
      creds = JSON.parse(token.access_token)
    } catch {
      return new Response(JSON.stringify({ error: 'Credenciais inválidas. Reconecte o Google Ads.' }), { status: 400, headers: corsHeaders })
    }

    const customerId = token.account_id.replace(/-/g, '')

    // 1. Renova o access_token usando o refresh_token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        refresh_token: creds.refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const tokenData = await tokenRes.json()
    if (tokenData.error) {
      return new Response(JSON.stringify({ error: `OAuth erro: ${tokenData.error_description || tokenData.error}` }), { status: 400, headers: corsHeaders })
    }

    const accessToken = tokenData.access_token

    // 2. Consulta Google Ads API com GAQL
    const gaqlQuery = `
      SELECT
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.cpc,
        metrics.ctr,
        metrics.average_cpm
      FROM customer
      WHERE segments.date BETWEEN '${date_start}' AND '${date_stop}'
      ORDER BY segments.date ASC
    `

    const adsRes = await fetch(
      `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': creds.developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: gaqlQuery }),
      }
    )

    const adsData = await adsRes.json()

    if (adsData.error) {
      return new Response(
        JSON.stringify({ error: `Google Ads API: ${adsData.error.message || JSON.stringify(adsData.error)}` }),
        { status: 400, headers: corsHeaders }
      )
    }

    // 3. Salva dados no metrics_cache
    const rows = adsData.results || []
    let saved = 0

    for (const row of rows) {
      const date = row.segments?.date
      if (!date) continue

      const spend = (row.metrics?.costMicros || 0) / 1_000_000
      const clicks = row.metrics?.clicks || 0
      const impressions = row.metrics?.impressions || 0
      const conversions = Math.round(row.metrics?.conversions || 0)
      const cpc = (row.metrics?.cpc || 0) / 1_000_000
      const ctr = (row.metrics?.ctr || 0) * 100
      const cpm = (row.metrics?.averageCpm || 0) / 1_000_000

      await supabase.from('metrics_cache').upsert({
        client_id,
        platform: 'google_ads',
        date,
        impressions,
        clicks,
        spend,
        conversions,
        cpc,
        cpm,
        ctr,
        raw_data: row,
        fetched_at: new Date().toISOString(),
      }, { onConflict: 'client_id,platform,date' })

      saved++
    }

    return new Response(
      JSON.stringify({ success: true, rows_saved: saved }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders })
  }
})
