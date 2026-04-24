import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { DCLogo } from '../components/DCLogo'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn, loading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await signIn(email, password)
    if (res.error) { setError(res.error); return }
    const { profile: p } = useAuthStore.getState()
    navigate(p?.role === 'owner' || p?.role === 'staff' ? '/owner' : '/client')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{
      background: '#0C0A28',
    }}>
      {/* Gradiente de fundo — identidade DigitalCreate */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: [
          'radial-gradient(ellipse 80% 60% at 20% 110%, #C040B840 0%, transparent 55%)',
          'radial-gradient(ellipse 70% 60% at 80% 110%, #7B35D940 0%, transparent 55%)',
          'radial-gradient(ellipse 60% 50% at 50% -10%, #6B3FE730 0%, transparent 60%)',
        ].join(', '),
      }} />

      {/* Orbes decorativos */}
      <div style={{
        position: 'absolute', width: 320, height: 320,
        borderRadius: '50%', bottom: -80, left: -80, zIndex: 0,
        background: 'radial-gradient(circle, #C040B825 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute', width: 280, height: 280,
        borderRadius: '50%', bottom: -60, right: -60, zIndex: 0,
        background: 'radial-gradient(circle, #7B35D930 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div style={{
              background: 'linear-gradient(135deg, #1A1060 0%, #2A1880 100%)',
              borderRadius: 20,
              padding: 14,
              boxShadow: '0 0 40px #6B3FE740, 0 0 80px #C040B820',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <DCLogo size={52} darkBg={true} />
            </div>
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 26, color: '#FFFFFF', marginBottom: 4, letterSpacing: -0.5,
          }}>
            DigitalCreate
          </h1>
          <p style={{ color: '#9A88C0', fontSize: 13 }}>Agência de Marketing Digital</p>
        </div>

        {/* Card de login */}
        <div style={{
          background: 'rgba(18, 14, 50, 0.85)',
          border: '1px solid rgba(107, 63, 231, 0.25)',
          borderRadius: 20,
          padding: 28,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          <p style={{ color: '#A098C8', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            Acesse sua conta
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#8070B0] mb-1.5 font-medium">E-mail</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{
                  width: '100%', background: 'rgba(10,8,30,0.8)',
                  border: '1px solid rgba(107,63,231,0.25)', borderRadius: 12,
                  padding: '10px 14px', fontSize: 14, color: '#F0EEF8',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#6B3FE7'}
                onBlur={e => e.target.style.borderColor = 'rgba(107,63,231,0.25)'}
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8070B0] mb-1.5 font-medium">Senha</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{
                  width: '100%', background: 'rgba(10,8,30,0.8)',
                  border: '1px solid rgba(107,63,231,0.25)', borderRadius: 12,
                  padding: '10px 14px', fontSize: 14, color: '#F0EEF8',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#6B3FE7'}
                onBlur={e => e.target.style.borderColor = 'rgba(107,63,231,0.25)'}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p style={{
                fontSize: 12, color: '#FF4D6D',
                background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)',
                padding: '8px 12px', borderRadius: 10,
              }}>{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', marginTop: 4,
                background: 'linear-gradient(135deg, #6B3FE7 0%, #C040B8 100%)',
                color: '#fff', border: 'none', borderRadius: 12,
                padding: '12px', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 8px 24px rgba(107,63,231,0.4)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#4A3870', marginTop: 20 }}>
          Dashboard de Performance © 2025 DigitalCreate
        </p>
      </div>
    </div>
  )
}
