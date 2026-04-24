import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, LayoutGrid, List, Tag, ExternalLink, Power } from 'lucide-react'
import { useDashboardStore } from '../../store/dashboardStore'
import { Button } from '../../components/ui/Button'
import { EditTagsModal, SECTORS, PLANS, STATUSES } from '../../components/platform/EditTagsModal'
import { supabase } from '../../lib/supabase'
import type { Client } from '../../types'
import { clsx } from 'clsx'

// Gera cor de avatar consistente por nome
const AVATAR_COLORS = [
  ['#6B3FE7', '#C040B8'], ['#00D4FF', '#6B3FE7'], ['#00E5A0', '#00D4FF'],
  ['#FFB547', '#FF6B35'], ['#C040B8', '#6B3FE7'], ['#4285F4', '#00D4FF'],
  ['#FF4D6D', '#C040B8'], ['#00E5A0', '#6B3FE7'],
]
function avatarGradient(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  const [a, b] = AVATAR_COLORS[idx]
  return `linear-gradient(135deg, ${a}, ${b})`
}

function getPlanBadge(plan?: string) {
  const p = PLANS.find(x => x.key === plan) || PLANS[0]
  return { label: p.label, icon: p.icon, color: p.color }
}

function getSectorBadge(sector?: string) {
  const s = SECTORS.find(x => x.key === sector)
  return s ? { label: s.label, color: s.color } : null
}

function getStatusBadge(status?: string) {
  const s = STATUSES.find(x => x.key === status) || STATUSES[0]
  return { label: s.label, color: s.color, bg: s.bg }
}

// Resumo de métricas por cliente (30d)
interface ClientSummary { spend: number; clicks: number }

export function Clients() {
  const { clients, loadClients, toggleClientActive } = useDashboardStore()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filterSector, setFilterSector] = useState<string | null>(null)
  const [filterPlan, setFilterPlan] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [summaries, setSummaries] = useState<Record<string, ClientSummary>>({})

  useEffect(() => { loadClients() }, [])

  useEffect(() => {
    if (!clients.length) return
    // Carrega resumo de métricas dos últimos 30 dias para todos os clientes
    const loadSummaries = async () => {
      const since = new Date(); since.setDate(since.getDate() - 30)
      const sinceStr = since.toISOString().split('T')[0]
      const { data } = await supabase
        .from('metrics_cache')
        .select('client_id, spend, clicks')
        .gte('date', sinceStr)
      if (!data) return
      const map: Record<string, ClientSummary> = {}
      for (const row of data) {
        if (!map[row.client_id]) map[row.client_id] = { spend: 0, clicks: 0 }
        map[row.client_id].spend += row.spend || 0
        map[row.client_id].clicks += row.clicks || 0
      }
      setSummaries(map)
    }
    loadSummaries()
  }, [clients])

  const filtered = clients.filter(c => {
    if (search && !c.company_name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterSector && c.sector !== filterSector) return false
    if (filterPlan && c.plan !== filterPlan) return false
    if (filterStatus && c.client_status !== filterStatus) return false
    return true
  })

  const fmtCurrency = (v: number) => v >= 1000
    ? `R$${(v / 1000).toFixed(1)}k`
    : `R$${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
  const fmtNum = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)

  const chipStyle = (active: boolean, color: string): React.CSSProperties => ({
    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    cursor: 'pointer', border: `1.5px solid ${active ? color : 'rgba(255,255,255,0.08)'}`,
    background: active ? `${color}20` : 'transparent',
    color: active ? color : '#6A6090', transition: 'all 0.15s',
  })

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#F0EEF8' }}>
            Clientes
          </h1>
          <p style={{ fontSize: 13, color: '#6A6090', marginTop: 2 }}>
            {filtered.length} de {clients.length} cliente{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/owner/clients/new')}>
          <Plus size={14} /> Novo Cliente
        </Button>
      </div>

      {/* Barra de busca + toggle de view */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6A6090' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
              background: 'rgba(14,12,46,0.9)', border: '1px solid rgba(107,63,231,0.2)',
              borderRadius: 12, fontSize: 13, color: '#F0EEF8', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', background: 'rgba(14,12,46,0.9)', border: '1px solid rgba(107,63,231,0.2)', borderRadius: 10, padding: 3, gap: 2 }}>
          {[
            { v: 'grid', Icon: LayoutGrid },
            { v: 'list', Icon: List },
          ].map(({ v, Icon }) => (
            <button key={v} onClick={() => setView(v as any)} style={{
              padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: view === v ? '#6B3FE7' : 'transparent',
              color: view === v ? '#fff' : '#6A6090',
            }}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(14,12,46,0.6)', border: '1px solid rgba(107,63,231,0.15)', borderRadius: 16, padding: '14px 16px' }}>
        {/* Setor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 1, minWidth: 46 }}>Setor</span>
          {SECTORS.map(s => (
            <button key={s.key} onClick={() => setFilterSector(filterSector === s.key ? null : s.key)}
              style={chipStyle(filterSector === s.key, s.color)}>
              ● {s.label}
            </button>
          ))}
        </div>
        {/* Plano */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 1, minWidth: 46 }}>Plano</span>
          {PLANS.map(p => (
            <button key={p.key} onClick={() => setFilterPlan(filterPlan === p.key ? null : p.key)}
              style={chipStyle(filterPlan === p.key, p.color)}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>
        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 1, minWidth: 46 }}>Status</span>
          {STATUSES.map(s => (
            <button key={s.key} onClick={() => setFilterStatus(filterStatus === s.key ? null : s.key)}
              style={chipStyle(filterStatus === s.key, s.color)}>
              ● {s.label}
            </button>
          ))}
          {(filterSector || filterPlan || filterStatus) && (
            <button onClick={() => { setFilterSector(null); setFilterPlan(null); setFilterStatus(null) }}
              style={{ fontSize: 11, color: '#FF4D6D', background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>
              ✕ Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid de clientes */}
      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(client => {
            const plan = getPlanBadge(client.plan)
            const sector = getSectorBadge(client.sector)
            const status = getStatusBadge(client.client_status)
            const summary = summaries[client.id] || { spend: 0, clicks: 0 }
            const statusDot = client.client_status === 'atencao' ? '#FFB547'
              : client.client_status === 'inativo' ? '#FF4D6D' : '#00E5A0'

            return (
              <div key={client.id} style={{
                background: 'rgba(14,12,46,0.9)', border: '1px solid rgba(107,63,231,0.18)',
                borderRadius: 18, overflow: 'hidden', transition: 'all 0.2s', cursor: 'default',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(192,64,184,0.35)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(107,63,231,0.18)'}
              >
                <div style={{ padding: '18px 18px 14px' }}>
                  {/* Avatar + status dot */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: avatarGradient(client.company_name),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 800, color: 'white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}>
                      {client.company_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot, boxShadow: `0 0 6px ${statusDot}` }} />
                  </div>

                  {/* Nome + setor */}
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#F0EEF8', marginBottom: 2, fontFamily: 'Syne, sans-serif' }}>
                    {client.company_name}
                  </p>
                  <p style={{ fontSize: 11, color: '#6A6090', marginBottom: 10 }}>
                    {sector?.label || 'Sem setor definido'}
                  </p>

                  {/* Badges plano + status */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: `${plan.color}18`, color: plan.color,
                      border: `1px solid ${plan.color}30`,
                    }}>
                      {plan.icon} {plan.label}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: status.bg, color: status.color,
                      border: `1px solid ${status.color}30`,
                    }}>
                      ● {status.label}
                    </span>
                  </div>

                  {/* Métricas */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#F0EEF8' }}>{fmtCurrency(summary.spend)}</p>
                      <p style={{ fontSize: 10, color: '#6A6090', marginTop: 1 }}>Investimento</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#F0EEF8' }}>{fmtNum(summary.clicks)}</p>
                      <p style={{ fontSize: 10, color: '#6A6090', marginTop: 1 }}>Cliques</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ borderTop: '1px solid rgba(107,63,231,0.12)', display: 'flex' }}>
                  <button onClick={() => setEditingClient(client)} style={{
                    flex: 1, padding: '10px', fontSize: 12, fontWeight: 600,
                    color: '#A098C8', background: 'transparent', border: 'none',
                    cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(192,64,184,0.08)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <Tag size={12} /> Editar tags
                  </button>
                  <div style={{ width: 1, background: 'rgba(107,63,231,0.12)' }} />
                  <button onClick={() => navigate(`/owner/clients/${client.id}`)} style={{
                    flex: 1, padding: '10px', fontSize: 12, fontWeight: 600,
                    color: '#A098C8', background: 'transparent', border: 'none',
                    cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(107,63,231,0.08)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <ExternalLink size={12} /> Abrir
                  </button>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', color: '#6A6090', fontSize: 14 }}>
              {search || filterSector || filterPlan || filterStatus
                ? 'Nenhum cliente encontrado com esses filtros.'
                : 'Nenhum cliente cadastrado ainda.'}
            </div>
          )}
        </div>
      ) : (
        /* Vista Lista */
        <div style={{ background: 'rgba(14,12,46,0.9)', border: '1px solid rgba(107,63,231,0.18)', borderRadius: 18, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(107,63,231,0.15)' }}>
                {['Empresa', 'Setor', 'Plano', 'Status', 'Invest. (30d)', 'Cliques (30d)', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(client => {
                const plan = getPlanBadge(client.plan)
                const sector = getSectorBadge(client.sector)
                const status = getStatusBadge(client.client_status)
                const summary = summaries[client.id] || { spend: 0, clicks: 0 }

                return (
                  <tr key={client.id} style={{ borderBottom: '1px solid rgba(107,63,231,0.08)', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(107,63,231,0.05)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                          background: avatarGradient(client.company_name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800, color: 'white',
                        }}>
                          {client.company_name.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: '#F0EEF8' }}>{client.company_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {sector ? (
                        <span style={{ fontSize: 11, fontWeight: 600, color: sector.color, background: `${sector.color}15`, padding: '3px 10px', borderRadius: 20 }}>
                          {sector.label}
                        </span>
                      ) : <span style={{ color: '#3A3360', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: plan.color, background: `${plan.color}15`, padding: '3px 10px', borderRadius: 20 }}>
                        {plan.icon} {plan.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: status.color, background: status.bg, padding: '3px 10px', borderRadius: 20 }}>
                        ● {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#F0EEF8', fontWeight: 600 }}>{fmtCurrency(summary.spend)}</td>
                    <td style={{ padding: '12px 16px', color: '#F0EEF8', fontWeight: 600 }}>{fmtNum(summary.clicks)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditingClient(client)} title="Editar tags" style={{
                          padding: '6px', borderRadius: 8, border: 'none', background: 'transparent',
                          cursor: 'pointer', color: '#6A6090', transition: 'all 0.15s',
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#C040B8'; (e.currentTarget as HTMLElement).style.background = 'rgba(192,64,184,0.1)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6A6090'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <Tag size={14} />
                        </button>
                        <button onClick={() => navigate(`/owner/clients/${client.id}`)} title="Ver cliente" style={{
                          padding: '6px', borderRadius: 8, border: 'none', background: 'transparent',
                          cursor: 'pointer', color: '#6A6090', transition: 'all 0.15s',
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#00D4FF'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.1)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6A6090'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button onClick={() => toggleClientActive(client.id, !client.is_active)} title={client.is_active ? 'Bloquear' : 'Ativar'} style={{
                          padding: '6px', borderRadius: 8, border: 'none', background: 'transparent',
                          cursor: 'pointer', color: client.is_active ? '#00E5A0' : '#FF4D6D', transition: 'all 0.15s',
                        }}>
                          <Power size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#6A6090' }}>
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de edição de tags */}
      {editingClient && (
        <EditTagsModal
          open={!!editingClient}
          onClose={() => setEditingClient(null)}
          client={editingClient}
          onSaved={() => { loadClients(); setEditingClient(null) }}
        />
      )}
    </div>
  )
}
