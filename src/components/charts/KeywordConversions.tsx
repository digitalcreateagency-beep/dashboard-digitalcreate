import { useState } from 'react'
import { Search, TrendingUp, MessageCircle, Tag, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import type { GoogleAdsKeyword, GoogleAdsClick } from '../../types'

interface Props {
  keywords: GoogleAdsKeyword[]
  clicks: GoogleAdsClick[]
  clientId?: string
  whatsappPhone?: string
}

const MATCH_LABELS: Record<string, { label: string; color: string }> = {
  EXACT:   { label: 'Exata', color: '#00E5A0' },
  PHRASE:  { label: 'Frase', color: '#00D4FF' },
  BROAD:   { label: 'Ampla', color: '#F59E0B' },
  BROAD_MATCH_MODIFIER: { label: 'Ampla+', color: '#F59E0B' },
}

const NET_LABELS: Record<string, string> = {
  SEARCH:   '🔍 Pesquisa',
  DISPLAY:  '🖼️ Display',
  YOUTUBE:  '▶️ YouTube',
  UNKNOWN:  '❓',
}

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length < 8) return phone
  return d.slice(0, 4) + '••••' + d.slice(-3)
}

function AvatarInitials({ name, phone }: { name: string | null; phone: string | null }) {
  const text = name ? name.charAt(0).toUpperCase() : (phone || '?').charAt(0)
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
      style={{ background: 'linear-gradient(135deg,#4285F4,#34A853)' }}>
      {text}
    </div>
  )
}

type Tab = 'keywords' | 'leads' | 'snippet'

export function KeywordConversions({ keywords, clicks, clientId, whatsappPhone }: Props) {
  const [tab, setTab] = useState<Tab>('keywords')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'clicks' | 'conversions' | 'cost'>('clicks')
  const [sortAsc, setSortAsc] = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState(false)

  const matchedLeads = clicks.filter(c => c.matched_at !== null)
  const totalClicks = clicks.length
  const totalMatched = matchedLeads.length

  // Agrega keywords por texto (soma múltiplos dias)
  const keywordMap = new Map<string, GoogleAdsKeyword & { _key: string }>()
  for (const kw of keywords) {
    const key = `${kw.keyword_text}|${kw.match_type}|${kw.campaign_id}`
    const ex = keywordMap.get(key)
    if (ex) {
      ex.impressions  += kw.impressions
      ex.clicks       += kw.clicks
      ex.cost         += kw.cost
      ex.conversions  += kw.conversions
    } else {
      keywordMap.set(key, { ...kw, _key: key })
    }
  }
  const aggregated = Array.from(keywordMap.values())

  const filtered = aggregated
    .filter(kw => !search || kw.keyword_text.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const diff = (a[sortBy] as number) - (b[sortBy] as number)
      return sortAsc ? diff : -diff
    })

  const SortBtn = ({ col, label }: { col: typeof sortBy; label: string }) => (
    <button onClick={() => { if (sortBy === col) setSortAsc(!sortAsc); else { setSortBy(col); setSortAsc(false) } }}
      className={`flex items-center gap-1 text-xs font-medium transition-colors ${sortBy === col ? 'text-[#4285F4]' : 'text-[#6A6090] hover:text-[#A098C8]'}`}>
      {label}
      {sortBy === col ? (sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ChevronDown size={10} className="opacity-30" />}
    </button>
  )

  // Snippet para landing page
  const supabaseUrl = 'https://zdynksdhbkpwskstowlq.supabase.co'
  const snippetCode = `<!-- DigitalCreate: Rastreamento Google Ads → WhatsApp -->
<script>
(function() {
  var p = new URLSearchParams(window.location.search);
  var tk = {
    keyword:       p.get('keyword') || p.get('utm_term') || '',
    campaign_id:   p.get('campaignid') || '',
    campaign_name: p.get('utm_campaign') || '',
    adgroup_id:    p.get('adgroupid') || '',
    adgroup_name:  p.get('utm_content') || '',
    match_type:    p.get('matchtype') || '',
    network:       p.get('network') || '',
    device:        p.get('device') || '',
    gclid:         p.get('gclid') || '',
    landing_url:   encodeURIComponent(window.location.href)
  };
  if (!tk.keyword && !tk.gclid) return;
  var base = '${supabaseUrl}/functions/v1/track-click';
  var qs = 'client_id=${clientId || 'SEU_CLIENT_ID'}&phone=${whatsappPhone ? whatsappPhone.replace(/\D/g, '') : '55119XXXXXXXX'}';
  Object.keys(tk).forEach(function(k) { if (tk[k]) qs += '&' + k + '=' + tk[k]; });
  document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]').forEach(function(el) {
    el.setAttribute('href', base + '?' + qs);
  });
})();
</script>`

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(snippetCode)
    setCopiedSnippet(true)
    setTimeout(() => setCopiedSnippet(false), 2000)
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'keywords', label: '🔑 Palavras-chave', count: aggregated.length },
    { key: 'leads',    label: '📲 Leads Convertidos', count: matchedLeads.length },
    { key: 'snippet',  label: '🔗 Snippet Landing Page' },
  ]

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Palavras-chave', value: aggregated.length, icon: '🔑', color: '#4285F4' },
          { label: 'Cliques na LP', value: totalClicks, icon: '👆', color: '#34A853' },
          { label: 'Abriram WA', value: totalMatched, icon: '📲', color: '#00E5A0' },
          { label: 'Taxa Conversão', value: totalClicks > 0 ? `${((totalMatched / totalClicks) * 100).toFixed(1)}%` : '—', icon: '🎯', color: '#FBBC04' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl p-4 border"
            style={{ background: 'rgba(14,12,46,0.85)', borderColor: `${item.color}25` }}>
            <p className="text-xs text-[#6A6090] mb-1">{item.label}</p>
            <div className="flex items-center gap-2">
              <span className="text-base">{item.icon}</span>
              <span className="text-xl font-bold" style={{ color: item.color }}>{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#0D0B1F] border border-[#1E1B3A]">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              tab === t.key ? 'bg-[#1A1A3E] text-[#F0EEF8] shadow' : 'text-[#6A6090] hover:text-[#A098C8]'
            }`}>
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[#4285F4]/20 text-[#4285F4]">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Palavras-chave */}
      {tab === 'keywords' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0D0B1F] border border-[#1E1B3A]">
            <Search size={13} className="text-[#6A6090]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar palavra-chave..."
              className="bg-transparent text-sm text-[#F0EEF8] placeholder-[#4A4070] outline-none flex-1" />
          </div>

          <div className="rounded-2xl overflow-hidden border border-[#1E1B3A]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1E1B3A]" style={{ background: 'rgba(14,12,46,0.9)' }}>
                  <th className="px-4 py-3 text-left text-[#6A6090] font-medium">Palavra-chave</th>
                  <th className="px-3 py-3 text-left text-[#6A6090] font-medium">Campanha / Grupo</th>
                  <th className="px-3 py-3 text-right"><SortBtn col="clicks" label="Cliques" /></th>
                  <th className="px-3 py-3 text-right"><SortBtn col="conversions" label="Conv." /></th>
                  <th className="px-3 py-3 text-right"><SortBtn col="cost" label="Custo" /></th>
                  <th className="px-3 py-3 text-right text-[#6A6090] font-medium">CPC Médio</th>
                  <th className="px-3 py-3 text-right text-[#6A6090] font-medium">QS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#6A6090]">
                      {keywords.length === 0
                        ? 'Clique em "Buscar Palavras-chave" para carregar dados do Google Ads.'
                        : 'Nenhuma palavra-chave encontrada.'}
                    </td>
                  </tr>
                )}
                {filtered.map((kw, i) => {
                  const match = MATCH_LABELS[kw.match_type] || { label: kw.match_type, color: '#6A6090' }
                  const costPerConv = kw.conversions > 0 ? kw.cost / kw.conversions : 0
                  return (
                    <tr key={kw._key} className="border-b border-[#1E1B3A]/50 transition-colors hover:bg-[#1A1A2E]/40"
                      style={{ background: i % 2 === 0 ? 'rgba(14,12,46,0.6)' : 'rgba(10,10,20,0.4)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#F0EEF8] truncate max-w-[180px]">{kw.keyword_text}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ color: match.color, background: `${match.color}15` }}>
                            {match.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-[#A098C8] truncate max-w-[140px]">{kw.campaign_name}</p>
                        <p className="text-[#6A6090] truncate max-w-[140px]">{kw.adgroup_name}</p>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="font-semibold text-[#4285F4]">{kw.clicks.toLocaleString('pt-BR')}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        {kw.conversions > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-[#00E5A0]">{Number(kw.conversions).toFixed(1)}</span>
                            {costPerConv > 0 && <span className="text-[10px] text-[#6A6090]">R${costPerConv.toFixed(2)}/conv</span>}
                          </div>
                        ) : (
                          <span className="text-[#4A4070]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-[#F0EEF8]">
                        R${kw.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3 text-right text-[#A098C8]">
                        R${kw.avg_cpc.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {kw.quality_score != null ? (
                          <span className={`font-bold ${kw.quality_score >= 7 ? 'text-[#00E5A0]' : kw.quality_score >= 5 ? 'text-[#FBBC04]' : 'text-[#FF4D6D]'}`}>
                            {kw.quality_score}
                          </span>
                        ) : (
                          <span className="text-[#4A4070]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Leads Convertidos */}
      {tab === 'leads' && (
        <div className="space-y-3">
          {clicks.length === 0 && (
            <div className="rounded-2xl border border-[#1E1B3A] p-8 text-center" style={{ background: 'rgba(14,12,46,0.6)' }}>
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm text-[#A098C8]">Nenhum clique rastreado ainda.</p>
              <p className="text-xs text-[#6A6090] mt-1">Instale o snippet na landing page para começar a rastrear.</p>
            </div>
          )}
          {clicks.map(click => (
            <div key={click.id} className="rounded-2xl border p-4 transition-all"
              style={{
                background: 'rgba(14,12,46,0.85)',
                borderColor: click.matched_at ? 'rgba(0,229,160,0.25)' : 'rgba(30,27,58,0.8)'
              }}>
              <div className="flex items-start gap-3">
                <AvatarInitials name={click.contact_name} phone={click.wa_id} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-[#F0EEF8]">
                      {click.contact_name || 'Contato desconhecido'}
                    </span>
                    {click.matched_at ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#00E5A0]/10 text-[#00E5A0] border border-[#00E5A0]/20">
                        ✓ Converteu no WhatsApp
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FBBC04]/10 text-[#FBBC04] border border-[#FBBC04]/20">
                        Aguardando mensagem
                      </span>
                    )}
                  </div>

                  {click.wa_id && (
                    <a href={`https://wa.me/${click.wa_id}`} target="_blank" rel="noreferrer"
                      className="text-xs text-[#00D4FF] hover:underline">
                      📱 {maskPhone(click.wa_id)}
                    </a>
                  )}

                  {/* Atribuição */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {click.keyword && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#4285F4]/10 border border-[#4285F4]/20">
                        <Tag size={10} className="text-[#4285F4]" />
                        <span className="text-[11px] text-[#4285F4] font-medium">{click.keyword}</span>
                        {click.match_type && (
                          <span className="text-[10px] text-[#4285F4]/60">({(MATCH_LABELS[click.match_type]?.label || click.match_type).toLowerCase()})</span>
                        )}
                      </div>
                    )}
                    {click.campaign_name && (
                      <span className="px-2 py-1 rounded-lg text-[11px] bg-[#1A1A2E] text-[#A098C8] border border-[#1E1B3A]">
                        📢 {click.campaign_name}
                      </span>
                    )}
                    {click.adgroup_name && (
                      <span className="px-2 py-1 rounded-lg text-[11px] bg-[#1A1A2E] text-[#A098C8] border border-[#1E1B3A]">
                        📁 {click.adgroup_name}
                      </span>
                    )}
                    {click.network && (
                      <span className="px-2 py-1 rounded-lg text-[11px] bg-[#1A1A2E] text-[#6A6090] border border-[#1E1B3A]">
                        {NET_LABELS[click.network] || click.network}
                      </span>
                    )}
                    {click.device && (
                      <span className="px-2 py-1 rounded-lg text-[11px] bg-[#1A1A2E] text-[#6A6090] border border-[#1E1B3A]">
                        {click.device === 'MOBILE' ? '📱' : click.device === 'DESKTOP' ? '💻' : '📟'} {click.device}
                      </span>
                    )}
                  </div>

                  {click.message_body && (
                    <p className="mt-2 text-xs text-[#6A6090] italic truncate">
                      💬 "{click.message_body.replace(/\[TK[A-Z0-9]+\]/, '').trim()}"
                    </p>
                  )}

                  <div className="mt-1 flex gap-3 text-[10px] text-[#4A4070]">
                    <span>Clicou: {new Date(click.clicked_at).toLocaleString('pt-BR')}</span>
                    {click.matched_at && <span>Respondeu: {new Date(click.matched_at).toLocaleString('pt-BR')}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Snippet */}
      {tab === 'snippet' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#4285F4]/20 p-4" style={{ background: 'rgba(66,133,244,0.05)' }}>
            <p className="text-sm font-semibold text-[#F0EEF8] mb-1">Como funciona</p>
            <ol className="text-xs text-[#A098C8] space-y-1 list-decimal list-inside">
              <li>Cole o snippet antes do <code className="text-[#4285F4]">&lt;/body&gt;</code> da landing page</li>
              <li>Configure os ValueTrack no Google Ads: <code className="text-[#4285F4]">{'{keyword}'}</code>, <code className="text-[#4285F4]">{'{campaignid}'}</code>, <code className="text-[#4285F4]">{'{adgroupid}'}</code></li>
              <li>Todos os botões WhatsApp da página passam pelo rastreamento automaticamente</li>
              <li>Quando o lead manda mensagem, o sistema vincula o contato à palavra-chave</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-[#1E1B3A] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#1E1B3A]"
              style={{ background: 'rgba(14,12,46,0.9)' }}>
              <span className="text-xs text-[#6A6090] font-mono">snippet.html</span>
              <button onClick={handleCopySnippet}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={{ background: copiedSnippet ? 'rgba(0,229,160,0.15)' : 'rgba(66,133,244,0.15)', color: copiedSnippet ? '#00E5A0' : '#4285F4' }}>
                {copiedSnippet ? <><Check size={11} /> Copiado!</> : <><Copy size={11} /> Copiar</>}
              </button>
            </div>
            <pre className="p-4 text-xs text-[#A098C8] overflow-x-auto font-mono leading-5"
              style={{ background: 'rgba(10,10,20,0.8)' }}>
              {snippetCode}
            </pre>
          </div>

          <div className="rounded-2xl border border-[#FBBC04]/20 p-4" style={{ background: 'rgba(251,188,4,0.05)' }}>
            <p className="text-xs font-semibold text-[#FBBC04] mb-2">⚙️ Parâmetros de URL no Google Ads</p>
            <p className="text-xs text-[#A098C8] mb-2">Configure no campo "Modelo de rastreamento" da campanha:</p>
            <code className="text-xs text-[#FBBC04] font-mono break-all">
              {`{lpurl}?keyword={keyword}&campaignid={campaignid}&adgroupid={adgroupid}&matchtype={matchtype}&network={network}&device={device}&gclid={gclid}`}
            </code>
          </div>
        </div>
      )}
    </div>
  )
}
