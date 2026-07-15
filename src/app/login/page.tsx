'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.login(email, password)
      router.push('/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Correo o contraseña incorrectos')
      } else {
        setError('No se pudo conectar con el servidor')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-pearl">Fin</span>
            <span className="text-emerald">Pyme</span>
          </h1>
          <p className="mt-2 text-sm text-muted">Dashboard financiero con IA</p>
        </div>

        {/* Card */}
        <div className="bg-slate border border-border rounded-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-pearl">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs text-muted font-medium">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nombre@empresa.com"
                className="
                  w-full bg-ink border border-border rounded-tag
                  text-sm text-pearl placeholder:text-muted
                  px-3 py-2.5
                  focus:outline-none focus:border-emerald/50
                  transition-colors duration-150
                "
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs text-muted font-medium">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="
                  w-full bg-ink border border-border rounded-tag
                  text-sm text-pearl placeholder:text-muted
                  px-3 py-2.5
                  focus:outline-none focus:border-emerald/50
                  transition-colors duration-150
                "
              />
            </div>

            {error && (
              <p className="text-xs text-coral bg-coral/10 border border-coral/20 rounded-tag px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full bg-emerald text-ink font-semibold text-sm
                rounded-pill py-2.5
                hover:bg-emerald/80 active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150
                flex items-center justify-center gap-2
              "
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
              )}
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-[11px] text-muted/70">
            Demo: demo@sabores.com / demo1234
          </p>
        </div>

        <div className="text-center space-y-2">
          <a
            href="mailto:hola@finpyme.co"
            className="text-xs text-muted hover:text-emerald transition-colors duration-150"
          >
            ¿Quieres una demo? Escríbenos
          </a>
          <p className="text-xs text-muted">
            FinPyme · Análisis financiero para pymes colombianas
          </p>
        </div>
      </div>
    </div>
  )
}
