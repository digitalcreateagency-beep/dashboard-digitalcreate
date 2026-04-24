import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { client_id, date_start, date_stop } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: tokenRow } = await supabase
    .from('platform_tokens')
    .select('*')
    .eq('client_id', client_id)
    .eq('platform', 'google_ads')
    .single()

  if (!tokenRow?.access_token) {
    return new Response(JSON.stringify({ error: 'Token não encontrado' }), { status: 400 })
  }

  let accessToken = tokenRow.access_token
  if (new Date(tokenRow.token_expires_at) < new Date()) {
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        refresh_token: tokenRow.refresh_token,
        grant_type: 'refresh_token'
      })
    })
    const refreshData = await refreshRes.json()
    accessToken = refreshData.access_token
    await supabase.from('platform_tokens').update({
      access_token: accessToken,
      token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
    }).eq('id', tokenRow.id)
  }

  const query = `
    SELECT
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.average_cpc,
      metrics.ctr
    FROM campaign
    WHERE segments.date BETWEEN '${date_start}' AND '${date_stop}'
  `

  const gaRes = await fetch(
    `https://googleads.googleapis.com/v16/customers/${tokenRow.account_id}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN')!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    }
  )

  const gaData = await gaRes.json()

  const byDate: Record<string, any> = {}
  for (const row of gaData.results || []) {
    const d = row.segments.date
    if (!byDate[d]) byDate[d] = { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
    byDate[d].impressions += row.metrics.impressions
    byDate[d].clicks += row.metrics.clicks
    byDate[d].spend += row.metrics.costMicros / 1_000_000
    byDate[d].conversions += row.metrics.conversions
    byDate[d].cpc = row.metrics.averageCpc / 1_000_000
    byDate[d].ctr = row.metrics.ctr
  }

  for (const [date, m] of Object.entries(byDate)) {
    await supabase.from('metrics_cache').upsert({
      client_id, platform: 'google_ads', date,
      impressions: m.impressions, clicks: m.clicks,
      spend: m.spend, conversions: m.conversions,
      cpc: m.cpc, ctr: m.ctr,
      fetched_at: new Date().toISOString()
    }, { onConflict: 'client_id,platform,date' })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
