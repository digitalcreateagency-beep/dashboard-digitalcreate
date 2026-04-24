import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { client_id, messages, date_range = 30 } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Dados do cliente
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single()

    // Métricas do período
    const since = new Date()
    since.setDate(since.getDate() - date_range)
    const sinceStr = since.toISOString().split('T')[0]

    const { data: metrics } = await supabase
      .from('metrics_cache')
      .select('*')
      .eq('client_id', client_id)
      .gte('date', sinceStr)
      .order('date', { ascending: true })

    const rows = metrics || []

    // Separa por plataforma
    const meta   = rows.filter(m => m.platform === 'meta_ads')
    const google = rows.filter(m => m.platform === 'google_ads')
    const ig     = rows.filter(m => m.platform === 'instagram')
    const fb     = rows.filter(m => m.platform === 'facebook_page')

    type Acc = { spend: number; clicks: number; impressions: number; conversions: number; followers: number; likes: number; comments: number; reach: number; cpc_sum: number; ctr_sum: number; count: number }
    const zero = (): Acc => ({ spend: 0, clicks: 0, impressions: 0, conversions: 0, followers: 0, likes: 0, comments: 0, reach: 0, cpc_sum: 0, ctr_sum: 0, count: 0 })

    const agg = (arr: any[]): Acc => arr.reduce((a, m) => ({
      spend: a.spend + (m.spend || 0),
      clicks: a.clicks + (m.clicks || 0),
      impressions: a.impressions + (m.impressions || 0),
      conversions: a.conversions + (m.conversions || 0),
      followers: Math.max(a.followers, m.followers || 0),
      likes: a.likes + (m.likes || 0),
      comments: a.comments + (m.comments || 0),
      reach: a.reach + (m.reach || 0),
      cpc_sum: a.cpc_sum + (m.cpc || 0),
      ctr_sum: a.ctr_sum + (m.ctr || 0),
      count: a.count + 1,
    }), zero())

    const M = agg(meta)
    const G = agg(google)
    const I = agg(ig)
    const F = agg(fb)

    const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    const pct = (v: number) => `${v.toFixed(2)}%`
    const roas = (d: Acc) => d.spend > 0 ? ((d.conversions * 100) / d.spend).toFixed(2) : '—'
    const cpc  = (d: Acc) => d.clicks > 0 ? brl(d.spend / d.clicks) : '—'
    const ctr  = (d: Acc) => d.impressions > 0 ? pct((d.clicks / d.impressions) * 100) : '—'
    const eng  = (d: Acc) => d.followers > 0 ? pct(((d.likes + d.comments) / d.followers) * 100) : '—'

    // Últimos 7 dias detalhados por plataforma
    const last7 = rows.filter(m => m.date >= new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0])
    const dailyDetail = last7.map(m =>
      `${m.date} [${m.platform}] Invest:${brl(m.spend||0)} Cliques:${m.clicks||0} Imp:${m.impressions||0} Conv:${m.conversions||0} CTR:${pct(m.ctr||0)} CPC:${brl(m.cpc||0)}`
    ).join('\n')

    const context = `
CLIENTE: ${client?.company_name || 'Desconhecido'}
PERÍODO: últimos ${date_range} dias (${sinceStr} até hoje)
SETOR: ${client?.sector || 'não informado'} | PLANO: ${client?.plan || 'starter'}

━━━ META ADS ━━━
Investimento total: ${brl(M.spend)}
Cliques: ${M.clicks.toLocaleString()}
Impressões: ${M.impressions.toLocaleString()}
Conversões: ${M.conversions}
CPC médio: ${cpc(M)}
CTR médio: ${ctr(M)}
ROAS: ${roas(M)}
Dias com dados: ${meta.length}

━━━ GOOGLE ADS ━━━
Investimento total: ${brl(G.spend)}
Cliques: ${G.clicks.toLocaleString()}
Impressões: ${G.impressions.toLocaleString()}
Conversões: ${G.conversions}
CPC médio: ${cpc(G)}
CTR médio: ${ctr(G)}
ROAS: ${roas(G)}
Dias com dados: ${google.length}

━━━ INSTAGRAM ━━━
Seguidores (pico): ${I.followers.toLocaleString()}
Curtidas acumuladas: ${I.likes.toLocaleString()}
Comentários acumulados: ${I.comments.toLocaleString()}
Alcance acumulado: ${I.reach.toLocaleString()}
Impressões acumuladas: ${I.impressions.toLocaleString()}
Taxa de engajamento: ${eng(I)}
Dias com dados: ${ig.length}

━━━ FACEBOOK PAGE ━━━
Fãs (pico): ${F.followers.toLocaleString()}
Impressões acumuladas: ${F.impressions.toLocaleString()}
Alcance acumulado: ${F.reach.toLocaleString()}
Curtidas/Engajamento: ${F.likes.toLocaleString()}
Dias com dados: ${fb.length}

━━━ DADOS DIÁRIOS (últimos 7 dias) ━━━
${dailyDetail || 'Sem dados nos últimos 7 dias'}
`

    const systemPrompt = `Você é um analista de marketing digital sênior da agência DigitalCreate. Você tem acesso completo aos dados de campanhas e redes sociais do cliente e responde perguntas em português brasileiro com precisão e insights práticos.

Ao responder:
- Use os dados fornecidos para fundamentar cada resposta com números reais
- Compare plataformas quando relevante
- Destaque pontos de atenção e oportunidades
- Dê recomendações práticas e acionáveis
- Quando não houver dados suficientes, diga claramente
- Use formatação clara: **negrito** para dados importantes, listas com •

DADOS DISPONÍVEIS:
${context}`

    const groqKey = Deno.env.get('GROQ_API_KEY')
    if (!groqKey) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY não configurada. Adicione nas variáveis de ambiente do Edge Function.' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.6,
        max_tokens: 1500,
      }),
    })

    const groqData = await groqRes.json()

    if (groqData.error) {
      return new Response(
        JSON.stringify({ error: `Groq API: ${groqData.error.message}` }),
        { status: 400, headers: corsHeaders }
      )
    }

    const answer = groqData.choices?.[0]?.message?.content || 'Sem resposta da IA.'

    return new Response(
      JSON.stringify({ answer, usage: groqData.usage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders })
  }
})
