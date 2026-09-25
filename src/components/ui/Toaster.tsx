import clsx from 'clsx'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { useRef, useState, type PointerEvent } from 'react'
import { useUi, type Tone, type Toast } from '@/stores/ui'

/** Tutti i toast sono carta: il tono vive solo nell'icona, così nessun avviso "urla" di notte. */
const toneIcon: Record<Tone, { icon: typeof Info; color: string }> = {
  success: { icon: CircleCheck, color: 'text-success' },
  info: { icon: Info, color: 'text-ink-2' },
  warning: { icon: TriangleAlert, color: 'text-warning' },
  error: { icon: CircleAlert, color: 'text-danger' },
}

/** Spinto verso l'alto oltre questa distanza (px) o con uno scatto (px/ms), il toast se ne va. */
const DISMISS_DISTANCE = 32
const DISMISS_VELOCITY = 0.35

export function Toaster() {
  const toasts = useUi((s) => s.toasts)
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-safe pt-safe"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

function ToastItem({ toast: t }: { toast: Toast }) {
  const dismiss = useUi((s) => s.dismiss)
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; y0: number; t0: number; dy: number } | null>(null)
  // Uscito col dito: prosegue la sua corsa invece di rifare l'animazione d'uscita.
  const [swiped, setSwiped] = useState(false)
  const { icon: Icon, color } = toneIcon[t.tone]

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' || t.leaving || (e.target as HTMLElement).closest('button')) return
    drag.current = { id: e.pointerId, y0: e.clientY, t0: e.timeStamp, dy: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    const el = ref.current
    if (!d || d.id !== e.pointerId || !el) return
    // Verso il basso resiste: il toast sta già al suo posto.
    const raw = e.clientY - d.y0
    d.dy = raw < 0 ? raw : raw / 6
    el.style.transition = 'none'
    el.style.transform = `translateY(${d.dy}px)`
    el.style.opacity = String(Math.max(0.2, 1 + Math.min(0, d.dy) / 90))
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    drag.current = null
    const el = ref.current
    if (!d || d.id !== e.pointerId || !el) return
    const velocity = d.dy / Math.max(1, e.timeStamp - d.t0)
    if (d.dy < -DISMISS_DISTANCE || (d.dy < -12 && velocity < -DISMISS_VELOCITY)) {
      el.style.transition = 'transform 160ms var(--ease-out-quart), opacity 160ms var(--ease-out-quart)'
      el.style.transform = 'translateY(calc(-100% - 1rem))'
      el.style.opacity = '0'
      setSwiped(true)
      dismiss(t.id)
      return
    }
    el.style.transition = 'transform var(--spring-ms) var(--ease-spring), opacity 200ms var(--ease-out-quart)'
    el.style.transform = ''
    el.style.opacity = ''
  }

  return (
    <div
      ref={ref}
      role={t.tone === 'error' ? 'alert' : 'status'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={clsx(
        t.leaving ? 'pointer-events-none' : 'animate-toast-in pointer-events-auto',
        t.leaving && !swiped && 'animate-toast-out',
        'flex w-full max-w-md touch-none items-center gap-3 rounded-2xl bg-surface py-2 pl-4 pr-1 text-ink shadow-[0_8px_24px_oklch(0.3_0.05_350/0.14)] ring-1 ring-line dark:bg-surface-2 dark:shadow-none',
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
          className="press h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-rose-ink [--press:0.94] hover:bg-surface-2 active:bg-surface-2"
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
        className="press inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-3 [--press:0.9] hover:bg-surface-2 hover:text-ink active:bg-surface-2"
        onClick={() => dismiss(t.id)}
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
