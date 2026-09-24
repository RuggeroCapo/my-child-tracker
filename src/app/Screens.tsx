import { LoaderCircle } from 'lucide-react'

export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-ink-3" role="status">
      <LoaderCircle className="size-7 animate-spin" aria-hidden />
      <span className="text-sm">{label ?? 'Caricamento…'}</span>
    </div>
  )
}

export function SetupMissing() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 px-6">
      <h1 className="text-2xl font-semibold">Configurazione mancante</h1>
      <p className="text-ink-2">
        Imposta <code className="rounded bg-surface-2 px-1">VITE_SUPABASE_URL</code> e{' '}
        <code className="rounded bg-surface-2 px-1">VITE_SUPABASE_ANON_KEY</code> in <code>.env.local</code> (vedi
        README).
      </p>
    </div>
  )
}
