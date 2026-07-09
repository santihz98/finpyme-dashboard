'use client'

import { useState, useEffect } from 'react'
import { Sparkles, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AnalisisIA } from '@/lib/types'

// ─── types ────────────────────────────────────────────────────────────────────

interface InsightBoxProps {
  analisis:  AnalisisIA | null
  loading:   boolean
  onGenerar: () => void
  mesLabel:  string
}

type AlertTipo = AnalisisIA['alertas'][number]['tipo']

// ─── helpers ──────────────────────────────────────────────────────────────────

const ALERT_META: Record<
  AlertTipo,
  { Icon: LucideIcon; chip: string; text: string }
> = {
  success: { Icon: CheckCircle,  chip: 'bg-emerald/10 border-emerald/30', text: 'text-emerald' },
  warning: { Icon: AlertTriangle, chip: 'bg-amber/10   border-amber/30',   text: 'text-amber'   },
  danger:  { Icon: XCircle,      chip: 'bg-coral/10   border-coral/30',   text: 'text-coral'   },
}

// ─── sub-states ───────────────────────────────────────────────────────────────

function EmptyState({ mesLabel, onGenerar }: { mesLabel: string; onGenerar: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 px-6 text-center rounded-card border border-dashed border-border bg-slate">
      <Sparkles size={24} className="text-muted" />
      <p className="text-xs text-muted leading-snug">
        Análisis IA no generado para{' '}
        <span className="text-pearl font-medium">{mesLabel}</span>
      </p>
      <button
        onClick={onGenerar}
        className="bg-emerald text-ink font-semibold text-sm rounded-pill px-6 py-2 hover:bg-emerald/80 active:scale-95 transition-all duration-150"
      >
        ✦ Generar análisis
      </button>
    </div>
  )
}

function LoadingState({ mesLabel }: { mesLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10 px-6 text-center rounded-card border border-border bg-slate/50">
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-emerald animate-bounce"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>
      <p className="text-sm text-muted">
        Analizando los números de{' '}
        <span className="text-pearl font-medium">{mesLabel}</span>…
      </p>
    </div>
  )
}

function ResultState({
  analisis,
  mesLabel,
  timestamp,
}: {
  analisis:  AnalisisIA
  mesLabel:  string
  timestamp: string
}) {
  return (
    <div
      className="
        rounded-card border-l-[3px] border-l-emerald border border-border
        bg-gradient-to-br from-slate to-ink
        p-5 flex flex-col gap-4
      "
    >
      {/* Header */}
      <p className="text-xs text-emerald uppercase tracking-wider font-semibold">
        ✦ Análisis IA · {mesLabel}
      </p>

      {/* Resumen */}
      <p className="text-sm text-pearl leading-relaxed">{analisis.resumen}</p>

      {/* Separator */}
      <div className="border-t border-border" />

      {/* Alertas */}
      {analisis.alertas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {analisis.alertas.map((alerta, i) => {
            const meta = ALERT_META[alerta.tipo]
            return (
              <div
                key={i}
                className={`
                  flex items-start gap-2 rounded-tag border px-3 py-2
                  ${meta.chip}
                `}
              >
                <meta.Icon size={14} className={`${meta.text} mt-0.5 shrink-0`} />
                <span className={`text-sm leading-snug ${meta.text}`}>
                  {alerta.mensaje}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Recomendación principal */}
      <div className="rounded-tag border border-amber/30 bg-amber/5 px-4 py-3">
        <p className="text-xs text-amber uppercase tracking-wider font-semibold mb-1">
          Recomendación
        </p>
        <p className="text-sm text-pearl leading-relaxed">
          {analisis.recomendacion_principal}
        </p>
      </div>

      {/* Footer */}
      <p className="text-xs text-muted">
        Generado con Claude AI · {timestamp}
      </p>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function InsightBox({
  analisis,
  loading,
  onGenerar,
  mesLabel,
}: InsightBoxProps) {
  const [timestamp, setTimestamp] = useState<string>('')

  // Capture generation time whenever a fresh analysis arrives
  useEffect(() => {
    if (analisis) {
      setTimestamp(
        new Date().toLocaleTimeString('es-CO', {
          hour:   '2-digit',
          minute: '2-digit',
        }),
      )
    }
  }, [analisis])

  if (loading)          return <LoadingState mesLabel={mesLabel} />
  if (analisis === null) return <EmptyState mesLabel={mesLabel} onGenerar={onGenerar} />

  return (
    <ResultState analisis={analisis} mesLabel={mesLabel} timestamp={timestamp} />
  )
}
