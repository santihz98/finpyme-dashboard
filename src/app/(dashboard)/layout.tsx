'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import Sidebar from '@/components/Sidebar'
import { api } from '@/lib/api'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const [usuario, setUsuario]           = useState<{ nombre: string; email: string } | null>(null)
  const [empresaNombre, setEmpresaNombre] = useState<string | undefined>(undefined)
  const [checking, setChecking]         = useState(true)
  const [showSidebar, setShowSidebar]   = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('finpyme_token') : null
    if (!token) {
      router.replace('/login')
      return
    }

    let cancelled = false
    api.getMe()
      .then(me => {
        if (cancelled) return
        setUsuario({ nombre: me.nombre, email: me.email })
        setEmpresaNombre(me.empresa?.nombre)
      })
      .catch(() => {}) // 401 already redirects to /login inside api.ts
      .finally(() => { if (!cancelled) setChecking(false) })

    return () => { cancelled = true }
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-emerald/30 border-t-emerald rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-row min-h-screen bg-ink">

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1A2A3A',
            color:      '#E8EDF2',
            border:     '1px solid #243447',
            fontSize:   '13px',
          },
        }}
      />

      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:flex">
        <Sidebar usuario={usuario} empresa={empresaNombre} />
      </div>

      {/* ── Mobile drawer ── */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          onClick={() => setShowSidebar(false)}
        >
          <div className="fixed inset-0 bg-black/50" />
          <Sidebar usuario={usuario} empresa={empresaNombre} />
        </div>
      )}

      <main className="flex-1 overflow-auto">
        {/* ── Mobile header ── */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-ink/95 backdrop-blur border-b border-border px-4 py-3">
          <button
            onClick={() => setShowSidebar(true)}
            aria-label="Abrir menú"
            className="text-pearl hover:text-emerald transition-colors duration-150"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-bold tracking-tight">
            <span className="text-pearl">Fin</span>
            <span className="text-emerald">Pyme</span>
          </span>
        </header>

        {children}
      </main>

    </div>
  )
}
