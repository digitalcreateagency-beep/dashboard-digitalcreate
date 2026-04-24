import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Sidebar } from '../components/layout/Sidebar'
import { Login } from '../pages/Login'
import { OwnerDashboard } from '../pages/owner/OwnerDashboard'
import { Clients } from '../pages/owner/Clients'
import { ClientDetail } from '../pages/owner/ClientDetail'
import { CreateClient } from '../pages/owner/CreateClient'
import { Settings } from '../pages/owner/Settings'
import { AIChat } from '../pages/owner/AIChat'
import { Team } from '../pages/owner/Team'
import { ClientDashboard } from '../pages/client/ClientDashboard'
import { ClientOverview } from '../pages/client/ClientOverview'
import type { ReactNode } from 'react'

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A14]">
      <Sidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}

function OwnerGuard({ children }: { children: ReactNode }) {
  const { profile } = useAuthStore()
  if (!profile) return <Navigate to="/login" replace />
  // staff também acessa as rotas de owner
  if (profile.role !== 'owner' && profile.role !== 'staff') return <Navigate to="/client" replace />
  return <>{children}</>
}

function ClientGuard({ children }: { children: ReactNode }) {
  const { profile } = useAuthStore()
  if (!profile) return <Navigate to="/login" replace />
  if (!profile.is_active) return (
    <div className="flex items-center justify-center h-screen bg-[#0A0A14] text-[#FF4D6D]">
      Seu acesso foi suspenso. Entre em contato com a agência.
    </div>
  )
  return <>{children}</>
}

export function AppRouter() {
  const { profile } = useAuthStore()
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/owner/*" element={
          <OwnerGuard>
            <AppShell>
              <Routes>
                <Route index element={<OwnerDashboard />} />
                <Route path="clients" element={<Clients />} />
                <Route path="clients/new" element={<CreateClient />} />
                <Route path="clients/:id" element={<ClientDetail />} />
                <Route path="settings" element={<Settings />} />
                <Route path="ai" element={<AIChat />} />
                <Route path="team" element={<Team />} />
              </Routes>
            </AppShell>
          </OwnerGuard>
        } />
        <Route path="/client/*" element={
          <ClientGuard>
            <AppShell>
              <Routes>
                <Route index element={<ClientDashboard />} />
                <Route path="overview" element={<ClientOverview />} />
              </Routes>
            </AppShell>
          </ClientGuard>
        } />
        <Route path="*" element={
          <Navigate to={profile?.role === 'owner' || profile?.role === 'staff' ? '/owner' : profile ? '/client' : '/login'} replace />
        } />
      </Routes>
    </BrowserRouter>
  )
}
