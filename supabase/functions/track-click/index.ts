/**
 * Edge Function: track-click
 *
 * Recebe clique em botão WhatsApp de landing page vindo do Google Ads.
 * Armazena os dados de atribuição e redireciona para o WhatsApp.
 *
 * URL na landing page:
 *   https://[projeto].supabase.co/functions/v1/track-click
 *     ?client_id=UUID
 *     &phone=5511999999999
 *     &keyword=agencia+marketing+sp
 *     &campaign_id={campaignid}
 *     &campaign_name={utm_campaign}
 *     &adgroup_id={adgroupid}
 *     &adgroup_name={utm_content}
 *     &match_type={matchtype}
 *     &network={network}
 *     &device={device}
 *     &gclid={gclid}
 *     &landing_url=URL_ATUAL
 *
 * O usuário é redirecionado para:
 *   https://wa.me/PHONE?text=Olá! ... [TOKEN]
 *
 * Quando a mensagem chega no webhook do WhatsApp, o token é detectado
 * e o lead é vinculado à palavra-chave/campanha/grupo de anúncios.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let token = 'TK'
  for (let i = 0; i < 7; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

serve(async (req) => {
  // Permite chamadas cross-origin (landing pages externas)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      }
    })
  }

  const url = new URL(req.url)
  const p = (key: string) => url.searchParams.get(key) || ''

  const clientId    = p('client_id')
  const phone       = p('phone')           // número de destino (ex: 5511999999999)
  const keyword     = p('keyword')
  const campaignId  = p('campaign_id')
  const campaignName = p('campaign_name')
  const adgroupId   = p('adgroup_id')
  const adgroupName = p('adgroup_name')
  const matchType   = p('match_type')
  const network     = p('network')
  const device      = p('device')
  const gclid       = p('gclid')
  const landingUrl  = p('landing_url')

  if (!clientId || !phone) {
    return new Response('Parâmetros client_id e phone são obrigatórios.', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const trackingToken = generateToken()

  try {
    await supabase.from('google_ads_clicks').insert({
      client_id:         clientId,
      tracking_token:    trackingToken,
      gclid:             gclid || null,
      keyword:           keyword || null,
      match_type:        matchType || null,
      campaign_id:       campaignId || null,
      campaign_name:     campaignName || null,
      adgroup_id:        adgroupId || null,
      adgroup_name:      adgroupName || null,
      network:           network || null,
      device:            device || null,
      landing_url:       landingUrl || null,
      destination_phone: phone,
      clicked_at:        new Date().toISOString(),
    })
  } catch (e) {
    console.error('track-click insert error:', e)
    // Ainda redireciona mesmo se a inserção falhar
  }

  // Monta a mensagem pré-preenchida com o token de rastreamento
  const cleanPhone = phone.replace(/\D/g, '')
  const msgText = `Olá! Tenho interesse e gostaria de mais informações. [${trackingToken}]`
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msgText)}`

  return Response.redirect(waUrl, 302)
})
