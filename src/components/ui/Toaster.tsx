import clsx from 'clsx'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { useUi, type Tone } from '@/stores/ui'

/** Tutti i toast sono carta: il tono vive solo nell'icona, così nessun avviso "urla" di notte. */
const toneIcon: Record<Tone, { icon: typeof Info; color: string }> = {
  success: { icon: CircleCheck, color: 'text-success' },
  info: { icon: Info, color: 'text-ink-2' },
  warning: { icon: TriangleAlert, color: 'text-warning' },
  error: { icon: CircleAlert, color: 'text-danger' },
}

export function Toaster() {
  const toasts = useUi((s) => s.toasts)
  const dismiss = useUi((s) => s.dismiss)
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-safe pt-safe"
    >
      {toasts.map((t) => {
        const { icon: Icon, color } = toneIcon[t.tone]
        return (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={clsx(
              t.leaving ? 'animate-toast-out pointer-events-none' : 'animate-toast-in pointer-events-auto',
              'flex w-full max-w-md items-center gap-3 rounded-2xl bg-surface py-2 pl-4 pr-1 text-ink shadow-[0_8px_24px_oklch(0.3_0.05_350/0.14)] ring-1 ring-line dark:bg-surface-2 dark:shadow-none',
            )}
          >
            <Icon className={clsx('size-5 shrink-0', color)} aria-hidden />
            <div className="min-w-0 flex-1 py-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && <p className="text-sm text-ink-2">{t.description}</p>}
            </div>
            {t.action && (
              <button
                type="button"
                className="h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-rose-ink transition-colors hover:bg-surface-2"
                onClick={() => {
                  t.action?.onClick()
                  dismiss(t.id)
                }}
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label="Chiudi"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
              onClick={() => dismiss(t.id)}
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
