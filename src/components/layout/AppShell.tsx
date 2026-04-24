import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: '#0A0820',
      position: 'relative',
    }}>
      {/* Gradiente de fundo da identidade DigitalCreate */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: [
          'radial-gradient(ellipse 50% 40% at 0% 100%, rgba(192,64,184,0.08) 0%, transparent 60%)',
          'radial-gradient(ellipse 40% 40% at 100% 0%, rgba(107,63,231,0.06) 0%, transparent 60%)',
        ].join(', '),
      }} />
      <Sidebar />
      <main className="flex-1 overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>
    </div>
  )
}
