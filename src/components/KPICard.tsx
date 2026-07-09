import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  label:        string
  valor:        string
  delta?:       { pct: string; positivo: boolean }
  colorAccent?: 'emerald' | 'amber' | 'coral'
  icon?:        LucideIcon
  variant?:     'default' | 'loading' | 'alert'
}

const ACCENT_COLOR: Record<string, string> = {
  emerald: '#00C896',
  amber:   '#F4B942',
  coral:   '#FF5C5C',
}

const ACCENT_ICON: Record<string, string> = {
  emerald: 'text-emerald',
  amber:   'text-amber',
  coral:   'text-coral',
}

export default function KPICard({
  label,
  valor,
  delta,
  colorAccent = 'emerald',
  icon: Icon,
  variant = 'default',
}: KPICardProps) {
  if (variant === 'loading') {
    return (
      <div className="bg-slate border border-border rounded-card p-5 border-l-[3px] border-l-border animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="h-3 w-20 bg-border rounded" />
          <div className="h-4 w-4 bg-border rounded" />
        </div>
        <div className="h-9 w-32 bg-border rounded mb-3" />
        <div className="h-3 w-24 bg-border rounded" />
      </div>
    )
  }

  return (
    <div
      className="relative bg-slate border border-border rounded-card p-5 hover:bg-slate/80 transition-colors duration-150"
      style={{
        borderLeftWidth:  '4px',
        borderLeftStyle:  'solid',
        borderLeftColor:  ACCENT_COLOR[colorAccent],
      }}
    >
      {/* Alert dot */}
      {variant === 'alert' && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-coral" />
        </span>
      )}

      {/* Header row */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs text-muted uppercase tracking-wider leading-none">
          {label}
        </span>
        {Icon && variant !== 'alert' && (
          <Icon size={15} className="text-muted flex-shrink-0" />
        )}
      </div>

      {/* Main value */}
      <p className="text-3xl font-bold text-pearl leading-none mb-2">{valor}</p>

      {/* Delta */}
      {delta ? (
        <p
          className={[
            'text-xs font-medium',
            delta.positivo ? 'text-emerald' : 'text-coral',
          ].join(' ')}
        >
          {delta.positivo ? '↑' : '↓'} {delta.pct.replace(/^[+-]/, '')} vs mes anterior
        </p>
      ) : (
        <p className="text-xs text-muted">Sin comparativo</p>
      )}
    </div>
  )
}
