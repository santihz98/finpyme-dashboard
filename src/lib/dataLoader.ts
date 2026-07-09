import type { EmpresaData, MesData } from '@/lib/types'

import restauranteRaw  from '@/data/restaurante_2025.json'
import distribuidoraRaw from '@/data/distribuidora_2025.json'
import clinicaRaw      from '@/data/clinica_2025.json'

export type EmpresaTipo = 'restaurante' | 'distribuidora' | 'clinica'

const DATA_MAP: Record<EmpresaTipo, unknown> = {
  restaurante:   restauranteRaw,
  distribuidora: distribuidoraRaw,
  clinica:       clinicaRaw,
}

/**
 * Returns the full dataset for a company, cast to EmpresaData.
 * The distribuidora JSON has extra top-level keys (alertas_ia, benchmarks_sectoriales)
 * that are not in the type — they are ignored transparently.
 */
export function loadEmpresaData(empresa: EmpresaTipo): EmpresaData {
  return DATA_MAP[empresa] as EmpresaData
}

/**
 * Returns the month at the given index (0-based).
 */
export function getMesActual(data: EmpresaData, index: number): MesData {
  return data.meses[index]
}

/**
 * Returns the month before `index`, or null when index === 0.
 */
export function getMesAnterior(data: EmpresaData, index: number): MesData | null {
  if (index <= 0) return null
  return data.meses[index - 1]
}

/**
 * Computes annual aggregates across all 12 months.
 */
export function calcularResumenAnual(data: EmpresaData): {
  totalIngresos:  number
  totalGastos:    number
  utilidadTotal:  number
  margenPromedio: number
} {
  const n = data.meses.length

  const totalIngresos  = data.meses.reduce((s, m) => s + m.ingresos.total,  0)
  const totalGastos    = data.meses.reduce((s, m) => s + m.gastos.total,    0)
  const utilidadTotal  = data.meses.reduce((s, m) => s + m.utilidad_neta,   0)
  const margenPromedio = n > 0
    ? data.meses.reduce((s, m) => s + m.margen_pct, 0) / n
    : 0

  return {
    totalIngresos:  Math.round(totalIngresos  * 100) / 100,
    totalGastos:    Math.round(totalGastos    * 100) / 100,
    utilidadTotal:  Math.round(utilidadTotal  * 100) / 100,
    margenPromedio: Math.round(margenPromedio * 100) / 100,
  }
}
