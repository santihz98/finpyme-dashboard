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

/**
 * Extracts up to two uppercase initials from a full name.
 * Example: "Demo Sabores" → "DS"
 */
export function getIniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

const MESES_ES_MIN = MESES_ES.map(m => m.toLowerCase())

/**
 * Formats an ISO date as a lowercase Spanish "month year" label.
 * Example: "2025-07-15T14:54:50Z" → "julio 2025"
 */
export function formatMesAnio(fechaISO: string): string {
  const fecha = new Date(fechaISO)
  return `${MESES_ES_MIN[fecha.getMonth()]} ${fecha.getFullYear()}`
}

/**
 * Formats an ISO timestamp as a relative Spanish string.
 * Example: 90 minutes ago → "hace 1 hora"
 */
export function formatTiempoRelativo(fechaISO: string): string {
  const diffMs  = Date.now() - new Date(fechaISO).getTime()
  const minutos = Math.floor(diffMs / 60_000)

  if (minutos < 1)   return 'hace un momento'
  if (minutos < 60)  return `hace ${minutos} minuto${minutos === 1 ? '' : 's'}`
  const horas = Math.floor(minutos / 60)
  if (horas < 24)    return `hace ${horas} hora${horas === 1 ? '' : 's'}`
  const dias = Math.floor(horas / 24)
  return `hace ${dias} día${dias === 1 ? '' : 's'}`
}
