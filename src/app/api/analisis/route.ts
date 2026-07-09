import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { EmpresaData, MesData, AnalisisIA } from '@/lib/types'
import { formatCOP, getMesLabel } from '@/lib/utils'

// ─── prompt builder ───────────────────────────────────────────────────────────

function labelGasto(key: string): string {
  return key
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function buildPrompt(
  empresa:     EmpresaData,
  mesActual:   MesData,
  mesAnterior: MesData | null,
): string {
  const { nombre, sector, ciudad } = empresa.empresa
  const totalGastos = mesActual.gastos.total

  // Dynamic gastos — works for restaurante, distribuidora AND clínica
  const gastosLines = Object.entries(mesActual.gastos)
    .filter(([key, val]) => key !== 'total' && typeof val === 'number' && (val as number) > 0)
    .map(([key, val]) => {
      const pct = totalGastos > 0
        ? (((val as number) / totalGastos) * 100).toFixed(1)
        : '0.0'
      return `  · ${labelGasto(key)}: ${formatCOP(val as number)} COP (${pct}% del total de gastos)`
    })
    .join('\n')

  const anomaliaLine = mesActual._anomalia
    ? `\nALERTA: Este mes tuvo una anomalía — ${mesActual._anomalia.descripcion}`
    : ''

  // ── mes anterior section ──
  let anteriorSection: string
  if (mesAnterior) {
    const pctIngresos = mesAnterior.ingresos.total > 0
      ? (((mesActual.ingresos.total - mesAnterior.ingresos.total) / mesAnterior.ingresos.total) * 100).toFixed(1)
      : 'N/A'
    const pctGastos = mesAnterior.gastos.total > 0
      ? (((mesActual.gastos.total - mesAnterior.gastos.total) / mesAnterior.gastos.total) * 100).toFixed(1)
      : 'N/A'
    const ptsMargen = (mesActual.margen_pct - mesAnterior.margen_pct).toFixed(1)

    anteriorSection = `MES ANTERIOR: ${getMesLabel(mesAnterior.periodo)}
- Variación ingresos: ${pctIngresos}%
- Variación gastos: ${pctGastos}%
- Variación margen: ${ptsMargen} pts`
  } else {
    anteriorSection = 'MES ANTERIOR: No disponible'
  }

  return `Eres el CFO virtual de ${nombre}, una empresa de ${sector} en ${ciudad}, Colombia.
Analiza los siguientes datos financieros y responde ÚNICAMENTE con JSON válido.

MES ACTUAL: ${getMesLabel(mesActual.periodo)}
- Ingresos totales: ${formatCOP(mesActual.ingresos.total)} COP
- Gastos totales: ${formatCOP(mesActual.gastos.total)} COP
- Utilidad neta: ${formatCOP(mesActual.utilidad_neta)} COP
- Margen: ${mesActual.margen_pct.toFixed(1)}%
- Composición de gastos:
${gastosLines}${anomaliaLine}

${anteriorSection}

INSTRUCCIONES:
- Responde SOLO con JSON, sin markdown, sin explicaciones fuera del JSON
- Usa español colombiano simple, como si hablaras directamente con el dueño
- Sé específico con números cuando refuerces un punto
- Estructura exacta requerida:
{
  "resumen": "2-3 oraciones directas sobre el estado del negocio este mes",
  "alertas": [
    { "tipo": "success|warning|danger", "mensaje": "1 oración accionable con número" }
  ],
  "recomendacion_principal": "1 oración con acción concreta que el dueño puede tomar esta semana"
}
- Máximo 3 alertas, mínimo 1
- El resumen no puede empezar con "Este mes"`
}

// ─── fallback analysis (when JSON parse fails) ────────────────────────────────

function buildFallback(empresa: EmpresaData, mesActual: MesData): AnalisisIA {
  const nombre = empresa.empresa.nombre
  const mes    = getMesLabel(mesActual.periodo)
  const margen = mesActual.margen_pct

  const tipoMargen: 'success' | 'warning' | 'danger' =
    margen >= 20 ? 'success' : margen >= 8 ? 'warning' : 'danger'

  return {
    resumen: `En ${mes}, ${nombre} registró ingresos de ${formatCOP(mesActual.ingresos.total)} COP con gastos de ${formatCOP(mesActual.gastos.total)} COP. La utilidad neta fue de ${formatCOP(mesActual.utilidad_neta)} COP, con un margen del ${margen.toFixed(1)}%.`,
    alertas: [
      {
        tipo:    tipoMargen,
        mensaje: margen >= 20
          ? `Margen del ${margen.toFixed(1)}% — resultado saludable; mantén el control de costos operativos.`
          : margen >= 8
          ? `Margen del ${margen.toFixed(1)}% — por debajo del 20% recomendado; revisa la estructura de gastos.`
          : `Margen del ${margen.toFixed(1)}% — nivel crítico; es urgente reducir costos o incrementar ingresos esta semana.`,
      },
    ],
    recomendacion_principal: `Compara la partida de gastos más alta (${formatCOP(mesActual.gastos.total)} COP en total) con el mes anterior e identifica al menos un rubro donde recortar sin afectar la operación.`,
  }
}

// ─── route handler ────────────────────────────────────────────────────────────

interface RequestBody {
  empresa:     EmpresaData
  mesActual:   MesData
  mesAnterior: MesData | null
}

export async function POST(request: NextRequest) {
  // Validate API key before anything else
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'tu_key_aqui') {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY no configurada en .env.local' },
      { status: 500 },
    )
  }

  // Parse body
  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json(
      { error: 'JSON inválido en el cuerpo de la solicitud' },
      { status: 400 },
    )
  }

  const { empresa, mesActual, mesAnterior } = body
  const prompt = buildPrompt(empresa, mesActual, mesAnterior)

  // Call Claude
  try {
    const client  = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model:       'claude-sonnet-4-6',
      max_tokens:  600,
      temperature: 0.3,
      messages:    [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0]?.type === 'text'
      ? message.content[0].text
      : ''

    // Strip markdown fences in case Claude wraps the JSON despite instructions
    const cleaned = raw
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```\s*$/m, '')
      .trim()

    try {
      const analisis = JSON.parse(cleaned) as AnalisisIA
      return NextResponse.json(analisis)
    } catch {
      // Malformed JSON from model — return a coherent fallback with real numbers
      return NextResponse.json(buildFallback(empresa, mesActual))
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json(
      { error: `Error al llamar a Claude API: ${msg}` },
      { status: 500 },
    )
  }
}
