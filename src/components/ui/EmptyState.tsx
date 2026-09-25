import type { ReactNode } from 'react'

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-[22px] border border-dashed border-line px-6 py-7 text-center">
      {icon && <div className="mb-1 text-ink-3">{icon}</div>}
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="max-w-[34ch] text-sm text-ink-2">{children}</div>}
    </div>
  )
}
