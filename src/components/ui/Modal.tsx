import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#12121E] border border-[#6B3FE7]/30 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-[#6B3FE7]/20">
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#F0EEF8]" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[#6A6090] hover:text-[#F0EEF8] hover:bg-[#1A1A2E] transition-all">
              <X size={14} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
