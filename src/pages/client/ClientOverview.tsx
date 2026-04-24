import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import type { Client, Platform } from '../../types'

const PLATFORMS: { key: Platform; label: string; color: string; icon: string }[] = [
  { key: 'meta_ads', label: 'Meta Ads', color: '#1877F2', icon: 'M' },
  { key: 'google_ads', label: 'Google Ads', color: '#4285F4', icon: 'G' },
  { key: 'instagram', label: 'Instagram', color: '#E1306C', icon: '📷' },
  { key: 'facebook_page', label: 'Facebook Page', color: '#1877F2', icon: 'f' },
]

export function ClientOverview() {
  const { profile } = useAuthStore()
  const [client, setClient] = useState<Client | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!profile) return
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', profile.id)
        .single()
      if (data) setClient(data as Client)
    }
    load()
  }, [profile])

  const enabledPlatforms = client
    ? PLATFORMS.filter(p => client[`can_see_${p.key}` as keyof Client])
    : []

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-bold text-[#F0EEF8]" style={{ fontFamily: 'Syne, sans-serif' }}>Visão Geral</h1>
        <p className="text-sm text-[#6A6090] mt-0.5">Plataformas disponíveis para sua conta</p>
      </div>

      {client && (
        <Card glow="purple">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B3FE7]/30 to-[#00D4FF]/20 flex items-center justify-center text-lg font-bold text-[#8B63F0]">
              {client.company_name[0]}
            </div>
            <div>
              <p className="text-base font-semibold text-[#F0EEF8]">{client.company_name}</p>
              <p className="text-xs text-[#6A6090]">{enabledPlatforms.length} plataforma(s) habilitada(s)</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {enabledPlatforms.map(p => (
          <div key={p.key} className="rounded-2xl p-5 border border-[#00E5A0]/20 bg-[#12121E]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
                style={{ background: p.color }}>
                {p.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F0EEF8]">{p.label}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00E5A0]/15 text-[#00E5A0]">● Ativo</span>
              </div>
            </div>
            <p className="text-xs text-[#6A6090]">Dados disponíveis no Dashboard principal</p>
          </div>
        ))}

        {enabledPlatforms.length === 0 && (
          <div className="col-span-2 flex items-center justify-center h-32 text-[#6A6090] text-sm">
            Nenhuma plataforma habilitada. Entre em contato com sua agência.
          </div>
        )}
      </div>
    </div>
  )
}
