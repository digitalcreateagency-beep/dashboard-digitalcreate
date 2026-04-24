import { clsx } from 'clsx'
import { Link2, LinkIcon } from 'lucide-react'
import { Button } from '../ui/Button'
import type { PlatformToken, Platform } from '../../types'

interface PlatformCardProps {
  platform: Platform
  label: string
  color: string
  icon: string
  token?: PlatformToken
  onConnect?: () => void
}

export function PlatformCard({ platform, label, color, icon, token, onConnect }: PlatformCardProps) {
  const connected = token?.is_connected

  return (
    <div className={clsx(
      'rounded-2xl p-4 border transition-all',
      connected
        ? 'bg-[#12121E] border-[#00E5A0]/20'
        : 'bg-[#0D0D1A] border-[#222240]'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
            style={{ background: color }}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-[#F0EEF8]">{label}</p>
            {token?.account_id
              ? <p className="text-xs text-[#6A6090]">ID: {token.account_id}</p>
              : <p className="text-xs text-[#3A3360]">Não conectado</p>
            }
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full',
            connected ? 'bg-[#00E5A0]/15 text-[#00E5A0]' : 'bg-[#FF4D6D]/15 text-[#FF4D6D]'
          )}>
            {connected ? '● Online' : '● Offline'}
          </span>
          <Button variant="secondary" size="sm" onClick={onConnect}>
            {connected ? <Link2 size={11} /> : <LinkIcon size={11} />}
            {connected ? 'Reconectar' : 'Conectar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
