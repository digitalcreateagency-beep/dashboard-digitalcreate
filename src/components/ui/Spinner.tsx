import { clsx } from 'clsx'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span className={clsx(
      'animate-spin rounded-full border-2 border-[#6B3FE7]/30 border-t-[#6B3FE7] inline-block',
      { 'w-4 h-4': size === 'sm', 'w-6 h-6': size === 'md', 'w-8 h-8': size === 'lg' },
      className
    )} />
  )
}
