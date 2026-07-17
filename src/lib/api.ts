'use client'

import toast from 'react-hot-toast'
import type { AnalisisIA, MesData, PeriodoResumen, ResumenAnual } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Backend shapes (different from frontend display types) ────────────────────

interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  usuario: {
    id: string
    empresa_id: string
    email: string
    nombre: string
    rol: string
  }
}

interface MeResponse {
  id: string
  empresa_id: string
  email: string
  nombre: string
  rol: string
  activo: boolean
  ultimo_login: string
  created_at: string
  empresa: {
    id: string
    nombre: string
    nit: string
    ciudad: string
    sector: string
    plan: string
    activo: boolean
    created_at: string
  }
}

interface PeriodoListItem {
  id: string
  periodo: string
  fuente: string
  tiene_analisis: boolean
  created_at: string
}

interface BackendPeriodo {
  id: string
  empresa_id: string
  periodo: string
  fuente: string
  datos_json: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface BackendComparativa {
  actual: BackendPeriodo
  anterior: BackendPeriodo | null
}

interface BackendAnalisis {
  id: string
  empresa_id: string
  periodo_id: string
  resumen: string
  alertas_json: { tipo: 'success' | 'warning' | 'danger'; mensaje: string }[]
  recomendacion: string
  modelo_usado: string
  tokens_usados: number
  created_at: string
}

// ── Custom error with status code ─────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ── Normalization helpers ─────────────────────────────────────────────────────

function normalizeAnalisis(raw: BackendAnalisis): AnalisisIA {
  return {
    resumen: raw.resumen,
    alertas: raw.alertas_json,
    recomendacion_principal: raw.recomendacion,
  }
}

function normalizeMesData(raw: BackendPeriodo): MesData {
  // datos_json is the raw MesData dict uploaded from the frontend JSON format
  return raw.datos_json as unknown as MesData
}

// ── Client class ──────────────────────────────────────────────────────────────

class ApiClient {
  private token: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('finpyme_token')
    }
  }

  // Sets the httpOnly session cookie read by middleware — must be awaited
  // before navigating, since the cookie only exists once this resolves.
  private async syncCookie(token: string): Promise<void> {
    await fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      keepalive: true,
    }).catch(() => {})
  }

  async setToken(token: string): Promise<void> {
    this.token = token
    if (typeof window === 'undefined') return
    localStorage.setItem('finpyme_token', token)
    await this.syncCookie(token)
  }

  async clearToken(): Promise<void> {
    this.token = null
    if (typeof window === 'undefined') return
    localStorage.removeItem('finpyme_token')
    localStorage.removeItem('finpyme_refresh')
    await this.syncCookie('')
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    let res: Response
    try {
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          ...options?.headers,
        },
      })
    } catch {
      toast.error('Error al conectar con el servidor')
      throw new ApiError(0, 'No se pudo conectar con el servidor')
    }

    if (res.status === 401) {
      void this.clearToken()
      if (typeof window !== 'undefined') window.location.href = '/login'
      throw new ApiError(401, 'Sesión expirada')
    }

    if (!res.ok) {
      const text = await res.text()
      throw new ApiError(res.status, text)
    }

    return res.json() as Promise<T>
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    await this.setToken(data.access_token)
    if (typeof window !== 'undefined') {
      localStorage.setItem('finpyme_refresh', data.refresh_token)
    }
    return data
  }

  async getMe(): Promise<MeResponse> {
    return this.request<MeResponse>('/auth/me')
  }

  async logout(): Promise<void> {
    const refresh = typeof window !== 'undefined'
      ? localStorage.getItem('finpyme_refresh')
      : null
    if (refresh) {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refresh }),
      }).catch(() => {}) // best-effort
    }
    await this.clearToken()
  }

  // ── Periodos ──────────────────────────────────────────────────────────────

  async getPeriodos(): Promise<PeriodoListItem[]> {
    return this.request<PeriodoListItem[]>('/periodos/')
  }

  async getPeriodosResumen(): Promise<PeriodoResumen[]> {
    return this.request<PeriodoResumen[]>('/periodos/')
  }

  async getPeriodo(periodo: string): Promise<MesData> {
    const raw = await this.request<BackendPeriodo>(`/periodos/${periodo}`)
    return normalizeMesData(raw)
  }

  async getComparativa(periodo: string): Promise<{
    actual: MesData
    anterior: MesData | null
  }> {
    const raw = await this.request<BackendComparativa>(`/periodos/${periodo}/comparativa`)
    return {
      actual: normalizeMesData(raw.actual),
      anterior: raw.anterior ? normalizeMesData(raw.anterior) : null,
    }
  }

  async getResumenAnual(): Promise<ResumenAnual> {
    return this.request<ResumenAnual>('/periodos/resumen/anual')
  }

  // ── Análisis IA ───────────────────────────────────────────────────────────

  async generarAnalisis(periodo: string): Promise<AnalisisIA> {
    const raw = await this.request<BackendAnalisis>(`/analisis/generar/${periodo}`, {
      method: 'POST',
    })
    return normalizeAnalisis(raw)
  }

  async getAnalisis(periodo: string): Promise<AnalisisIA | null> {
    try {
      const raw = await this.request<BackendAnalisis>(`/analisis/${periodo}`)
      return normalizeAnalisis(raw)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  }
}

// Module-level singleton — re-reads localStorage token on first import
export const api = new ApiClient()

export type { MeResponse, PeriodoListItem, ResumenAnual }
