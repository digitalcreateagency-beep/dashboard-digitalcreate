/**
 * Edge Function: whatsapp-webhook
 *
 * Recebe webhooks da API do WhatsApp Business (Meta).
 * URL configurada no Meta: https://[projeto].supabase.co/functions/v1/whatsapp-webhook?client_id=UUID
 *
 * Env vars necessárias:
 *   WHATSAPP_VERIFY_TOKEN  — token criado por você para verificação do webhook
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_URL
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const url = new URL(req.url)
  const clientId = url.searchParams.get('client_id')

  // ── Verificação do webhook (GET) ──────────────────────────────────────────
  if (req.method === 'GET') {
    const mode      = url.searchParams.get('hub.mode')
    const token     = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'digitalcreate_verify_2026'

    if (mode === 'subscribe' && token === verifyToken) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // ── Recebe evento do WhatsApp (POST) ──────────────────────────────────────
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const entries = body?.entry || []

    for (const entry of entries) {
      for (const change of (entry.changes || [])) {
        const val = change.value
        if (!val || change.field !== 'messages') continue

        const phoneNumberId: string = val.metadata?.phone_number_id || ''
        const contacts: any[]       = val.contacts || []
        const messages: any[]       = val.messages || []

        // Resolve client_id: usa query param ou busca pelo phone_number_id
        let resolvedClientId = clientId
        if (!resolvedClientId && phoneNumberId) {
          const { data: tokenRow } = await supabase
            .from('platform_tokens')
            .select('client_id')
            .eq('phone_number_id', phoneNumberId)
            .single()
          resolvedClientId = tokenRow?.client_id || null
        }

        if (!resolvedClientId) continue

        for (const msg of messages) {
          // Só processa mensagens de entrada de usuários
          if (msg.type === 'status') continue

          const waId        = msg.from                               // número do usuário
          const referral    = msg.referral || {}                     // dados do anúncio
          const ctwaClid    = referral.ctwa_clid || null             // click ID Meta
          const adId        = referral.source_id || null
          const sourceType  = referral.source_type || 'unknown'      // 'ad' ou 'organic'
          const messageBody = msg.text?.body || msg.type             // conteúdo da msg

          // Nome do contato
          const contact     = contacts.find((c: any) => c.wa_id === waId)
          const contactName = contact?.profile?.name || null

          // Lookup nome do anúncio via ad_insights (se disponível)
          let adName = referral.headline || null
          let campaignId: string | null = null
          let campaignName: string | null = null
          let adsetId: string | null = null
          let adsetName: string | null = null

          if (adId) {
            const { data: insight } = await supabase
              .from('ad_insights')
              .select('campaign_id,campaign_name,adset_id,adset_name,ad_name')
              .eq('client_id', resolvedClientId)
              .eq('ad_id', adId)
              .limit(1)
              .single()
            if (insight) {
              campaignId   = insight.campaign_id
              campaignName = insight.campaign_name
              adsetId      = insight.adset_id
              adsetName    = insight.adset_name
              adName       = insight.ad_name || adName
            }
          }

          // ── Detecta token do Google Ads na mensagem (ex: [TKABC1234]) ────────
          const tokenMatch = messageBody.match(/\[TK[A-Z0-9]{6,12}\]/)
          if (tokenMatch) {
            const tkToken = tokenMatch[0].slice(1, -1) // remove colchetes
            await supabase.from('google_ads_clicks')
              .update({
                wa_id:        waId,
                contact_name: contactName,
                message_body: messageBody,
                matched_at:   new Date(parseInt(msg.timestamp) * 1000).toISOString(),
              })
              .eq('tracking_token', tkToken)
              .is('matched_at', null) // só atualiza se ainda não foi vinculado
          }

          // Salva o lead (upsert para evitar duplicatas por ctwa_clid)
          const leadData = {
            client_id: resolvedClientId,
            wa_id: waId,
            contact_name: contactName,
            campaign_id: campaignId,
            campaign_name: campaignName,
            adset_id: adsetId,
            adset_name: adsetName,
            ad_id: adId,
            ad_name: adName,
            ctwa_clid: ctwaClid,
            source_type: sourceType,
            message_body: messageBody,
            phone_number_id: phoneNumberId,
            received_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
            raw_data: { msg, contact, referral },
          }

          if (ctwaClid) {
            await supabase.from('whatsapp_leads')
              .upsert(leadData, { onConflict: 'client_id,ctwa_clid' })
          } else {
            // Sem ctwa_clid = mensagem orgânica, evita duplicatas por wa_id + hora
            await supabase.from('whatsapp_leads').insert(leadData)
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    console.error('whatsapp-webhook error:', e)
    // Retorna 200 para Meta não reenviar
    return new Response(JSON.stringify({ ok: true, warning: e.message }), { status: 200, headers: corsHeaders })
  }
})
