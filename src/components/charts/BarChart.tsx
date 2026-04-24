import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { MetricRow, Platform } from '../../types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface BarChartProps {
  data: MetricRow[]
  platforms: Platform[]
  metric: 'spend' | 'clicks' | 'impressions' | 'conversions'
}

const COLORS: Record<Platform, string> = {
  meta_ads: '#1877F2',
  google_ads: '#4285F4',
  instagram: '#E1306C',
  facebook_page: '#1877F2'
}

export function MetricBarChart({ data, platforms, metric }: BarChartProps) {
  const byDate: Record<string, any> = {}
  for (const row of data) {
    if (!platforms.includes(row.platform)) continue
    const d = row.date
    if (!byDate[d]) byDate[d] = { date: d }
    byDate[d][row.platform] = (byDate[d][row.platform] || 0) + row[metric]
  }

  const chartData = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({ ...r, date: format(parseISO(r.date), 'dd/MM', { locale: ptBR }) }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ReBarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222240" />
        <XAxis dataKey="date" tick={{ fill: '#6A6090', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6A6090', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(107,63,231,0.3)', borderRadius: 12, color: '#F0EEF8' }}
          labelStyle={{ color: '#A098C8', fontSize: 12 }}
        />
        {platforms.map(p => (
          <Bar key={p} dataKey={p} fill={COLORS[p]} radius={[4, 4, 0, 0]} />
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  )
}
