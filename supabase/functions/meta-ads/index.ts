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
    .eq('platform', 'meta_ads')
    .single()

  if (!tokenRow?.access_token) {
    return new Response(JSON.stringify({ error: 'Token não encontrado' }), { status: 400 })
  }

  const fields = 'impressions,clicks,spend,reach,actions,cpc,cpm,ctr'
  const url = `https://graph.facebook.com/v19.0/${tokenRow.account_id}/insights?fields=${fields}&time_range={"since":"${date_start}","until":"${date_stop}"}&access_token=${tokenRow.access_token}`

  const response = await fetch(url)
  const data = await response.json()

  if (data.data) {
    for (const row of data.data) {
      const conversions = row.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0
      await supabase.from('metrics_cache').upsert({
        client_id,
        platform: 'meta_ads',
        date: row.date_start,
        impressions: parseInt(row.impressions || 0),
        clicks: parseInt(row.clicks || 0),
        spend: parseFloat(row.spend || 0),
        reach: parseInt(row.reach || 0),
        conversions: parseInt(conversions),
        cpc: parseFloat(row.cpc || 0),
        cpm: parseFloat(row.cpm || 0),
        ctr: parseFloat(row.ctr || 0),
        raw_data: row,
        fetched_at: new Date().toISOString()
      }, { onConflict: 'client_id,platform,date' })
    }
  }

  return new Response(JSON.stringify({ success: true, rows: data.data?.length || 0 }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
