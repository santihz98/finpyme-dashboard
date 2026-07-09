'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import type { MesData } from '@/lib/types'
import type { EmpresaTipo } from '@/lib/dataLoader'
import { getMesLabel } from '@/lib/utils'

// ─── constants ────────────────────────────────────────────────────────────────

const EMPRESAS: { value: EmpresaTipo; label: string }[] = [
  { value: 'restaurante',   label: '🏪 Restaurante Bogotá'    },
  { value: 'distribuidora', label: '🏭 Distribuidora Medellín' },
  { value: 'clinica',       label: '🏥 Clínica Cali'          },
]

// ─── types ────────────────────────────────────────────────────────────────────

interface NavbarProps {
  empresa:           string
  onEmpresaChange:   (e: string) => void
  mesIndex:          number
  onMesChange:       (i: number) => void
  meses:             MesData[]
  onGenerarAnalisis: () => void
  loadingAnalisis:   boolean
}

// ─── sub-components ───────────────────────────────────────────────────────────

const SELECT_CLASS = `
  appearance-none bg-slate border border-border text-pearl
  rounded-tag text-sm pl-3 pr-8 py-2 cursor-pointer max-w-[140px] truncate
  hover:border-emerald/50 focus:outline-none focus:border-emerald/50
  transition-colors duration-150
`

function StyledSelect({
  value,
  onChange,
  children,
}: {
  value:    string | number
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={SELECT_CLASS}
      >
        {children}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
      />
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function Navbar({
  empresa,
  onEmpresaChange,
  mesIndex,
  onMesChange,
  meses,
  onGenerarAnalisis,
  loadingAnalisis,
}: NavbarProps) {
  const [hasGenerated, setHasGenerated] = useState(false)

  // Reset "Regenerar" label whenever the selection changes
  useEffect(() => {
    setHasGenerated(false)
  }, [empresa, mesIndex])

  function handleGenerar() {
    onGenerarAnalisis()
    setHasGenerated(true)
  }

  const btnLabel = loadingAnalisis
    ? 'Analizando...'
    : hasGenerated
    ? '✦ Regenerar'
    : '✦ Analizar con IA'

  return (
    <nav className="sticky top-0 z-50 bg-ink/95 backdrop-blur border-b border-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">

        {/* ── Logo ── */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base font-bold tracking-tight">
            <span className="text-pearl">Fin</span>
            <span className="text-emerald">Pyme</span>
          </span>
          <span className="text-xs text-amber border border-amber/30 rounded-pill px-2 py-0.5 leading-tight">
            Beta
          </span>
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <StyledSelect value={empresa} onChange={onEmpresaChange}>
            {EMPRESAS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </StyledSelect>

          <StyledSelect value={mesIndex} onChange={v => onMesChange(Number(v))}>
            {meses.map((mes, i) => (
              <option key={mes.periodo} value={i}>{getMesLabel(mes.periodo)}</option>
            ))}
          </StyledSelect>

          <button
            onClick={handleGenerar}
            disabled={loadingAnalisis}
            className={[
              'flex items-center gap-2 shrink-0 border rounded-pill text-sm px-4 py-2',
              'transition-all duration-150',
              loadingAnalisis
                ? 'border-emerald/20 text-emerald/40 bg-emerald/5 cursor-not-allowed'
                : 'border-emerald/30 text-emerald bg-emerald/10 hover:bg-emerald/20 active:scale-95',
            ].join(' ')}
          >
            {loadingAnalisis && (
              <span className="inline-block w-3 h-3 border-2 border-emerald/30 border-t-emerald rounded-full animate-spin" />
            )}
            {btnLabel}
          </button>
        </div>

      </div>
    </nav>
  )
}
