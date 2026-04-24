import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string
  delta?: number
  icon?: React.ReactNode
  color?: 'purple' | 'cyan' | 'green' | 'amber'
}

const colorConfig = {
  purple: {
    bg: 'linear-gradient(135deg, rgba(107,63,231,0.25) 0%, rgba(192,64,184,0.08) 100%)',
    border: 'rgba(107,63,231,0.35)',
    glow: 'rgba(107,63,231,0.2)',
    accent: '#9B73FF',
  },
  cyan: {
    bg: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(0,212,255,0.04) 100%)',
    border: 'rgba(0,212,255,0.25)',
    glow: 'rgba(0,212,255,0.12)',
    accent: '#00D4FF',
  },
  green: {
    bg: 'linear-gradient(135deg, rgba(0,229,160,0.15) 0%, rgba(0,229,160,0.04) 100%)',
    border: 'rgba(0,229,160,0.25)',
    glow: 'rgba(0,229,160,0.12)',
    accent: '#00E5A0',
  },
  amber: {
    bg: 'linear-gradient(135deg, rgba(255,181,71,0.15) 0%, rgba(255,181,71,0.04) 100%)',
    border: 'rgba(255,181,71,0.25)',
    glow: 'rgba(255,181,71,0.1)',
    accent: '#FFB547',
  },
}

export function MetricCard({ label, value, delta, icon, color = 'purple' }: MetricCardProps) {
  const cfg = colorConfig[color]
  const isPositive = delta !== undefined && delta >= 0

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 18,
      padding: '18px 20px',
      boxShadow: `0 4px 20px ${cfg.glow}`,
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ color: '#A098C8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {label}
        </span>
        {icon && <div style={{ opacity: 0.6 }}>{icon}</div>}
      </div>
      <div style={{
        fontSize: 24, fontWeight: 800, color: '#F0EEF8',
        fontFamily: 'Syne, sans-serif', marginBottom: 6, letterSpacing: -0.5,
      }}>
        {value}
      </div>
      {delta !== undefined && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 600,
          color: isPositive ? '#00E5A0' : '#FF4D6D',
        }}>
          {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {isPositive ? '+' : ''}{delta.toFixed(1)}% vs período anterior
        </div>
      )}
    </div>
  )
}
