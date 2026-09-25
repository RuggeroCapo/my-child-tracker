import clsx from 'clsx'
import { CalendarDays } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Textarea } from '@/components/ui/Field'
import { WheelTimePicker } from '@/components/ui/WheelPicker'
import { formatAgo, formatDayLabel, toDateInput, withLocalTime } from '@/lib/time'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Data e ora di un evento. L'ora è il controllo principale (quasi sempre si
 * corregge solo quella): tocco sull'ora → rotelle in linea, senza conferma.
 * Si chiudono ritoccando l'ora, toccando fuori o con Esc. Il giorno è un chip
 * secondario (date input nativo trasparente) perché è quasi sempre oggi, e
 * `withLocalTime` porta già a ieri un orario che oggi sarebbe nel futuro.
 * Rotelle proprie invece del picker nativo: su Android apre un quadrante
 * analogico e su iOS non risponde bene al tocco dentro un foglio modale.
 */
export function DateTimeInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const now = new Date()
  const date = new Date(value)
  const [wheelOpen, setWheelOpen] = useState(false)
  const hour = Number(value.slice(11, 13))
  const minute = Number(value.slice(14, 16))

  useEffect(() => {
    if (!wheelOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setWheelOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setWheelOpen(false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [wheelOpen])

  return (
    <div ref={rootRef} className="space-y-1.5">
      {/* Il "quanto tempo fa" sta sulla riga dell'etichetta: una riga in meno per campo. */}
      <div className="flex items-baseline justify-between gap-3 px-1">
        <label htmlFor={id} className="text-sm font-medium text-ink-2">
          {label}
        </label>
        <span id={`${id}-ago`} className="truncate text-xs text-ink-3 tabular">
          {formatAgo(date.toISOString(), now.getTime())}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          id={id}
          aria-haspopup="dialog"
          aria-expanded={wheelOpen}
          aria-controls={`${id}-wheel`}
          aria-describedby={`${id}-ago`}
          onClick={() => setWheelOpen((o) => !o)}
          className={clsx(
            'flex h-14 min-w-0 flex-1 items-center justify-center rounded-2xl border bg-surface text-2xl font-semibold text-ink tabular transition-colors',
            wheelOpen ? 'border-rose ring-3 ring-rose/20' : 'border-line',
          )}
        >
          {value.slice(11, 16)}
        </button>
        <div className="relative flex h-14 shrink-0 items-center gap-1.5 rounded-2xl border border-line bg-surface px-3.5 text-sm font-medium text-ink-2">
          <CalendarDays className="size-4" aria-hidden />
          <span className="max-w-28 truncate" aria-hidden>
            {formatDayLabel(date, now)}
          </span>
          <input
            type="date"
            required
            aria-label="Giorno"
            max={toDateInput(now)}
            value={value.slice(0, 10)}
            onChange={(e) => e.target.value && onChange(`${e.target.value}${value.slice(10)}`)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </div>
      </div>
      {wheelOpen && (
        <div id={`${id}-wheel`} role="dialog" aria-label="Seleziona l'ora" className="pt-1">
          <WheelTimePicker hour={hour} minute={minute} onChange={(h, m) => onChange(withLocalTime(value, `${pad(h)}:${pad(m)}`))} />
        </div>
      )}
    </div>
  )
}

export function NotesInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    // Una riga che cresce col testo: la nota è rara, non deve spingere Salva fuori schermo.
    <Textarea
      label="Note"
      optional
      rows={1}
      maxLength={1000}
      placeholder="Aggiungi una nota…"
      className="min-h-12 max-h-40 field-sizing-content"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

/** Griglia di scelte grandi (tipo pannolino, lato, tipo di latte...). */
export function ChoiceGrid<T extends string>({
  value,
  options,
  onChange,
  columns = 3,
  activeClass = 'ring-2 ring-rose bg-rose/10 text-ink',
  label,
}: {
  value: T | null
  options: { value: T; label: string; icon?: ReactNode }[]
  onChange: (v: T) => void
  columns?: 2 | 3 | 4
  activeClass?: string
  label?: string
}) {
  return (
    <div className="space-y-1.5">
      {label && <p className="px-1 text-sm font-medium text-ink-2">{label}</p>}
      <div role="radiogroup" aria-label={label} className={clsx('grid gap-2', { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[columns])}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={clsx(
              'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl short:min-h-12 border border-line bg-surface px-2 py-2 text-sm font-medium transition-colors duration-150',
              value === o.value ? activeClass : 'text-ink-2 hover:bg-surface-2',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
