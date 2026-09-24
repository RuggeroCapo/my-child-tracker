import clsx from 'clsx'

export interface SegmentOption<T extends string> {
  value: T
  label: string
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  tone = 'rose',
  ariaLabel,
}: {
  value: T
  options: SegmentOption<T>[]
  onChange: (value: T) => void
  className?: string
  tone?: 'rose' | 'sky' | 'violet'
  ariaLabel?: string
}) {
  const active = { rose: 'bg-rose text-white', sky: 'bg-sky text-white', violet: 'bg-violet text-white' }[tone]
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={clsx('flex gap-1 rounded-2xl bg-surface-2 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'h-10 flex-1 rounded-xl px-2 text-sm font-medium transition-colors',
            o.value === value ? active : 'text-ink-2 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
