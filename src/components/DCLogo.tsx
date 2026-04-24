interface DCLogoProps {
  size?: number
  darkBg?: boolean // true = fundo escuro (app), false = fundo branco (PDF)
}

export function DCLogo({ size = 40, darkBg = true }: DCLogoProps) {
  const bgColor = darkBg ? '#0D0B28' : '#ffffff'
  const id = `dcg-${size}`

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-c`} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#00C8FF" />
          <stop offset="55%" stopColor="#5B6FE8" />
          <stop offset="100%" stopColor="#1A1060" />
        </linearGradient>
        <linearGradient id={`${id}-shadow`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00C8FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6B3FE7" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* D letter — white */}
      <path
        d="M12 6 L12 94 L47 94 Q92 94 92 50 Q92 6 47 6 Z"
        fill="white"
      />
      {/* D inner cutout */}
      <path
        d="M27 22 L27 78 L46 78 Q72 78 72 50 Q72 22 46 22 Z"
        fill={bgColor}
      />
      {/* C arc with gradient — opens to the right */}
      <path
        d="M 66 27 A 24 24 0 1 0 66 73"
        fill="none"
        stroke={`url(#${id}-c)`}
        strokeWidth="9.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function DCLogoFull({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <DCLogo size={38} darkBg={true} />
      <div>
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#F0EEF8', lineHeight: 1.1 }}>
          DigitalCreate
        </p>
        <p style={{ fontSize: 10, color: '#6A6090', lineHeight: 1 }}>Agência de Marketing Digital</p>
      </div>
    </div>
  )
}
