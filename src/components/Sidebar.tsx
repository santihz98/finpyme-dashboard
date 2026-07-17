'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  FileBarChart,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { getIniciales } from '@/lib/utils'

// ─── types ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  usuario: { nombre: string; email: string } | null
  empresa?: string
}

interface NavItem {
  label:    string
  icon:     LucideIcon
  href:     string
  disabled?: boolean
}

// ─── nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Mi Empresa', icon: Building2,        href: '/empresa' },
  { label: 'Periodos',   icon: CalendarDays,     href: '/periodos' },
  { label: 'Reportes',   icon: FileBarChart,     href: '/reportes', disabled: true },
]

// ─── main component ───────────────────────────────────────────────────────────

export default function Sidebar({ usuario, empresa }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await api.clearToken()
    toast('Sesión cerrada', { icon: '👋' })
    router.push('/login')
  }

  return (
    <aside className="w-56 h-screen sticky top-0 bg-slate border-r border-border flex flex-col shrink-0">

      {/* ── Top: logo + user ── */}
      <div className="p-4 space-y-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight">
            <span className="text-pearl">Fin</span>
            <span className="text-emerald">Pyme</span>
          </span>
          <span className="text-xs text-amber border border-amber/30 rounded-pill px-2 py-0.5 leading-tight">
            Beta
          </span>
        </div>

        {usuario && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald/20 border border-emerald/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-emerald">
                {getIniciales(usuario.nombre)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-pearl truncate">{usuario.nombre}</p>
              {empresa && <p className="text-xs text-muted truncate">{empresa}</p>}
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon   = item.icon
          const active = pathname === item.href

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-tag text-sm text-pearl opacity-50 cursor-not-allowed"
              >
                <Icon size={16} className="shrink-0" />
                <span className="truncate">{item.label}</span>
                <span className="ml-auto text-[10px] text-amber border border-amber/30 rounded-pill px-1.5 py-0.5 leading-tight shrink-0">
                  Pronto
                </span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-tag text-sm transition-colors duration-150',
                active
                  ? 'bg-emerald/10 text-emerald border-l-2 border-emerald'
                  : 'text-pearl/80 border-l-2 border-transparent hover:bg-white/5 hover:text-pearl',
              ].join(' ')}
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── Bottom: logout + version ── */}
      <div className="border-t border-border p-3 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-tag text-sm text-coral hover:bg-coral/10 transition-colors duration-150"
        >
          <LogOut size={16} className="shrink-0" />
          <span>Cerrar sesión</span>
        </button>
        <p className="px-3 text-xs text-muted">v0.1.0 Beta</p>
      </div>

    </aside>
  )
}
