import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Download, Bell, CheckCircle } from 'lucide-react'
import { useDashboardStore } from '../../store/dashboardStore'
import { useAuthStore } from '../../store/authStore'
import { MetricCard } from '../../components/charts/MetricCard'
import { MetricLineChart } from '../../components/charts/LineChart'
import { SocialMetrics } from '../../components/charts/SocialMetrics'
import { WhatsAppConversions } from '../../components/charts/WhatsAppConversions'
import { KeywordConversions } from '../../components/charts/KeywordConversions'
import { PrintReport } from '../../components/PrintReport'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function ClientDashboard() {
  const { profile } = useAuthStore()
  const {
    metrics, dashboardMetrics, adInsights, whatsappLeads,
    keywordStats, googleAdsClicks,
    loading, lastRefresh, activePlatforms, tokens,
    loadMetrics, loadTokens, loadAdInsights, loadWhatsAppLeads,
    loadKeywordStats, loadGoogleAdsClicks,
    subscribeRealtime
  } = useDashboardStore()

  const clientIdRef = useRef<string | null>(null)
  const [companyName, setCompanyName] = useState('')
  const printRef = useRef<HTMLDivElement>(null)
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (!profile) return
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .single()
      if (!client) return
      clientIdRef.current = client.id
      setCompanyName(client.company_name || '')
      await loadTokens(client.id)
      loadMetrics(client.id)
      loadAdInsights(client.id)
      loadWhatsAppLeads(client.id)
      loadKeywordStats(client.id)
      loadGoogleAdsClicks(client.id)
      return subscribeRealtime(client.id)
    }
    const cleanup = init()
    return () => { cleanup.then(fn => fn?.()) }
  }, [profile])

  const fmtCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const fmtNum = (v: number) => v.toLocaleString('pt-BR')

  const handlePrint = () => window.print()

  const handleRequestUpdate = async () => {
    if (!clientIdRef.current) return
    setRequesting(true)
    await supabase.from('refresh_requests').insert({
      client_id: clientIdRef.current,
      status: 'pending',
      message: 'Cliente solicitou atualização dos dados'
    })
    setRequesting(false)
    setRequested(true)
    setTimeout(() => setRequested(false), 5000)
  }

  const igMetrics = metrics.filter(m => m.platform === 'instagram')
  const fbMetrics = metrics.filter(m => m.platform === 'facebook_page')
  const hasInstagram = tokens.some(t => t.platform === 'instagram' && t.is_connected)
  const hasFacebook = tokens.some(t => t.platform === 'facebook_page' && t.is_connected)

  const sumSocial = (rows: any[]) => rows.reduce((acc, m) => ({
    followers: Math.max(acc.followers, m.followers || 0),
    newFollowers: acc.newFollowers + (m.new_followers || 0),
    likes: acc.likes + (m.likes || 0),
    comments: acc.comments + (m.comments || 0),
    shares: acc.shares + (m.shares || 0),
    reach: acc.reach + (m.reach || 0),
    impressions: acc.impressions + (m.impressions || 0),
    profileViews: acc.profileViews + (m.profile_views || 0),
    websiteClicks: acc.websiteClicks + (m.website_clicks || 0),
    engagementRate: 0,
  }), { followers: 0, newFollowers: 0, likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0, profileViews: 0, websiteClicks: 0, engagementRate: 0 })

  const igData = sumSocial(igMetrics)
  igData.engagementRate = igData.followers > 0 ? ((igData.likes + igData.comments) / igData.followers) * 100 : 0
  const fbData = sumSocial(fbMetrics)
  fbData.engagementRate = fbData.followers > 0 ? ((fbData.likes + fbData.comments) / fbData.followers) * 100 : 0

  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <>
      {/* Conteúdo da tela */}
      <div className="p-6 space-y-6 overflow-y-auto h-full no-print-scroll" ref={printRef}>

        {/* Header */}
        <div className="flex items-center justify-between print-hide">
          <div>
            <h1 className="text-xl font-bold text-[#F0EEF8]" style={{ fontFamily: 'Syne, sans-serif' }}>
              Meu Dashboard
            </h1>
            {lastRefresh && <p className="text-xs text-[#6A6090]">Última atualização: {format(lastRefresh, 'HH:mm:ss')}</p>}
          </div>
          <div className="flex items-center gap-2">
            {loading && <RefreshCw size={14} className="text-[#6B3FE7] animate-spin" />}
            {requested ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#00E5A0] bg-[#00E5A0]/10 border border-[#00E5A0]/20">
                <CheckCircle size={12} /> Solicitação enviada!
              </div>
            ) : (
              <Button variant="secondary" size="sm" loading={requesting} onClick={handleRequestUpdate}>
                <Bell size={13} /> Solicitar Atualização
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Download size={13} /> Baixar PDF
            </Button>
          </div>
        </div>

        {/* Print header - aparece só no PDF */}
        <div className="hidden print-show print-header">
          <div className="flex items-center gap-3 mb-2">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6B3FE7,#00D4FF)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>⚡</span>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#0A0A14' }}>DigitalCreate Dashboard</p>
              <p style={{ fontSize: 11, color: '#6A6090' }}>Relatório de Performance — {today}</p>
            </div>
          </div>
          <hr style={{ borderColor: '#e5e7eb', marginBottom: 16 }} />
        </div>

        {/* Métricas de Ads */}
        {dashboardMetrics ? (
          <>
            <div>
              <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider mb-3 print-section-title">Campanhas de Mídia Paga</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Investimento" value={fmtCurrency(dashboardMetrics.totalSpend)} delta={dashboardMetrics.spendDelta} color="purple" />
                <MetricCard label="Cliques" value={fmtNum(dashboardMetrics.totalClicks)} delta={dashboardMetrics.clicksDelta} color="cyan" />
                <MetricCard label="Impressões" value={fmtNum(dashboardMetrics.totalImpressions)} color="amber" />
                <MetricCard label="Conversões" value={fmtNum(dashboardMetrics.totalConversions)} delta={dashboardMetrics.convDelta} color="green" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider mb-4">Investimento ao longo do tempo</p>
                <MetricLineChart data={metrics} platforms={activePlatforms} metric="spend" />
              </Card>
              <Card>
                <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider mb-4">Cliques ao longo do tempo</p>
                <MetricLineChart data={metrics} platforms={activePlatforms} metric="clicks" />
              </Card>
            </div>
          </>
        ) : (
          !loading && !(hasInstagram || hasFacebook) && (
            <div className="flex items-center justify-center h-48 text-[#6A6090]">
              Nenhum dado disponível ainda. Aguarde a agência configurar suas plataformas.
            </div>
          )
        )}

        {/* Métricas Sociais */}
        {(hasInstagram || hasFacebook) && (
          <div>
            <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider mb-3 print-section-title">Redes Sociais</p>

            {hasInstagram && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-[#E1306C] flex items-center justify-center text-white text-[10px]">📷</div>
                  <span className="text-sm font-semibold text-[#F0EEF8]">Instagram</span>
                </div>
                {igData.followers > 0 || igData.impressions > 0 ? (
                  <SocialMetrics platform="instagram" data={igData} />
                ) : (
                  <div className="bg-[#12121E] border border-[#E1306C]/20 rounded-2xl p-6 text-center">
                    <p className="text-2xl mb-2">📷</p>
                    <p className="text-sm text-[#A098C8]">Conta conectada</p>
                    <p className="text-xs text-[#6A6090] mt-1">Aguardando sincronização dos dados pela agência</p>
                  </div>
                )}
              </div>
            )}

            {hasFacebook && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-[#1877F2] flex items-center justify-center text-white text-[10px] font-bold">f</div>
                  <span className="text-sm font-semibold text-[#F0EEF8]">Facebook Page</span>
                </div>
                {fbData.followers > 0 || fbData.impressions > 0 ? (
                  <SocialMetrics platform="facebook_page" data={fbData} />
                ) : (
                  <div className="bg-[#12121E] border border-[#1877F2]/20 rounded-2xl p-6 text-center">
                    <p className="text-2xl mb-2">📘</p>
                    <p className="text-sm text-[#A098C8]">Página conectada</p>
                    <p className="text-xs text-[#6A6090] mt-1">Aguardando sincronização dos dados pela agência</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Conversões WhatsApp */}
        {(adInsights.length > 0 || whatsappLeads.length > 0) && (
          <div>
            <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider mb-3">
              📲 Conversões via WhatsApp
            </p>
            <Card>
              <WhatsAppConversions adInsights={adInsights} leads={whatsappLeads} />
            </Card>
          </div>
        )}

        {/* Google Ads Palavras-chave */}
        {(keywordStats.length > 0 || googleAdsClicks.length > 0) && (
          <div>
            <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider mb-3">
              🔑 Google Ads — Palavras-chave & Conversões
            </p>
            <Card>
              <KeywordConversions
                keywords={keywordStats}
                clicks={googleAdsClicks}
                clientId={clientIdRef.current || undefined}
              />
            </Card>
          </div>
        )}

        {/* Rodapé do PDF */}
        <div className="hidden print-show print-footer">
          <hr style={{ borderColor: '#e5e7eb', marginTop: 24, marginBottom: 8 }} />
          <p style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
            Relatório gerado em {today} • DigitalCreate Dashboard • Dados confidenciais
          </p>
        </div>
      </div>

      <PrintReport
        companyName={companyName}
        metrics={dashboardMetrics}
        rows={metrics}
        tokens={tokens}
      />
    </>
  )
}
