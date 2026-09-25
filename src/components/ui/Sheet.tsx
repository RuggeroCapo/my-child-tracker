import clsx from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Oltre questa distanza (px) o velocità (px/ms) il trascinamento chiude il foglio. */
const DISMISS_DISTANCE = 96
const DISMISS_VELOCITY = 0.5

/** Bottom sheet modale, ottimizzato per l'uso con il pollice. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}) {
  const panel = useRef<HTMLDivElement>(null)
  const scrim = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; y0: number; t0: number; dy: number } | null>(null)
  // Resta montato durante l'animazione di uscita.
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  const closing = mounted && !open

  useEffect(() => {
    if (!open) return
    // Riaperto mentre usciva dopo un trascinamento: via gli stili lasciati dal dito.
    panel.current?.style.removeProperty('transform')
    panel.current?.style.removeProperty('--drag')
    scrim.current?.style.removeProperty('opacity')
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const prevFocus = document.activeElement as HTMLElement | null
    panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prevFocus?.focus?.()
    }
  }, [open, onClose])

  if (!mounted) return null

  // Trascinamento verso il basso dalla maniglia/intestazione, solo con tocco o penna.
  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' || closing || (e.target as HTMLElement).closest('button')) return
    drag.current = { id: e.pointerId, y0: e.clientY, t0: e.timeStamp, dy: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || d.id !== e.pointerId || !panel.current) return
    // Verso l'alto resiste: il foglio è già aperto del tutto.
    const raw = e.clientY - d.y0
    d.dy = raw > 0 ? raw : raw / 6
    panel.current.style.transition = 'none'
    panel.current.style.transform = `translateY(${d.dy}px)`
    if (scrim.current) scrim.current.style.opacity = String(1 - Math.max(0, d.dy) / panel.current.offsetHeight)
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    drag.current = null
    const el = panel.current
    if (!d || d.id !== e.pointerId || !el) return
    const velocity = d.dy / Math.max(1, e.timeStamp - d.t0)
    if (d.dy > DISMISS_DISTANCE || (d.dy > 24 && velocity > DISMISS_VELOCITY)) {
      // L'animazione di uscita riparte da qui (vedi --drag in sheet-down).
      el.style.setProperty('--drag', `${d.dy}px`)
      onClose()
      return
    }
    el.style.transition = 'transform 220ms var(--ease-out-expo)'
    el.style.transform = ''
    if (scrim.current) {
      scrim.current.style.transition = 'opacity 220ms var(--ease-out-quart)'
      scrim.current.style.opacity = ''
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" inert={closing || undefined}>
      <div
        ref={scrim}
        className={clsx('absolute inset-0 bg-scrim backdrop-blur-[2px]', closing ? 'animate-fade-out' : 'animate-fade-in')}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) setMounted(false)
        }}
        className={clsx(
          'relative max-h-[92dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-[1.75rem] bg-surface px-safe pb-safe pt-2 outline-none sm:rounded-[1.75rem] sm:pb-6',
          closing ? 'animate-sheet-down' : 'animate-sheet-up',
          className,
        )}
      >
        <div
          className="touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
          {title && (
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-display-snug text-xl font-bold">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Chiudi"
                className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-ink-2 transition-[color,background-color,transform] duration-150 ease-out-quart hover:bg-surface-2 hover:text-ink active:scale-95"
              >
                <X className="size-5" />
              </button>
            </div>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
