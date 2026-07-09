'use client'

import { useState, useMemo, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'

import Navbar      from '@/components/Navbar'
import KPICard     from '@/components/KPICard'
import RevenueChart from '@/components/RevenueChart'
import ExpenseDonut from '@/components/ExpenseDonut'
import InsightBox  from '@/components/InsightBox'

import { loadEmpresaData, type EmpresaTipo } from '@/lib/dataLoader'
import { formatCOP, formatPct, getDelta, getMesLabel, getSectorLabel } from '@/lib/utils'
import type { AnalisisIA } from '@/lib/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

function margenDelta(actual: number, anterior: number) {
  const diff = actual - anterior
  return {
    pct:      `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} pp`,
    positivo: diff >= 0,
  }
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [empresa,        setEmpresa]        = useState<EmpresaTipo>('restaurante')
  const [mesIndex,       setMesIndex]       = useState(11)
  const [analisis,       setAnalisis]       = useState<AnalisisIA | null>(null)
  const [loadingAnalisis, setLoadingAnalisis] = useState(false)

  const data = useMemo(() => loadEmpresaData(empresa), [empresa])

  // Guard against out-of-range index when empresa changes
  const safeIndex  = Math.min(mesIndex, data.meses.length - 1)
  const mesActual  = data.meses[safeIndex]
  const mesAnterior = safeIndex > 0 ? data.meses[safeIndex - 1] : null

  // Reset analysis when selection changes
  useEffect(() => { setAnalisis(null) }, [empresa, mesIndex])

  // ── KPI deltas ────────────────────────────────────────────────────────────

  const ingresosDelta = mesAnterior
    ? getDelta(mesActual.ingresos.total, mesAnterior.ingresos.total)
    : undefined

  // Gastos: an increase is bad → flip positivo
  const gastosRaw  = mesAnterior
    ? getDelta(mesActual.gastos.total, mesAnterior.gastos.total)
    : undefined
  const gastosDelta = gastosRaw
    ? { pct: gastosRaw.pct, positivo: !gastosRaw.positivo }
    : undefined

  const utilidadDelta = mesAnterior
    ? getDelta(mesActual.utilidad_neta, mesAnterior.utilidad_neta)
    : undefined

  const margenDeltaVal = mesAnterior
    ? margenDelta(mesActual.margen_pct, mesAnterior.margen_pct)
    : undefined

  // ── Alert variants ────────────────────────────────────────────────────────

  const anomaliaTipo = mesActual._anomalia?.tipo ?? ''
  const ingresosVariant: 'default' | 'alert' =
    anomaliaTipo.includes('ingreso') ? 'alert' : 'default'
  const gastosVariant: 'default' | 'alert' =
    anomaliaTipo.includes('gasto') ? 'alert' : 'default'

  // ── API call ──────────────────────────────────────────────────────────────

  async function handleGenerarAnalisis() {
    setLoadingAnalisis(true)
    try {
      const res = await fetch('/api/analisis', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          empresa:    data.empresa,
          mesActual,
          mesAnterior,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setAnalisis(await res.json() as AnalisisIA)
    } catch (err) {
      console.error('Error al generar análisis:', err)
    } finally {
      setLoadingAnalisis(false)
    }
  }

  const mesLabel = getMesLabel(mesActual.periodo)

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-ink">
      <Navbar
        empresa={empresa}
        onEmpresaChange={v => setEmpresa(v as EmpresaTipo)}
        mesIndex={safeIndex}
        onMesChange={setMesIndex}
        meses={data.meses}
        onGenerarAnalisis={handleGenerarAnalisis}
        loadingAnalisis={loadingAnalisis}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">

        {/* Breadcrumb */}
        <p className="text-xs text-muted flex items-center gap-2">
          {data.empresa.nombre}
          <span className="opacity-40">·</span>
          {getSectorLabel(data.empresa.sector)}
          <span className="opacity-40">·</span>
          {data.empresa.ciudad}
        </p>

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
              meses={data.meses}
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
                const delta = prevCat
                  ? getDelta(cat.valor, prevCat.valor)
                  : null
                const pct =
                  mesActual.ingresos.total > 0
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
                          ? delta.positivo
                            ? 'text-emerald'
                            : 'text-coral'
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
    </div>
  )
}
