import { Card } from '../../components/ui/Card'
import { useAuthStore } from '../../store/authStore'

export function Settings() {
  const { profile } = useAuthStore()

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-bold text-[#F0EEF8]" style={{ fontFamily: 'Syne, sans-serif' }}>Configurações</h1>
        <p className="text-sm text-[#6A6090] mt-0.5">Gerenciamento da conta e integrações</p>
      </div>

      <Card>
        <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider mb-4">Perfil do Proprietário</p>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6B3FE7] to-[#00D4FF] flex items-center justify-center text-white text-xl font-bold">
            {profile?.full_name?.[0] || '?'}
          </div>
          <div>
            <p className="text-base font-semibold text-[#F0EEF8]">{profile?.full_name}</p>
            <p className="text-sm text-[#6A6090]">{profile?.email}</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#6B3FE7]/20 text-[#8B63F0] mt-1 inline-block">
              PROPRIETÁRIO
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider mb-4">Integrações de Plataforma</p>
        <div className="space-y-3">
          {[
            { name: 'Meta Ads API', desc: 'Graph API v19.0 — OAuth 2.0', color: '#1877F2', status: 'Configurado' },
            { name: 'Google Ads API', desc: 'GAQL + OAuth 2.0 com refresh automático', color: '#4285F4', status: 'Configurado' },
          ].map(item => (
            <div key={item.name} className="flex items-center justify-between p-3 bg-[#0D0D1A] rounded-xl border border-[#222240]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: item.color }}>
                  {item.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F0EEF8]">{item.name}</p>
                  <p className="text-xs text-[#6A6090]">{item.desc}</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00E5A0]/15 text-[#00E5A0]">
                ● {item.status}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider mb-4">Sobre o Sistema</p>
        <div className="space-y-2 text-sm text-[#A098C8]">
          <div className="flex justify-between"><span>Versão</span><span className="text-[#F0EEF8]">1.0.0</span></div>
          <div className="flex justify-between"><span>Stack</span><span className="text-[#F0EEF8]">React 18 + Supabase + Vite</span></div>
          <div className="flex justify-between"><span>Auth</span><span className="text-[#F0EEF8]">Supabase Auth + RLS</span></div>
          <div className="flex justify-between"><span>Realtime</span><span className="text-[#F0EEF8]">Supabase Realtime</span></div>
        </div>
      </Card>
    </div>
  )
}
