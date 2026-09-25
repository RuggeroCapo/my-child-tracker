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
  ariaLabel,
}: {
  value: T
  options: SegmentOption<T>[]
  onChange: (value: T) => void
  className?: string
  ariaLabel?: string
}) {
  const index = options.findIndex((o) => o.value === value)
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={clsx('frost relative isolate flex gap-1 rounded-2xl p-1', className)}
    >
      {/* Un solo indicatore che scivola sotto l'opzione scelta (opzioni di pari larghezza, gap-1 = 0.25rem). */}
      {index >= 0 && (
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 -z-10 rounded-xl rose-lit transition-transform duration-200 ease-out-expo"
          style={{
            width: `calc((100% - 0.5rem - ${options.length - 1} * 0.25rem) / ${options.length})`,
            transform: `translateX(calc(${index} * (100% + 0.25rem)))`,
          }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'h-10 flex-1 rounded-xl px-2 text-sm transition-colors duration-200',
            o.value === value ? 'font-semibold text-night' : 'font-medium text-ink-2 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
