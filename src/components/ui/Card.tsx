import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: 'purple' | 'cyan' | 'magenta'
  onClick?: () => void
}

export function Card({ children, className, glow, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl p-5 transition-all duration-200',
        glow === 'purple' && 'shadow-lg shadow-[#6B3FE7]/15',
        glow === 'cyan' && 'shadow-lg shadow-[#00D4FF]/10',
        glow === 'magenta' && 'shadow-lg shadow-[#C040B8]/15',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        background: 'rgba(14,12,46,0.85)',
        border: '1px solid rgba(107,63,231,0.18)',
        backdropFilter: 'blur(8px)',
        ...(onClick ? {} : {}),
      }}
      onMouseEnter={onClick ? (e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(192,64,184,0.35)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(107,63,231,0.12)'
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(107,63,231,0.18)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = ''
      } : undefined}
    >
      {children}
    </div>
  )
}
