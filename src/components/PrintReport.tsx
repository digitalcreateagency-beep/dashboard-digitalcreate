import type { DashboardMetrics, MetricRow, PlatformToken } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DCLogo } from './DCLogo'

interface PrintReportProps {
  companyName: string
  metrics: DashboardMetrics | null
  rows: MetricRow[]
  tokens: PlatformToken[]
}

const fmtCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtNum = (v: number) => v.toLocaleString('pt-BR')
const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

function MetBox({ label, value, delta, color }: { label: string; value: string; delta?: number; color: string }) {
  return (
    <div style={{
      border: `2px solid ${color}30`,
      borderRadius: 12,
      padding: '16px',
      background: `${color}08`,
      flex: 1,
    }}>
      <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>{value}</p>
      {delta !== undefined && (
        <p style={{ fontSize: 11, color: delta >= 0 ? '#059669' : '#dc2626', marginTop: 4 }}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs período anterior
        </p>
      )}
    </div>
  )
}

function SocialRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{typeof value === 'number' ? fmtNum(value) : value}</span>
    </div>
  )
}

export function PrintReport({ companyName, metrics, rows, tokens }: PrintReportProps) {
  const igRows = rows.filter(r => r.platform === 'instagram')
  const fbRows = rows.filter(r => r.platform === 'facebook_page')

  const sumSocial = (data: any[]) => data.reduce((acc, m) => ({
    followers: Math.max(acc.followers, m.followers || 0),
    newFollowers: acc.newFollowers + (m.new_followers || 0),
    likes: acc.likes + (m.likes || 0),
    comments: acc.comments + (m.comments || 0),
    impressions: acc.impressions + (m.impressions || 0),
    reach: acc.reach + (m.reach || 0),
    profileViews: acc.profileViews + (m.profile_views || 0),
  }), { followers: 0, newFollowers: 0, likes: 0, comments: 0, impressions: 0, reach: 0, profileViews: 0 })

  const ig = sumSocial(igRows)
  const fb = sumSocial(fbRows)
  const hasIg = tokens.some(t => t.platform === 'instagram' && t.is_connected)
  const hasFb = tokens.some(t => t.platform === 'facebook_page' && t.is_connected)

  return (
    <div id="print-report" style={{
      display: 'none',
      fontFamily: "'DM Sans', Arial, sans-serif",
      color: '#111827',
      background: '#ffffff',
      padding: '32px',
      maxWidth: 800,
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottom: '3px solid #6B3FE7' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <DCLogo size={36} darkBg={false} />
            <div>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#6B3FE7', display: 'block' }}>DigitalCreate</span>
              <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Agência de Marketing Digital</p>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{companyName}</p>
          <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>Relatório de Performance</p>
          <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>{today}</p>
        </div>
      </div>

      {/* Campanhas */}
      {metrics && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 4, height: 16, background: '#6B3FE7', borderRadius: 2 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Campanhas de Mídia Paga</p>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <MetBox label="Investimento" value={fmtCurrency(metrics.totalSpend)} delta={metrics.spendDelta} color="#6B3FE7" />
            <MetBox label="Cliques" value={fmtNum(metrics.totalClicks)} delta={metrics.clicksDelta} color="#00D4FF" />
            <MetBox label="Impressões" value={fmtNum(metrics.totalImpressions)} color="#FFB547" />
            <MetBox label="Conversões" value={fmtNum(metrics.totalConversions)} delta={metrics.convDelta} color="#00E5A0" />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <MetBox label="CPC Médio" value={fmtCurrency(metrics.avgCpc)} color="#6B3FE7" />
            <MetBox label="CTR Médio" value={`${metrics.avgCtr.toFixed(2)}%`} color="#00D4FF" />
            <MetBox label="ROAS" value={metrics.avgRoas.toFixed(2)} color="#00E5A0" />
            <div style={{ flex: 1 }} />
          </div>
        </div>
      )}

      {/* Instagram */}
      {hasIg && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 4, height: 16, background: '#E1306C', borderRadius: 2 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Instagram</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#fdf2f8', borderRadius: 12, padding: 16 }}>
            <div><SocialRow label="Seguidores" value={ig.followers} /></div>
            <div><SocialRow label="Novos Seguidores" value={ig.newFollowers} /></div>
            <div><SocialRow label="Curtidas" value={ig.likes} /></div>
            <div><SocialRow label="Comentários" value={ig.comments} /></div>
            <div><SocialRow label="Impressões" value={ig.impressions} /></div>
            <div><SocialRow label="Alcance" value={ig.reach} /></div>
            <div><SocialRow label="Visitas ao Perfil" value={ig.profileViews} /></div>
            <div><SocialRow label="Taxa de Engajamento" value={ig.followers > 0 ? `${(((ig.likes + ig.comments) / ig.followers) * 100).toFixed(2)}%` : '0%'} /></div>
          </div>
        </div>
      )}

      {/* Facebook */}
      {hasFb && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 4, height: 16, background: '#1877F2', borderRadius: 2 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Facebook Page</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#eff6ff', borderRadius: 12, padding: 16 }}>
            <div><SocialRow label="Seguidores / Fãs" value={fb.followers} /></div>
            <div><SocialRow label="Novos Seguidores" value={fb.newFollowers} /></div>
            <div><SocialRow label="Impressões" value={fb.impressions} /></div>
            <div><SocialRow label="Alcance" value={fb.reach} /></div>
            <div><SocialRow label="Curtidas / Engajamento" value={fb.likes} /></div>
            <div><SocialRow label="Visitas à Página" value={fb.profileViews} /></div>
          </div>
        </div>
      )}

      {/* Rodapé */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 10, color: '#9ca3af' }}>DigitalCreate Dashboard • Dados confidenciais</p>
        <p style={{ fontSize: 10, color: '#9ca3af' }}>Gerado em {today}</p>
      </div>
    </div>
  )
}
