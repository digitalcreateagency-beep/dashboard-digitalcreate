import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A14] disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-gradient-to-r from-[#6B3FE7] to-[#C040B8] text-white hover:from-[#7B4FF7] hover:to-[#D050C8] focus:ring-[#6B3FE7] shadow-lg shadow-[#6B3FE7]/30': variant === 'primary',
          'bg-[#0E0C2E] text-[#F0EEF8] border border-[#6B3FE7]/25 hover:border-[#C040B8]/40 hover:bg-[#140F38] focus:ring-[#6B3FE7]/50': variant === 'secondary',
          'text-[#A098C8] hover:text-[#F0EEF8] hover:bg-[#1A1A2E]': variant === 'ghost',
          'bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/30 hover:bg-[#FF4D6D]/30': variant === 'danger',
          'px-3 py-1.5 text-xs': size === 'sm',
          'px-4 py-2.5 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        className
      )}
    >
      {loading && <span className="animate-spin rounded-full border-2 border-current border-t-transparent w-3.5 h-3.5" />}
      {children}
    </button>
  )
}
