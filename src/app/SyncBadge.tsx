import { CloudOff, RefreshCw, TriangleAlert } from 'lucide-react'
import { useOutbox } from '@/stores/outbox'
import { useUi } from '@/stores/ui'
import { resync } from '@/sync/engine'

/** Indicatore discreto: compare solo quando la sincronizzazione non è completa. */
export function SyncBadge() {
  const status = useUi((s) => s.syncStatus)
  const pending = useOutbox((s) => s.ops.length)
  if (status === 'synced' && pending === 0) return null
  if (status === 'offline') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-2" role="status">
        <CloudOff className="size-3.5" aria-hidden /> Offline{pending > 0 && ` · ${pending} da inviare`}
      </span>
    )
  }
  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={() => void resync()}
        className="-my-2 inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-ink ring-1 ring-inset ring-line transition-colors hover:bg-surface-2"
      >
        <TriangleAlert className="size-3.5 text-warning" aria-hidden /> Non sincronizzato · Riprova
      </button>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-2" role="status">
      <RefreshCw className="size-3.5 animate-spin" aria-hidden /> Sincronizzo
    </span>
  )
}
