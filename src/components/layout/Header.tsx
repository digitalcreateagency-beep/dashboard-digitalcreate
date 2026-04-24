import { Bell, Search } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export function Header() {
  const { profile } = useAuthStore()

  return (
    <header className="h-14 bg-[#0D0D1A] border-b border-[#6B3FE7]/15 flex items-center justify-between px-6 flex-shrink-0">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A6090]" />
        <input
          placeholder="Buscar..."
          className="bg-[#12121E] border border-[#6B3FE7]/15 rounded-xl pl-9 pr-4 py-1.5 text-xs text-[#F0EEF8] focus:outline-none focus:border-[#6B3FE7] placeholder:text-[#3A3360] w-48"
        />
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl text-[#6A6090] hover:text-[#F0EEF8] hover:bg-[#1A1A2E] transition-all relative">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#6B3FE7]" />
        </button>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6B3FE7] to-[#00D4FF] flex items-center justify-center text-white text-xs font-bold">
          {profile?.full_name?.[0] || '?'}
        </div>
      </div>
    </header>
  )
}
