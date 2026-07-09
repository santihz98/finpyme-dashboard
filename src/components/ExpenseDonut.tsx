'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Label,
} from 'recharts'
import type { MesData } from '@/lib/types'
import { formatCOP } from '@/lib/utils'

// ─── constants ────────────────────────────────────────────────────────────────

const C = {
  coral:  '#FF5C5C',
  pearl:  '#E8EDF2',
  muted:  '#6B7A8D',
  ink:    '#0F1923',
  border: '#243447',
} as const

const CATEGORIAS = [
  { key: 'nomina',      label: 'Nómina',      color: '#378ADD' },
  { key: 'proveedores', label: 'Proveedores',  color: '#00C896' },
  { key: 'arriendo',    label: 'Arriendo',     color: '#F4B942' },
  { key: 'servicios',   label: 'Servicios',    color: '#A78BFA' },
  { key: 'otros',       label: 'Otros',        color: '#6B7A8D' },
] as const

const ALERTA_NOMINA_PCT = 38

// ─── types ────────────────────────────────────────────────────────────────────

interface ExpenseDonutProps {
  gastos:   MesData['gastos']
  mesLabel: string
}

interface Segment {
  key:   string
  label: string
  color: string
  value: number
  pct:   number
}

// ─── tooltip ─────────────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
}: {
  active?:  boolean
  payload?: { payload: Segment }[]
}) {
  if (!active || !payload?.length) return null
  const seg = payload[0].payload
  return (
    <div className="bg-ink border border-border rounded-card p-3 text-xs shadow-xl min-w-[150px]">
      <p className="font-semibold text-pearl mb-1">{seg.label}</p>
      <p style={{ color: seg.color }} className="font-medium">{formatCOP(seg.value)}</p>
      <p className="text-muted mt-0.5">{seg.pct}% del total</p>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ExpenseDonut({ gastos, mesLabel }: ExpenseDonutProps) {
  const { segments, total, isAlerta } = useMemo(() => {
    const total = gastos.total ?? 0
    const segments: Segment[] = CATEGORIAS
      .map(cat => {
        const value = gastos[cat.key] ?? 0
        return {
          key:   cat.key,
          label: cat.label,
          color: cat.color,
          value,
          pct:   total > 0 ? Math.round((value / total) * 100) : 0,
        }
      })
      .filter(s => s.value > 0)
    const nominaPct = total > 0 ? ((gastos.nomina ?? 0) / total) * 100 : 0
    return { segments, total, isAlerta: nominaPct > ALERTA_NOMINA_PCT }
  }, [gastos])

  // Center label: defined via useMemo to avoid new function reference each render
  const CenterLabel = useMemo(
    () =>
      function Label(props: any) {
        // PolarViewBox passes cx/cy either directly or via viewBox
        const cx: number = props.viewBox?.cx ?? props.cx ?? 0
        const cy: number = props.viewBox?.cy ?? props.cy ?? 0
        return (
          <>
            <text
              x={cx} y={cy - 5}
              textAnchor="middle"
              fill={C.pearl}
              fontSize={15}
              fontWeight={700}
            >
              {formatCOP(total)}
            </text>
            <text
              x={cx} y={cy + 12}
              textAnchor="middle"
              fill={C.muted}
              fontSize={11}
            >
              Gastos
            </text>
          </>
        )
      },
    [total],
  )

  const renderTooltip = useMemo(
    () => (props: object) =>
      <CustomTooltip {...(props as { active?: boolean; payload?: { payload: Segment }[] })} />,
    [],
  )

  return (
    <div className="bg-slate border border-border rounded-card p-4 flex flex-col h-full overflow-visible">
      {/* Header — outside the flex-row so it never gets clipped */}
      <h3 className="text-sm font-medium text-pearl mb-1">Composición de gastos</h3>
      <p className="text-xs text-muted mb-3">{mesLabel}</p>

      <div className="flex flex-row items-center gap-4 flex-1">
        {/* Donut — fixed size, no ResponsiveContainer */}
        <PieChart width={160} height={160}>
          <Pie
            data={segments}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            stroke="transparent"
            strokeWidth={0}
            paddingAngle={2}
          >
            {segments.map(seg => (
              <Cell
                key={seg.key}
                fill={seg.color}
                stroke={isAlerta && seg.key === 'nomina' ? C.coral : 'transparent'}
                strokeWidth={isAlerta && seg.key === 'nomina' ? 2 : 0}
              />
            ))}
            <Label content={CenterLabel as any} position="center" />
          </Pie>
          <Tooltip content={renderTooltip} />
        </PieChart>

        {/* Legend */}
        <div className="flex flex-col gap-2 min-w-[140px]">
          {segments.map(seg => (
            <div key={seg.key} className="flex items-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-muted whitespace-nowrap">
                {seg.label} · {seg.pct}%
                {isAlerta && seg.key === 'nomina' && (
                  <span className="ml-1" style={{ color: C.coral }}>⚠</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
