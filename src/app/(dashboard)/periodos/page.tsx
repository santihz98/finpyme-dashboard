'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutList, CalendarDays, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'

import KPICard        from '@/components/KPICard'
import PeriodosTable  from '@/components/PeriodosTable'
import PeriodosCalendar from '@/components/PeriodosCalendar'

import { api, ApiError }         from '@/lib/api'
import type { ResumenAnual }     from '@/lib/api'
import type { PeriodoResumen }   from '@/lib/types'
import { formatCOP, formatPct }  from '@/lib/utils'

// ─── loading skeleton ─────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate/60 rounded-tag animate-pulse ${className}`} />
}

function PeriodosSkeleton() {
  return (
    <div className="px-6 py-4 space-y-4 w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 12 }, (_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function PeriodosPage() {
  const router = useRouter()

  const [periodos,     setPeriodos]     = useState<PeriodoResumen[]>([])
  const [resumenAnual, setResumenAnual] = useState<ResumenAnual | null>(null)
  const [empresaNombre, setEmpresaNombre] = useState('')
  const [vista,   setVista]   = useState<'tabla' | 'calendario'>('tabla')
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoading(true)
      setError(null)
      try {
        const [periodosData, resumenData, me] = await Promise.all([
          api.getPeriodosResumen(),
          api.getResumenAnual(),
          api.getMe(),
        ])
        if (cancelled) return
        setPeriodos(periodosData)
        setResumenAnual(resumenData)
        setEmpresaNombre(me.empresa.nombre)
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) return // handled in api.ts
        setError('No se pudieron cargar los períodos. Intenta recargar la página.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void init()
    return () => { cancelled = true }
  }, [])

  function handleSelectPeriodo(periodo: string) {
    router.push(`/dashboard?periodo=${periodo}`)
  }

  const anio = periodos[0]?.periodo.split('-')[0] ?? String(new Date().getFullYear())

  return (
    <div className="min-h-screen bg-ink">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold text-pearl">Periodos</h1>
          <p className="text-xs text-muted">{empresaNombre} · {anio}</p>
        </div>
        <div className="flex items-center gap-1 bg-slate border border-border rounded-tag p-1">
          <button
            onClick={() => setVista('tabla')}
            className={vista === 'tabla'
              ? 'bg-emerald/10 text-emerald px-3 py-1 rounded text-xs font-medium'
              : 'text-muted px-3 py-1 rounded text-xs hover:text-pearl transition-colors'
            }
          >
            <LayoutList size={14} className="inline mr-1" />Tabla
          </button>
          <button
            onClick={() => setVista('calendario')}
            className={vista === 'calendario'
              ? 'bg-emerald/10 text-emerald px-3 py-1 rounded text-xs font-medium'
              : 'text-muted px-3 py-1 rounded text-xs hover:text-pearl transition-colors'
            }
          >
            <CalendarDays size={14} className="inline mr-1" />Calendario
          </button>
        </div>
      </div>

      {loading ? (
        <PeriodosSkeleton />
      ) : error || !resumenAnual ? (
        <div className="px-6 py-12 text-center w-full">
          <p className="text-sm text-coral">{error ?? 'No se pudo cargar la información.'}</p>
        </div>
      ) : (
        <main className="px-6 py-4 space-y-4 w-full">

          {/* ── Resumen anual KPIs ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Total ingresos"
              valor={formatCOP(resumenAnual.total_ingresos)}
              colorAccent="emerald"
              icon={TrendingUp}
            />
            <KPICard
              label="Total gastos"
              valor={formatCOP(resumenAnual.total_gastos)}
              colorAccent="coral"
              icon={TrendingDown}
            />
            <KPICard
              label="Utilidad total"
              valor={formatCOP(resumenAnual.utilidad_total)}
              colorAccent={resumenAnual.utilidad_total >= 0 ? 'emerald' : 'coral'}
              icon={DollarSign}
            />
            <KPICard
              label="Margen promedio"
              valor={formatPct(resumenAnual.margen_promedio)}
              colorAccent="amber"
              icon={Percent}
            />
          </div>

          {/* ── Vista condicional ── */}
          {vista === 'tabla' ? (
            <PeriodosTable
              periodos={periodos}
              mejorMes={resumenAnual.mejor_mes}
              peorMes={resumenAnual.peor_mes}
              onSelectPeriodo={handleSelectPeriodo}
            />
          ) : (
            <PeriodosCalendar
              periodos={periodos}
              mejorMes={resumenAnual.mejor_mes}
              peorMes={resumenAnual.peor_mes}
              onSelectPeriodo={handleSelectPeriodo}
            />
          )}

        </main>
      )}
    </div>
  )
}
