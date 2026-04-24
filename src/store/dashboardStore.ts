import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Client, MetricRow, PlatformToken, DateRange, Platform, DashboardMetrics, AdInsight, WhatsAppLead, GoogleAdsKeyword, GoogleAdsClick } from '../types'
import { subDays, format } from 'date-fns'

interface DashboardState {
  clients: Client[]
  selectedClient: Client | null
  metrics: MetricRow[]
  tokens: PlatformToken[]
  adInsights: AdInsight[]
  whatsappLeads: WhatsAppLead[]
  keywordStats: GoogleAdsKeyword[]
  googleAdsClicks: GoogleAdsClick[]
  dateRange: DateRange
  activePlatforms: Platform[]
  dashboardMetrics: DashboardMetrics | null
  loading: boolean
  lastRefresh: Date | null

  setSelectedClient: (c: Client | null) => void
  setDateRange: (r: DateRange) => void
  togglePlatform: (p: Platform) => void
  loadClients: () => Promise<void>
  loadMetrics: (clientId: string) => Promise<void>
  loadTokens: (clientId: string) => Promise<void>
  refreshData: (clientId: string) => Promise<void>
  fetchSocialData: (clientId: string) => Promise<{ error?: string }>
  fetchAdInsights: (clientId: string) => Promise<{ error?: string }>
  loadAdInsights: (clientId: string) => Promise<void>
  loadWhatsAppLeads: (clientId: string) => Promise<void>
  fetchGoogleAdsKeywords: (clientId: string) => Promise<{ error?: string }>
  loadKeywordStats: (clientId: string) => Promise<void>
  loadGoogleAdsClicks: (clientId: string) => Promise<void>
  updateClientAccess: (clientId: string, field: string, value: boolean) => Promise<void>
  toggleClientActive: (clientId: string, active: boolean) => Promise<void>
  computeMetrics: () => void
  subscribeRealtime: (clientId: string) => () => void
}

const dateRangeMap: Record<DateRange, number> = {
  '7d': 7, '14d': 14, '30d': 30, '90d': 90, 'custom': 30
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  clients: [],
  selectedClient: null,
  metrics: [],
  tokens: [],
  adInsights: [],
  whatsappLeads: [],
  keywordStats: [],
  googleAdsClicks: [],
  dateRange: '30d',
  activePlatforms: ['meta_ads', 'google_ads', 'instagram', 'facebook_page'],
  dashboardMetrics: null,
  loading: false,
  lastRefresh: null,

  setSelectedClient: (c) => { set({ selectedClient: c }); if (c) get().loadMetrics(c.id) },
  setDateRange: (r) => { set({ dateRange: r }); if (get().selectedClient) get().loadMetrics(get().selectedClient!.id) },
  togglePlatform: (p) => {
    const cur = get().activePlatforms
    const next = cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p]
    set({ activePlatforms: next })
    get().computeMetrics()
  },

  loadClients: async () => {
    set({ loading: true })
    const { data } = await supabase.from('clients').select('*').order('company_name')
    set({ clients: (data || []) as Client[], loading: false })
  },

  loadMetrics: async (clientId) => {
    set({ loading: true })
    const days = dateRangeMap[get().dateRange]
    const since = format(subDays(new Date(), days), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('metrics_cache')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', since)
      .order('date')
    set({ metrics: (data || []) as MetricRow[], loading: false, lastRefresh: new Date() })
    get().computeMetrics()
  },

  loadTokens: async (clientId) => {
    const { data } = await supabase.from('platform_tokens').select('*').eq('client_id', clientId)
    set({ tokens: (data || []) as PlatformToken[] })
  },

  refreshData: async (clientId) => {
    set({ loading: true })
    const days = dateRangeMap[get().dateRange]
    const dateStop = format(new Date(), 'yyyy-MM-dd')
    const dateStart = format(subDays(new Date(), days), 'yyyy-MM-dd')

    const tokens = get().tokens
    const metaToken = tokens.find(t => t.platform === 'meta_ads' && t.is_connected)

    if (metaToken?.access_token && metaToken?.account_id) {
      try {
        const fields = 'impressions,clicks,spend,reach,actions,cpc,cpm,ctr'
        const timeRange = JSON.stringify({ since: dateStart, until: dateStop })
        const url = `https://graph.facebook.com/v19.0/${metaToken.account_id}/insights?fields=${fields}&time_range=${timeRange}&time_increment=1&level=account&access_token=${metaToken.access_token}`
        const res = await fetch(url)
        const data = await res.json()

        if (data.data) {
          for (const row of data.data) {
            const conversions = row.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0
            await supabase.from('metrics_cache').upsert({
              client_id: clientId,
              platform: 'meta_ads',
              date: row.date_start,
              impressions: parseInt(row.impressions || '0'),
              clicks: parseInt(row.clicks || '0'),
              spend: parseFloat(row.spend || '0'),
              reach: parseInt(row.reach || '0'),
              conversions: parseInt(conversions),
              cpc: parseFloat(row.cpc || '0'),
              cpm: parseFloat(row.cpm || '0'),
              ctr: parseFloat(row.ctr || '0'),
              raw_data: row,
              fetched_at: new Date().toISOString()
            }, { onConflict: 'client_id,platform,date' })
          }
        } else if (data.error) {
          console.error('Meta Ads API error:', data.error.message)
        }
      } catch (e) {
        console.error('Erro ao buscar Meta Ads:', e)
      }
    }

    // Google Ads — requer Edge Function (server-side, sem CORS)
    const googleToken = tokens.find(t => t.platform === 'google_ads' && t.is_connected)
    if (googleToken?.access_token && googleToken?.account_id) {
      try {
        const { data: fnData, error: fnErr } = await supabase.functions.invoke('fetch-google-ads', {
          body: { client_id: clientId, date_start: dateStart, date_stop: dateStop }
        })
        if (fnErr) console.error('Google Ads Edge Function erro:', fnErr)
        else if (fnData?.error) console.error('Google Ads erro:', fnData.error)
      } catch (e) {
        console.error('Erro ao chamar fetch-google-ads:', e)
      }
    }

    await get().loadMetrics(clientId)
    set({ loading: false, lastRefresh: new Date() })
  },

  fetchSocialData: async (clientId) => {
    const tokens = get().tokens
    const days = dateRangeMap[get().dateRange]
    const since = Math.floor(subDays(new Date(), days).getTime() / 1000)
    const until = Math.floor(new Date().getTime() / 1000)

    const igToken = tokens.find(t => t.platform === 'instagram' && t.is_connected)
    const fbToken = tokens.find(t => t.platform === 'facebook_page' && t.is_connected)

    let errorMsg = ''

    if (igToken?.access_token && igToken?.account_id) {
      try {
        const igId = igToken.account_id.replace('act_', '')
        const infoUrl = `https://graph.facebook.com/v19.0/${igId}?fields=followers_count,follows_count,media_count&access_token=${igToken.access_token}`
        const infoRes = await fetch(infoUrl)
        const info = await infoRes.json()

        const insightUrl = `https://graph.facebook.com/v19.0/${igId}/insights?metric=follower_count,impressions,reach,profile_views,website_clicks&period=day&since=${since}&until=${until}&access_token=${igToken.access_token}`
        const insightRes = await fetch(insightUrl)
        const insights = await insightRes.json()

        if (info.error) { errorMsg = `Instagram: ${info.error.message}`; }
        else {
          const byMetric: Record<string, any[]> = {}
          for (const m of insights.data || []) byMetric[m.name] = m.values || []

          const dates = (byMetric['impressions'] || []).map((v: any) => v.end_time?.split('T')[0]).filter(Boolean)
          for (const date of dates) {
            const idx = (byMetric['impressions'] || []).findIndex((v: any) => v.end_time?.startsWith(date))
            await supabase.from('metrics_cache').upsert({
              client_id: clientId, platform: 'instagram', date,
              followers: info.followers_count || 0,
              new_followers: byMetric['follower_count']?.[idx]?.value || 0,
              impressions: byMetric['impressions']?.[idx]?.value || 0,
              reach: byMetric['reach']?.[idx]?.value || 0,
              profile_views: byMetric['profile_views']?.[idx]?.value || 0,
              website_clicks: byMetric['website_clicks']?.[idx]?.value || 0,
              raw_data: { info, date },
              fetched_at: new Date().toISOString()
            }, { onConflict: 'client_id,platform,date' })
          }
        }
      } catch (e: any) { errorMsg = e.message }
    }

    if (fbToken?.access_token && fbToken?.account_id) {
      try {
        const pageId = fbToken.account_id.replace('act_', '')

        // Testa acesso básico à página primeiro
        const infoUrl = `https://graph.facebook.com/v19.0/${pageId}?fields=id,name,fan_count,followers_count&access_token=${fbToken.access_token}`
        const infoRes = await fetch(infoUrl)
        const info = await infoRes.json()

        if (info.error) {
          errorMsg += ` | Facebook: ${info.error.message} — Verifique se o token tem permissão na página e se o Page ID está correto.`
        } else {
          // Salva pelo menos os dados básicos da página de hoje
          const today = format(new Date(), 'yyyy-MM-dd')
          await supabase.from('metrics_cache').upsert({
            client_id: clientId, platform: 'facebook_page', date: today,
            followers: info.fan_count || info.followers_count || 0,
            raw_data: info,
            fetched_at: new Date().toISOString()
          }, { onConflict: 'client_id,platform,date' })

          // Tenta buscar insights (requer permissões adicionais)
          const metricsStr = 'page_fans,page_impressions,page_engaged_users,page_post_engagements,page_fan_adds_unique,page_views_total'
          const fbUrl = `https://graph.facebook.com/v19.0/${pageId}/insights?metric=${metricsStr}&period=day&since=${since}&until=${until}&access_token=${fbToken.access_token}`
          const fbRes = await fetch(fbUrl)
          const fbData = await fbRes.json()

          if (!fbData.error) {
            const byMetric: Record<string, any[]> = {}
            for (const m of fbData.data || []) byMetric[m.name] = m.values || []

            const dates = (byMetric['page_impressions'] || []).map((v: any) => v.end_time?.split('T')[0]).filter(Boolean)
            for (const date of dates) {
              const idx = (byMetric['page_impressions'] || []).findIndex((v: any) => v.end_time?.startsWith(date))
              await supabase.from('metrics_cache').upsert({
                client_id: clientId, platform: 'facebook_page', date,
                followers: info.fan_count || 0,
                new_followers: byMetric['page_fan_adds_unique']?.[idx]?.value || 0,
                impressions: byMetric['page_impressions']?.[idx]?.value || 0,
                likes: byMetric['page_post_engagements']?.[idx]?.value || 0,
                reach: byMetric['page_engaged_users']?.[idx]?.value || 0,
                profile_views: byMetric['page_views_total']?.[idx]?.value || 0,
                raw_data: { info, date },
                fetched_at: new Date().toISOString()
              }, { onConflict: 'client_id,platform,date' })
            }
          }
        }

      } catch (e: any) { errorMsg += e.message }
    }

    await get().loadMetrics(clientId)
    set({ lastRefresh: new Date() })
    return errorMsg ? { error: errorMsg } : {}
  },

  // Carrega ad_insights do Supabase
  loadAdInsights: async (clientId) => {
    const days = dateRangeMap[get().dateRange]
    const since = format(subDays(new Date(), days), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('ad_insights')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', since)
      .order('date', { ascending: false })
    set({ adInsights: (data || []) as AdInsight[] })
  },

  // Carrega leads WhatsApp do Supabase
  loadWhatsAppLeads: async (clientId) => {
    const days = dateRangeMap[get().dateRange]
    const since = format(subDays(new Date(), days), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('whatsapp_leads')
      .select('*')
      .eq('client_id', clientId)
      .gte('received_at', since)
      .order('received_at', { ascending: false })
    set({ whatsappLeads: (data || []) as WhatsAppLead[] })
  },

  // Busca métricas por ad (campanha/conjunto/criativo) + conversões WhatsApp da Meta Graph API
  fetchAdInsights: async (clientId) => {
    const tokens = get().tokens
    const metaToken = tokens.find(t => t.platform === 'meta_ads' && t.is_connected)
    if (!metaToken?.access_token || !metaToken?.account_id) return { error: 'Token Meta Ads não configurado' }

    const days = dateRangeMap[get().dateRange]
    const dateStop  = format(new Date(), 'yyyy-MM-dd')
    const dateStart = format(subDays(new Date(), days), 'yyyy-MM-dd')
    const timeRange = JSON.stringify({ since: dateStart, until: dateStop })

    const waActions = [
      'onsite_conversion.messaging_conversation_started_7d',
      'onsite_conversion.messaging_first_reply',
      'onsite_conversion.messaging_welcome_message_view',
    ].join(',')

    const fields = [
      'campaign_id', 'campaign_name',
      'adset_id', 'adset_name',
      'ad_id', 'ad_name',
      'impressions', 'clicks', 'spend', 'actions',
    ].join(',')

    try {
      const url = `https://graph.facebook.com/v19.0/${metaToken.account_id}/insights` +
        `?level=ad&fields=${fields}&time_range=${encodeURIComponent(timeRange)}` +
        `&time_increment=1&limit=500&access_token=${metaToken.access_token}`

      const res  = await fetch(url)
      const data = await res.json()

      if (data.error) return { error: data.error.message }

      const rows: any[] = data.data || []
      let saved = 0

      for (const row of rows) {
        const actions = row.actions || []
        const findAction = (type: string) =>
          parseInt(actions.find((a: any) => a.action_type === type)?.value || '0')

        await supabase.from('ad_insights').upsert({
          client_id:     clientId,
          platform:      'meta_ads',
          date:          row.date_start,
          campaign_id:   row.campaign_id,
          campaign_name: row.campaign_name,
          adset_id:      row.adset_id,
          adset_name:    row.adset_name,
          ad_id:         row.ad_id,
          ad_name:       row.ad_name,
          impressions:   parseInt(row.impressions || '0'),
          clicks:        parseInt(row.clicks || '0'),
          spend:         parseFloat(row.spend || '0'),
          wa_conversations: findAction('onsite_conversion.messaging_conversation_started_7d'),
          wa_replies:       findAction('onsite_conversion.messaging_first_reply'),
          wa_views:         findAction('onsite_conversion.messaging_welcome_message_view'),
          conversions:   actions.find((a: any) => a.action_type === 'purchase')
            ? parseInt(actions.find((a: any) => a.action_type === 'purchase').value)
            : 0,
          fetched_at: new Date().toISOString(),
        }, { onConflict: 'client_id,platform,date,ad_id' })
        saved++
      }

      await get().loadAdInsights(clientId)
      return saved === 0 ? { error: 'Nenhum dado retornado. Verifique se há campanhas ativas no período.' } : {}
    } catch (e: any) {
      return { error: e.message }
    }
  },

  // Busca palavras-chave do Google Ads via Edge Function e salva no banco
  fetchGoogleAdsKeywords: async (clientId) => {
    const days = dateRangeMap[get().dateRange]
    const dateStop  = format(new Date(), 'yyyy-MM-dd')
    const dateStart = format(subDays(new Date(), days), 'yyyy-MM-dd')
    try {
      const { data, error } = await supabase.functions.invoke('fetch-google-ads-keywords', {
        body: { client_id: clientId, date_start: dateStart, date_stop: dateStop }
      })
      if (error) return { error: error.message }
      if (data?.error) return { error: data.error }
      await get().loadKeywordStats(clientId)
      return {}
    } catch (e: any) {
      return { error: e.message }
    }
  },

  // Carrega estatísticas de palavras-chave do banco
  loadKeywordStats: async (clientId) => {
    const days = dateRangeMap[get().dateRange]
    const since = format(subDays(new Date(), days), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('google_ads_keyword_stats')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', since)
      .order('clicks', { ascending: false })
    set({ keywordStats: (data || []) as GoogleAdsKeyword[] })
  },

  // Carrega cliques rastreados em landing pages
  loadGoogleAdsClicks: async (clientId) => {
    const days = dateRangeMap[get().dateRange]
    const since = format(subDays(new Date(), days), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('google_ads_clicks')
      .select('*')
      .eq('client_id', clientId)
      .gte('clicked_at', since)
      .order('clicked_at', { ascending: false })
    set({ googleAdsClicks: (data || []) as GoogleAdsClick[] })
  },

  updateClientAccess: async (clientId, field, value) => {
    await supabase.from('clients').update({ [field]: value }).eq('id', clientId)
    await get().loadClients()
  },

  toggleClientActive: async (clientId, active) => {
    await supabase.from('clients').update({ is_active: active }).eq('id', clientId)
    await get().loadClients()
  },

  computeMetrics: () => {
    const { metrics, activePlatforms } = get()
    const filtered = metrics.filter(m => activePlatforms.includes(m.platform))
    if (!filtered.length) { set({ dashboardMetrics: null }); return }

    const totalSpend = filtered.reduce((s, m) => s + m.spend, 0)
    const totalImpressions = filtered.reduce((s, m) => s + m.impressions, 0)
    const totalClicks = filtered.reduce((s, m) => s + m.clicks, 0)
    const totalConversions = filtered.reduce((s, m) => s + m.conversions, 0)
    const avgCpc = totalClicks ? totalSpend / totalClicks : 0
    const avgCtr = totalImpressions ? (totalClicks / totalImpressions) * 100 : 0
    const avgRoas = totalSpend ? (totalConversions * 100) / totalSpend : 0

    set({
      dashboardMetrics: {
        totalSpend, totalImpressions, totalClicks, totalConversions,
        avgCpc, avgCtr, avgRoas, spendDelta: 12.4, clicksDelta: 8.1, convDelta: 22.3
      }
    })
  },

  subscribeRealtime: (clientId) => {
    const channel = supabase
      .channel(`metrics-${clientId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'metrics_cache', filter: `client_id=eq.${clientId}`
      }, () => { get().loadMetrics(clientId) })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }
}))
