'use client'
import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Props {
  periodo: string
  mesLabel: string
  variant?: 'button' | 'icon'
}

export default function BotonReporte({ periodo, mesLabel, variant = 'button' }: Props) {
  const [loading, setLoading] = useState(false)

  const handleDescargar = async () => {
    setLoading(true)
    try {
      await api.descargarReporte(periodo)
      toast.success(`Reporte de ${mesLabel} descargado`)
    } catch (error) {
      toast.error('Error generando el reporte. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDescargar}
        disabled={loading}
        title={`Descargar reporte ${mesLabel}`}
        className="p-2 rounded-tag bg-slate border border-border
                   hover:border-emerald/30 hover:bg-emerald/5
                   transition-colors disabled:opacity-50"
      >
        {loading
          ? <Loader2 size={14} className="animate-spin text-muted" />
          : <FileDown size={14} className="text-muted hover:text-emerald" />
        }
      </button>
    )
  }

  return (
    <button
      onClick={handleDescargar}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-pill text-sm
                 bg-slate border border-border text-muted
                 hover:border-emerald/30 hover:text-emerald hover:bg-emerald/5
                 transition-colors disabled:opacity-50"
    >
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : <FileDown size={14} />
      }
      {loading ? 'Generando...' : 'Descargar reporte'}
    </button>
  )
}
