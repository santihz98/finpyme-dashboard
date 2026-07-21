'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { ComparativoData } from '@/lib/types'
import { formatCOP, formatPct, getMesLabel } from '@/lib/utils'

// ─── colour constants (keep in sync with tailwind.config.ts) ─────────────────
const C = {
  emerald: '#00C896',
  coral:   '#FF5C5C',
  amber:   '#F4B942',
  ink:     '#0F1923',
  border:  '#243447',
  muted:   '#6B7A8D',
  pearl:   '#E8EDF2',
} as const

function margenColorClass(pct: number): string {
  if (pct > 35) return 'text-emerald'
  if (pct >= 25) return 'text-amber'
  return 'text-coral'
}

function margenEmoji(pct: number): string {
  if (pct > 35) return '🟢'
  if (pct >= 25) return '🟡'
  return '🔴'
}

// ─── tooltip ─────────────────────────────────────────────────────────────────

function TooltipRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  )
}

interface ChartEntry {
  periodo:  string
  label:    string
  ingresos: number
  gastos:   number
  utilidad: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartEntry }[] }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]?.payload
  if (!entry) return null

  return (
    <div className="bg-ink border border-border rounded-card p-3 text-xs shadow-xl min-w-[190px]">
      <p className="text-pearl font-semibold mb-2">{entry.label}</p>
      <div className="space-y-1">
        <TooltipRow label="Ingresos" value={formatCOP(entry.ingresos)} color="text-emerald" />
        <TooltipRow label="Gastos"   value={formatCOP(entry.gastos)}   color="text-coral" />
        <TooltipRow
          label="Utilidad"
          value={formatCOP(entry.utilidad)}
          color={entry.utilidad >= 0 ? 'text-emerald' : 'text-coral'}
        />
      </div>
    </div>
  )
}

function renderTooltip(props: object) {
  return <CustomTooltip {...(props as { active?: boolean; payload?: { payload: ChartEntry }[] })} />
}

// ─── types ────────────────────────────────────────────────────────────────────

interface ComparativoMesesProps {
  data: {
    empresa:  string
    periodos: ComparativoData[]
  }
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ComparativoMeses({ data }: ComparativoMesesProps) {
  const { periodos } = data

  const chartData = useMemo<ChartEntry[]>(
    () =>
      periodos.map(p => ({
        periodo:  p.periodo,
        label:    getMesLabel(p.periodo),
        ingresos: p.ingresos_total,
        gastos:   p.gastos_total,
        utilidad: p.utilidad_neta,
      })),
    [periodos],
  )

  return (
    <div className="bg-slate rounded-card border border-border overflow-hidden">

      {/* ── Tabla comparativa ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs text-muted font-medium">Métrica</th>
              {periodos.map(p => (
                <th key={p.periodo} className="px-4 py-3 text-right">
                  <span className="text-emerald font-medium">{getMesLabel(p.periodo)}</span>
                  {p.tiene_anomalia && <span className="text-amber ml-1">⚠</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Ingresos */}
            <tr>
              <td className="px-4 py-3 text-muted text-sm">Ingresos</td>
              {periodos.map((p, i) => {
                const prev  = i > 0 ? periodos[i - 1].ingresos_total : null
                const arrow = prev === null ? '' : p.ingresos_total > prev ? ' ↑' : p.ingresos_total < prev ? ' ↓' : ''
                const arrowColor = arrow === ' ↑' ? 'text-emerald' : arrow === ' ↓' ? 'text-coral' : ''
                return (
                  <td key={p.periodo} className="px-4 py-3 text-right text-emerald font-medium">
                    {formatCOP(p.ingresos_total)}
                    <span className={arrowColor}>{arrow}</span>
                  </td>
                )
              })}
            </tr>

            {/* Gastos */}
            <tr className="bg-ink/20">
              <td className="px-4 py-3 text-muted text-sm">Gastos</td>
              {periodos.map(p => (
                <td key={p.periodo} className="px-4 py-3 text-right text-coral font-medium">
                  {formatCOP(p.gastos_total)}
                </td>
              ))}
            </tr>

            {/* Utilidad */}
            <tr>
              <td className="px-4 py-3 text-muted text-sm">Utilidad</td>
              {periodos.map(p => (
                <td
                  key={p.periodo}
                  className={`px-4 py-3 text-right font-medium ${p.utilidad_neta >= 0 ? 'text-emerald' : 'text-coral'}`}
                >
                  {formatCOP(p.utilidad_neta)}
                </td>
              ))}
            </tr>

            {/* Margen */}
            <tr className="bg-ink/20">
              <td className="px-4 py-3 text-muted text-sm">Margen</td>
              {periodos.map(p => (
                <td key={p.periodo} className={`px-4 py-3 text-right font-medium ${margenColorClass(p.margen_pct)}`}>
                  {formatPct(p.margen_pct)} {margenEmoji(p.margen_pct)}
                </td>
              ))}
            </tr>

            {/* Nómina */}
            <tr>
              <td className="px-4 py-3 text-muted text-sm">Nómina</td>
              {periodos.map(p => (
                <td key={p.periodo} className="px-4 py-3 text-right text-coral font-medium">
                  {formatCOP(p.gastos_detalle.nomina)}
                </td>
              ))}
            </tr>

            {/* Proveedores */}
            <tr className="bg-ink/20">
              <td className="px-4 py-3 text-muted text-sm">Proveedores</td>
              {periodos.map(p => (
                <td key={p.periodo} className="px-4 py-3 text-right text-coral font-medium">
                  {formatCOP(p.gastos_detalle.proveedores)}
                </td>
              ))}
            </tr>

            {/* Arriendo */}
            <tr>
              <td className="px-4 py-3 text-muted text-sm">Arriendo</td>
              {periodos.map(p => (
                <td key={p.periodo} className="px-4 py-3 text-right text-coral font-medium">
                  {formatCOP(p.gastos_detalle.arriendo)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Gráfica comparativa ── */}
      <div className="p-5 border-t border-border">
        <div className="flex items-center gap-4 text-xs text-muted mb-3">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald" />
            Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-coral" />
            Gastos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber" />
            Utilidad
          </span>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barCategoryGap="25%" barGap={2}>
            <CartesianGrid vertical={false} stroke={C.border} strokeOpacity={0.5} />
            <XAxis
              dataKey="label"
              tick={{ fill: C.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v =>
                v >= 1_000_000_000 ? `$${(v / 1_000_000_000).toFixed(0)}B` :
                v >= 1_000_000     ? `$${(v / 1_000_000).toFixed(0)}M`     :
                v >= 1_000         ? `$${(v / 1_000).toFixed(0)}K`         : `$${v}`
              }
              tick={{ fill: C.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={renderTooltip} cursor={{ fill: C.border, fillOpacity: 0.4 }} />
            <Bar dataKey="ingresos" fill={C.emerald} radius={[2, 2, 0, 0]} />
            <Bar dataKey="gastos"   fill={C.coral}   radius={[2, 2, 0, 0]} />
            <Bar dataKey="utilidad" fill={C.amber}   radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
