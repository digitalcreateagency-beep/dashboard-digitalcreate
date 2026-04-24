import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Link2, Power, Eye, EyeOff, UserPlus, MessageCircle, Search } from 'lucide-react'
import { useDashboardStore } from '../../store/dashboardStore'
import { MetricCard } from '../../components/charts/MetricCard'
import { MetricLineChart } from '../../components/charts/LineChart'
import { SocialMetrics } from '../../components/charts/SocialMetrics'
import { WhatsAppConversions } from '../../components/charts/WhatsAppConversions'
import { KeywordConversions } from '../../components/charts/KeywordConversions'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ConnectPlatformModal } from '../../components/platform/ConnectPlatformModal'
import { CreateClientAccountModal } from '../../components/platform/CreateClientAccountModal'
import type { Platform, Client } from '../../types'
import { clsx } from 'clsx'
import { format } from 'date-fns'

const PLATFORMS: { key: Platform; label: string; color: string; icon: string }[] = [
  { key: 'meta_ads', label: 'Meta Ads', color: '#1877F2', icon: 'M' },
  { key: 'google_ads', label: 'Google Ads', color: '#4285F4', icon: 'G' },
  { key: 'instagram', label: 'Instagram', color: '#E1306C', icon: '📷' },
  { key: 'facebook_page', label: 'Facebook Page', color: '#1877F2', icon: 'f' },
]

const DATE_RANGES = [
  { key: '7d', label: '7 dias' },
  { key: '14d', label: '14 dias' },
  { key: '30d', label: '30 dias' },
  { key: '90d', label: '90 dias' },
] as const

export function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    clients, metrics, tokens, dashboardMetrics, adInsights, whatsappLeads,
    keywordStats, googleAdsClicks,
    loading, lastRefresh, dateRange, activePlatforms,
    loadClients, loadMetrics, loadTokens, refreshData, fetchSocialData,
    fetchAdInsights, loadAdInsights, loadWhatsAppLeads,
    fetchGoogleAdsKeywords, loadKeywordStats, loadGoogleAdsClicks,
    setDateRange, togglePlatform, updateClientAccess, toggleClientActive,
    subscribeRealtime
  } = useDashboardStore()

  const [connectModal, setConnectModal] = useState<{ platform: Platform; label: string; color: string } | null>(null)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
  const [socialError, setSocialError] = useState('')
  const [waLoading, setWaLoading] = useState(false)
  const [waError, setWaError] = useState('')
  const [kwLoading, setKwLoading] = useState(false)
  const [kwError, setKwError] = useState('')

  const client = clients.find(c => c.id === id)

  useEffect(() => {
    loadClients()
    if (id) {
      loadMetrics(id); loadTokens(id)
      loadAdInsights(id); loadWhatsAppLeads(id)
      loadKeywordStats(id); loadGoogleAdsClicks(id)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    const unsub = subscribeRealtime(id)
    return unsub
  }, [id])

  if (!client) return (
    <div className="p-6 flex items-center justify-center h-full">
      <p className="text-[#6A6090]">Carregando cliente...</p>
    </div>
  )

  const fmtCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const fmtNum = (v: number) => v.toLocaleString('pt-BR')

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/owner/clients')}
          className="p-2 rounded-xl text-[#6A6090] hover:text-[#F0EEF8] hover:bg-[#1A1A2E] transition-all">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#F0EEF8]" style={{ fontFamily: 'Syne, sans-serif' }}>{client.company_name}</h1>
          {lastRefresh && <p className="text-xs text-[#6A6090]">Atualizado {format(lastRefresh, 'HH:mm:ss')}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleClientActive(client.id, !client.is_active)}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
              client.is_active
                ? 'text-[#00E5A0] border-[#00E5A0]/30 hover:bg-[#00E5A0]/10'
                : 'text-[#FF4D6D] border-[#FF4D6D]/30 hover:bg-[#FF4D6D]/10'
            )}>
            <Power size={12} />
            {client.is_active ? 'Ativo' : 'Bloqueado'}
          </button>
          <Button variant="secondary" size="sm" onClick={() => setShowCreateAccount(true)}>
            <UserPlus size={13} /> {client.user_id ? 'Recriar Acesso' : 'Criar Acesso Cliente'}
          </Button>
          <Button onClick={async () => { if (id) { await loadTokens(id); await refreshData(id) } }} loading={loading} size="sm">
            <RefreshCw size={13} /> Atualizar
          </Button>
        </div>
      </div>

      <Card>
        <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider mb-3">Plataformas visíveis ao cliente</p>
        <div className="flex gap-3 flex-wrap">
          {PLATFORMS.map(p => {
            const field = `can_see_${p.key}` as keyof Client
            const enabled = client[field] as boolean
            return (
              <button key={p.key}
                onClick={() => updateClientAccess(client.id, field, !enabled)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border',
                  enabled ? 'text-white border-transparent' : 'bg-transparent border-[#222240] text-[#3A3360]'
                )}
                style={enabled ? { background: p.color, boxShadow: `0 4px 14px ${p.color}40` } : {}}
              >
                {enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                {p.label}
              </button>
            )
          })}
        </div>
      </Card>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-[#12121E] border border-[#6B3FE7]/20 rounded-xl p-1 gap-1">
          {DATE_RANGES.map(r => (
            <button key={r.key} onClick={() => setDateRange(r.key)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                dateRange === r.key ? 'bg-[#6B3FE7] text-white' : 'text-[#6A6090] hover:text-[#F0EEF8]'
              )}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {PLATFORMS.map(p => (
            <button key={p.key} onClick={() => togglePlatform(p.key)}
              className={clsx('px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border',
                activePlatforms.includes(p.key)
                  ? 'text-white border-transparent'
                  : 'bg-transparent border-[#222240] text-[#3A3360]'
              )}
              style={activePlatforms.includes(p.key) ? { background: p.color } : {}}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {dashboardMetrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Investimento Total" value={fmtCurrency(dashboardMetrics.totalSpend)} delta={dashboardMetrics.spendDelta} color="purple" />
          <MetricCard label="Cliques" value={fmtNum(dashboardMetrics.totalClicks)} delta={dashboardMetrics.clicksDelta} color="cyan" />
          <MetricCard label="Impressões" value={fmtNum(dashboardMetrics.totalImpressions)} color="amber" />
          <MetricCard label="Conversões" value={fmtNum(dashboardMetrics.totalConversions)} delta={dashboardMetrics.convDelta} color="green" />
        </div>
      )}

      {!dashboardMetrics && !loading && (
        <div className="flex items-center justify-center h-32 text-[#6A6090] text-sm">
          Nenhum dado de métricas disponível para este período.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider mb-4">Investimento por plataforma</p>
          <MetricLineChart data={metrics} platforms={activePlatforms} metric="spend" />
        </Card>
        <Card>
          <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider mb-4">Cliques por plataforma</p>
          <MetricLineChart data={metrics} platforms={activePlatforms} metric="clicks" />
        </Card>
      </div>

      {/* Social Media Metrics */}
      {(tokens.some(t => t.platform === 'instagram' && t.is_connected) ||
        tokens.some(t => t.platform === 'facebook_page' && t.is_connected)) && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider">Métricas de Redes Sociais</p>
            <Button size="sm" variant="secondary" loading={socialLoading}
              onClick={async () => {
                if (!id) return
                setSocialLoading(true)
                setSocialError('')
                await loadTokens(id)
                const res = await fetchSocialData(id)
                if (res.error) setSocialError(res.error)
                setSocialLoading(false)
              }}>
              <RefreshCw size={12} /> Buscar Dados
            </Button>
          </div>
          {socialError && <p className="text-xs text-[#FF4D6D] bg-[#FF4D6D]/10 px-3 py-2 rounded-lg mb-4">{socialError}</p>}

          {tokens.some(t => t.platform === 'instagram' && t.is_connected) && (() => {
            const igMetrics = metrics.filter(m => m.platform === 'instagram')
            const total = igMetrics.reduce((acc, m) => ({
              followers: Math.max(acc.followers, (m as any).followers || 0),
              newFollowers: acc.newFollowers + ((m as any).new_followers || 0),
              likes: acc.likes + ((m as any).likes || 0),
              comments: acc.comments + ((m as any).comments || 0),
              shares: acc.shares + ((m as any).shares || 0),
              reach: acc.reach + (m.reach || 0),
              impressions: acc.impressions + (m.impressions || 0),
              profileViews: acc.profileViews + ((m as any).profile_views || 0),
              websiteClicks: acc.websiteClicks + ((m as any).website_clicks || 0),
              engagementRate: 0,
            }), { followers: 0, newFollowers: 0, likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0, profileViews: 0, websiteClicks: 0, engagementRate: 0 })
            total.engagementRate = total.followers > 0 ? ((total.likes + total.comments) / total.followers) * 100 : 0
            return (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-[#E1306C] flex items-center justify-center text-white text-[10px]">📷</div>
                  <span className="text-sm font-semibold text-[#F0EEF8]">Instagram</span>
                </div>
                <SocialMetrics platform="instagram" data={total} />
              </div>
            )
          })()}

          {tokens.some(t => t.platform === 'facebook_page' && t.is_connected) && (() => {
            const fbMetrics = metrics.filter(m => m.platform === 'facebook_page')
            const total = fbMetrics.reduce((acc, m) => ({
              followers: Math.max(acc.followers, (m as any).followers || 0),
              newFollowers: acc.newFollowers + ((m as any).new_followers || 0),
              likes: acc.likes + ((m as any).likes || 0),
              comments: acc.comments + ((m as any).comments || 0),
              shares: acc.shares + ((m as any).shares || 0),
              reach: acc.reach + (m.reach || 0),
              impressions: acc.impressions + (m.impressions || 0),
              profileViews: acc.profileViews + ((m as any).profile_views || 0),
              websiteClicks: 0,
              engagementRate: 0,
            }), { followers: 0, newFollowers: 0, likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0, profileViews: 0, websiteClicks: 0, engagementRate: 0 })
            total.engagementRate = total.followers > 0 ? ((total.likes + total.comments) / total.followers) * 100 : 0
            return (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-[#1877F2] flex items-center justify-center text-white text-[10px] font-bold">f</div>
                  <span className="text-sm font-semibold text-[#F0EEF8]">Facebook Page</span>
                </div>
                <SocialMetrics platform="facebook_page" data={total} />
              </div>
            )
          })()}

          {metrics.filter(m => m.platform === 'instagram' || m.platform === 'facebook_page').length === 0 && !socialLoading && (
            <p className="text-sm text-[#6A6090] text-center py-4">Clique em "Buscar Dados" para carregar as métricas sociais.</p>
          )}
        </Card>
      )}

      {/* ── Rastreamento WhatsApp ── */}
      {tokens.some(t => t.platform === 'meta_ads' && t.is_connected) && (
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={14} color="white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F0EEF8]">Conversões WhatsApp</p>
                <p className="text-xs text-[#6A6090]">Por campanha, conjunto e criativo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {waError && <p className="text-xs text-[#FF4D6D]">{waError}</p>}
              <Button size="sm" variant="secondary" loading={waLoading}
                onClick={async () => {
                  if (!id) return
                  setWaLoading(true); setWaError('')
                  await loadTokens(id)
                  const res = await fetchAdInsights(id)
                  await loadWhatsAppLeads(id)
                  if (res?.error) setWaError(res.error)
                  setWaLoading(false)
                }}>
                <RefreshCw size={12} /> Buscar Dados
              </Button>
            </div>
          </div>
          <WhatsAppConversions
            adInsights={adInsights}
            leads={whatsappLeads}
            loading={waLoading}
            onFetch={async () => {
              if (!id) return
              setWaLoading(true); setWaError('')
              await loadTokens(id)
              const res = await fetchAdInsights(id)
              await loadWhatsAppLeads(id)
              if (res?.error) setWaError(res.error)
              setWaLoading(false)
            }}
          />
        </Card>
      )}

      {/* ── Google Ads: Palavras-chave + Landing Page → WhatsApp ── */}
      {tokens.some(t => t.platform === 'google_ads' && t.is_connected) && (
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#4285F4,#34A853)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={14} color="white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F0EEF8]">Google Ads — Palavras-chave</p>
                <p className="text-xs text-[#6A6090]">Performance por keyword + atribuição WhatsApp</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {kwError && <p className="text-xs text-[#FF4D6D] max-w-xs truncate">{kwError}</p>}
              <Button size="sm" variant="secondary" loading={kwLoading}
                onClick={async () => {
                  if (!id) return
                  setKwLoading(true); setKwError('')
                  await loadTokens(id)
                  const res = await fetchGoogleAdsKeywords(id)
                  await loadGoogleAdsClicks(id)
                  if (res?.error) setKwError(res.error)
                  setKwLoading(false)
                }}>
                <RefreshCw size={12} /> Buscar Palavras-chave
              </Button>
            </div>
          </div>
          <KeywordConversions
            keywords={keywordStats}
            clicks={googleAdsClicks}
            clientId={id}
            whatsappPhone={tokens.find(t => t.platform === 'meta_ads')?.phone_number_id || ''}
          />
        </Card>
      )}

      <Card>
        <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider mb-4">Conexões OAuth</p>
        <div className="space-y-3">
          {PLATFORMS.map(p => {
            const token = tokens.find(t => t.platform === p.key)
            return (
              <div key={p.key} className="flex items-center justify-between py-2 border-b border-[#6B3FE7]/10 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: p.color }}>
                    {p.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#F0EEF8]">{p.label}</p>
                    {token?.account_id && <p className="text-xs text-[#6A6090]">ID: {token.account_id}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    token?.is_connected ? 'bg-[#00E5A0]/15 text-[#00E5A0]' : 'bg-[#FF4D6D]/15 text-[#FF4D6D]'
                  )}>
                    {token?.is_connected ? '● Conectado' : '● Desconectado'}
                  </span>
                  <Button variant="secondary" size="sm"
                    onClick={() => setConnectModal({ platform: p.key, label: p.label, color: p.color })}>
                    <Link2 size={11} /> {token?.is_connected ? 'Reconectar' : 'Conectar'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {showCreateAccount && client && id && (
        <CreateClientAccountModal
          open={showCreateAccount}
          onClose={() => { setShowCreateAccount(false); loadClients() }}
          clientId={id}
          clientName={client.company_name}
          existingUserId={client.user_id}
        />
      )}

      {connectModal && id && (
        <ConnectPlatformModal
          open={!!connectModal}
          onClose={() => setConnectModal(null)}
          clientId={id}
          platform={connectModal.platform}
          platformLabel={connectModal.label}
          platformColor={connectModal.color}
          onSuccess={() => loadTokens(id)}
        />
      )}
    </div>
  )
}
