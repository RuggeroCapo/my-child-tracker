import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { formatAgo, formatDayLabel, isSameDay, shiftLocalDay, toDateInput, toLocalInput, withLocalTime } from '@/lib/time'

const QUICK_OFFSETS = [
  { minutes: 0, label: 'Adesso', aria: 'Adesso' },
  { minutes: 5, label: '−5′', aria: '5 minuti fa' },
  { minutes: 15, label: '−15′', aria: '15 minuti fa' },
  { minutes: 30, label: '−30′', aria: '30 minuti fa' },
  { minutes: 60, label: '−1h', aria: "Un'ora fa" },
]

/**
 * Data e ora di un evento: scorciatoie relative ad adesso, giorno a frecce e ora nativa.
 * Il caso comune ("appena successo") richiede un tocco, non un selettore a rotelle.
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
  const now = new Date()
  const date = new Date(value)
  const isToday = isSameDay(date, now)

  return (
    <Field label={label} htmlFor={id} hint={formatAgo(date.toISOString(), now.getTime())}>
      <div className="flex gap-2">
        <div className="flex h-12 min-w-0 flex-1 items-center rounded-2xl border border-line bg-surface">
          <button
            type="button"
            aria-label="Giorno precedente"
            onClick={() => onChange(shiftLocalDay(value, -1))}
            className="grid size-12 shrink-0 place-items-center rounded-2xl text-ink-2 hover:text-ink"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          {/* Il giorno è un date input nativo trasparente: per saltare a date lontane (es. misurazioni). */}
          <div className="relative flex h-full min-w-0 flex-1 items-center justify-center">
            <span className="truncate text-sm font-medium text-ink" aria-hidden>
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
          <button
            type="button"
            aria-label="Giorno successivo"
            disabled={isToday}
            onClick={() => onChange(shiftLocalDay(value, 1))}
            className="grid size-12 shrink-0 place-items-center rounded-2xl text-ink-2 hover:text-ink disabled:opacity-30"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
        <Input
          id={id}
          type="time"
          required
          className="w-28 text-center tabular"
          value={value.slice(11, 16)}
          onChange={(e) => e.target.value && onChange(withLocalTime(value, e.target.value))}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pt-1">
        {QUICK_OFFSETS.map((o) => (
          <button
            key={o.minutes}
            type="button"
            aria-label={o.aria}
            onClick={() => onChange(toLocalInput(new Date(Date.now() - o.minutes * 60_000)))}
            className="h-10 shrink-0 rounded-xl bg-surface-2 px-3.5 text-sm font-medium text-ink-2 transition-colors duration-150 hover:text-ink active:bg-rose/15"
          >
            {o.label}
          </button>
        ))}
      </div>
    </Field>
  )
}

export function NotesInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Textarea label="Note" optional maxLength={1000} placeholder="Aggiungi una nota…" value={value} onChange={(e) => onChange(e.target.value)} />
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
              'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-surface px-2 py-2 text-sm font-medium transition-colors duration-150',
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
