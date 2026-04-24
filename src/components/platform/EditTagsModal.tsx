import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabase'
import type { Client, SectorKey, PlanKey, ClientStatusKey } from '../../types'

interface EditTagsModalProps {
  open: boolean
  onClose: () => void
  client: Client
  onSaved: () => void
}

const SECTORS: { key: SectorKey; label: string; color: string }[] = [
  { key: 'e-commerce',  label: 'E-commerce',  color: '#6B3FE7' },
  { key: 'saude',       label: 'Saúde',        color: '#00E5A0' },
  { key: 'educacao',    label: 'Educação',     color: '#00D4FF' },
  { key: 'imobiliario', label: 'Imobiliário',  color: '#FFB547' },
  { key: 'servicos',    label: 'Serviços',     color: '#C040B8' },
  { key: 'tecnologia',  label: 'Tecnologia',   color: '#4285F4' },
  { key: 'outro',       label: 'Outro',        color: '#6A6090' },
]

const PLANS: { key: PlanKey; label: string; icon: string; color: string }[] = [
  { key: 'starter',    label: 'Starter',    icon: '●',  color: '#6A6090' },
  { key: 'pro',        label: 'Pro',        icon: '★',  color: '#FFB547' },
  { key: 'enterprise', label: 'Enterprise', icon: '♦',  color: '#C040B8' },
]

const STATUSES: { key: ClientStatusKey; label: string; color: string; bg: string }[] = [
  { key: 'ativo',   label: 'Ativo',   color: '#00E5A0', bg: 'rgba(0,229,160,0.15)' },
  { key: 'atencao', label: 'Atenção', color: '#FFB547', bg: 'rgba(255,181,71,0.15)' },
  { key: 'inativo', label: 'Inativo', color: '#FF4D6D', bg: 'rgba(255,77,109,0.15)' },
]

export { SECTORS, PLANS, STATUSES }

export function EditTagsModal({ open, onClose, client, onSaved }: EditTagsModalProps) {
  const [sector, setSector] = useState<string>(client.sector || '')
  const [plan, setPlan] = useState<string>(client.plan || 'starter')
  const [status, setStatus] = useState<string>(client.client_status || 'ativo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')
    const { error: err } = await supabase
      .from('clients')
      .update({ sector: sector || null, plan, client_status: status })
      .eq('id', client.id)
    setLoading(false)
    if (err) { setError(err.message); return }
    onSaved()
    onClose()
  }

  const chipBase: React.CSSProperties = {
    borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.15s',
  }

  return (
    <Modal open={open} onClose={onClose} title={`Editar tags — ${client.company_name}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* SETOR */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Setor
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SECTORS.map(s => {
              const active = sector === s.key
              return (
                <button key={s.key} onClick={() => setSector(active ? '' : s.key)} style={{
                  ...chipBase,
                  background: active ? `${s.color}20` : 'rgba(255,255,255,0.04)',
                  borderColor: active ? s.color : 'rgba(255,255,255,0.08)',
                  color: active ? s.color : '#6A6090',
                }}>
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* PLANO */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Plano
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {PLANS.map(p => {
              const active = plan === p.key
              return (
                <button key={p.key} onClick={() => setPlan(p.key)} style={{
                  ...chipBase,
                  flex: 1,
                  background: active ? `${p.color}20` : 'rgba(255,255,255,0.04)',
                  borderColor: active ? p.color : 'rgba(255,255,255,0.08)',
                  color: active ? p.color : '#6A6090',
                }}>
                  {p.icon} {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* STATUS */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Status do Cliente
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {STATUSES.map(s => {
              const active = status === s.key
              return (
                <button key={s.key} onClick={() => setStatus(s.key)} style={{
                  ...chipBase,
                  flex: 1,
                  background: active ? s.bg : 'rgba(255,255,255,0.04)',
                  borderColor: active ? s.color : 'rgba(255,255,255,0.08)',
                  color: active ? s.color : '#6A6090',
                }}>
                  ● {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {error && <p style={{ fontSize: 12, color: '#FF4D6D', background: 'rgba(255,77,109,0.1)', padding: '8px 12px', borderRadius: 10 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSave} loading={loading} className="flex-1">
            Salvar Tags
          </Button>
        </div>
      </div>
    </Modal>
  )
}
