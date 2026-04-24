/**
 * Edge Function: fetch-google-ads-keywords
 *
 * Busca estatísticas por palavra-chave do Google Ads API (GAQL)
 * e salva em google_ads_keyword_stats.
 *
 * Body: { client_id, date_start, date_stop }
 * Ex: { client_id: "uuid", date_start: "2024-01-01", date_stop: "2024-01-31" }
 */
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
    if (!client_id) {
      return new Response(JSON.stringify({ error: 'client_id obrigatório' }), { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Busca credenciais do Google Ads
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

    // Renova o access_token
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
      return new Response(JSON.stringify({ error: `OAuth: ${tokenData.error_description || tokenData.error}` }), { status: 400, headers: corsHeaders })
    }
    const accessToken = tokenData.access_token

    // GAQL: performance por palavra-chave
    const gaqlQuery = `
      SELECT
        segments.date,
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        ad_group_criterion.quality_info.quality_score
      FROM keyword_view
      WHERE segments.date BETWEEN '${date_start}' AND '${date_stop}'
        AND campaign.status = 'ENABLED'
        AND ad_group.status = 'ENABLED'
        AND ad_group_criterion.status = 'ENABLED'
      ORDER BY metrics.conversions DESC, metrics.clicks DESC
      LIMIT 2000
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

    const rows = adsData.results || []
    let saved = 0

    for (const row of rows) {
      const date = row.segments?.date
      if (!date) continue

      const keywordText = row.adGroupCriterion?.keyword?.text
      if (!keywordText) continue

      await supabase.from('google_ads_keyword_stats').upsert({
        client_id,
        date,
        campaign_id:   row.campaign?.id?.toString() || '',
        campaign_name: row.campaign?.name || '',
        adgroup_id:    row.adGroup?.id?.toString() || '',
        adgroup_name:  row.adGroup?.name || '',
        keyword_text:  keywordText,
        match_type:    row.adGroupCriterion?.keyword?.matchType || 'BROAD',
        impressions:   row.metrics?.impressions || 0,
        clicks:        row.metrics?.clicks || 0,
        cost:          (row.metrics?.costMicros || 0) / 1_000_000,
        conversions:   row.metrics?.conversions || 0,
        conversion_value: row.metrics?.conversionsValue || 0,
        ctr:           row.metrics?.ctr || 0,
        avg_cpc:       (row.metrics?.averageCpc || 0) / 1_000_000,
        quality_score: row.adGroupCriterion?.qualityInfo?.qualityScore ?? null,
        synced_at:     new Date().toISOString(),
      }, { onConflict: 'client_id,date,campaign_id,adgroup_id,keyword_text,match_type' })

      saved++
    }

    return new Response(
      JSON.stringify({ success: true, keywords_saved: saved, total_rows: rows.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (e: any) {
    console.error('fetch-google-ads-keywords error:', e)
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders })
  }
})
