import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabase'
import type { Platform } from '../../types'

interface ConnectPlatformModalProps {
  open: boolean
  onClose: () => void
  clientId: string
  platform: Platform
  platformLabel: string
  platformColor: string
  onSuccess: () => void
}

// Google Ads precisa de credenciais OAuth completas (não suporta chamadas diretas do browser)
function GoogleAdsForm({ clientId, onSuccess, onClose, platformColor }: {
  clientId: string; onSuccess: () => void; onClose: () => void; platformColor: string
}) {
  const [form, setForm] = useState({ developerToken: '', clientId: '', clientSecret: '', refreshToken: '', customerId: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.developerToken || !form.clientId || !form.clientSecret || !form.refreshToken || !form.customerId) {
      setError('Todos os campos são obrigatórios.'); return
    }
    setLoading(true)
    setError('')
    const credJson = JSON.stringify({
      developerToken: form.developerToken.trim(),
      clientId: form.clientId.trim(),
      clientSecret: form.clientSecret.trim(),
      refreshToken: form.refreshToken.trim(),
    })
    const customerId = form.customerId.replace(/-/g, '').trim()
    const { error: err } = await supabase.from('platform_tokens').upsert({
      client_id: clientId, platform: 'google_ads',
      access_token: credJson, account_id: customerId,
      is_connected: true, updated_at: new Date().toISOString()
    }, { onConflict: 'client_id,platform' })
    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess(); onClose()
  }

  const inputCls = "w-full bg-[#0A0A14] border border-[#4285F4]/20 rounded-xl px-3 py-2.5 text-sm text-[#F0EEF8] focus:outline-none focus:border-[#4285F4] transition-colors placeholder:text-[#3A3360] font-mono"

  return (
    <div className="space-y-4">
      <div className="px-3 py-3 rounded-xl text-xs bg-[#0A0A14] border border-[#4285F4]/20 space-y-2">
        <p className="text-[#4285F4] font-semibold">Como obter as credenciais:</p>
        <p className="text-[#A098C8]">1. <strong className="text-[#F0EEF8]">Developer Token:</strong> Google Ads → Ferramentas → Central de API</p>
        <p className="text-[#A098C8]">2. <strong className="text-[#F0EEF8]">Client ID + Secret:</strong> <a className="text-[#4285F4] underline" href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">console.cloud.google.com</a> → Credenciais → OAuth 2.0</p>
        <p className="text-[#A098C8]">3. <strong className="text-[#F0EEF8]">Refresh Token:</strong> <a className="text-[#4285F4] underline" href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer">OAuth Playground</a> → scope: <code>https://www.googleapis.com/auth/adwords</code></p>
        <p className="text-[#A098C8]">4. <strong className="text-[#F0EEF8]">Customer ID:</strong> número no topo do Google Ads (ex: 123-456-7890)</p>
      </div>

      {[
        { key: 'developerToken', label: 'Developer Token *', ph: 'Ex: ABcDeF_GhIjKlMnO' },
        { key: 'clientId', label: 'OAuth Client ID *', ph: 'Ex: 123456789-abc.apps.googleusercontent.com' },
        { key: 'clientSecret', label: 'OAuth Client Secret *', ph: 'Ex: GOCSPX-...' },
        { key: 'refreshToken', label: 'Refresh Token *', ph: 'Ex: 1//0abc...' },
        { key: 'customerId', label: 'Customer ID (Google Ads) *', ph: 'Ex: 123-456-7890' },
      ].map(f => (
        <div key={f.key}>
          <label className="block text-xs text-[#A098C8] mb-1.5 font-medium">{f.label}</label>
          <input value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)}
            placeholder={f.ph} className={inputCls} />
        </div>
      ))}

      {error && <p className="text-xs text-[#FF4D6D] bg-[#FF4D6D]/10 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex gap-3 pt-1">
        <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button onClick={handleSave} loading={loading} className="flex-1" style={{ background: platformColor }}>
          Salvar Conexão
        </Button>
      </div>
    </div>
  )
}

export function ConnectPlatformModal({
  open, onClose, clientId, platform, platformLabel, platformColor, onSuccess
}: ConnectPlatformModalProps) {
  const [accessToken, setAccessToken] = useState('')
  const [accountId, setAccountId] = useState('')
  const [pageId, setPageId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!accessToken || !accountId) { setError('Token e ID da conta são obrigatórios.'); return }
    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('platform_tokens').upsert({
      client_id: clientId,
      platform,
      access_token: accessToken,
      account_id: accountId,
      page_id: pageId || null,
      is_connected: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'client_id,platform' })

    setLoading(false)
    if (err) { setError(err.message); return }
    setAccessToken('')
    setAccountId('')
    setPageId('')
    onSuccess()
    onClose()
  }

  const helpText: Record<Exclude<Platform, 'google_ads'>, { tokenLabel: string; accountLabel: string; hint: string; extra?: string }> = {
    meta_ads: {
      tokenLabel: 'Access Token do Meta (System User)',
      accountLabel: 'ID da Conta de Anúncios — começa com act_ (ex: act_1234567890)',
      hint: 'Business Suite → Configurações → Usuários do sistema → Gerar token'
    },
    instagram: {
      tokenLabel: 'Access Token do Instagram (mesmo token do Meta)',
      accountLabel: 'Instagram Business Account ID — só números, SEM act_ (ex: 17841475214596460)',
      hint: 'Meta Business Suite → Instagram → clique na conta → copie o ID numérico na URL',
      extra: 'O ID do Instagram é diferente do ID da conta de anúncios. Não use act_xxx aqui.'
    },
    facebook_page: {
      tokenLabel: 'Access Token da Página (mesmo token do Meta)',
      accountLabel: 'Page ID da Página do Facebook — só números, SEM act_ (ex: 123456789012345)',
      hint: 'Acesse sua Página no Facebook → Sobre → ID da Página (no rodapé)',
      extra: 'O Page ID é diferente do ID da conta de anúncios. Não use act_xxx aqui.'
    }
  }

  if (platform === 'google_ads') {
    return (
      <Modal open={open} onClose={onClose} title="Conectar Google Ads">
        <GoogleAdsForm clientId={clientId} onSuccess={onSuccess} onClose={onClose} platformColor={platformColor} />
      </Modal>
    )
  }

  const help = helpText[platform as Exclude<Platform, 'google_ads'>]

  return (
    <Modal open={open} onClose={onClose} title={`Conectar ${platformLabel}`}>
      <div className="space-y-4">
        <div className="px-3 py-2.5 rounded-xl text-xs text-[#A098C8] bg-[#0A0A14] border border-[#6B3FE7]/15 space-y-1">
          <p>💡 {help.hint}</p>
          {help.extra && <p className="text-[#FF4D6D]">⚠️ {help.extra}</p>}
        </div>

        <div>
          <label className="block text-xs text-[#A098C8] mb-1.5 font-medium">{help.tokenLabel} *</label>
          <textarea
            value={accessToken}
            onChange={e => setAccessToken(e.target.value)}
            rows={3}
            placeholder="Cole o access token aqui..."
            className="w-full bg-[#0A0A14] border border-[#6B3FE7]/20 rounded-xl px-3 py-2.5 text-xs text-[#F0EEF8] focus:outline-none focus:border-[#6B3FE7] transition-colors placeholder:text-[#3A3360] resize-none font-mono"
          />
        </div>

        <div>
          <label className="block text-xs text-[#A098C8] mb-1.5 font-medium">{help.accountLabel} *</label>
          <input
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            placeholder="Ex: act_123456789"
            className="w-full bg-[#0A0A14] border border-[#6B3FE7]/20 rounded-xl px-3 py-2.5 text-sm text-[#F0EEF8] focus:outline-none focus:border-[#6B3FE7] transition-colors placeholder:text-[#3A3360]"
          />
        </div>

        {(platform === 'instagram' || platform === 'facebook_page') && (
          <div>
            <label className="block text-xs text-[#A098C8] mb-1.5 font-medium">Page ID (opcional)</label>
            <input
              value={pageId}
              onChange={e => setPageId(e.target.value)}
              placeholder="ID da página"
              className="w-full bg-[#0A0A14] border border-[#6B3FE7]/20 rounded-xl px-3 py-2.5 text-sm text-[#F0EEF8] focus:outline-none focus:border-[#6B3FE7] transition-colors placeholder:text-[#3A3360]"
            />
          </div>
        )}

        {error && <p className="text-xs text-[#FF4D6D] bg-[#FF4D6D]/10 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSave} loading={loading} className="flex-1"
            style={{ background: platformColor }}>
            Salvar Conexão
          </Button>
        </div>
      </div>
    </Modal>
  )
}
