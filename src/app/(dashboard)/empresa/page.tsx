'use client'

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import { api, ApiError } from '@/lib/api'
import type { MeResponse, ResumenAnual } from '@/lib/api'
import {
  formatCOP,
  formatPct,
  getMesLabel,
  getIniciales,
  formatMesAnio,
  formatTiempoRelativo,
} from '@/lib/utils'

// ─── sector / rol lookup tables ────────────────────────────────────────────────

const SECTOR_META: Record<string, { icon: string; label: string }> = {
  restaurante:   { icon: '🏪', label: 'Restaurante' },
  distribuidora: { icon: '🏭', label: 'Distribuidora' },
  clinica:       { icon: '🏥', label: 'Clínica' },
}

function getSectorMeta(sector: string) {
  return SECTOR_META[sector] ?? { icon: '🏢', label: sector }
}

const ROL_META: Record<string, { label: string; className: string }> = {
  owner:  { label: 'Propietario',   className: 'bg-emerald/20 text-emerald' },
  admin:  { label: 'Administrador', className: 'bg-amber/20 text-amber' },
  viewer: { label: 'Visor',         className: 'bg-muted/20 text-muted' },
}

// ─── shared bits ────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate/60 rounded-tag animate-pulse ${className}`} />
}

function Row({
  label,
  value,
  valueClassName = 'text-pearl font-medium',
}: {
  label: string
  value: ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
      <span className="text-xs text-muted uppercase tracking-wider">{label}</span>
      <span className={`text-sm ${valueClassName}`}>{value}</span>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function EmpresaPage() {
  const router = useRouter()

  const [me,      setMe]      = useState<MeResponse | null>(null)
  const [resumen, setResumen] = useState<ResumenAnual | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoading(true)
      setError(null)
      try {
        const [meData, resumenData] = await Promise.all([api.getMe(), api.getResumenAnual()])
        if (cancelled) return
        setMe(meData)
        setResumen(resumenData)
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) return // handled in api.ts
        setError('No se pudo cargar la información. Intenta recargar la página.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void init()
    return () => { cancelled = true }
  }, [])

  async function handleLogout() {
    await api.clearToken()
    toast('Sesión cerrada', { icon: '👋' })
    router.push('/login')
  }

  function handleChangePassword() {
    toast('Esta función estará disponible pronto', { icon: '⏳' })
  }

  function handleUpgrade() {
    toast.success('¡Pronto disponible! Te notificaremos.')
  }

  // ─── loading / error states ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-6 py-6 w-full space-y-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-56" />)}
        </div>
      </div>
    )
  }

  if (error || !me || !resumen) {
    return (
      <div className="px-6 py-12 text-center w-full">
        <p className="text-sm text-coral">{error ?? 'No se pudo cargar la información.'}</p>
      </div>
    )
  }

  const sector = getSectorMeta(me.empresa.sector)
  const rol    = ROL_META[me.rol] ?? { label: me.rol, className: 'bg-muted/20 text-muted' }
  const isPro  = me.empresa.plan.toLowerCase() === 'pro'

  // ─── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="px-6 py-6 w-full space-y-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">

        {/* ── Columna izquierda: info empresa ── */}
        <div className="flex flex-col gap-4">

          {/* Card 1 — Información de la empresa */}
          <div className="bg-slate rounded-card p-6 border border-border">
            <h2 className="text-sm font-semibold text-pearl mb-1">Información de la empresa</h2>
            <p className="text-lg font-semibold text-pearl mb-3">{me.empresa.nombre}</p>

            <Row label="NIT" value={me.empresa.nit} />
            <Row label="Ciudad" value={me.empresa.ciudad} />
            <Row
              label="Sector"
              value={
                <span className="inline-flex items-center gap-1.5 text-xs bg-white/5 border border-border rounded-pill px-2.5 py-1">
                  <span>{sector.icon}</span>{sector.label}
                </span>
              }
            />
            <Row
              label="Plan"
              value={
                <span
                  className={`text-xs rounded-pill px-2.5 py-1 font-medium ${
                    isPro ? 'bg-emerald/20 text-emerald' : 'bg-muted/20 text-muted'
                  }`}
                >
                  {isPro ? 'Pro' : 'Free'}
                </span>
              }
            />
            <Row label="Miembro desde" value={formatMesAnio(me.empresa.created_at)} />
          </div>

          {/* Card 2 — Resumen del año */}
          <div className="bg-slate rounded-card p-6 border border-border">
            <h2 className="text-sm font-semibold text-pearl mb-3">Resumen del año</h2>

            <Row label="Total ingresos" value={formatCOP(resumen.total_ingresos)} valueClassName="text-emerald font-semibold" />
            <Row label="Total gastos" value={formatCOP(resumen.total_gastos)} valueClassName="text-coral font-semibold" />
            <Row label="Utilidad total" value={formatCOP(resumen.utilidad_total)} valueClassName="text-pearl font-semibold" />
            <Row label="Margen promedio" value={formatPct(resumen.margen_promedio)} valueClassName="text-pearl font-semibold" />
            <Row label="Mejor mes" value={getMesLabel(resumen.mejor_mes)} valueClassName="text-emerald" />
            <Row label="Peor mes" value={getMesLabel(resumen.peor_mes)} valueClassName="text-coral" />
          </div>

        </div>

        {/* ── Columna derecha: info usuario ── */}
        <div className="flex flex-col gap-4">

          {/* Card 3 — Mi perfil */}
          <div className="bg-slate rounded-card p-6 border border-border">
            <h2 className="text-sm font-semibold text-pearl mb-4">Mi perfil</h2>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald flex items-center justify-center shrink-0">
                <span className="text-2xl font-semibold text-ink">{getIniciales(me.nombre)}</span>
              </div>
              <p className="text-xl font-semibold text-pearl mt-3">{me.nombre}</p>
              <p className="text-sm text-muted mt-1">{me.email}</p>
            </div>

            <div className="border-t border-border mt-4 pt-4">
              <Row
                label="Rol"
                value={
                  <span className={`text-xs rounded-pill px-2.5 py-1 font-medium ${rol.className}`}>
                    {rol.label}
                  </span>
                }
              />
              <Row label="Último acceso" value={formatTiempoRelativo(me.ultimo_login)} />
            </div>
          </div>

          {/* Card 4 — Seguridad */}
          <div className="bg-slate rounded-card p-6 border border-border space-y-2.5">
            <h2 className="text-sm font-semibold text-pearl mb-1.5">Seguridad</h2>

            <button
              onClick={handleChangePassword}
              className="w-full text-left border border-border rounded-tag px-4 py-2.5 text-sm text-pearl hover:border-emerald/50 transition-colors duration-150"
            >
              Cambiar contraseña
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left border border-coral/30 rounded-tag px-4 py-2.5 text-sm text-coral hover:bg-coral/10 transition-colors duration-150"
            >
              Cerrar sesión
            </button>
          </div>

          {/* Card 5 — Plan actual */}
          <div className="bg-slate rounded-card p-6 border border-border mt-4">
            <h2 className="text-sm font-medium text-pearl mb-3">Plan actual</h2>

            <span
              className={`text-xs px-3 py-1 rounded-pill ${
                isPro ? 'bg-emerald/20 text-emerald' : 'bg-muted/20 text-muted'
              }`}
            >
              {isPro ? 'Pro' : 'Free'}
            </span>

            <p className="text-xs text-muted mt-2">Acceso básico al dashboard financiero</p>

            <button
              onClick={handleUpgrade}
              className="mt-4 w-full bg-emerald/10 border border-emerald/30 text-emerald text-sm rounded-card py-2 text-center hover:bg-emerald/20 transition-colors cursor-pointer"
            >
              Actualizar a Pro →
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
