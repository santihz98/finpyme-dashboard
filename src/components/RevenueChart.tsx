'use client'

import { useCallback, useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { MesData } from '@/lib/types'
import { formatCOP, getMesLabel } from '@/lib/utils'

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

const ABBR = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const abbr = (periodo: string) =>
  ABBR[parseInt(periodo.split('-')[1], 10) - 1] ?? periodo

const formatY = (v: number) =>
  v >= 1_000_000_000 ? `$${(v / 1_000_000_000).toFixed(0)}B` :
  v >= 1_000_000     ? `$${(v / 1_000_000).toFixed(0)}M`     :
  v >= 1_000         ? `$${(v / 1_000).toFixed(0)}K`         : `$${v}`

// ─── types ────────────────────────────────────────────────────────────────────

interface RevenueChartProps {
  meses:           MesData[]
  mesSeleccionado: number
  onSelectMes:     (index: number) => void
}

interface ChartEntry {
  periodo:     string
  index:       number
  ingresos:    number
  gastos:      number
  utilidad:    number
  hasAnomalia: boolean
}

// ─── tooltip ─────────────────────────────────────────────────────────────────

function TooltipRow({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  )
}

function CustomTooltip({
  active,
  payload,
  meses,
}: {
  active?:  boolean
  payload?: { payload: ChartEntry }[]
  meses:    MesData[]
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]?.payload
  if (!entry) return null
  const mes = meses[entry.index]

  return (
    <div className="bg-ink border border-border rounded-card p-3 text-xs shadow-xl min-w-[190px]">
      <p className="text-pearl font-semibold mb-2">{getMesLabel(entry.periodo)}</p>
      <div className="space-y-1">
        <TooltipRow label="Ingresos" value={formatCOP(entry.ingresos)} color="text-emerald" />
        <TooltipRow label="Gastos"   value={formatCOP(entry.gastos)}   color="text-coral"   />
        <div className="border-t border-border pt-1 mt-1">
          <TooltipRow
            label="Utilidad"
            value={formatCOP(entry.utilidad)}
            color={entry.utilidad >= 0 ? 'text-emerald' : 'text-coral'}
          />
        </div>
        {mes?._anomalia && (
          <div className="border-t border-border pt-1 mt-1">
            <p className="text-amber leading-snug">⚠ {mes._anomalia.descripcion}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function RevenueChart({
  meses,
  mesSeleccionado,
  onSelectMes,
}: RevenueChartProps) {
  const data = useMemo<ChartEntry[]>(
    () =>
      meses.map((mes, index) => ({
        periodo:     mes.periodo,
        index,
        ingresos:    mes.ingresos.total,
        gastos:      mes.gastos.total,
        utilidad:    mes.utilidad_neta,
        hasAnomalia: !!mes._anomalia,
      })),
    [meses],
  )

  // Custom ingreso bar: amber on anomaly month, selected gets full opacity + white top line
  const IngresoShape = useCallback(
    ({ x, y, width, height, index }: { x: number; y: number; width: number; height: number; index: number }) => {
      if (!width || height <= 0) return null
      const fill  = data[index]?.hasAnomalia ? C.amber : C.emerald
      const isSel = index === mesSeleccionado
      return (
        <g>
          <rect
            x={x} y={y} width={width} height={height}
            fill={fill} fillOpacity={isSel ? 1 : 0.8} rx={2}
          />
          {isSel && (
            <line x1={x} y1={y} x2={x + width} y2={y} stroke={C.pearl} strokeWidth={1.5} />
          )}
        </g>
      )
    },
    [data, mesSeleccionado],
  )

  // Custom gasto bar
  const GastoShape = useCallback(
    ({ x, y, width, height, index }: { x: number; y: number; width: number; height: number; index: number }) => {
      if (!width || height <= 0) return null
      const isSel = index === mesSeleccionado
      return (
        <g>
          <rect
            x={x} y={y} width={width} height={height}
            fill={C.coral} fillOpacity={isSel ? 1 : 0.8} rx={2}
          />
          {isSel && (
            <line x1={x} y1={y} x2={x + width} y2={y} stroke={C.pearl} strokeWidth={1.5} />
          )}
        </g>
      )
    },
    [mesSeleccionado],
  )

  // Custom X-axis tick — rotated -35°, adds ⚠ for anomaly months
  const XTick = useCallback(
    ({ x, y, payload, index }: { x: string | number; y: string | number; payload: { value: string }; index: number }) => (
      <g transform={`translate(${x},${y})`}>
        <text
          textAnchor="end"
          fill={C.muted}
          fontSize={10}
          transform="rotate(-35)"
          dy={4}
          dx={-2}
        >
          {abbr(payload.value)}{meses[index]?._anomalia ? ' ⚠' : ''}
        </text>
      </g>
    ),
    [meses],
  )

  const renderTooltip = useCallback(
    (props: object) => <CustomTooltip {...(props as { active?: boolean; payload?: { payload: ChartEntry }[] })} meses={meses} />,
    [meses],
  )

  const period =
    meses.length > 0
      ? `${abbr(meses[0].periodo)} – ${abbr(meses[meses.length - 1].periodo)} ${meses[0].periodo.split('-')[0]}`
      : ''

  return (
    <div className="bg-slate border border-border rounded-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-pearl">Ingresos vs Gastos</h3>
          {period && <p className="text-xs text-muted mt-0.5">{period}</p>}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald" />
            Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-coral" />
            Gastos
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="25%" barGap={2}>
          <CartesianGrid vertical={false} stroke={C.border} strokeOpacity={0.5} />
          <XAxis
            dataKey="periodo"
            tick={XTick}
            axisLine={false}
            tickLine={false}
            interval={0}
            height={40}
          />
          <YAxis
            tickFormatter={formatY}
            tick={{ fill: C.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            content={renderTooltip}
            cursor={{ fill: C.border, fillOpacity: 0.4 }}
          />
          <Bar
            dataKey="ingresos"
            shape={IngresoShape as any}
            onClick={(_: unknown, idx: number) => onSelectMes(idx)}
            style={{ cursor: 'pointer' }}
          />
          <Bar
            dataKey="gastos"
            shape={GastoShape as any}
            onClick={(_: unknown, idx: number) => onSelectMes(idx)}
            style={{ cursor: 'pointer' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
