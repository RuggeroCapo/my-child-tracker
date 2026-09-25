import clsx from 'clsx'
import { CloudOff, RefreshCw, TriangleAlert } from 'lucide-react'
import { useOutbox } from '@/stores/outbox'
import { useUi } from '@/stores/ui'
import { resync } from '@/sync/engine'

/** Indicatore discreto: compare solo quando la sincronizzazione non è completa. */
export function SyncBadge({ className }: { className?: string } = {}) {
  const status = useUi((s) => s.syncStatus)
  const pending = useOutbox((s) => s.ops.length)
  if (status === 'synced' && pending === 0) return null
  if (status === 'offline') {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-2 shadow-xs ring-1 ring-inset ring-line/70',
          className,
        )}
        role="status"
      >
        <CloudOff className="size-3.5" aria-hidden /> Offline{pending > 0 && ` · ${pending} da inviare`}
      </span>
    )
  }
  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={() => void resync()}
        className={clsx(
          'inline-flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-xs font-semibold text-ink ring-1 ring-inset ring-line shadow-xs transition-colors hover:bg-surface active:scale-95',
          className,
        )}
      >
        <TriangleAlert className="size-3.5 text-warning" aria-hidden /> Non sincronizzato · Riprova
      </button>
    )
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-2 shadow-xs ring-1 ring-inset ring-line/70',
        className,
      )}
      role="status"
    >
      <RefreshCw className="size-3.5 animate-spin" aria-hidden /> Sincronizzo
    </span>
  )
}
