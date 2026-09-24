import clsx from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

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

  useEffect(() => {
    if (!open) return
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

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="animate-fade-in absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={clsx(
          'animate-sheet-up relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] bg-surface px-safe pb-safe pt-2 outline-none sm:rounded-[1.75rem] sm:pb-6',
          className,
        )}
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
        {title && (
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi"
              className="-mr-2 inline-flex size-10 items-center justify-center rounded-full text-ink-3 hover:bg-surface-2"
            >
              <X className="size-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
