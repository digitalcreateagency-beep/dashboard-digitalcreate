import { Heart, MessageCircle, Share2, Users, TrendingUp, Eye, MousePointerClick } from 'lucide-react'
import { clsx } from 'clsx'

interface SocialStat {
  label: string
  value: string | number
  delta?: number
  icon: React.ReactNode
  color: 'pink' | 'blue' | 'purple' | 'green' | 'amber' | 'cyan'
}

interface SocialMetricsProps {
  platform: 'instagram' | 'facebook_page'
  data: {
    followers: number
    newFollowers: number
    likes: number
    comments: number
    shares: number
    reach: number
    impressions: number
    engagementRate: number
    profileViews: number
    websiteClicks: number
  }
}

const colorMap = {
  pink:   'from-[#E1306C]/15 to-[#E1306C]/5 border-[#E1306C]/25 text-[#E1306C]',
  blue:   'from-[#1877F2]/15 to-[#1877F2]/5 border-[#1877F2]/25 text-[#1877F2]',
  purple: 'from-[#6B3FE7]/20 to-[#6B3FE7]/5 border-[#6B3FE7]/30 text-[#8B63F0]',
  green:  'from-[#00E5A0]/15 to-[#00E5A0]/5 border-[#00E5A0]/25 text-[#00E5A0]',
  amber:  'from-[#FFB547]/15 to-[#FFB547]/5 border-[#FFB547]/25 text-[#FFB547]',
  cyan:   'from-[#00D4FF]/15 to-[#00D4FF]/5 border-[#00D4FF]/25 text-[#00D4FF]',
}

function StatCard({ label, value, delta, icon, color }: SocialStat) {
  const isPositive = delta !== undefined && delta >= 0
  return (
    <div className={clsx('bg-gradient-to-br rounded-2xl p-4 border', colorMap[color])}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-[#A098C8] text-[10px] font-medium uppercase tracking-wider">{label}</span>
        <div className="opacity-50">{icon}</div>
      </div>
      <div className="text-xl font-bold text-[#F0EEF8]">{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</div>
      {delta !== undefined && (
        <div className={clsx('text-[10px] font-medium mt-1', isPositive ? 'text-[#00E5A0]' : 'text-[#FF4D6D]')}>
          {isPositive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs anterior
        </div>
      )}
    </div>
  )
}

export function SocialMetrics({ platform, data }: SocialMetricsProps) {
  const isInstagram = platform === 'instagram'
  const accent = isInstagram ? 'pink' : 'blue'

  const stats: SocialStat[] = [
    { label: 'Seguidores', value: data.followers, icon: <Users size={14} />, color: accent },
    { label: 'Novos Seguidores', value: data.newFollowers, delta: data.newFollowers > 0 ? 100 : 0, icon: <TrendingUp size={14} />, color: 'green' },
    { label: 'Curtidas', value: data.likes, icon: <Heart size={14} />, color: accent },
    { label: 'Comentários', value: data.comments, icon: <MessageCircle size={14} />, color: 'purple' },
    { label: 'Compartilhamentos', value: data.shares, icon: <Share2 size={14} />, color: 'cyan' },
    { label: 'Alcance', value: data.reach, icon: <Eye size={14} />, color: 'amber' },
    { label: 'Impressões', value: data.impressions, icon: <Eye size={14} />, color: 'amber' },
    { label: 'Taxa de Engajamento', value: `${data.engagementRate.toFixed(2)}%`, icon: <TrendingUp size={14} />, color: 'green' },
    ...(isInstagram ? [
      { label: 'Visitas ao Perfil', value: data.profileViews, icon: <Eye size={14} />, color: 'cyan' as const },
      { label: 'Cliques no Link', value: data.websiteClicks, icon: <MousePointerClick size={14} />, color: 'purple' as const },
    ] : []),
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map(s => <StatCard key={s.label} {...s} />)}
    </div>
  )
}
