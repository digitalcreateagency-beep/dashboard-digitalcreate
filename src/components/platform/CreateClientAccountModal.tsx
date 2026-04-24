import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabase'
import { UserPlus, Mail, Lock, User, CheckCircle } from 'lucide-react'

interface CreateClientAccountModalProps {
  open: boolean
  onClose: () => void
  clientId: string
  clientName: string
  existingUserId?: string
}

export function CreateClientAccountModal({
  open, onClose, clientId, clientName, existingUserId
}: CreateClientAccountModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState(clientName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleCreate = async () => {
    if (!email || !password || !fullName) { setError('Preencha todos os campos.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    setError('')

    const { data, error: fnError } = await supabase.functions.invoke('create-client-user', {
      body: { client_id: clientId, email, password, full_name: fullName }
    })

    setLoading(false)

    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || 'Erro ao criar conta.')
      return
    }

    setSuccess(true)
  }

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setFullName(clientName)
    setError('')
    setSuccess(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Criar Acesso do Cliente">
      {success ? (
        <div className="text-center py-4 space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#00E5A0]/15 flex items-center justify-center mx-auto">
            <CheckCircle size={28} className="text-[#00E5A0]" />
          </div>
          <p className="text-[#F0EEF8] font-semibold">Acesso criado com sucesso!</p>
          <div className="bg-[#0A0A14] border border-[#00E5A0]/20 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs text-[#6A6090]">Envie estas credenciais ao cliente:</p>
            <div className="flex items-center gap-2 text-sm text-[#F0EEF8]">
              <Mail size={13} className="text-[#6B3FE7]" /> {email}
            </div>
            <div className="flex items-center gap-2 text-sm text-[#F0EEF8]">
              <Lock size={13} className="text-[#6B3FE7]" /> {password}
            </div>
            <p className="text-[10px] text-[#6A6090] mt-2">Login: <span className="text-[#00D4FF]">seu-dominio.com/login</span></p>
          </div>
          <Button onClick={handleClose} className="w-full mt-2">Fechar</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {existingUserId && (
            <div className="px-3 py-2.5 rounded-xl text-xs bg-[#FFB547]/10 border border-[#FFB547]/20 text-[#FFB547]">
              ⚠️ Este cliente já possui uma conta vinculada. Criar nova conta substituirá a atual.
            </div>
          )}

          <div className="px-3 py-2.5 rounded-xl text-xs text-[#A098C8] bg-[#0A0A14] border border-[#6B3FE7]/15">
            <p className="flex items-center gap-1.5"><UserPlus size={11} /> O cliente receberá acesso apenas aos dados das plataformas que você habilitou.</p>
          </div>

          <div>
            <label className="block text-xs text-[#A098C8] mb-1.5 font-medium">Nome completo</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Nome do cliente"
              className="w-full bg-[#0A0A14] border border-[#6B3FE7]/20 rounded-xl px-3 py-2.5 text-sm text-[#F0EEF8] focus:outline-none focus:border-[#6B3FE7] transition-colors placeholder:text-[#3A3360]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#A098C8] mb-1.5 font-medium">E-mail de acesso *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="cliente@empresa.com"
              className="w-full bg-[#0A0A14] border border-[#6B3FE7]/20 rounded-xl px-3 py-2.5 text-sm text-[#F0EEF8] focus:outline-none focus:border-[#6B3FE7] transition-colors placeholder:text-[#3A3360]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#A098C8] mb-1.5 font-medium">Senha *</label>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-[#0A0A14] border border-[#6B3FE7]/20 rounded-xl px-3 py-2.5 text-sm text-[#F0EEF8] focus:outline-none focus:border-[#6B3FE7] transition-colors placeholder:text-[#3A3360] font-mono"
            />
            <p className="text-[10px] text-[#6A6090] mt-1">A senha ficará visível aqui para você copiar e enviar ao cliente.</p>
          </div>

          {error && <p className="text-xs text-[#FF4D6D] bg-[#FF4D6D]/10 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={handleClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleCreate} loading={loading} className="flex-1">
              <UserPlus size={14} /> Criar Acesso
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
