import { useEffect, useState } from 'react'
import { UserPlus, Trash2, ShieldCheck, Copy, CheckCheck, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'

interface StaffMember {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at?: string
}

const PERMISSIONS = [
  { label: 'Ver e gerenciar todos os clientes', granted: true },
  { label: 'Conectar e configurar plataformas', granted: true },
  { label: 'Acessar IA Consultora', granted: true },
  { label: 'Ver dados de campanhas e redes sociais', granted: true },
  { label: 'Receber notificações de atualizações', granted: true },
  { label: 'Gerenciar equipe / criar novos admins', granted: false },
  { label: 'Alterar configurações do proprietário', granted: false },
]

function avatarGradient(name: string) {
  const colors = [
    ['#6B3FE7', '#C040B8'], ['#00D4FF', '#6B3FE7'], ['#00E5A0', '#00D4FF'],
    ['#FFB547', '#C040B8'], ['#C040B8', '#6B3FE7'], ['#4285F4', '#00D4FF'],
  ]
  const [a, b] = colors[name.charCodeAt(0) % colors.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#00E5A0' : '#6A6090', padding: 4, borderRadius: 6, transition: 'color 0.2s' }}>
      {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
    </button>
  )
}

function CreateStaffModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ email: string; password: string } | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const genPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
    const pwd = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setForm(f => ({ ...f, password: pwd }))
  }

  const handleCreate = async () => {
    if (!form.full_name || !form.email || !form.password) { setError('Preencha todos os campos.'); return }
    setLoading(true); setError('')
    const { data, error: fnErr } = await supabase.functions.invoke('create-staff-user', {
      body: { full_name: form.full_name, email: form.email, password: form.password }
    })
    setLoading(false)
    if (fnErr || data?.error) { setError(fnErr?.message || data?.error); return }
    setSuccess({ email: form.email, password: form.password })
    onCreated()
  }

  const handleClose = () => { setForm({ full_name: '', email: '', password: '' }); setSuccess(null); setError(''); onClose() }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(10,8,30,0.8)', border: '1px solid rgba(107,63,231,0.25)',
    borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#F0EEF8',
    outline: 'none', boxSizing: 'border-box',
  }

  if (success) {
    return (
      <Modal open={open} onClose={handleClose} title="Acesso criado com sucesso!">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 14, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <p style={{ color: '#00E5A0', fontWeight: 700, fontSize: 14 }}>Colaborador adicionado à equipe!</p>
            <p style={{ color: '#6A6090', fontSize: 12, marginTop: 4 }}>Compartilhe as credenciais abaixo com segurança</p>
          </div>

          {[
            { label: 'E-mail', value: success.email },
            { label: 'Senha', value: success.password },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: 11, color: '#6A6090', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(10,8,30,0.8)', border: '1px solid rgba(107,63,231,0.2)', borderRadius: 10, padding: '10px 12px' }}>
                <code style={{ flex: 1, fontSize: 13, color: '#F0EEF8', fontFamily: 'monospace' }}>{value}</code>
                <CopyButton text={value} />
              </div>
            </div>
          ))}

          <div style={{ background: 'rgba(255,181,71,0.08)', border: '1px solid rgba(255,181,71,0.2)', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: 11, color: '#FFB547' }}>⚠️ Guarde a senha agora. Por segurança, ela não será exibida novamente.</p>
          </div>

          <Button onClick={handleClose} className="w-full">Concluir</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title="Adicionar Colaborador">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Permissões que serão concedidas */}
        <div style={{ background: 'rgba(107,63,231,0.08)', border: '1px solid rgba(107,63,231,0.2)', borderRadius: 12, padding: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8B63F0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
            <ShieldCheck size={12} style={{ display: 'inline', marginRight: 4 }} />
            Permissões do Administrador
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PERMISSIONS.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ color: p.granted ? '#00E5A0' : '#FF4D6D', fontSize: 14 }}>{p.granted ? '✓' : '✗'}</span>
                <span style={{ color: p.granted ? '#C0B8E8' : '#4A3870' }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11, color: '#A098C8', fontWeight: 600, display: 'block', marginBottom: 6 }}>Nome completo *</label>
          <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Ex: João Silva" style={inputStyle} />
        </div>

        <div>
          <label style={{ fontSize: 11, color: '#A098C8', fontWeight: 600, display: 'block', marginBottom: 6 }}>E-mail *</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="colaborador@agencia.com" style={inputStyle} />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 11, color: '#A098C8', fontWeight: 600 }}>Senha *</label>
            <button onClick={genPassword} style={{ fontSize: 11, color: '#6B3FE7', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={11} /> Gerar senha
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="Mínimo 8 caracteres"
              style={{ ...inputStyle, paddingRight: 40 }}
            />
            <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6A6090' }}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && <p style={{ fontSize: 12, color: '#FF4D6D', background: 'rgba(255,77,109,0.1)', padding: '8px 12px', borderRadius: 10 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <Button variant="ghost" onClick={handleClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleCreate} loading={loading} className="flex-1">
            <UserPlus size={14} /> Criar Acesso
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function RemoveConfirmModal({ open, member, onClose, onConfirm, loading }: {
  open: boolean; member: StaffMember | null; onClose: () => void; onConfirm: () => void; loading: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title="Remover acesso">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          <p style={{ color: '#F0EEF8', fontWeight: 700, fontSize: 14 }}>{member?.full_name}</p>
          <p style={{ color: '#6A6090', fontSize: 12, marginTop: 4 }}>
            Ao remover, o colaborador perderá acesso imediato ao sistema. Essa ação pode ser revertida criando um novo acesso.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} className="flex-1">
            <Trash2 size={14} /> Remover acesso
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function Team() {
  const { profile } = useAuthStore()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [removing, setRemoving] = useState<StaffMember | null>(null)
  const [removeLoading, setRemoveLoading] = useState(false)

  const isOwner = profile?.role === 'owner'

  const loadStaff = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'staff')
      .order('created_at', { ascending: false })
    setStaff((data || []) as StaffMember[])
    setLoading(false)
  }

  useEffect(() => { loadStaff() }, [])

  const handleRemove = async () => {
    if (!removing) return
    setRemoveLoading(true)
    // Desativa o usuário no Auth (sem deletar — pode ser reativado)
    await supabase.from('profiles').update({ is_active: false, role: 'client' }).eq('id', removing.id)
    await supabase.auth.admin.deleteUser(removing.id).catch(() => {})
    setRemoveLoading(false)
    setRemoving(null)
    loadStaff()
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#F0EEF8' }}>
            Equipe
          </h1>
          <p style={{ fontSize: 13, color: '#6A6090', marginTop: 2 }}>
            Sócios e colaboradores com acesso ao sistema
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus size={14} /> Adicionar Colaborador
          </Button>
        )}
      </div>

      {/* Card do proprietário */}
      <div style={{ background: 'linear-gradient(135deg, rgba(107,63,231,0.2), rgba(192,64,184,0.1))', border: '1px solid rgba(192,64,184,0.25)', borderRadius: 18, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #6B3FE7, #C040B8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: 'white',
              boxShadow: '0 4px 16px rgba(192,64,184,0.4)',
            }}>
              {profile?.full_name?.[0] || '?'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#F0EEF8' }}>{profile?.full_name}</p>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: 'linear-gradient(135deg,#6B3FE7,#C040B8)', color: 'white', letterSpacing: 0.5 }}>
                  PROPRIETÁRIO
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#6A6090' }}>{profile?.email}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: '#6A6090' }}>Acesso total</p>
            <p style={{ fontSize: 11, color: '#00E5A0', fontWeight: 600 }}>● Ativo</p>
          </div>
        </div>
      </div>

      {/* Lista de staff */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Administradores ({staff.length})
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6A6090' }}>Carregando...</div>
        ) : staff.length === 0 ? (
          <div style={{ background: 'rgba(14,12,46,0.8)', border: '1px dashed rgba(107,63,231,0.25)', borderRadius: 18, padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <p style={{ color: '#A098C8', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Nenhum colaborador ainda</p>
            <p style={{ color: '#6A6090', fontSize: 12, marginBottom: 20 }}>
              Adicione sócios e colaboradores para que eles possam gerenciar clientes e campanhas.
            </p>
            {isOwner && (
              <Button onClick={() => setShowCreate(true)}>
                <UserPlus size={14} /> Adicionar primeiro colaborador
              </Button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {staff.map(member => (
              <div key={member.id} style={{
                background: 'rgba(14,12,46,0.9)', border: '1px solid rgba(107,63,231,0.18)',
                borderRadius: 16, padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(107,63,231,0.35)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(107,63,231,0.18)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: avatarGradient(member.full_name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800, color: 'white',
                  }}>
                    {member.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#F0EEF8' }}>{member.full_name}</p>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(107,63,231,0.2)', color: '#8B63F0', border: '1px solid rgba(107,63,231,0.3)' }}>
                        ADMIN
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#6A6090' }}>{member.email}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 10, color: '#00E5A0', fontWeight: 600 }}>● Ativo</p>
                    <p style={{ fontSize: 10, color: '#6A6090', marginTop: 2 }}>Acesso total</p>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => setRemoving(member)}
                      title="Remover acesso"
                      style={{
                        padding: 8, borderRadius: 10, border: '1px solid rgba(255,77,109,0.2)',
                        background: 'transparent', cursor: 'pointer', color: '#FF4D6D', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,109,0.1)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Painel de permissões */}
      <div style={{ background: 'rgba(14,12,46,0.7)', border: '1px solid rgba(107,63,231,0.15)', borderRadius: 18, padding: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
          O que os administradores podem fazer
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {PERMISSIONS.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ color: p.granted ? '#00E5A0' : '#FF4D6D', fontSize: 16, lineHeight: 1 }}>
                {p.granted ? '✓' : '✗'}
              </span>
              <span style={{ color: p.granted ? '#A098C8' : '#4A3870' }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modais */}
      <CreateStaffModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadStaff}
      />
      <RemoveConfirmModal
        open={!!removing}
        member={removing}
        onClose={() => setRemoving(null)}
        onConfirm={handleRemove}
        loading={removeLoading}
      />
    </div>
  )
}
