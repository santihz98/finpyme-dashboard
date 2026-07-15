'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Percent, ChevronDown } from 'lucide-react'

import KPICard      from '@/components/KPICard'
import RevenueChart from '@/components/RevenueChart'
import ExpenseDonut from '@/components/ExpenseDonut'
import InsightBox   from '@/components/InsightBox'

import { api, ApiError }                    from '@/lib/api'
import { formatCOP, formatPct, getDelta, getMesLabel, getSectorLabel } from '@/lib/utils'
import type { AnalisisIA, MesData }         from '@/lib/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

function margenDelta(actual: number, anterior: number) {
  const diff = actual - anterior
  return { pct: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} pp`, positivo: diff >= 0 }
}

// ─── loading skeleton ─────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-slate/60 rounded-tag animate-pulse ${className}`} />
  )
}

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      <Skeleton className="h-4 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <Skeleton className="lg:flex-[3] h-64" />
        <Skeleton className="lg:flex-[2] h-64" />
      </div>
      <Skeleton className="h-32" />
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [allMeses,    setAllMeses]    = useState<MesData[]>([])
  const [mesIndex,    setMesIndex]    = useState(0)
  const [empresaInfo, setEmpresaInfo] = useState<{
    nombre: string; sector: string; ciudad: string
  } | null>(null)
  const [analisis,   setAnalisis]     = useState<AnalisisIA | null>(null)

  // ── Loading state ────────────────────────────────────────────────────────────
  const [loadingInit,    setLoadingInit]    = useState(true)
  const [loadingAnalisis, setLoadingAnalisis] = useState(false)
  const [initError,      setInitError]      = useState<string | null>(null)

  // ─── Initial load: empresa + all periods in parallel ─────────────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoadingInit(true)
      setInitError(null)
      try {
        const [me, periodList] = await Promise.all([api.getMe(), api.getPeriodos()])

        if (cancelled) return

        setEmpresaInfo({
          nombre: me.empresa.nombre,
          sector: me.empresa.sector,
          ciudad: me.empresa.ciudad,
        })

        if (periodList.length === 0) {
          setAllMeses([])
          return
        }

        // Fetch all periods' datos_json in parallel for the chart
        const mesesData = await Promise.all(
          periodList.map(p => api.getPeriodo(p.periodo)),
        )

        if (cancelled) return
        setAllMeses(mesesData)
        setMesIndex(mesesData.length - 1) // default to latest
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) return // handled in api.ts
        setInitError('No se pudieron cargar los datos. Intenta recargar la página.')
      } finally {
        if (!cancelled) setLoadingInit(false)
      }
    }

    void init()
    return () => { cancelled = true }
  }, [])

  // ── Auto-load existing analisis when period changes ───────────────────────────
  useEffect(() => {
    if (!allMeses.length) return
    const periodo = allMeses[safeIndex]?.periodo  // eslint-disable-line react-hooks/exhaustive-deps
    if (!periodo) return

    let cancelled = false
    setAnalisis(null)

    api.getAnalisis(periodo)
      .then(data => { if (!cancelled) setAnalisis(data) })
      .catch(() => {}) // 404 → null already handled in api.getAnalisis

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesIndex, allMeses])

  // ── Derived values ──────────────────────────────────────────────────────────
  const safeIndex   = Math.min(mesIndex, allMeses.length - 1)
  const mesActual   = allMeses[safeIndex] ?? null
  const mesAnterior = safeIndex > 0 ? allMeses[safeIndex - 1] : null

  const ingresosDelta = mesAnterior
    ? getDelta(mesActual!.ingresos.total, mesAnterior.ingresos.total)
    : undefined

  const gastosRaw = mesAnterior
    ? getDelta(mesActual!.gastos.total, mesAnterior.gastos.total)
    : undefined
  const gastosDelta = gastosRaw
    ? { pct: gastosRaw.pct, positivo: !gastosRaw.positivo }
    : undefined

  const utilidadDelta = mesAnterior
    ? getDelta(mesActual!.utilidad_neta, mesAnterior.utilidad_neta)
    : undefined

  const margenDeltaVal = mesAnterior
    ? margenDelta(mesActual!.margen_pct, mesAnterior.margen_pct)
    : undefined

  const anomaliaTipo     = mesActual?._anomalia?.tipo ?? ''
  const ingresosVariant: 'default' | 'alert' = anomaliaTipo.includes('ingreso') ? 'alert' : 'default'
  const gastosVariant:   'default' | 'alert' = anomaliaTipo.includes('gasto')   ? 'alert' : 'default'

  const mesLabel = mesActual ? getMesLabel(mesActual.periodo) : ''

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleGenerarAnalisis = useCallback(async () => {
    if (!mesActual) return
    setLoadingAnalisis(true)
    try {
      const data = await api.generarAnalisis(mesActual.periodo)
      setAnalisis(data)
    } catch (err) {
      console.error('Error al generar análisis:', err)
    } finally {
      setLoadingAnalisis(false)
    }
  }, [mesActual])

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-ink">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-ink/95 backdrop-blur z-10">
        <div>
          <h1 className="text-lg font-semibold text-pearl">Dashboard</h1>
          {empresaInfo && mesActual && (
            <p className="text-xs text-muted mt-0.5">
              {empresaInfo.nombre} · {mesLabel}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {allMeses.length > 0 && (
            <div className="relative">
              <select
                value={safeIndex}
                onChange={e => setMesIndex(Number(e.target.value))}
                className="
                  appearance-none bg-slate border border-border text-pearl
                  rounded-tag text-sm pl-3 pr-8 py-2 cursor-pointer
                  hover:border-emerald/50 focus:outline-none focus:border-emerald/50
                  transition-colors duration-150
                "
              >
                {allMeses.map((mes, i) => (
                  <option key={mes.periodo} value={i}>{getMesLabel(mes.periodo)}</option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
            </div>
          )}

          <button
            disabled
            title="Análisis con IA — Próximamente"
            className="bg-slate border border-border text-muted opacity-50 cursor-not-allowed rounded-pill px-4 py-2 text-sm"
          >
            ✦ Analizar con IA
          </button>
        </div>
      </div>

      {loadingInit ? (
        <DashboardSkeleton />
      ) : initError ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-sm text-coral">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-xs text-muted underline hover:text-pearl transition-colors"
          >
            Recargar
          </button>
        </div>
      ) : allMeses.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-sm text-muted">No hay períodos registrados aún.</p>
        </div>
      ) : mesActual ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">

          {/* Breadcrumb */}
          {empresaInfo && (
            <p className="text-xs text-muted flex items-center gap-2">
              {empresaInfo.nombre}
              <span className="opacity-40">·</span>
              {getSectorLabel(empresaInfo.sector)}
              <span className="opacity-40">·</span>
              {empresaInfo.ciudad}
            </p>
          )}

          {/* ── KPI Grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Ingresos"
              valor={formatCOP(mesActual.ingresos.total)}
              delta={ingresosDelta}
              colorAccent="emerald"
              icon={TrendingUp}
              variant={ingresosVariant}
            />
            <KPICard
              label="Gastos"
              valor={formatCOP(mesActual.gastos.total)}
              delta={gastosDelta}
              colorAccent="coral"
              icon={TrendingDown}
              variant={gastosVariant}
            />
            <KPICard
              label="Utilidad Neta"
              valor={formatCOP(mesActual.utilidad_neta)}
              delta={utilidadDelta}
              colorAccent={mesActual.utilidad_neta >= 0 ? 'emerald' : 'coral'}
              icon={DollarSign}
            />
            <KPICard
              label="Margen"
              valor={formatPct(mesActual.margen_pct)}
              delta={margenDeltaVal}
              colorAccent="amber"
              icon={Percent}
            />
          </div>

          {/* ── Charts Row ── */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="lg:flex-[3] min-w-0">
              <RevenueChart
                meses={allMeses}
                mesSeleccionado={safeIndex}
                onSelectMes={setMesIndex}
              />
            </div>
            <div className="lg:flex-[2] min-w-0">
              <ExpenseDonut gastos={mesActual.gastos} mesLabel={mesLabel} />
            </div>
          </div>

          {/* ── AI Insight ── */}
          <InsightBox
            analisis={analisis}
            loading={loadingAnalisis}
            onGenerar={handleGenerarAnalisis}
            mesLabel={mesLabel}
          />

          {/* ── Income Categories Table ── */}
          <div className="bg-slate border border-border rounded-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-pearl">Categorías de ingreso</h3>
              <p className="text-xs text-muted mt-0.5">{mesLabel}</p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Categoría', 'Valor', '% del total', 'Vs anterior'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-xs text-muted font-medium ${i === 0 ? 'text-left' : 'text-right'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mesActual.ingresos.categorias.map((cat, i) => {
                  const prevCat = mesAnterior?.ingresos.categorias.find(
                    c => c.nombre === cat.nombre,
                  )
                  const delta = prevCat ? getDelta(cat.valor, prevCat.valor) : null
                  const pct   = mesActual.ingresos.total > 0
                    ? ((cat.valor / mesActual.ingresos.total) * 100).toFixed(1)
                    : '0.0'

                  return (
                    <tr key={cat.nombre} className={i % 2 !== 0 ? 'bg-slate/30' : ''}>
                      <td className="px-5 py-3 text-pearl">{cat.nombre}</td>
                      <td className="px-5 py-3 text-right text-pearl font-medium">
                        {formatCOP(cat.valor)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted">{pct}%</td>
                      <td
                        className={`px-5 py-3 text-right font-medium ${
                          delta
                            ? delta.positivo ? 'text-emerald' : 'text-coral'
                            : 'text-muted'
                        }`}
                      >
                        {delta ? delta.pct : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </main>
      ) : null}
    </div>
  )
}
