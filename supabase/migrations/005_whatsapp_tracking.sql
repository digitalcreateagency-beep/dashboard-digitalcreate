-- ═══════════════════════════════════════════════════
-- Rastreamento de conversões WhatsApp via Meta Ads
-- ═══════════════════════════════════════════════════

-- Métricas por nível de anúncio (campanha / conjunto / criativo)
CREATE TABLE IF NOT EXISTS ad_insights (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id      uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  platform       text NOT NULL DEFAULT 'meta_ads',
  date           date NOT NULL,
  campaign_id    text,
  campaign_name  text,
  adset_id       text,
  adset_name     text,
  ad_id          text,
  ad_name        text,
  impressions    bigint  DEFAULT 0,
  clicks         bigint  DEFAULT 0,
  spend          numeric DEFAULT 0,
  wa_conversations bigint DEFAULT 0,  -- onsite_conversion.messaging_conversation_started_7d
  wa_replies       bigint DEFAULT 0,  -- onsite_conversion.messaging_first_reply
  wa_views         bigint DEFAULT 0,  -- onsite_conversion.messaging_welcome_message_view
  conversions    bigint  DEFAULT 0,
  fetched_at     timestamptz DEFAULT now(),
  UNIQUE(client_id, platform, date, ad_id)
);

-- Leads gerados via WhatsApp (dados do webhook Meta/WhatsApp Business API)
CREATE TABLE IF NOT EXISTS whatsapp_leads (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id      uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  wa_id          text NOT NULL,         -- número WhatsApp (ex: 5511999999999)
  contact_name   text,                  -- nome do perfil WhatsApp
  campaign_id    text,
  campaign_name  text,
  adset_id       text,
  adset_name     text,
  ad_id          text,
  ad_name        text,
  ctwa_clid      text,                  -- click ID para atribuição Meta
  source_type    text DEFAULT 'ad',     -- 'ad' | 'organic' | 'unknown'
  message_body   text,                  -- primeira mensagem enviada
  phone_number_id text,                 -- ID do número WhatsApp Business
  received_at    timestamptz DEFAULT now(),
  raw_data       jsonb,
  UNIQUE(client_id, ctwa_clid)          -- evita duplicatas por click ID
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ad_insights_client_date ON ad_insights(client_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ad_insights_campaign    ON ad_insights(client_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_insights_ad          ON ad_insights(client_id, ad_id);
CREATE INDEX IF NOT EXISTS idx_wa_leads_client         ON whatsapp_leads(client_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_leads_campaign       ON whatsapp_leads(client_id, campaign_id);

-- RLS
ALTER TABLE ad_insights    ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_staff_ad_insights" ON ad_insights FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'staff')
  OR EXISTS (SELECT 1 FROM clients WHERE id = ad_insights.client_id AND user_id = auth.uid())
);

CREATE POLICY "owner_staff_wa_leads" ON whatsapp_leads FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'staff')
  OR EXISTS (SELECT 1 FROM clients WHERE id = whatsapp_leads.client_id AND user_id = auth.uid())
);

-- Coluna de configuração do WhatsApp no platform_tokens (phone_number_id)
ALTER TABLE platform_tokens
  ADD COLUMN IF NOT EXISTS phone_number_id text,
  ADD COLUMN IF NOT EXISTS waba_id         text;  -- WhatsApp Business Account ID
