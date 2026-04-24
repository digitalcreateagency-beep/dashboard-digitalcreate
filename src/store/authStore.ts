import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthState {
  profile: Profile | null
  loading: boolean
  setProfile: (p: Profile | null) => void
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  loadProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      profile: null,
      loading: false,

      setProfile: (profile) => set({ profile }),

      signIn: async (email, password) => {
        set({ loading: true })
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { set({ loading: false }); return { error: error.message } }
        await get().loadProfile()
        set({ loading: false })
        return {}
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ profile: null })
      },

      loadProfile: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (data) set({ profile: data as Profile })
      }
    }),
    { name: 'dc-auth', partialize: (s) => ({ profile: s.profile }) }
  )
)
