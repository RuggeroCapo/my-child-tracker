import clsx from 'clsx'
import type { ReactNode } from 'react'

/** Riga di valori separati da filetti, come nel pannello della home: niente griglia di riquadri. */
export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={clsx('grid grid-cols-3 divide-x divide-line', className)}>{children}</dl>
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0">
      <dt className="truncate text-xs text-ink-2">{label}</dt>
      <dd className="mt-0.5 truncate text-lg font-semibold tabular">{value}</dd>
      {sub && <dd className="truncate text-xs text-ink-2 tabular">{sub}</dd>}
    </div>
  )
}
