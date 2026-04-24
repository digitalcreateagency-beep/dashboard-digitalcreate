import { Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'
import type { Platform } from '../../types'

interface PlatformToggleProps {
  platform: Platform
  label: string
  color: string
  enabled: boolean
  onToggle: () => void
}

export function PlatformToggle({ label, color, enabled, onToggle }: PlatformToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={clsx(
        'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border',
        enabled ? 'text-white border-transparent' : 'bg-transparent border-[#222240] text-[#3A3360]'
      )}
      style={enabled ? { background: color, boxShadow: `0 4px 14px ${color}40` } : {}}
    >
      {enabled ? <Eye size={12} /> : <EyeOff size={12} />}
      {label}
    </button>
  )
}
