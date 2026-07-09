/**
 * Formats a COP amount with magnitude suffix.
 * Examples: 573_365_982 → "$573.4M"  |  28_000_000 → "$28.0M"  |  450_000 → "$450.0K"
 */
export function formatCOP(valor: number): string {
  const sign = valor < 0 ? '-' : ''
  const abs  = Math.abs(valor)

  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000)     return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)         return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${abs.toFixed(0)}`
}

/**
 * Formats a percentage value.
 * Example: 31.2 → "31.2%"
 */
export function formatPct(valor: number): string {
  return `${valor.toFixed(1)}%`
}

/**
 * Computes the percentage delta between two values and signals direction.
 * Example: getDelta(23_241_075, 33_231_318) → { pct: "-30.1%", positivo: false }
 */
export function getDelta(
  actual: number,
  anterior: number,
): { pct: string; positivo: boolean } {
  if (anterior === 0) return { pct: '0.0%', positivo: true }
  const delta = ((actual - anterior) / Math.abs(anterior)) * 100
  return {
    pct:      `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`,
    positivo: delta >= 0,
  }
}

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/**
 * Converts a period string to a Spanish month label.
 * Example: "2025-02" → "Febrero 2025"
 */
export function getMesLabel(periodo: string): string {
  const [year, month] = periodo.split('-')
  return `${MESES_ES[parseInt(month, 10) - 1]} ${year}`
}

const SECTOR_LABELS: Record<string, string> = {
  restaurantes_colombia:       'Restaurantes',
  distribucion_colombia:       'Distribución',
  medicina_estetica_colombia:  'Medicina Estética',
}

/**
 * Converts a sector key to a human-readable Spanish label.
 * Example: "restaurantes_colombia" → "Restaurantes"
 */
export function getSectorLabel(sector: string): string {
  return SECTOR_LABELS[sector] ?? sector
}
