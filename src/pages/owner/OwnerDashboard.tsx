import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, TrendingUp, DollarSign, MousePointerClick, Bell, CheckCheck } from 'lucide-react'
import { useDashboardStore } from '../../store/dashboardStore'
import { Card } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RefreshRequest {
  id: string
  client_id: string
  status: string
  message: string
  created_at: string
  clients?: { company_name: string }
}

export function OwnerDashboard() {
  const { clients, loadClients } = useDashboardStore()
  const navigate = useNavigate()
  const [requests, setRequests] = useState<RefreshRequest[]>([])

  const loadRequests = async () => {
    const { data } = await supabase
      .from('refresh_requests')
      .select('*, clients(company_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setRequests((data || []) as RefreshRequest[])
  }

  const markDone = async (id: string) => {
    await supabase.from('refresh_requests').update({ status: 'done' }).eq('id', id)
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  useEffect(() => {
    loadClients()
    loadRequests()
    const channel = supabase
      .channel('refresh-requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'refresh_requests' }, () => loadRequests())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const activeClients = clients.filter(c => c.is_active).length
  const totalClients = clients.length

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-bold text-[#F0EEF8]" style={{ fontFamily: 'Syne, sans-serif' }}>Dashboard Geral</h1>
        <p className="text-sm text-[#6A6090] mt-0.5">Visão consolidada de todos os clientes</p>
      </div>

      {/* Notificações de solicitação */}
      {requests.length > 0 && (
        <div className="bg-[#12121E] border border-[#FFB547]/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-[#FFB547]" />
            <span className="text-sm font-semibold text-[#FFB547]">
              {requests.length} solicitação{requests.length > 1 ? 'ões' : ''} de atualização pendente{requests.length > 1 ? 's' : ''}
            </span>
          </div>
          {requests.map(req => (
            <div key={req.id} className="flex items-center justify-between py-2 border-b border-[#FFB547]/10 last:border-0">
              <div>
                <p className="text-sm font-medium text-[#F0EEF8]">
                  {(req.clients as any)?.company_name || 'Cliente'}
                </p>
                <p className="text-xs text-[#6A6090]">
                  {format(new Date(req.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/owner/clients/${req.client_id}`)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6B3FE7]/20 text-[#8B63F0] hover:bg-[#6B3FE7]/30 transition-all"
                >
                  Ver cliente
                </button>
                <button
                  onClick={() => markDone(req.id)}
                  className="p-1.5 rounded-lg text-[#00E5A0] hover:bg-[#00E5A0]/10 transition-all"
                  title="Marcar como resolvido"
                >
                  <CheckCheck size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#6B3FE7]/20 to-[#6B3FE7]/5 border border-[#6B3FE7]/30 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[#A098C8] text-xs font-medium uppercase tracking-wider">Total Clientes</span>
            <Users size={16} className="text-[#6B3FE7] opacity-60" />
          </div>
          <div className="text-2xl font-bold text-[#F0EEF8]">{totalClients}</div>
          <div className="text-xs text-[#00E5A0] mt-2">{activeClients} ativos</div>
        </div>
        <div className="bg-gradient-to-br from-[#00D4FF]/15 to-[#00D4FF]/5 border border-[#00D4FF]/25 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[#A098C8] text-xs font-medium uppercase tracking-wider">Clientes Ativos</span>
            <TrendingUp size={16} className="text-[#00D4FF] opacity-60" />
          </div>
          <div className="text-2xl font-bold text-[#F0EEF8]">{activeClients}</div>
          <div className="text-xs text-[#00E5A0] mt-2">+{Math.round((activeClients / Math.max(totalClients, 1)) * 100)}% taxa ativa</div>
        </div>
        <div className="bg-gradient-to-br from-[#FFB547]/15 to-[#FFB547]/5 border border-[#FFB547]/25 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[#A098C8] text-xs font-medium uppercase tracking-wider">Plataformas</span>
            <MousePointerClick size={16} className="text-[#FFB547] opacity-60" />
          </div>
          <div className="text-2xl font-bold text-[#F0EEF8]">4</div>
          <div className="text-xs text-[#A098C8] mt-2">Meta, Google, IG, FB</div>
        </div>
        <div className="bg-gradient-to-br from-[#00E5A0]/15 to-[#00E5A0]/5 border border-[#00E5A0]/25 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[#A098C8] text-xs font-medium uppercase tracking-wider">Bloqueados</span>
            <DollarSign size={16} className="text-[#00E5A0] opacity-60" />
          </div>
          <div className="text-2xl font-bold text-[#F0EEF8]">{totalClients - activeClients}</div>
          <div className="text-xs text-[#FF4D6D] mt-2">acesso suspenso</div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[#A098C8] mb-3 uppercase tracking-wider">Clientes Recentes</h2>
        <div className="space-y-2">
          {clients.slice(0, 5).map(client => (
            <Card
              key={client.id}
              onClick={() => navigate(`/owner/clients/${client.id}`)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6B3FE7]/30 to-[#00D4FF]/20 flex items-center justify-center text-sm font-bold text-[#8B63F0]">
                  {client.company_name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F0EEF8]">{client.company_name}</p>
                  <p className="text-xs text-[#6A6090]">
                    {[
                      client.can_see_meta_ads && 'Meta Ads',
                      client.can_see_google_ads && 'Google Ads',
                      client.can_see_instagram && 'Instagram',
                      client.can_see_facebook_page && 'FB Page',
                    ].filter(Boolean).join(', ') || 'Sem plataformas'}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${client.is_active ? 'bg-[#00E5A0]/15 text-[#00E5A0]' : 'bg-[#FF4D6D]/15 text-[#FF4D6D]'}`}>
                {client.is_active ? '● Ativo' : '● Bloqueado'}
              </span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
