'use client'

import { AlertTriangle } from 'lucide-react'
import type { PeriodoResumen } from '@/lib/types'
import { formatCOP, formatPct, getMesLabel, getDelta } from '@/lib/utils'
import BotonReporte from '@/components/BotonReporte'

// ─── types ────────────────────────────────────────────────────────────────────

interface PeriodosTableProps {
  periodos:        PeriodoResumen[]
  mejorMes:        string
  peorMes:         string
  onSelectPeriodo: (periodo: string) => void
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function getMargenColor(margen: number): string {
  if (margen > 35) return 'text-emerald'
  if (margen >= 25) return 'text-amber'
  return 'text-coral'
}

function getMesNombre(periodo: string): string {
  return getMesLabel(periodo).split(' ')[0]
}

// ─── main component ───────────────────────────────────────────────────────────

export default function PeriodosTable({
  periodos,
  mejorMes,
  peorMes,
  onSelectPeriodo,
}: PeriodosTableProps) {
  // Chronological order — "vs anterior" only makes sense against the prior month
  const ordenados = [...periodos].sort((a, b) => a.periodo.localeCompare(b.periodo))

  const totales = ordenados.reduce(
    (acc, p) => ({
      ingresos:  acc.ingresos + p.ingresos_total,
      gastos:    acc.gastos + p.gastos_total,
      utilidad:  acc.utilidad + p.utilidad_neta,
      margenSum: acc.margenSum + p.margen_pct,
    }),
    { ingresos: 0, gastos: 0, utilidad: 0, margenSum: 0 },
  )
  const margenPromedio = ordenados.length > 0 ? totales.margenSum / ordenados.length : 0

  return (
    <div className="bg-slate rounded-card border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-pearl">Historial anual</h3>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {['Mes', 'Ingresos', 'Gastos', 'Utilidad', 'Margen', 'vs ant.', 'Reporte'].map((h, i) => (
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
          {ordenados.map((p, i) => {
            const anterior = i > 0 ? ordenados[i - 1] : null
            const delta    = anterior ? getDelta(p.utilidad_neta, anterior.utilidad_neta) : null

            return (
              <tr
                key={p.periodo}
                onClick={() => onSelectPeriodo(p.periodo)}
                className="border-b border-border last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-pearl">{getMesNombre(p.periodo)}</span>
                    {p.tiene_anomalia && (
                      <AlertTriangle size={13} className="text-amber shrink-0" />
                    )}
                    {p.periodo === mejorMes && (
                      <span className="text-xs bg-emerald/10 text-emerald rounded-pill px-2 py-0.5">
                        Mejor
                      </span>
                    )}
                    {p.periodo === peorMes && (
                      <span className="text-xs bg-coral/10 text-coral rounded-pill px-2 py-0.5">
                        Peor
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-right text-emerald font-medium">
                  {formatCOP(p.ingresos_total)}
                </td>
                <td className="px-5 py-3 text-right text-coral font-medium">
                  {formatCOP(p.gastos_total)}
                </td>
                <td className="px-5 py-3 text-right text-pearl font-medium">
                  {formatCOP(p.utilidad_neta)}
                </td>
                <td className={`px-5 py-3 text-right font-medium ${getMargenColor(p.margen_pct)}`}>
                  {formatPct(p.margen_pct)}
                </td>
                <td
                  className={`px-5 py-3 text-right font-medium ${
                    delta ? (delta.positivo ? 'text-emerald' : 'text-coral') : 'text-muted'
                  }`}
                >
                  {delta ? `${delta.positivo ? '↑' : '↓'} ${delta.pct.replace(/^[+-]/, '')}` : '—'}
                </td>
                <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-end">
                    <BotonReporte
                      periodo={p.periodo}
                      mesLabel={getMesNombre(p.periodo)}
                      variant="icon"
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>

        <tfoot>
          <tr className="bg-ink/30 font-semibold">
            <td className="px-5 py-3 text-pearl">Total</td>
            <td className="px-5 py-3 text-right text-emerald">{formatCOP(totales.ingresos)}</td>
            <td className="px-5 py-3 text-right text-coral">{formatCOP(totales.gastos)}</td>
            <td className="px-5 py-3 text-right text-pearl">{formatCOP(totales.utilidad)}</td>
            <td className={`px-5 py-3 text-right ${getMargenColor(margenPromedio)}`}>
              {formatPct(margenPromedio)}
            </td>
            <td className="px-5 py-3 text-right text-muted">—</td>
            <td className="px-5 py-3"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
