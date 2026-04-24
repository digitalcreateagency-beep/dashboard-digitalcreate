import { useState } from 'react'
import { MessageCircle, TrendingUp, Users, Megaphone, Layers, Image, Phone, ChevronDown, ChevronUp } from 'lucide-react'
import type { AdInsight, WhatsAppLead } from '../../types'

interface Props {
  adInsights: AdInsight[]
  leads: WhatsAppLead[]
  loading?: boolean
  onFetch?: () => void
}

type GroupBy = 'campaign' | 'adset' | 'ad'

const GROUP_LABELS: Record<GroupBy, { label: string; icon: React.ElementType }> = {
  campaign: { label: 'Campanha',         icon: Megaphone },
  adset:    { label: 'Conjunto de Anúncios', icon: Layers },
  ad:       { label: 'Criativo (Anúncio)',   icon: Image },
}

function maskPhone(wa_id: string) {
  if (!wa_id || wa_id.length < 8) return wa_id
  return wa_id.slice(0, 4) + '•'.repeat(wa_id.length - 7) + wa_id.slice(-3)
}

function whatsappLink(wa_id: string) {
  const clean = wa_id.replace(/\D/g, '')
  return `https://wa.me/${clean}`
}

function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 70 }}>
      <p style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'Syne, sans-serif' }}>{value}</p>
      <p style={{ fontSize: 9, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 1 }}>{label}</p>
    </div>
  )
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#A098C8' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{value.toLocaleString('pt-BR')}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: color, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

export function WhatsAppConversions({ adInsights, leads, loading, onFetch }: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>('campaign')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showAllLeads, setShowAllLeads] = useState(false)

  // ── Totais gerais ────────────────────────────────────────────────────────
  const totals = adInsights.reduce((acc, r) => ({
    impressions:      acc.impressions + r.impressions,
    clicks:           acc.clicks + r.clicks,
    spend:            acc.spend + r.spend,
    wa_conversations: acc.wa_conversations + r.wa_conversations,
    wa_replies:       acc.wa_replies + r.wa_replies,
  }), { impressions: 0, clicks: 0, spend: 0, wa_conversations: 0, wa_replies: 0 })

  const ctrTotal = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0'
  const cplTotal = totals.wa_conversations > 0 ? (totals.spend / totals.wa_conversations).toFixed(2) : '—'

  // ── Agrupamento ──────────────────────────────────────────────────────────
  type GroupRow = { key: string; name: string; impressions: number; clicks: number; spend: number; wa_conversations: number; wa_replies: number; count: number }

  const grouped: Record<string, GroupRow> = {}
  for (const r of adInsights) {
    const key  = groupBy === 'campaign' ? r.campaign_id : groupBy === 'adset' ? r.adset_id : r.ad_id
    const name = groupBy === 'campaign' ? r.campaign_name : groupBy === 'adset' ? r.adset_name : r.ad_name
    if (!key) continue
    if (!grouped[key]) grouped[key] = { key, name, impressions: 0, clicks: 0, spend: 0, wa_conversations: 0, wa_replies: 0, count: 0 }
    grouped[key].impressions      += r.impressions
    grouped[key].clicks           += r.clicks
    grouped[key].spend            += r.spend
    grouped[key].wa_conversations += r.wa_conversations
    grouped[key].wa_replies       += r.wa_replies
    grouped[key].count++
  }
  const rows = Object.values(grouped).sort((a, b) => b.wa_conversations - a.wa_conversations)

  const maxWA = rows[0]?.wa_conversations || 1
  const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  const displayLeads = showAllLeads ? leads : leads.slice(0, 8)

  const sourceColors: Record<string, string> = {
    ad:      '#00D4FF',
    organic: '#00E5A0',
    unknown: '#6A6090',
  }

  if (adInsights.length === 0 && leads.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6A6090' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>📲</div>
        <p style={{ fontWeight: 600, color: '#A098C8', marginBottom: 6 }}>Nenhum dado de WhatsApp ainda</p>
        <p style={{ fontSize: 12, maxWidth: 320, margin: '0 auto 16px' }}>
          Clique em "Buscar Dados" para carregar as conversões WhatsApp das campanhas Meta Ads.
        </p>
        {onFetch && (
          <button onClick={onFetch} disabled={loading} style={{
            padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#6B3FE7,#C040B8)', color: 'white', fontWeight: 600, fontSize: 13,
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Buscando...' : '📲 Buscar Dados WhatsApp'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── KPIs do funil ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 1, background: 'rgba(107,63,231,0.12)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(107,63,231,0.2)' }}>
        {[
          { label: 'Impressões',   value: totals.impressions.toLocaleString('pt-BR'), color: '#A098C8' },
          { label: 'Cliques',      value: totals.clicks.toLocaleString('pt-BR'), color: '#00D4FF' },
          { label: 'Conversas WA', value: totals.wa_conversations.toLocaleString('pt-BR'), color: '#25D366' },
          { label: '1ª Resposta',  value: totals.wa_replies.toLocaleString('pt-BR'), color: '#00E5A0' },
          { label: 'Custo/Lead',   value: cplTotal === '—' ? '—' : `R$${cplTotal}`, color: '#FFB547' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '14px 10px', textAlign: 'center', background: 'rgba(14,12,46,0.9)' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'Syne, sans-serif' }}>{s.value}</p>
            <p style={{ fontSize: 9, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Funil visual ── */}
      <div style={{ background: 'rgba(14,12,46,0.7)', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(107,63,231,0.15)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
          Funil de Conversão
        </p>
        <FunnelBar label="Impressões"             value={totals.impressions}      max={totals.impressions}      color="#A098C8" />
        <FunnelBar label="Cliques no Anúncio"     value={totals.clicks}           max={totals.impressions}      color="#00D4FF" />
        <FunnelBar label="Conversas WhatsApp"     value={totals.wa_conversations} max={totals.impressions}      color="#25D366" />
        <FunnelBar label="Primeira Resposta"      value={totals.wa_replies}       max={totals.wa_conversations || 1} color="#00E5A0" />
        {leads.length > 0 && <FunnelBar label="Leads Capturados (webhook)" value={leads.length} max={totals.wa_conversations || 1} color="#FFB547" />}
        <div style={{ display: 'flex', gap: 16, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 11, color: '#6A6090' }}>CTR: <strong style={{ color: '#00D4FF' }}>{ctrTotal}%</strong></span>
          <span style={{ fontSize: 11, color: '#6A6090' }}>Custo por conversa: <strong style={{ color: '#25D366' }}>{cplTotal === '—' ? '—' : `R$ ${cplTotal}`}</strong></span>
          <span style={{ fontSize: 11, color: '#6A6090' }}>Investimento: <strong style={{ color: '#FFB547' }}>{brl(totals.spend)}</strong></span>
        </div>
      </div>

      {/* ── Breakdown por campanha/conjunto/anúncio ── */}
      {rows.length > 0 && (
        <div style={{ background: 'rgba(14,12,46,0.7)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(107,63,231,0.15)' }}>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(107,63,231,0.1)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 1 }}>
              Por {GROUP_LABELS[groupBy].label}
            </p>
            <div style={{ display: 'flex', background: 'rgba(10,8,32,0.8)', border: '1px solid rgba(107,63,231,0.2)', borderRadius: 8, padding: 2, gap: 1 }}>
              {(Object.keys(GROUP_LABELS) as GroupBy[]).map(g => {
                const { icon: Icon } = GROUP_LABELS[g]
                return (
                  <button key={g} onClick={() => setGroupBy(g)} title={GROUP_LABELS[g].label} style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: groupBy === g ? '#6B3FE7' : 'transparent',
                    color: groupBy === g ? '#fff' : '#6A6090', transition: 'all 0.15s',
                  }}>
                    <Icon size={11} /> {GROUP_LABELS[g].label.split(' ')[0]}
                  </button>
                )
              })}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(107,63,231,0.1)' }}>
                {['Nome', 'Impressões', 'Cliques', 'Conversas WA', '1ª Resposta', 'Investimento', 'Custo/Lead'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 0.7, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const cpl = row.wa_conversations > 0 ? (row.spend / row.wa_conversations).toFixed(2) : '—'
                const barW = `${Math.max(4, (row.wa_conversations / maxWA) * 100)}%`
                return (
                  <tr key={row.key} style={{ borderBottom: '1px solid rgba(107,63,231,0.06)', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(107,63,231,0.05)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 14px', maxWidth: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 4, height: 28, borderRadius: 2, background: `hsl(${(i * 47) % 360}, 70%, 60%)`, flexShrink: 0 }} />
                        <p style={{ color: '#E0D8F8', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                          {row.name || '(sem nome)'}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#A098C8' }}>{row.impressions.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '10px 14px', color: '#00D4FF' }}>{row.clicks.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', minWidth: 40 }}>
                          <div style={{ height: '100%', borderRadius: 3, width: barW, background: '#25D366' }} />
                        </div>
                        <span style={{ color: '#25D366', fontWeight: 700, minWidth: 28 }}>{row.wa_conversations}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#00E5A0' }}>{row.wa_replies}</td>
                    <td style={{ padding: '10px 14px', color: '#FFB547' }}>{brl(row.spend)}</td>
                    <td style={{ padding: '10px 14px', color: '#F0EEF8', fontWeight: 600 }}>
                      {cpl === '—' ? <span style={{ color: '#4A3870' }}>—</span> : `R$ ${cpl}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Leads individuais (do webhook) ── */}
      {leads.length > 0 && (
        <div style={{ background: 'rgba(14,12,46,0.7)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(37,211,102,0.2)' }}>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(37,211,102,0.1)', background: 'rgba(37,211,102,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={14} color="#25D366" />
              <p style={{ fontSize: 11, fontWeight: 700, color: '#25D366', textTransform: 'uppercase', letterSpacing: 1 }}>
                Leads via WhatsApp ({leads.length})
              </p>
            </div>
            <p style={{ fontSize: 11, color: '#6A6090' }}>Rastreados via webhook</p>
          </div>

          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayLeads.map(lead => {
              const srcColor = sourceColors[lead.source_type] || '#6A6090'
              const dateStr  = new Date(lead.received_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
              return (
                <div key={lead.id} style={{
                  background: 'rgba(10,8,32,0.7)', border: '1px solid rgba(37,211,102,0.12)',
                  borderRadius: 12, padding: '12px 14px',
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px 16px', alignItems: 'start',
                }}>
                  {/* Contato */}
                  <div>
                    <p style={{ fontSize: 10, color: '#6A6090', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.6 }}>Contato</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#25D366,#128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Phone size={12} color="white" />
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#F0EEF8' }}>
                          {lead.contact_name || 'Desconhecido'}
                        </p>
                        <a href={whatsappLink(lead.wa_id)} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#25D366', textDecoration: 'none' }}>
                          +{maskPhone(lead.wa_id)}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Origem */}
                  <div>
                    <p style={{ fontSize: 10, color: '#6A6090', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 }}>Origem</p>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${srcColor}15`, color: srcColor, border: `1px solid ${srcColor}30` }}>
                      {lead.source_type === 'ad' ? '📢 Anúncio' : lead.source_type === 'organic' ? '🌱 Orgânico' : '❓ Desconhecido'}
                    </span>
                    {lead.campaign_name && <p style={{ fontSize: 11, color: '#A098C8', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }} title={lead.campaign_name}>📢 {lead.campaign_name}</p>}
                  </div>

                  {/* Anúncio */}
                  <div>
                    <p style={{ fontSize: 10, color: '#6A6090', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 }}>Anúncio</p>
                    {lead.adset_name && <p style={{ fontSize: 11, color: '#A098C8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }} title={lead.adset_name}>⚙️ {lead.adset_name}</p>}
                    {lead.ad_name && <p style={{ fontSize: 11, color: '#C0B8E8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }} title={lead.ad_name}>🖼️ {lead.ad_name}</p>}
                    {!lead.adset_name && !lead.ad_name && <p style={{ fontSize: 11, color: '#4A3870' }}>—</p>}
                  </div>

                  {/* Data */}
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 10, color: '#6A6090', marginBottom: 2 }}>{dateStr}</p>
                    {lead.message_body && (
                      <p style={{ fontSize: 10, color: '#4A3870', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lead.message_body}>
                        "{lead.message_body}"
                      </p>
                    )}
                  </div>
                </div>
              )
            })}

            {leads.length > 8 && (
              <button onClick={() => setShowAllLeads(!showAllLeads)} style={{
                width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(37,211,102,0.15)',
                background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#25D366', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {showAllLeads
                  ? <><ChevronUp size={13} /> Mostrar menos</>
                  : <><ChevronDown size={13} /> Ver todos os {leads.length} leads</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
