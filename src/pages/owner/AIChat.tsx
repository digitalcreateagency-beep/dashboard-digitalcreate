import { useEffect, useRef, useState } from 'react'
import { Send, Trash2, Bot, User, Sparkles, ChevronDown } from 'lucide-react'
import { useDashboardStore } from '../../store/dashboardStore'
import { supabase } from '../../lib/supabase'
import { DCLogo } from '../../components/DCLogo'

interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

const DATE_RANGES = [
  { key: 7,  label: '7 dias' },
  { key: 14, label: '14 dias' },
  { key: 30, label: '30 dias' },
  { key: 90, label: '90 dias' },
]

const SUGGESTIONS = [
  'Qual plataforma teve melhor ROAS nesse período?',
  'Como está a taxa de engajamento do Instagram?',
  'Compare o CPC do Meta Ads com o Google Ads',
  'Quais dias tiveram mais cliques e por quê?',
  'O investimento está gerando um bom retorno?',
  'Sugira melhorias para aumentar as conversões',
  'Como está o crescimento de seguidores no período?',
  'Qual é o custo por conversão atual?',
]

function renderContent(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Bold
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const rendered = parts.map((part, j) =>
      j % 2 === 1
        ? <strong key={j} style={{ color: '#F0EEF8', fontWeight: 700 }}>{part}</strong>
        : <span key={j}>{part}</span>
    )
    // Bullet
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return (
        <div key={i} style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <span style={{ color: '#C040B8', flexShrink: 0, marginTop: 1 }}>•</span>
          <span>{rendered}</span>
        </div>
      )
    }
    // Heading (━━)
    if (line.startsWith('━') || line.startsWith('##')) {
      return <div key={i} style={{ color: '#A098C8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 4 }}>{line.replace(/━|##/g, '').trim()}</div>
    }
    if (line === '') return <div key={i} style={{ height: 6 }} />
    return <div key={i}>{rendered}</div>
  })
}

export function AIChat() {
  const { clients, loadClients } = useDashboardStore()
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [dateRange, setDateRange] = useState(30)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showClientDrop, setShowClientDrop] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { loadClients() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const selectedClient = clients.find(c => c.id === selectedClientId)

  const send = async (text?: string) => {
    const question = (text ?? input).trim()
    if (!question || !selectedClientId || loading) return

    const userMsg: Message = { role: 'user', content: question, ts: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('ai-chat', {
        body: {
          client_id: selectedClientId,
          date_range: dateRange,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        },
      })

      if (fnErr) throw new Error(fnErr.message)
      if (data?.error) throw new Error(data.error)

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, ts: Date.now() }])
    } catch (e: any) {
      setError(e.message)
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const clearChat = () => { setMessages([]); setError('') }

  const noClient = !selectedClientId
  const noMessages = messages.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent' }}>

      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid rgba(107,63,231,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        background: 'rgba(14,12,46,0.6)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6B3FE7, #C040B8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(192,64,184,0.3)',
          }}>
            <Sparkles size={17} color="white" />
          </div>
          <div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#F0EEF8' }}>
              IA Consultora
            </p>
            <p style={{ fontSize: 11, color: '#6A6090' }}>Análise de dados em linguagem natural • Groq Llama 3.3</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Seletor de período */}
          <div style={{ display: 'flex', background: 'rgba(10,8,32,0.8)', border: '1px solid rgba(107,63,231,0.2)', borderRadius: 10, padding: 3, gap: 2 }}>
            {DATE_RANGES.map(r => (
              <button key={r.key} onClick={() => setDateRange(r.key)} style={{
                padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: dateRange === r.key ? '#6B3FE7' : 'transparent',
                color: dateRange === r.key ? '#fff' : '#6A6090',
                transition: 'all 0.15s',
              }}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Seletor de cliente */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowClientDrop(!showClientDrop)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(10,8,32,0.8)', border: '1px solid rgba(107,63,231,0.25)',
              borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontSize: 12,
              color: selectedClient ? '#F0EEF8' : '#6A6090', fontWeight: 600, minWidth: 160,
            }}>
              {selectedClient ? (
                <div style={{ width: 18, height: 18, borderRadius: 6, background: 'linear-gradient(135deg,#6B3FE7,#C040B8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white', fontWeight: 800 }}>
                  {selectedClient.company_name[0]}
                </div>
              ) : <User size={13} />}
              <span style={{ flex: 1, textAlign: 'left' }}>{selectedClient?.company_name || 'Selecionar cliente'}</span>
              <ChevronDown size={12} />
            </button>
            {showClientDrop && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 100,
                background: '#0E0C2E', border: '1px solid rgba(107,63,231,0.25)',
                borderRadius: 12, padding: 6, minWidth: 200, boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              }}>
                {clients.filter(c => c.is_active).map(c => (
                  <button key={c.id} onClick={() => { setSelectedClientId(c.id); setShowClientDrop(false); clearChat() }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: selectedClientId === c.id ? 'rgba(107,63,231,0.15)' : 'transparent',
                    color: '#F0EEF8', fontSize: 13, textAlign: 'left', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(107,63,231,0.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = selectedClientId === c.id ? 'rgba(107,63,231,0.15)' : 'transparent'}
                  >
                    <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#6B3FE7,#C040B8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', fontWeight: 800 }}>
                      {c.company_name[0]}
                    </div>
                    {c.company_name}
                  </button>
                ))}
                {clients.filter(c => c.is_active).length === 0 && (
                  <p style={{ padding: '10px', color: '#6A6090', fontSize: 12, textAlign: 'center' }}>Nenhum cliente ativo</p>
                )}
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <button onClick={clearChat} title="Limpar conversa" style={{
              padding: '7px', borderRadius: 10, border: '1px solid rgba(255,77,109,0.2)',
              background: 'transparent', cursor: 'pointer', color: '#FF4D6D', transition: 'all 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,109,0.1)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Área de mensagens */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}
        onClick={() => setShowClientDrop(false)}>

        {/* Tela de boas-vindas */}
        {noMessages && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '40px 20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
                background: 'linear-gradient(135deg, rgba(107,63,231,0.3), rgba(192,64,184,0.3))',
                border: '1px solid rgba(192,64,184,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(192,64,184,0.2)',
              }}>
                <Sparkles size={28} color="#C040B8" />
              </div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#F0EEF8', marginBottom: 8 }}>
                IA Consultora DigitalCreate
              </h2>
              <p style={{ fontSize: 13, color: '#6A6090', maxWidth: 380 }}>
                {noClient
                  ? 'Selecione um cliente no menu acima para começar a análise'
                  : `Analisando dados de ${selectedClient?.company_name}. Faça uma pergunta abaixo.`}
              </p>
            </div>

            {!noClient && (
              <div style={{ width: '100%', maxWidth: 600 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6A6090', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, textAlign: 'center' }}>
                  Perguntas sugeridas
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => send(s)} style={{
                      padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(107,63,231,0.2)',
                      background: 'rgba(14,12,46,0.8)', color: '#A098C8', fontSize: 12,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', lineHeight: 1.4,
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(192,64,184,0.4)'; (e.currentTarget as HTMLElement).style.color = '#F0EEF8' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(107,63,231,0.2)'; (e.currentTarget as HTMLElement).style.color = '#A098C8' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensagens */}
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12,
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
          }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #6B3FE7, #C040B8)'
                : 'linear-gradient(135deg, #1A1060, #2A1880)',
              border: msg.role === 'assistant' ? '1px solid rgba(107,63,231,0.3)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: msg.role === 'user' ? '0 4px 12px rgba(192,64,184,0.3)' : 'none',
            }}>
              {msg.role === 'user'
                ? <User size={14} color="white" />
                : <DCLogo size={22} darkBg={true} />}
            </div>

            {/* Balão */}
            <div style={{
              maxWidth: '72%',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, rgba(107,63,231,0.3), rgba(192,64,184,0.2))'
                : 'rgba(14,12,46,0.9)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(192,64,184,0.3)' : 'rgba(107,63,231,0.2)'}`,
              borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
              padding: '12px 16px',
              fontSize: 13, lineHeight: 1.65, color: '#C0B8E8',
            }}>
              {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
              <div style={{ fontSize: 10, color: '#4A3870', marginTop: 6, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {new Date(msg.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #1A1060, #2A1880)', border: '1px solid rgba(107,63,231,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DCLogo size={22} darkBg={true} />
            </div>
            <div style={{ background: 'rgba(14,12,46,0.9)', border: '1px solid rgba(107,63,231,0.2)', borderRadius: '4px 18px 18px 18px', padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0, 1, 2].map(j => (
                  <div key={j} style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6B3FE7, #C040B8)',
                    animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite`,
                  }} />
                ))}
                <style>{`@keyframes pulse { 0%,80%,100%{opacity:.2;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }`}</style>
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#FF4D6D' }}>
            ⚠️ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 24px', borderTop: '1px solid rgba(107,63,231,0.15)',
        background: 'rgba(14,12,46,0.8)', backdropFilter: 'blur(12px)', flexShrink: 0,
      }}>
        {noClient && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#4A3870', marginBottom: 10 }}>
            ⬆ Selecione um cliente para habilitar o chat
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={noClient || loading}
            placeholder={noClient ? 'Selecione um cliente primeiro...' : 'Pergunte sobre campanhas, engajamento, ROAS, CTR... (Enter para enviar)'}
            rows={1}
            style={{
              flex: 1, background: 'rgba(10,8,32,0.9)', border: '1px solid rgba(107,63,231,0.25)',
              borderRadius: 14, padding: '12px 16px', fontSize: 13, color: '#F0EEF8',
              outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: 120,
              opacity: noClient ? 0.5 : 1, transition: 'border-color 0.2s',
              fontFamily: 'DM Sans, sans-serif',
            }}
            onFocus={e => e.target.style.borderColor = '#6B3FE7'}
            onBlur={e => e.target.style.borderColor = 'rgba(107,63,231,0.25)'}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || noClient || loading}
            style={{
              width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: !input.trim() || noClient || loading
                ? 'rgba(107,63,231,0.2)'
                : 'linear-gradient(135deg, #6B3FE7, #C040B8)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.2s',
              boxShadow: !input.trim() || noClient || loading ? 'none' : '0 4px 16px rgba(192,64,184,0.4)',
            }}
          >
            <Send size={16} />
          </button>
        </div>
        <p style={{ fontSize: 10, color: '#3A2860', marginTop: 6, textAlign: 'center' }}>
          Powered by Groq + Llama 3.3 70B • Gratuito • Dados em tempo real do Supabase
        </p>
      </div>
    </div>
  )
}
