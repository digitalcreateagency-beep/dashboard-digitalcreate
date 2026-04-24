import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'purple'
}

export function Badge({ children, variant = 'purple' }: BadgeProps) {
  return (
    <span className={clsx(
      'px-2.5 py-1 rounded-full text-[10px] font-semibold',
      {
        'bg-[#00E5A0]/15 text-[#00E5A0]': variant === 'success',
        'bg-[#FF4D6D]/15 text-[#FF4D6D]': variant === 'danger',
        'bg-[#FFB547]/15 text-[#FFB547]': variant === 'warning',
        'bg-[#00D4FF]/15 text-[#00D4FF]': variant === 'info',
        'bg-[#6B3FE7]/20 text-[#8B63F0]': variant === 'purple',
      }
    )}>
      {children}
    </span>
  )
}
