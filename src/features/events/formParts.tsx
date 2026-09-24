import clsx from 'clsx'
import { useState, type ReactNode } from 'react'
import { Input, Textarea } from '@/components/ui/Field'
import { toLocalInput } from '@/lib/time'

export function DateTimeInput({
  label,
  value,
  onChange,
  min,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  min?: string
}) {
  const [max] = useState(() => toLocalInput(new Date(Date.now() + 5 * 60_000)))
  return (
    <Input
      label={label}
      type="datetime-local"
      required
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
    />
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
              'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-surface px-2 py-2 text-sm font-medium transition-all',
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
