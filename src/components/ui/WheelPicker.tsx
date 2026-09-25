import clsx from 'clsx'
import { useLayoutEffect, useRef, useState } from 'react'
import { haptic } from '@/lib/haptics'

const ITEM_H = 40
const PAD_ROWS = 2

/**
 * Rotella a scorrimento nativo con scroll-snap: stesso comportamento tattile
 * ovunque (a differenza del picker nativo del browser, che su Android apre un
 * quadrante e su iOS smette di rispondere ai tocchi dentro un foglio modale).
 */
function WheelColumn({
  count,
  value,
  onChange,
  label,
}: {
  count: number
  value: number
  onChange: (n: number) => void
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<number>(undefined)
  // La riga sotto la lente mentre la rotella gira: si evidenzia (e fa tic) a ogni scatto,
  // prima che lo scroll si fermi e il valore venga confermato.
  const [live, setLive] = useState(value)
  const liveRef = useRef(value)
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setLive(value)
  }

  // Il valore può cambiare da fuori (cambio giorno, passaggio a ieri...): riallinea lo scroll.
  useLayoutEffect(() => {
    const el = ref.current
    const target = value * ITEM_H
    liveRef.current = value
    if (el && Math.abs(el.scrollTop - target) > 1) el.scrollTop = target
  }, [value])

  function settle(el: HTMLDivElement) {
    const idx = Math.max(0, Math.min(count - 1, Math.round(el.scrollTop / ITEM_H)))
    if (idx !== value) onChange(idx)
  }

  function onScroll() {
    window.clearTimeout(settleTimer.current)
    const el = ref.current
    if (!el) return
    const idx = Math.max(0, Math.min(count - 1, Math.round(el.scrollTop / ITEM_H)))
    if (idx !== liveRef.current) {
      liveRef.current = idx
      setLive(idx)
      haptic('tick')
    }
    settleTimer.current = window.setTimeout(() => settle(el), 90)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const el = ref.current
    if (!el) return
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      onChange(Math.max(0, value - 1))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onChange(Math.min(count - 1, value + 1))
    }
  }

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={onKeyDown}
      className="no-scrollbar h-[200px] w-14 select-none snap-y snap-mandatory overflow-y-scroll outline-none"
    >
      <div style={{ height: ITEM_H * PAD_ROWS }} aria-hidden />
      {Array.from({ length: count }, (_, n) => (
        <div
          key={n}
          role="option"
          aria-selected={n === value}
          onClick={() => {
            liveRef.current = n
            ref.current!.scrollTop = n * ITEM_H
            if (n !== value) haptic('tick')
            onChange(n)
          }}
          className={clsx(
            'flex h-10 snap-center items-center justify-center text-xl tabular transition-[color,scale] duration-150',
            n === live ? 'scale-110 font-semibold text-ink' : 'text-ink-3',
          )}
        >
          {String(n).padStart(2, '0')}
        </div>
      ))}
      <div style={{ height: ITEM_H * PAD_ROWS }} aria-hidden />
    </div>
  )
}

/** Selettore ore:minuti a due rotelle indipendenti. */
export function WheelTimePicker({ hour, minute, onChange }: { hour: number; minute: number; onChange: (hour: number, minute: number) => void }) {
  return (
    <div className="relative flex items-center justify-center rounded-2xl border border-line bg-surface">
      <div className="pointer-events-none absolute inset-x-3 top-1/2 h-10 -translate-y-1/2 rounded-xl bg-rose/10" aria-hidden />
      <WheelColumn label="Ore" count={24} value={hour} onChange={(h) => onChange(h, minute)} />
      <span className="text-xl font-semibold text-ink-3" aria-hidden>
        :
      </span>
      <WheelColumn label="Minuti" count={60} value={minute} onChange={(m) => onChange(hour, m)} />
    </div>
  )
}
