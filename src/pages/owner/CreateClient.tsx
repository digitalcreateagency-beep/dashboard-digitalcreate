import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export function CreateClient() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    company_name: '',
    can_see_meta_ads: false,
    can_see_google_ads: false,
    can_see_instagram: false,
    can_see_facebook_page: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('clients').insert({
      ...form,
      owner_id: profile.id,
      is_active: true,
    })

    setLoading(false)
    if (err) { setError(err.message); return }
    navigate('/owner/clients')
  }

  const toggle = (field: keyof typeof form) => setForm(prev => ({ ...prev, [field]: !prev[field] }))

  const platforms = [
    { key: 'can_see_meta_ads' as const, label: 'Meta Ads', color: '#1877F2' },
    { key: 'can_see_google_ads' as const, label: 'Google Ads', color: '#4285F4' },
    { key: 'can_see_instagram' as const, label: 'Instagram', color: '#E1306C' },
    { key: 'can_see_facebook_page' as const, label: 'Facebook Page', color: '#1877F2' },
  ]

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/owner/clients')}
          className="p-2 rounded-xl text-[#6A6090] hover:text-[#F0EEF8] hover:bg-[#1A1A2E] transition-all">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold text-[#F0EEF8]" style={{ fontFamily: 'Syne, sans-serif' }}>Novo Cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#A098C8] mb-1.5 font-medium">Nome da Empresa *</label>
              <input
                required
                value={form.company_name}
                onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                placeholder="Ex: Empresa XYZ"
                className="w-full bg-[#0A0A14] border border-[#6B3FE7]/20 rounded-xl px-3 py-2.5 text-sm text-[#F0EEF8] focus:outline-none focus:border-[#6B3FE7] transition-colors placeholder:text-[#3A3360]"
              />
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-xs text-[#6A6090] font-medium uppercase tracking-wider mb-4">Plataformas com Acesso</p>
          <div className="grid grid-cols-2 gap-3">
            {platforms.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => toggle(p.key)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border"
                style={form[p.key]
                  ? { background: p.color, color: '#fff', border: 'transparent', boxShadow: `0 4px 14px ${p.color}40` }
                  : { background: 'transparent', color: '#3A3360', borderColor: '#222240' }
                }
              >
                <span className="w-2 h-2 rounded-full" style={{ background: form[p.key] ? '#fff' : '#3A3360' }} />
                {p.label}
              </button>
            ))}
          </div>
        </Card>

        {error && <p className="text-xs text-[#FF4D6D] bg-[#FF4D6D]/10 px-3 py-2 rounded-lg">{error}</p>}

        <Button type="submit" loading={loading} size="lg" className="w-full">
          <Save size={15} /> Criar Cliente
        </Button>
      </form>
    </div>
  )
}
