import clsx from 'clsx'
import type { ReactNode } from 'react'

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('grid grid-cols-3 gap-2', className)}>{children}</div>
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-3 py-2.5">
      <p className="truncate text-xs text-ink-3">{label}</p>
      <p className="truncate text-lg font-semibold tabular">{value}</p>
      {sub && <p className="truncate text-xs text-ink-2">{sub}</p>}
    </div>
  )
}
