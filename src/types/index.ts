export type Role = 'owner' | 'staff' | 'client'

export interface Profile {
  id: string
  role: Role
  full_name: string
  company_name: string
  email: string
  avatar_url?: string
  is_active: boolean
}

export interface Client {
  id: string
  owner_id: string
  user_id?: string
  company_name: string
  logo_url?: string
  is_active: boolean
  can_see_meta_ads: boolean
  can_see_google_ads: boolean
  can_see_instagram: boolean
  can_see_facebook_page: boolean
  created_at: string
  // Tags de segmentação
  sector?: string
  plan?: string
  client_status?: string
}

export type SectorKey = 'e-commerce' | 'saude' | 'educacao' | 'imobiliario' | 'servicos' | 'tecnologia' | 'outro'
export type PlanKey = 'starter' | 'pro' | 'enterprise'
export type ClientStatusKey = 'ativo' | 'atencao' | 'inativo'

export type Platform = 'meta_ads' | 'google_ads' | 'instagram' | 'facebook_page'

export interface PlatformToken {
  id: string
  client_id: string
  platform: Platform
  access_token?: string
  account_id?: string
  page_id?: string
  is_connected: boolean
}

export interface MetricRow {
  id: string
  client_id: string
  platform: Platform
  date: string
  impressions: number
  clicks: number
  spend: number
  reach: number
  conversions: number
  cpc: number
  cpm: number
  ctr: number
  roas: number
}

export interface DashboardMetrics {
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  avgCpc: number
  avgCtr: number
  avgRoas: number
  spendDelta: number
  clicksDelta: number
  convDelta: number
}

export type DateRange = '7d' | '14d' | '30d' | '90d' | 'custom'

export interface AdInsight {
  id: string
  client_id: string
  platform: string
  date: string
  campaign_id: string
  campaign_name: string
  adset_id: string
  adset_name: string
  ad_id: string
  ad_name: string
  impressions: number
  clicks: number
  spend: number
  wa_conversations: number
  wa_replies: number
  wa_views: number
  conversions: number
}

export interface GoogleAdsKeyword {
  id: string
  client_id: string
  date: string
  campaign_id: string
  campaign_name: string
  adgroup_id: string
  adgroup_name: string
  keyword_text: string
  match_type: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  conversion_value: number
  ctr: number
  avg_cpc: number
  quality_score: number | null
}

export interface GoogleAdsClick {
  id: string
  client_id: string
  tracking_token: string
  gclid: string | null
  keyword: string | null
  match_type: string | null
  campaign_id: string | null
  campaign_name: string | null
  adgroup_id: string | null
  adgroup_name: string | null
  network: string | null
  device: string | null
  landing_url: string | null
  destination_phone: string | null
  clicked_at: string
  wa_id: string | null
  contact_name: string | null
  message_body: string | null
  matched_at: string | null
}

export interface WhatsAppLead {
  id: string
  client_id: string
  wa_id: string
  contact_name: string | null
  campaign_id: string | null
  campaign_name: string | null
  adset_id: string | null
  adset_name: string | null
  ad_id: string | null
  ad_name: string | null
  ctwa_clid: string | null
  source_type: string
  message_body: string | null
  received_at: string
}
