import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, LogOut, BarChart3, Sparkles, UsersRound } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { DCLogo } from '../DCLogo'
import { clsx } from 'clsx'

const staffNav = [
  { to: '/owner', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/owner/clients', icon: Users, label: 'Clientes' },
  { to: '/owner/ai', icon: Sparkles, label: 'IA Consultora', highlight: true },
]

const ownerNav = [
  { to: '/owner', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/owner/clients', icon: Users, label: 'Clientes' },
  { to: '/owner/ai', icon: Sparkles, label: 'IA Consultora', highlight: true },
  { to: '/owner/team', icon: UsersRound, label: 'Equipe' },
  { to: '/owner/settings', icon: Settings, label: 'Configurações' },
]

const clientNav = [
  { to: '/client', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/client/overview', icon: BarChart3, label: 'Visão Geral' },
]

export function Sidebar() {
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const isOwner = profile?.role === 'owner'
  const isStaff = profile?.role === 'staff'
  const nav = isOwner ? ownerNav : isStaff ? staffNav : clientNav

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  return (
    <aside style={{
      width: 220, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #0C0A28 0%, #0E0C30 100%)',
      borderRight: '1px solid rgba(107,63,231,0.15)',
      position: 'relative',
    }}>
      {/* Glow superior sutil */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 120,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(192,64,184,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{
        padding: '18px 20px 16px',
        borderBottom: '1px solid rgba(107,63,231,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DCLogo size={36} darkBg={true} />
          <div>
            <p style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: 14, color: '#F0EEF8', lineHeight: 1.1,
            }}>DigitalCreate</p>
            <p style={{ fontSize: 9, color: '#6A6090', lineHeight: 1.3 }}>Agência de Marketing Digital</p>
          </div>
        </div>
      </div>

      {/* Badge de role */}
      <div style={{ padding: '10px 20px 4px' }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
          padding: '3px 10px', borderRadius: 20,
          background: isOwner ? 'rgba(192,64,184,0.15)' : isStaff ? 'rgba(107,63,231,0.15)' : 'rgba(0,212,255,0.1)',
          color: isOwner ? '#D060C8' : isStaff ? '#8B63F0' : '#00D4FF',
          border: isOwner ? '1px solid rgba(192,64,184,0.25)' : isStaff ? '1px solid rgba(107,63,231,0.25)' : '1px solid rgba(0,212,255,0.2)',
        }}>
          {isOwner ? '● PROPRIETÁRIO' : isStaff ? '● ADMINISTRADOR' : '● CLIENTE'}
        </span>
      </div>

      {/* Navegação */}
      <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(({ to, icon: Icon, label, highlight }: any) => (
          <NavLink
            key={to}
            to={to}
            end
            className="no-underline"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: isActive ? '10px 10px 10px 10px' : '10px 12px',
              borderRadius: 12, fontSize: 13, fontWeight: isActive ? 600 : 400,
              color: isActive ? '#fff' : highlight ? '#C040B8' : '#6A6090',
              background: isActive
                ? 'linear-gradient(135deg, rgba(107,63,231,0.3) 0%, rgba(192,64,184,0.15) 100%)'
                : 'transparent',
              borderLeft: isActive ? '2px solid #C040B8' : '2px solid transparent',
              transition: 'all 0.15s', textDecoration: 'none',
            })}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.style.borderLeft.includes('C040B8') || el.style.borderLeft === '2px solid transparent') {
                el.style.background = 'rgba(255,255,255,0.04)'
                el.style.color = highlight ? '#D060C8' : '#C0A8E8'
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              if (el.style.background !== 'linear-gradient(135deg, rgba(107,63,231,0.3) 0%, rgba(192,64,184,0.15) 100%)') {
                el.style.background = 'transparent'
                el.style.color = highlight ? '#C040B8' : '#6A6090'
              }
            }}
          >
            <Icon size={15} />
            <span style={{ flex: 1 }}>{label}</span>
            {highlight && <span style={{ fontSize: 8, fontWeight: 800, background: 'linear-gradient(135deg,#6B3FE7,#C040B8)', color: 'white', padding: '2px 6px', borderRadius: 8, letterSpacing: 0.5 }}>NOVO</span>}
          </NavLink>
        ))}
      </nav>

      {/* Usuário + Sair */}
      <div style={{
        padding: 16,
        borderTop: '1px solid rgba(107,63,231,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #6B3FE7 0%, #C040B8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 12, fontWeight: 700,
            boxShadow: '0 4px 12px rgba(192,64,184,0.3)',
          }}>
            {profile?.full_name?.[0] || '?'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#F0EEF8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name}
            </p>
            <p style={{ fontSize: 10, color: '#6A6090', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10, border: 'none',
            background: 'transparent', cursor: 'pointer',
            fontSize: 12, color: '#6A6090', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#FF4D6D'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,77,109,0.08)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6A6090'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <LogOut size={13} />
          Sair da conta
        </button>
      </div>
    </aside>
  )
}
