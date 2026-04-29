import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface SlideOverProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  width?: 'md' | 'lg' | 'xl'
}

export default function SlideOver({ open, onClose, title, children, width = 'lg' }: SlideOverProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const widths = {
    md: 'w-96',
    lg: 'w-[520px]',
    xl: 'w-[680px]',
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <div className={`${widths[width]} bg-bg-surface border-l border-border h-full flex flex-col overflow-hidden shadow-2xl`}>
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <h2 className="font-display text-xl text-text-primary tracking-wider">{title.toUpperCase()}</h2>
                <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1">
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
