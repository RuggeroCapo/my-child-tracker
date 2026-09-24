import clsx from 'clsx'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { useUi, type Tone } from '@/stores/ui'

const toneStyles: Record<Tone, { box: string; icon: typeof Info }> = {
  success: { box: 'bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-800', icon: CircleCheck },
  info: { box: 'bg-sky-50 text-sky-900 ring-sky-200 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-800', icon: Info },
  warning: { box: 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800', icon: TriangleAlert },
  error: { box: 'bg-rose-50 text-rose-900 ring-rose-200 dark:bg-rose-950 dark:text-rose-100 dark:ring-rose-800', icon: CircleAlert },
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
        const { box, icon: Icon } = toneStyles[t.tone]
        return (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={clsx('animate-toast-in pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl px-4 py-3 shadow-lg ring-1', box)}
          >
            <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && <p className="text-sm opacity-80">{t.description}</p>}
            </div>
            {t.action && (
              <button
                type="button"
                className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold underline-offset-2 hover:underline"
                onClick={() => {
                  t.action?.onClick()
                  dismiss(t.id)
                }}
              >
                {t.action.label}
              </button>
            )}
            <button type="button" aria-label="Chiudi" className="-mr-1 shrink-0 opacity-60 hover:opacity-100" onClick={() => dismiss(t.id)}>
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
