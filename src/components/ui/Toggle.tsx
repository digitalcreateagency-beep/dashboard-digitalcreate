import { clsx } from 'clsx'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-10 h-5 rounded-full transition-colors duration-200',
          checked ? 'bg-[#6B3FE7]' : 'bg-[#222240]'
        )}
      >
        <span className={clsx(
          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
          checked ? 'left-5' : 'left-0.5'
        )} />
      </div>
      {label && <span className="text-xs text-[#A098C8]">{label}</span>}
    </label>
  )
}
