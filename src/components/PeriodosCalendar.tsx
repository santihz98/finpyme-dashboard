'use client'

import type { PeriodoResumen } from '@/lib/types'
import { formatCOP, formatPct } from '@/lib/utils'

// ─── types ────────────────────────────────────────────────────────────────────

interface PeriodosCalendarProps {
  periodos:        PeriodoResumen[]
  mejorMes:        string
  peorMes:         string
  onSelectPeriodo: (periodo: string) => void
}

// ─── constants / helpers ────────────────────────────────────────────────────────

const MESES_ABREV = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

function getMargenColor(margen: number): string {
  if (margen > 35) return 'text-emerald'
  if (margen >= 25) return 'text-pearl'
  return 'text-coral'
}

function getBarColor(margen: number): string {
  if (margen > 35) return 'bg-emerald'
  if (margen >= 25) return 'bg-pearl'
  return 'bg-coral'
}

// ─── main component ───────────────────────────────────────────────────────────

export default function PeriodosCalendar({
  periodos,
  mejorMes,
  peorMes,
  onSelectPeriodo,
}: PeriodosCalendarProps) {
  const anio = periodos[0]?.periodo.split('-')[0] ?? String(new Date().getFullYear())
  const porPeriodo = new Map(periodos.map(p => [p.periodo, p]))

  const slots = Array.from({ length: 12 }, (_, i) => {
    const mes     = String(i + 1).padStart(2, '0')
    const periodo = `${anio}-${mes}`
    return { periodo, mesIndex: i, data: porPeriodo.get(periodo) ?? null }
  })

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {slots.map(({ periodo, mesIndex, data }) => {
        if (!data) {
          return (
            <div
              key={periodo}
              className="bg-ink/30 opacity-50 border border-border rounded-card p-5 flex items-center justify-center min-h-[112px]"
            >
              <p className="text-xs text-muted">Sin datos</p>
            </div>
          )
        }

        const esMejor  = data.periodo === mejorMes
        const esPeor   = data.periodo === peorMes
        const barWidth = Math.min(Math.max(data.margen_pct, 0), 100)

        return (
          <div
            key={periodo}
            onClick={() => onSelectPeriodo(data.periodo)}
            className={[
              'relative bg-slate border border-border rounded-card p-5',
              'hover:border-emerald/30 transition-colors cursor-pointer',
              esMejor ? 'border-t-2 border-t-emerald' : '',
              esPeor ? 'border-t-2 border-t-coral' : '',
            ].join(' ')}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-medium text-pearl">{MESES_ABREV[mesIndex]}</span>
                <span className="text-xs text-muted">{anio}</span>
              </div>
              {data.tiene_anomalia && (
                <span className="text-amber text-xs leading-none">⚠</span>
              )}
            </div>

            {/* Ingreso total */}
            <p className={`mt-2 text-xl font-semibold ${getMargenColor(data.margen_pct)}`}>
              {formatCOP(data.ingresos_total)}
            </p>

            {/* Margen + barra */}
            <div>
              <p className="text-sm text-muted mt-2 mb-1">Margen: {formatPct(data.margen_pct)}</p>
              <div className="w-full h-1 bg-border rounded-sm overflow-hidden">
                <div
                  className={`h-full rounded-sm ${getBarColor(data.margen_pct)}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
