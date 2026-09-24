import type { ReactNode } from 'react'

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-line px-6 py-8 text-center">
      {icon && <div className="text-ink-3">{icon}</div>}
      <p className="font-medium text-ink-2">{title}</p>
      {children && <div className="text-sm text-ink-3">{children}</div>}
    </div>
  )
}
