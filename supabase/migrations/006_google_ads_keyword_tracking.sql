-- ─────────────────────────────────────────────────────────────────────────────
-- 006: Google Ads Keyword Tracking + Landing Page → WhatsApp Attribution
-- ─────────────────────────────────────────────────────────────────────────────

-- Estatísticas de palavras-chave vindas da API do Google Ads
CREATE TABLE IF NOT EXISTS google_ads_keyword_stats (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date           date NOT NULL,
  campaign_id    text NOT NULL,
  campaign_name  text,
  adgroup_id     text NOT NULL,
  adgroup_name   text,
  keyword_text   text NOT NULL,
  match_type     text DEFAULT 'BROAD',
  impressions    integer DEFAULT 0,
  clicks         integer DEFAULT 0,
  cost           numeric(12,2) DEFAULT 0,
  conversions    numeric(8,2) DEFAULT 0,
  conversion_value numeric(12,2) DEFAULT 0,
  ctr            numeric(10,6) DEFAULT 0,
  avg_cpc        numeric(12,2) DEFAULT 0,
  quality_score  integer,
  synced_at      timestamptz DEFAULT now(),
  UNIQUE(client_id, date, campaign_id, adgroup_id, keyword_text, match_type)
);

-- Cliques rastreados em landing pages (Google Ads → WhatsApp)
CREATE TABLE IF NOT EXISTS google_ads_clicks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tracking_token   text NOT NULL,
  gclid            text,
  keyword          text,
  match_type       text,
  campaign_id      text,
  campaign_name    text,
  adgroup_id       text,
  adgroup_name     text,
  network          text,
  device           text,
  landing_url      text,
  destination_phone text,
  clicked_at       timestamptz DEFAULT now(),
  -- Preenchido quando a mensagem chega no WhatsApp
  wa_id            text,
  contact_name     text,
  message_body     text,
  matched_at       timestamptz,
  UNIQUE(tracking_token)
);

CREATE INDEX IF NOT EXISTS idx_gak_client_date   ON google_ads_keyword_stats(client_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_gak_keyword       ON google_ads_keyword_stats(client_id, keyword_text);
CREATE INDEX IF NOT EXISTS idx_gac_client_date   ON google_ads_clicks(client_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_gac_token         ON google_ads_clicks(tracking_token);
CREATE INDEX IF NOT EXISTS idx_gac_wa_id         ON google_ads_clicks(wa_id);

ALTER TABLE google_ads_keyword_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_clicks        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_staff_gak_all" ON google_ads_keyword_stats FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','staff')));
CREATE POLICY "client_own_gak" ON google_ads_keyword_stats FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "owner_staff_gac_all" ON google_ads_clicks FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','staff')));
CREATE POLICY "client_own_gac" ON google_ads_clicks FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
