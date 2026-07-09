import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-ink min-h-screen flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-5xl font-bold tracking-tight">
          <span className="text-pearl">Fin</span>
          <span className="text-emerald">Pyme</span>
        </span>
        <span className="text-xs text-amber border border-amber/30 rounded-pill px-2 py-0.5 leading-tight self-start mt-2">
          Beta
        </span>
      </div>

      {/* Tagline */}
      <p className="text-xl text-pearl mt-4 font-medium">
        Entiende tu negocio en segundos
      </p>

      {/* Subtitle */}
      <p className="text-sm text-muted mt-2 max-w-sm">
        Dashboard financiero con IA para pymes colombianas
      </p>

      {/* CTA */}
      <Link
        href="/dashboard"
        className="mt-8 bg-emerald text-ink font-semibold rounded-pill px-8 py-3 text-sm hover:bg-emerald/80 active:scale-95 transition-all duration-150 inline-block"
      >
        Ver demo →
      </Link>
    </div>
  )
}
