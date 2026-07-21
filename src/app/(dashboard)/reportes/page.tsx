'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Minus } from 'lucide-react'
import toast from 'react-hot-toast'

import { api, ApiError }        from '@/lib/api'
import type { PeriodoListItem } from '@/lib/api'
import type { MesData }         from '@/lib/types'
import { formatCOP, formatPct, getMesLabel } from '@/lib/utils'

// ─── mes selector ─────────────────────────────────────────────────────────────

function MesSelect({
  periodos, value, onChange,
}: {
  periodos: PeriodoListItem[]
  value:    string
  onChange: (periodo: string) => void
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="
        appearance-none bg-ink border border-border text-pearl
        rounded-tag text-sm px-3 py-2 cursor-pointer
        hover:border-emerald/50 focus:outline-none focus:border-emerald/50
        transition-colors duration-150
      "
    >
      {periodos.map(p => (
        <option key={p.periodo} value={p.periodo}>{getMesLabel(p.periodo)}</option>
      ))}
    </select>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ReportesPage() {
  const [periodos,    setPeriodos]    = useState<PeriodoListItem[]>([])
  const [email,       setEmail]       = useState('')
  const [loadingInit, setLoadingInit] = useState(true)

  // Sección 1 — Reporte PDF
  const [periodoPdf, setPeriodoPdf] = useState('')
  const [loadingPdf, setLoadingPdf] = useState(false)

  // Sección 2 — Reporte por email
  const [periodoEmail, setPeriodoEmail] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)

  // Sección 3 — Comparativo de meses
  const [periodosComparar,   setPeriodosComparar]   = useState<string[]>([''])
  const [loadingComparativa, setLoadingComparativa] = useState(false)
  const [comparativa,        setComparativa]        = useState<MesData[] | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoadingInit(true)
      try {
        const [periodosData, me] = await Promise.all([api.getPeriodos(), api.getMe()])
        if (cancelled) return

        setPeriodos(periodosData)
        setEmail(me.email)

        if (periodosData.length > 0) {
          const ultimo = periodosData[periodosData.length - 1].periodo
          setPeriodoPdf(ultimo)
          setPeriodoEmail(ultimo)
          setPeriodosComparar([ultimo])
        }
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) return // handled in api.ts
        toast.error('No se pudieron cargar los períodos.')
      } finally {
        if (!cancelled) setLoadingInit(false)
      }
    }

    void init()
    return () => { cancelled = true }
  }, [])

  async function handleDescargarPdf() {
    if (!periodoPdf) return
    setLoadingPdf(true)
    try {
      await api.descargarReporte(periodoPdf)
      toast.success(`Reporte de ${getMesLabel(periodoPdf)} descargado`)
    } catch {
      toast.error('Error generando el reporte. Intenta de nuevo.')
    } finally {
      setLoadingPdf(false)
    }
  }

  async function handleEnviarEmail() {
    if (!periodoEmail) return
    setLoadingEmail(true)
    try {
      await api.enviarReporteEmail(periodoEmail)
      toast.success(`Reporte enviado a ${email}`)
    } catch {
      toast.error('Error enviando el reporte. Intenta de nuevo.')
    } finally {
      setLoadingEmail(false)
    }
  }

  function handleAgregarPeriodo() {
    if (periodosComparar.length >= 3) return
    const disponible = periodos.find(p => !periodosComparar.includes(p.periodo))
    setPeriodosComparar([...periodosComparar, disponible?.periodo ?? periodos[0]?.periodo ?? ''])
  }

  function handleQuitarPeriodo(index: number) {
    setPeriodosComparar(periodosComparar.filter((_, i) => i !== index))
  }

  function handleCambiarPeriodoComparar(index: number, periodo: string) {
    setPeriodosComparar(periodosComparar.map((p, i) => (i === index ? periodo : p)))
  }

  async function handleVerComparativo() {
    const validos = periodosComparar.filter(Boolean)
    if (validos.length === 0) return
    setLoadingComparativa(true)
    try {
      const data = await Promise.all(validos.map(p => api.getPeriodo(p)))
      setComparativa(data)
    } catch {
      toast.error('Error cargando el comparativo. Intenta de nuevo.')
    } finally {
      setLoadingComparativa(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink">

      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-pearl">Reportes</h1>
        <p className="text-xs text-muted mt-0.5">Descarga, envía y compara los reportes de tu empresa</p>
      </div>

      <main className="px-6 py-4 space-y-6 w-full max-w-3xl">

        {/* ── SECCIÓN 1 — Reporte PDF ── */}
        <div className="bg-slate border border-border rounded-card p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-pearl">Reporte ejecutivo PDF</h2>
            <p className="text-xs text-muted mt-1">
              Descarga el reporte completo de cualquier mes con KPIs, gráficas y análisis
            </p>
          </div>

          {loadingInit ? (
            <div className="h-9 w-48 bg-ink/60 rounded-tag animate-pulse" />
          ) : periodos.length === 0 ? (
            <p className="text-xs text-muted">No hay períodos disponibles.</p>
          ) : (
            <div className="flex items-center gap-3">
              <MesSelect periodos={periodos} value={periodoPdf} onChange={setPeriodoPdf} />
              <button
                onClick={handleDescargarPdf}
                disabled={loadingPdf}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-pill text-sm
                  bg-emerald/10 border border-emerald/30 text-emerald
                  hover:bg-emerald/20 transition-colors disabled:opacity-50
                "
              >
                {loadingPdf
                  ? <Loader2 size={14} className="animate-spin" />
                  : <span>⬇</span>
                }
                {loadingPdf ? 'Generando...' : 'Descargar PDF'}
              </button>
            </div>
          )}
        </div>

        {/* ── SECCIÓN 2 — Reporte por email ── */}
        <div className="bg-slate border border-border rounded-card p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-pearl">Enviar por email</h2>
            <p className="text-xs text-muted mt-1">Recibe el reporte en tu correo electrónico</p>
          </div>

          {loadingInit ? (
            <div className="h-9 w-64 bg-ink/60 rounded-tag animate-pulse" />
          ) : periodos.length === 0 ? (
            <p className="text-xs text-muted">No hay períodos disponibles.</p>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <input
                value={email}
                readOnly
                className="bg-ink border border-border text-muted rounded-tag text-sm px-3 py-2 cursor-not-allowed"
              />
              <MesSelect periodos={periodos} value={periodoEmail} onChange={setPeriodoEmail} />
              <button
                onClick={handleEnviarEmail}
                disabled={loadingEmail}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-pill text-sm
                  bg-emerald/10 border border-emerald/30 text-emerald
                  hover:bg-emerald/20 transition-colors disabled:opacity-50
                "
              >
                {loadingEmail
                  ? <Loader2 size={14} className="animate-spin" />
                  : <span>✉</span>
                }
                {loadingEmail ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
          )}
        </div>

        {/* ── SECCIÓN 3 — Comparativo de meses ── */}
        <div className="bg-slate border border-border rounded-card p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-pearl">Comparar períodos</h2>
            <p className="text-xs text-muted mt-1">Compara hasta 3 meses lado a lado</p>
          </div>

          {loadingInit ? (
            <div className="h-9 w-48 bg-ink/60 rounded-tag animate-pulse" />
          ) : periodos.length === 0 ? (
            <p className="text-xs text-muted">No hay períodos disponibles.</p>
          ) : (
            <>
              <div className="space-y-2">
                {periodosComparar.map((periodo, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <MesSelect
                      periodos={periodos}
                      value={periodo}
                      onChange={v => handleCambiarPeriodoComparar(i, v)}
                    />
                    {periodosComparar.length > 1 && (
                      <button
                        onClick={() => handleQuitarPeriodo(i)}
                        title="Quitar mes"
                        className="p-2 rounded-tag text-muted hover:text-coral hover:bg-coral/10 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {periodosComparar.length < 3 && (
                  <button
                    onClick={handleAgregarPeriodo}
                    className="flex items-center gap-1.5 text-xs text-emerald hover:text-emerald/80 transition-colors"
                  >
                    <Plus size={13} /> Agregar mes
                  </button>
                )}
              </div>

              <button
                onClick={handleVerComparativo}
                disabled={loadingComparativa}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-pill text-sm
                  bg-emerald/10 border border-emerald/30 text-emerald
                  hover:bg-emerald/20 transition-colors disabled:opacity-50
                "
              >
                {loadingComparativa && <Loader2 size={14} className="animate-spin" />}
                Ver comparativo
              </button>
            </>
          )}

          {comparativa && comparativa.length > 0 && (
            <div className="border border-border rounded-tag overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-ink/40">
                    <th className="px-4 py-3 text-left text-xs text-muted font-medium">Métrica</th>
                    {comparativa.map(mes => (
                      <th key={mes.periodo} className="px-4 py-3 text-right text-xs text-muted font-medium">
                        {getMesLabel(mes.periodo)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-pearl">Ingresos</td>
                    {comparativa.map(mes => (
                      <td key={mes.periodo} className="px-4 py-3 text-right text-emerald font-medium">
                        {formatCOP(mes.ingresos.total)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-pearl">Gastos</td>
                    {comparativa.map(mes => (
                      <td key={mes.periodo} className="px-4 py-3 text-right text-coral font-medium">
                        {formatCOP(mes.gastos.total)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-pearl">Utilidad neta</td>
                    {comparativa.map(mes => (
                      <td
                        key={mes.periodo}
                        className={`px-4 py-3 text-right font-medium ${
                          mes.utilidad_neta >= 0 ? 'text-emerald' : 'text-coral'
                        }`}
                      >
                        {formatCOP(mes.utilidad_neta)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-pearl">Margen</td>
                    {comparativa.map(mes => (
                      <td key={mes.periodo} className="px-4 py-3 text-right text-amber font-medium">
                        {formatPct(mes.margen_pct)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
